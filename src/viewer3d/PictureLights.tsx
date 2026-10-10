"use client";

// Picture lights (T-125, look-foundation): a fixed pool of spot lights, re-aimed at the frames of
// the current room. The pool size never changes (changing the light count recompiles every shader);
// unused lights sit at intensity 0. On a room change the lights move to their new frames and fade
// up over ~1 s, like a gallery switching its track lights on (R4, R6; snaps under reduced motion).

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { SceneModel } from "@/lib/compile/types";

export const PICTURE_LIGHT_POOL = { high: 8, low: 4 } as const;
const OUT_FROM_WALL = 1.1; // meters in front of the frame
const BELOW_CEILING = 0.15; // meters under the wall top
const FADE_SECONDS = 1;
const MAX_FRAME_DELTA = 1 / 15; // R6

export interface PictureLightAim {
  position: [number, number, number];
  target: [number, number, number];
  angle: number;
}

/** Where each light of the pool goes for a room: largest frames first, at most `count`. */
export function aimPictureLights(
  model: SceneModel,
  roomId: string | undefined,
  count: number,
): PictureLightAim[] {
  if (!roomId) return [];
  const top = Math.max(
    0,
    ...model.walls.filter((w) => w.roomId === roomId).map((w) => w.top),
  );
  if (top <= 0) return [];
  const aims: PictureLightAim[] = model.frames
    .filter((f) => f.roomId === roomId)
    .sort((a, b) => b.width - a.width)
    .slice(0, count)
    .map((f) => {
      const nx = Math.sin(f.rotationY);
      const nz = Math.cos(f.rotationY);
      const y = Math.max(f.position[1] + 0.3, top - BELOW_CEILING);
      const position: [number, number, number] = [
        f.position[0] + nx * OUT_FROM_WALL,
        y,
        f.position[2] + nz * OUT_FROM_WALL,
      ];
      const dist = Math.hypot(OUT_FROM_WALL, y - f.position[1]);
      const halfDiag = Math.hypot(f.width, f.height) / 2;
      const angle = Math.min(Math.PI / 3, Math.atan((halfDiag * 1.25) / dist));
      return { position, target: [...f.position], angle };
    });
  // Leftover slots go to free-standing objects (T-131): one spot from above at a 60° tilt,
  // tucked under the ceiling. The pool size never changes, so no shader recompiles.
  if (aims.length < count) {
    const tilt = (60 * Math.PI) / 180;
    for (const o of model.objects.filter((o) => o.roomId === roomId)) {
      if (aims.length >= count) break;
      const mid: [number, number, number] = [
        o.base[0],
        o.base[1] + o.height / 2,
        o.base[2],
      ];
      const rise = 1.2;
      const run = rise / Math.tan(tilt);
      const dx = Math.sin(o.rotationY);
      const dz = Math.cos(o.rotationY);
      const position: [number, number, number] = [
        mid[0] + dx * run,
        Math.min(mid[1] + rise, top - BELOW_CEILING),
        mid[2] + dz * run,
      ];
      const dist = Math.hypot(run, position[1] - mid[1]);
      const angle = Math.min(
        Math.PI / 3,
        Math.atan(((o.plinth.size * 1.25) / 2 / Math.max(dist, 1e-6)) * 2),
      );
      aims.push({ position, target: mid, angle });
    }
  }
  return aims;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
}

export function PictureLights({
  model,
  roomId,
  color,
  intensity,
  poolSize,
}: {
  model: SceneModel;
  roomId?: string;
  color: string;
  intensity: number;
  poolSize: number;
}) {
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const lights = useMemo(
    () =>
      Array.from({ length: poolSize }, () => {
        const l = new THREE.SpotLight("#ffffff", 0, 0, Math.PI / 6, 0.6, 2);
        l.castShadow = false;
        return l;
      }),
    [poolSize],
  );

  // Lights and their targets live in the scene graph for the life of the pool.
  useEffect(() => {
    for (const l of lights) scene.add(l, l.target);
    return () => {
      for (const l of lights) {
        scene.remove(l, l.target);
        l.dispose();
      }
    };
  }, [lights, scene]);

  const aims = useMemo(
    () => aimPictureLights(model, roomId, lights.length),
    [model, roomId, lights.length],
  );
  const fade = useRef(1);

  // Re-aim on a room (or layout) change and restart the fade.
  useEffect(() => {
    lights.forEach((l, i) => {
      const a = aims[i];
      if (!a) return;
      l.position.set(...a.position);
      l.target.position.set(...a.target);
      l.angle = a.angle;
      l.target.updateMatrixWorld();
    });
    fade.current = prefersReducedMotion() ? 1 : 0;
    invalidate();
  }, [aims, lights, invalidate]);

  // Color and target intensity follow the look (which itself blends over ~1 s).
  useEffect(() => {
    for (const l of lights) l.color.set(color);
    invalidate();
  }, [color, lights, invalidate]);

  useFrame((_, delta) => {
    if (fade.current < 1) {
      fade.current = Math.min(
        1,
        fade.current + Math.min(delta, MAX_FRAME_DELTA) / FADE_SECONDS,
      );
      invalidate();
    }
    const k = fade.current * fade.current * (3 - 2 * fade.current); // smoothstep
    lights.forEach((l, i) => {
      l.intensity = aims[i] ? intensity * k : 0;
    });
  });

  return null;
}
