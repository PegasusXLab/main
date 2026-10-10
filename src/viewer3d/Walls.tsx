"use client";

// Wall pieces from the SceneModel. Each room's pieces are merged into one mesh (plan.md §7),
// materials are shared per wall color, and geometry/materials are disposed when they go away.
// Walls are not clickable (R10).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { SceneWall } from "@/lib/compile/types";
import { injectWallAO } from "./materials";

/** Box size and center for one wall piece. It sits inside its room, `thickness` in from the edge line. */
export function wallBox(p: SceneWall): {
  size: [number, number, number];
  center: [number, number, number];
} {
  const height = p.top - p.bottom;
  const cy = (p.bottom + p.top) / 2;
  const half = p.thickness / 2;
  switch (p.side) {
    case "n":
    case "s": {
      const length = p.end[0] - p.start[0];
      const z = p.side === "n" ? p.start[1] + half : p.start[1] - half;
      return {
        size: [length, height, p.thickness],
        center: [p.start[0] + length / 2, cy, z],
      };
    }
    case "w":
    case "e": {
      const length = p.end[1] - p.start[1];
      const x = p.side === "w" ? p.start[0] + half : p.start[0] - half;
      return {
        size: [p.thickness, height, length],
        center: [x, cy, p.start[1] + length / 2],
      };
    }
  }
}

/** Baseboard trim (T-125): height and how far it stands proud of the wall face, meters. */
export const BASEBOARD_HEIGHT = 0.1;
export const BASEBOARD_DEPTH = 0.015;

/**
 * Baseboard box for a wall piece that reaches the floor, on its room-facing side; null for header
 * pieces over doorways (bottom > 0).
 */
export function baseboardBox(p: SceneWall): {
  size: [number, number, number];
  center: [number, number, number];
} | null {
  if (p.bottom > 0) return null;
  const y = BASEBOARD_HEIGHT / 2;
  const off = p.thickness + BASEBOARD_DEPTH / 2;
  switch (p.side) {
    case "n":
    case "s": {
      const length = p.end[0] - p.start[0];
      const z = p.side === "n" ? p.start[1] + off : p.start[1] - off;
      return {
        size: [length, BASEBOARD_HEIGHT, BASEBOARD_DEPTH],
        center: [p.start[0] + length / 2, y, z],
      };
    }
    case "w":
    case "e": {
      const length = p.end[1] - p.start[1];
      const x = p.side === "w" ? p.start[0] + off : p.start[0] - off;
      return {
        size: [BASEBOARD_DEPTH, BASEBOARD_HEIGHT, length],
        center: [x, y, p.start[1] + length / 2],
      };
    }
  }
}

const noRaycast = () => null;

function RoomWalls({
  pieces,
  material,
}: {
  pieces: SceneWall[];
  material: THREE.Material;
}) {
  // Rebuild only when this room's pieces actually change, not on every recompile.
  const signature = JSON.stringify(pieces);
  const geometry = useMemo(() => {
    const boxes = (JSON.parse(signature) as SceneWall[]).flatMap((p) => {
      const { size, center } = wallBox(p);
      const wall = new THREE.BoxGeometry(...size).translate(...center);
      const trim = baseboardBox(p);
      return trim
        ? [wall, new THREE.BoxGeometry(...trim.size).translate(...trim.center)]
        : [wall];
    });
    const merged = mergeGeometries(boxes);
    for (const b of boxes) b.dispose();
    return merged;
  }, [signature]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} raycast={noRaycast} />;
}

export function Walls({ walls }: { walls: SceneWall[] }) {
  const byRoom = useMemo(() => {
    const groups = new Map<string, SceneWall[]>();
    for (const w of walls) {
      const list = groups.get(w.roomId);
      if (list) list.push(w);
      else groups.set(w.roomId, [w]);
    }
    return groups;
  }, [walls]);

  // One material per distinct wall color, shared by every room using it.
  const colorKey = [...new Set(walls.map((w) => w.color))].sort().join(",");
  const materials = useMemo(
    () =>
      new Map(
        colorKey
          .split(",")
          .filter(Boolean)
          .map((c) => {
            const m = new THREE.MeshStandardMaterial({
              color: c,
              roughness: 0.92,
            });
            injectWallAO(m);
            return [c, m] as const;
          }),
      ),
    [colorKey],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  return (
    <group>
      {[...byRoom].map(([roomId, pieces]) => (
        <RoomWalls
          key={roomId}
          pieces={pieces}
          material={materials.get(pieces[0].color)!}
        />
      ))}
    </group>
  );
}
