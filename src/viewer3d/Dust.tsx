"use client";

// Dust motes (look L2, bunker recipe): static additive points drifting nowhere —
// they catch the picture lights and make foggy rooms feel like air. Static on purpose:
// the canvas renders on demand (R1), so nothing animates per frame. Count, opacity, size
// and tint come from lookExtras (derived from the look, so blends carry them for free).
// Positions are deterministic per room (seeded), so SSR, tests and screenshots agree.

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { noRaycast } from "./Frames";

/** Soft round sprite for motes (canvas radial gradient). Browser only; cached. */
let moteTexture: THREE.Texture | null = null;
export function getMoteTexture(): THREE.Texture | null {
  if (moteTexture) return moteTexture;
  if (typeof document === "undefined") return null;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  moteTexture = new THREE.CanvasTexture(canvas);
  return moteTexture;
}
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashRoomId(roomId: string): number {
  let h = 2166136261;
  for (let i = 0; i < roomId.length; i++) {
    h ^= roomId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mote positions inside a room box (meters, room-local + room origin). Pure, tested. */
export function dustPositions(
  seed: number,
  count: number,
  w: number,
  h: number,
  d: number,
): Float32Array {
  const rand = seededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (rand() - 0.5) * w;
    out[i * 3 + 1] = 0.15 + rand() * Math.max(0.1, h - 0.3);
    out[i * 3 + 2] = (rand() - 0.5) * d;
  }
  return out;
}

export interface DustProps {
  roomId: string;
  /** Room origin (floor center x/z) and size. */
  center: [number, number, number];
  size: [number, number];
  wallTop: number;
  count: number;
  opacity: number;
  sizePx: number;
  color: string;
}

export function Dust({
  roomId,
  center,
  size,
  wallTop,
  count,
  opacity,
  sizePx,
  color,
}: DustProps) {
  const map = useMemo(() => getMoteTexture(), []);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        dustPositions(hashRoomId(roomId), count, size[0], wallTop, size[1]),
        3,
      ),
    );
    return geo;
  }, [roomId, count, size, wallTop]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  if (count <= 0 || opacity <= 0) return null;
  return (
    <points
      geometry={geometry}
      position={center}
      raycast={noRaycast}
      frustumCulled={false}
    >
      <pointsMaterial
        attach="material"
        color={color}
        map={map ?? undefined}
        size={sizePx}
        sizeAttenuation
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
