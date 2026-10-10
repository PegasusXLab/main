"use client";

// Ceilings (T-125, look-foundation): one plane per room at its wall top, facing down. Front-side
// only, so it encloses the room when you stand inside (viewer, 3D POV) and is culled from above, so
// orbit and top-down views stay open with no mode check. Not clickable (R10).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SceneModel } from "@/lib/compile/types";
import { mix } from "@/lib/schema/atmosphere";

const noRaycast = () => null;
export const CEILING_DARKEN = 0.12;

export function Ceilings({ model }: { model: SceneModel }) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2),
    [],
  );

  const rooms = useMemo(
    () =>
      model.floors.flatMap((f) => {
        const walls = model.walls.filter((w) => w.roomId === f.roomId);
        if (walls.length === 0) return [];
        const top = Math.max(...walls.map((w) => w.top));
        return [
          {
            roomId: f.roomId,
            position: [f.center[0], top, f.center[2]] as [
              number,
              number,
              number,
            ],
            scale: [f.size[0], 1, f.size[1]] as [number, number, number],
            color: mix(walls[0].color, "#000000", CEILING_DARKEN),
          },
        ];
      }),
    [model.floors, model.walls],
  );

  const colorKey = [...new Set(rooms.map((r) => r.color))].sort().join(",");
  const materials = useMemo(
    () =>
      new Map(
        colorKey
          .split(",")
          .filter(Boolean)
          .map((c) => [
            c,
            new THREE.MeshStandardMaterial({
              color: c,
              roughness: 0.95,
              side: THREE.FrontSide,
            }),
          ]),
      ),
    [colorKey],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  return (
    <group>
      {rooms.map((r) => (
        <mesh
          key={r.roomId}
          geometry={geometry}
          material={materials.get(r.color)}
          position={r.position}
          scale={r.scale}
          raycast={noRaycast}
        />
      ))}
    </group>
  );
}
