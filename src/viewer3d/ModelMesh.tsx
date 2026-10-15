"use client";

// GLB model mesh (T-131, object-render spec): loads any-scale/orientation upload or library model,
// normalizes it onto its plinth (bounding-box scale to `height`, bottom-center on the plinth top,
// footprint clamped), and fades in over the placeholder/cutout. Broken URLs suspend-then-throw to
// the per-object ErrorBoundary in Objects.tsx, which keeps the fallback. Anything over 300k
// triangles renders as a kraft bounding box in the editor only (pipeline bypassed).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { THEME } from "@/lib/theme";

/** Models heavier than this render as a kraft box in the editor (spec budget guard). */
export const MAX_MODEL_TRIANGLES = 300_000;
/** Fade-in duration for a freshly loaded model, ms (spec motion). */
export const MODEL_FADE_MS = 600;

export interface NormalizedModel {
  object: THREE.Object3D;
  triangles: number;
}

/**
 * Normalize any model onto its plinth (pure on the three object): scale so the bbox height =
 * `height` (shrinking further if the footprint exceeds `maxFootprint`), translate so the
 * bottom-center sits at the origin (caller lifts it to the plinth top). Clamps env intensity,
 * disables shadow casting, counts triangles. Clones the input; the original is untouched.
 */
export function normalizeObjectModel(
  source: THREE.Object3D,
  height: number,
  maxFootprint: number,
): NormalizedModel {
  const object = source.clone(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const safeHeight = Math.max(height, 1e-6);
  let scale = safeHeight / Math.max(size.y, 1e-6);
  const footprint = Math.max(size.x, size.z) * scale;
  if (footprint > maxFootprint && footprint > 1e-9) {
    scale *= maxFootprint / footprint;
  }
  // Center horizontally on the origin, bottom at y = 0. "Upright" is trusted: uploads come
  // Y-up from Polycam/Sketchfab/Blender (spec AC: lands upright at the requested height).
  object.scale.setScalar(scale);
  object.position.x -= center.x * scale;
  object.position.z -= center.z * scale;
  object.position.y -= box.min.y * scale;

  let triangles = 0;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        if (typeof std.envMapIntensity === "number") {
          std.envMapIntensity = Math.min(std.envMapIntensity, 1.5);
        }
      }
      const geom = child.geometry as THREE.BufferGeometry | undefined;
      if (geom) {
        const index = geom.index;
        triangles += index ? index.count / 3 : (geom.attributes.position?.count ?? 0) / 3;
      }
    }
  });
  return { object, triangles };
}

export interface ModelMeshProps {
  modelUrl: string;
  /** Displayed height, meters. */
  height: number;
  /** Max horizontal footprint, meters (plinth size x 1.1). */
  maxFootprint: number;
  /** 0..1 fade-in; 1 (default) is fully opaque. */
  opacity?: number;
  /** Called once the model is normalized and mounted. */
  onLoaded?: (info: { triangles: number }) => void;
  onClick?: (e: { stopPropagation: () => void }) => void;
}

export function ModelMesh({
  modelUrl,
  height,
  maxFootprint,
  opacity = 1,
  onLoaded,
  onClick,
}: ModelMeshProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const gltf = useGLTF(modelUrl);
  const normalized = useMemo(() => {
    return normalizeObjectModel(gltf.scene, height, maxFootprint);
  }, [gltf, height, maxFootprint]);

  useEffect(() => {
    const transparent = opacity < 1;
    normalized.object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const list = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of list) {
          m.transparent = transparent;
          m.opacity = opacity;
        }
      }
    });
  }, [normalized, opacity]);

  useEffect(() => {
    onLoaded?.({ triangles: normalized.triangles });

    // Warm up this model's textures and compile its shaders so the first time
    // the visitor looks at or approaches the model, it does not hitch on main-thread linking.
    normalized.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          for (const val of Object.values(m)) {
            if (val instanceof THREE.Texture && val.image && !(val instanceof THREE.VideoTexture)) {
              try {
                gl?.initTexture?.(val);
              } catch {}
            }
          }
        }
      }
    });
    if (gl?.compileAsync) {
      gl.compileAsync(normalized.object, camera, scene).catch(() => {});
    }
  }, [normalized, gl, camera, scene, onLoaded]);

  return <primitive object={normalized.object} onClick={onClick} />;
}

/** Kraft placeholder for an over-budget model (editor only). */
export function HeavyModelPlaceholder({
  height,
  footprint,
}: {
  height: number;
  footprint: number;
}) {
  return (
    <mesh position={[0, height / 2, 0]} data-heavy-model="true">
      <boxGeometry args={[footprint, height, footprint]} />
      <meshStandardMaterial color={THEME.colors.kraft} roughness={0.9} />
    </mesh>
  );
}
