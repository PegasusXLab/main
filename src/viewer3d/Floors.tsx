"use client";

// Floors from the SceneModel: one shared unit plane, scaled per room, with one material per
// floor preset. Floors are the only clickable meshes (R10); what a click does comes in Sprint 2.

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { SceneFloor } from "@/lib/compile/types";
import { THEME } from "@/lib/theme";

/** Floor preset colors (plain data; textures can replace these later, plan.md §7). */
export const FLOOR_COLORS: Record<SceneFloor["floor"], string> = {
  wood: "#9c7350",
  concrete: "#8f8f8b",
  marble: "#e6e3dc",
};

/** Klein blue selection color from canonical design tokens (ADR-013). */
export const SELECTION_COLOR = THEME.colors.accent;
const OUTLINE_LIFT = 0.02; // meters above the floor / wall top, so the line isn't hidden
const TINT_LIFT = 0.005;

/**
 * Two closed rectangles around a room (T-071): one at floor level, one at its wall tops.
 * Points are world (x, y, z); the first point repeats at the end to close each loop.
 */
export function selectionOutline(
  floor: SceneFloor,
  wallTop: number,
): [number, number, number][][] {
  const [cx, , cz] = floor.center;
  const hw = floor.size[0] / 2;
  const hd = floor.size[1] / 2;
  const loop = (y: number): [number, number, number][] => [
    [cx - hw, y, cz - hd],
    [cx + hw, y, cz - hd],
    [cx + hw, y, cz + hd],
    [cx - hw, y, cz + hd],
    [cx - hw, y, cz - hd],
  ];
  return [loop(OUTLINE_LIFT), loop(wallTop + OUTLINE_LIFT)];
}

const noRaycast = () => null;

export function Floors({
  floors,
  onFloorClick,
  selectedRoomId,
  selectedWallTop = 3,
}: {
  floors: SceneFloor[];
  onFloorClick?: (roomId: string) => void;
  /** Room to highlight in blue (editor only). */
  selectedRoomId?: string;
  /** Height of the selected room's walls, for the upper outline. */
  selectedWallTop?: number;
}) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    [],
  );
  const tintMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SELECTION_COLOR,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
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
      tintMaterial.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [geometry, materials, tintMaterial],
  );

  const selected = selectedRoomId
    ? floors.find((f) => f.roomId === selectedRoomId)
    : undefined;

  return (
    <group>
      {selected ? (
        <group>
          <mesh
            geometry={geometry}
            material={tintMaterial}
            position={[selected.center[0], TINT_LIFT, selected.center[2]]}
            scale={[selected.size[0], 1, selected.size[1]]}
            raycast={noRaycast}
          />
          {selectionOutline(selected, selectedWallTop).map((points, i) => (
            <Line
              key={i}
              points={points}
              color={SELECTION_COLOR}
              lineWidth={3}
              raycast={noRaycast}
            />
          ))}
        </group>
      ) : null}
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
