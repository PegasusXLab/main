// Shared look helpers for the 3D scene (T-125, look-foundation): analytic ambient-occlusion and
// procedural floor detail injected into MeshStandardMaterial with onBeforeCompile, plus a soft
// shadow texture. Rooms are axis-aligned boxes, so corner darkening is a function of distance to
// the floor or room edge; no extra render pass, no textures to download.

import * as THREE from "three";

/** Darken walls near the floor junction (and a little near the top). */
export function injectWallAO(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vAoWorldY;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvAoWorldY = (modelMatrix * vec4(transformed, 1.0)).y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vAoWorldY;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float aoFloor = 1.0 - 0.38 * (1.0 - smoothstep(0.0, 0.55, vAoWorldY));
        diffuseColor.rgb *= aoFloor;`,
      );
  };
  material.customProgramCacheKey = () => "wall-ao-v1";
}

export type FloorKind = "wood" | "concrete" | "marble";

const FLOOR_KIND_ID: Record<FloorKind, number> = {
  wood: 0,
  concrete: 1,
  marble: 2,
};

/**
 * Floor detail + edge AO. The floor is a unit plane scaled per room, so the vertex shader reads the
 * room size from the model matrix and passes distance-to-edge in meters. Detail is in world space
 * so patterns line up across rooms: wood planks, troweled concrete, marble tiles with veins.
 */
export function injectFloorLook(
  material: THREE.MeshStandardMaterial,
  kind: FloorKind,
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFloorKind = { value: FLOOR_KIND_ID[kind] };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vFloorEdge;\nvarying vec2 vFloorWorld;",
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec2 floorSize = vec2(length(modelMatrix[0].xyz), length(modelMatrix[2].xyz));
        vec2 floorUv = transformed.xz + 0.5;
        vFloorEdge = min(floorUv, 1.0 - floorUv) * floorSize;
        vFloorWorld = (modelMatrix * vec4(transformed, 1.0)).xz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vFloorEdge;
        varying vec2 vFloorWorld;
        uniform int uFloorKind;
        float fHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float fNoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(fHash(i), fHash(i + vec2(1, 0)), f.x), mix(fHash(i + vec2(0, 1)), fHash(i + vec2(1, 1)), f.x), f.y);
        }
        float fFbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * fNoise(p); p *= 2.03; a *= 0.5; } return v; }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float detail = 1.0;
        if (uFloorKind == 0) {
          // Wood: 0.18 m planks, staggered 1.2 m boards, per-board tone, fine grain, dark seams.
          float row = floor(vFloorWorld.y / 0.18);
          float board = floor((vFloorWorld.x + fHash(vec2(row, 3.0)) * 1.2) / 1.2);
          float tone = 0.86 + 0.22 * fHash(vec2(row, board));
          float grain = 0.93 + 0.07 * fNoise(vec2(vFloorWorld.x * 2.0, vFloorWorld.y * 40.0));
          float fy = fract(vFloorWorld.y / 0.18);
          float seamY = smoothstep(0.0, 0.006, min(fy, 1.0 - fy) * 0.18);
          float bx = fract((vFloorWorld.x + fHash(vec2(row, 3.0)) * 1.2) / 1.2) * 1.2;
          float seamX = smoothstep(0.0, 0.006, min(bx, 1.2 - bx));
          detail = tone * grain * mix(0.72, 1.0, seamY * seamX);
        } else if (uFloorKind == 1) {
          // Concrete: soft trowel clouds + speckle.
          detail = 0.9 + 0.14 * fFbm(vFloorWorld * 0.6) + 0.05 * (fHash(floor(vFloorWorld * 220.0)) - 0.5);
        } else {
          // Marble: 0.6 m tiles, thin grout, soft veins.
          vec2 t = fract(vFloorWorld / 0.6) * 0.6;
          float grout = smoothstep(0.0, 0.004, min(min(t.x, 0.6 - t.x), min(t.y, 0.6 - t.y)));
          vec2 q = vFloorWorld * 0.9 + fHash(floor(vFloorWorld / 0.6)) * 9.0;
          float v = fFbm(q + 2.0 * fFbm(q * 0.5));
          float vein = 1.0 - 0.13 * smoothstep(0.012, 0.0, abs(v - 0.5));
          float cloud = 0.96 + 0.06 * fFbm(vFloorWorld * 0.35);
          detail = vein * cloud * mix(0.86, 1.0, grout) * (0.98 + 0.04 * fHash(floor(vFloorWorld / 0.6)));
        }
        float edge = min(vFloorEdge.x, vFloorEdge.y);
        float aoEdge = 1.0 - 0.32 * (1.0 - smoothstep(0.0, 0.45, edge));
        diffuseColor.rgb *= detail * aoEdge;`,
      );
  };
  material.customProgramCacheKey = () => `floor-look-v2-${kind}`;
}

let shadowTexture: THREE.Texture | null = null;

/** A soft rounded-rectangle shadow (alpha) shared by every frame and plinth. Browser only. */
export function getSoftShadowTexture(): THREE.Texture | null {
  if (shadowTexture) return shadowTexture;
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.filter = "blur(14px)";
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(24, 24, size - 48, size - 48);
  shadowTexture = new THREE.CanvasTexture(canvas);
  return shadowTexture;
}

/** Quality tier: "low" on small/slow/touch devices or ?quality=low; "high" otherwise. */
export type Quality = "high" | "low";

export function detectQuality(): Quality {
  if (typeof window === "undefined") return "high";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "low" || forced === "high") return forced;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return cores <= 4 || coarse || window.devicePixelRatio > 2 ? "low" : "high";
}
