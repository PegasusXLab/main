"use client";

// Warm-up (ADR-018): once the scene has settled, upload every texture and compile every shader, so
// the first walk into a room the camera hasn't looked at yet doesn't stall on GPU work (measured: a
// 67-83 ms hitch at the start of the first walk). Re-runs, debounced, when the scene changes.

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import type { SceneModel } from "@/lib/compile/types";

/** Wait this long after the scene (or an edit) settles, so loading and first paint come first. */
const SETTLE_MS = 1500;

export function WarmUp({ model }: { model: SceneModel }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const id = window.setTimeout(() => {
      scene.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        if (!material) return;
        for (const m of Array.isArray(material) ? material : [material]) {
          for (const value of Object.values(m)) {
            // Videos upload a frame at a time on their own; everything else uploads once here.
            if (value instanceof THREE.Texture && value.image && !(value instanceof THREE.VideoTexture)) {
              gl.initTexture(value);
            }
          }
        }
      });
      gl.compileAsync(scene, camera).catch(() => {});
    }, SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [gl, scene, camera, model]);

  return null;
}
