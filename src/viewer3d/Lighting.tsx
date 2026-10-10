"use client";

// One hemisphere light + one directional light, driven entirely by a preset object (R7), so
// atmosphere presets (F11) can later blend values without touching this component.

import { useLayoutEffect, useRef } from "react";
import type * as THREE from "three";
import type { LightingPreset } from "@/lib/schema/defaults";

const LIGHT_DISTANCE = 20; // meters from the target, along the preset's direction

export function Lighting({
  preset,
  target = [0, 0, 0],
}: {
  preset: LightingPreset;
  target?: [number, number, number];
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const [dx, dy, dz] = preset.directional.direction;
  const len = Math.hypot(dx, dy, dz) || 1;
  const position: [number, number, number] = [
    target[0] - (dx / len) * LIGHT_DISTANCE,
    target[1] - (dy / len) * LIGHT_DISTANCE,
    target[2] - (dz / len) * LIGHT_DISTANCE,
  ];

  // The light points at its target object, which must sit at the gallery center.
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(...target);
    l.target.updateMatrixWorld();
  }, [target]);

  return (
    <>
      <color attach="background" args={[preset.background]} />
      <hemisphereLight
        color={preset.ambient.skyColor}
        groundColor={preset.ambient.groundColor}
        intensity={preset.ambient.intensity}
      />
      <directionalLight
        ref={light}
        color={preset.directional.color}
        intensity={preset.directional.intensity}
        position={position}
      />
    </>
  );
}
