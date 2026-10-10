"use client";

// Floors from the SceneModel: one shared unit plane, scaled per room, with one material per
// floor preset. Floors are the only clickable meshes (R10); what a click does comes in Sprint 2.

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { SceneFloor } from "@/lib/compile/types";

/** Floor preset colors (plain data; textures can replace these later, plan.md §7). */
export const FLOOR_COLORS: Record<SceneFloor["floor"], string> = {
  wood: "#9c7350",
  concrete: "#8f8f8b",
  marble: "#e6e3dc",
};

export function Floors({
  floors,
  onFloorClick,
}: {
  floors: SceneFloor[];
  onFloorClick?: (roomId: string) => void;
}) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    [],
  );
  const materials = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(FLOOR_COLORS).map(([preset, color]) => [
          preset,
          new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
        ]),
      ) as Record<SceneFloor["floor"], THREE.MeshStandardMaterial>,
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  return (
    <group>
      {floors.map((f) => (
        <mesh
          key={f.roomId}
          geometry={geometry}
          material={materials[f.floor]}
          position={f.center}
          scale={[f.size[0], 1, f.size[1]]}
          onClick={
            onFloorClick
              ? (e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation();
                  onFloorClick(f.roomId);
                }
              : undefined
          }
        />
      ))}
    </group>
  );
}
