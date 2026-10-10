"use client";

// One hemisphere light + one directional light, driven entirely by a preset object (R7), so
// atmosphere presets (F11) can later blend values without touching this component.
// T-125: plus image-based light from three's RoomEnvironment (generated once, no download), whose
// strength follows the look; the hemisphere light drops to a fill because IBL now carries it.

import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { LightingPreset } from "@/lib/schema/defaults";

const LIGHT_DISTANCE = 20; // meters from the target, along the preset's direction
export const HEMISPHERE_FILL = 0.45; // share of the preset's hemisphere intensity kept with IBL on

/** Sets scene.environment to a PMREM of RoomEnvironment once per canvas; intensity per look. */
export function SceneEnvironment({ intensity }: { intensity: number }) {
  // Read the scene through get() so effects mutate the live three.js object, not a hook value.
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const scene = get().scene;
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    invalidate();
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, get, invalidate]);

  useEffect(() => {
    get().scene.environmentIntensity = intensity;
    invalidate();
  }, [get, intensity, invalidate]);

  return null;
}

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
        intensity={preset.ambient.intensity * HEMISPHERE_FILL}
      />
      <directionalLight
        ref={light}
        color={preset.directional.color}
        intensity={preset.directional.intensity * 0.8}
        position={position}
      />
    </>
  );
}
