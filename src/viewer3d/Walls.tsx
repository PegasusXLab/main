"use client";

// Wall pieces from the SceneModel. Each room's pieces are merged into one mesh (plan.md §7),
// materials are shared per wall color, and geometry/materials are disposed when they go away.
// Walls are not clickable (R10).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { SceneWall } from "@/lib/compile/types";

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
    const boxes = (JSON.parse(signature) as SceneWall[]).map((p) => {
      const { size, center } = wallBox(p);
      return new THREE.BoxGeometry(...size).translate(...center);
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
          .map((c) => [
            c,
            new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }),
          ]),
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
