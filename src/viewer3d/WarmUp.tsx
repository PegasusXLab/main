"use client";

// Warm-up (ADR-018): once the scene has settled, upload every texture and compile every shader, so
// the first walk into a room the camera hasn't looked at yet doesn't stall on GPU work (measured: a
// 67-83 ms hitch at the start of the first walk). Re-runs, debounced, when the scene changes.

import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { SceneModel } from "@/lib/compile/types";
import { libraryEntry } from "@/lib/objects/library";

/** Wait this long after the scene (or an edit) settles, so loading and first paint come first. */
const SETTLE_MS = 1500;
/** Follow-up pass to warm models and textures that resolved after initial paint. */
const SECONDARY_SETTLE_MS = 3500;

export function WarmUp({ model }: { model: SceneModel }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Preload any 3D models in the gallery so they fetch immediately rather than on doorway entry.
  useEffect(() => {
    if (typeof window === "undefined") return;
    for (const obj of model.objects) {
      if (obj.render.kind === "library") {
        const entry = libraryEntry(obj.render.libraryId);
        if (entry?.modelUrl) {
          try {
            useGLTF.preload(entry.modelUrl);
          } catch {}
        }
      } else if (obj.render.kind === "model" && obj.render.modelUrl) {
        try {
          useGLTF.preload(obj.render.modelUrl);
        } catch {}
      }
    }
  }, [model.objects]);

  useEffect(() => {
    const warm = () => {
      scene.traverse((object) => {
        const material = (object as THREE.Mesh).material;
        if (!material) return;
        for (const m of Array.isArray(material) ? material : [material]) {
          for (const value of Object.values(m)) {
            // Videos upload a frame at a time on their own; everything else uploads once here.
            if (value instanceof THREE.Texture && value.image && !(value instanceof THREE.VideoTexture)) {
              try {
                gl.initTexture(value);
              } catch {}
            }
          }
        }
      });
      gl.compileAsync(scene, camera).catch(() => {});
    };

    const id1 = window.setTimeout(warm, SETTLE_MS);
    const id2 = window.setTimeout(warm, SECONDARY_SETTLE_MS);

    return () => {
      window.clearTimeout(id1);
      window.clearTimeout(id2);
    };
  }, [gl, scene, camera, model]);

  return null;
}
