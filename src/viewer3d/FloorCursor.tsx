"use client";

// Click-to-walk cursor (ADR-018): a small ring on the floor where you'd stand if you clicked.
// Reads the hover point from a ref (written by Floors' pointer-move), so hovering never
// re-renders React; fades in where you can reach and stand, out everywhere else.

import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { canReach, type WalkMap } from "./walkable";

export interface FloorHover {
  point: [number, number] | null;
}

const RING_COLOR = "#002fa7"; // accent (pegasus-ui token)
const HALO_COLOR = "#ffffff"; // paper
const RING_OPACITY = 0.9;
const HALO_OPACITY = 0.45;
const LIFT = 0.012;
const noRaycast = () => null;

export function FloorCursor({ hover, walk }: { hover: MutableRefObject<FloorHover>; walk: WalkMap }) {
  const group = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const shown = useRef(0);

  useFrame((state, delta) => {
    const p = hover.current.point;
    const cam = state.camera.position;
    const ok = p !== null && canReach(walk, [cam.x, cam.z], p);
    if (ok && group.current) group.current.position.set(p[0], LIFT, p[1]);
    const target = ok ? 1 : 0;
    shown.current += (target - shown.current) * (1 - Math.exp(-14 * Math.min(delta, 1 / 15)));
    if (ringMat.current) ringMat.current.opacity = RING_OPACITY * shown.current;
    if (haloMat.current) haloMat.current.opacity = HALO_OPACITY * shown.current;
    if (group.current) group.current.visible = shown.current > 0.01;
    if (Math.abs(target - shown.current) > 0.01) state.invalidate();
  });

  return (
    <group ref={group} visible={false}>
      <mesh rotation-x={-Math.PI / 2} raycast={noRaycast} renderOrder={1}>
        <circleGeometry args={[0.26, 48]} />
        <meshBasicMaterial ref={haloMat} color={HALO_COLOR} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.001} raycast={noRaycast} renderOrder={2}>
        <ringGeometry args={[0.15, 0.2, 48]} />
        <meshBasicMaterial ref={ringMat} color={RING_COLOR} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
