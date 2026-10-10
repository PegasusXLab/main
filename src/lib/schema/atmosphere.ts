// Atmosphere presets (F11, plan.md §6, reference R7): plain data describing how a room feels:
// light colors and intensities, fog and background. Rooms without `atmosphere` fall back to their
// `lighting` preset, so existing galleries look exactly as before. Pure data + math, no three.js.

import { LIGHTING_PRESETS, type LightingPreset } from "./defaults";
import type { Atmosphere, Room } from "./types";

/** Everything the renderer needs to light a room. A LightingPreset plus fog. */
export interface AtmosphereLook extends LightingPreset {
  fog: { color: string; density: number }; // exponential fog (FogExp2); density 0 = none
}

export type AtmospherePresetName = Exclude<Atmosphere["preset"], "custom">;

export const ATMOSPHERE_PRESETS: Record<AtmospherePresetName, AtmosphereLook> =
  {
    "gallery-white": {
      ambient: { skyColor: "#ffffff", groundColor: "#dcd8d0", intensity: 1.2 },
      directional: {
        color: "#ffffff",
        intensity: 1.3,
        direction: [0.3, -1, 0.2],
      },
      background: "#f4f2ee",
      fog: { color: "#f4f2ee", density: 0 },
    },
    "neon-bunker": {
      ambient: { skyColor: "#ff3cac", groundColor: "#120326", intensity: 0.55 },
      directional: {
        color: "#2bd2ff",
        intensity: 1.1,
        direction: [-0.6, -1, -0.3],
      },
      background: "#0a0414",
      fog: { color: "#1a0630", density: 0.045 },
    },
    "golden-hour": {
      ambient: { skyColor: "#ffd8a8", groundColor: "#7a4a2a", intensity: 0.9 },
      directional: {
        color: "#ffb35c",
        intensity: 1.6,
        direction: [-1, -0.45, 0.3],
      },
      background: "#3a2414",
      fog: { color: "#e8a86a", density: 0.02 },
    },
    moonlit: {
      // Night, but readable (T-065): stronger cool sky light and a lifted ground bounce so walls
      // and hung artwork stay visible; fog and background stay deep blue.
      ambient: { skyColor: "#a9bde8", groundColor: "#3a4a7a", intensity: 2.4 },
      directional: {
        color: "#d4e0ff",
        intensity: 1.6,
        direction: [0.4, -1, -0.6],
      },
      background: "#0b1224",
      fog: { color: "#1a2644", density: 0.025 },
    },
  };

const MAX_HAZE_DENSITY = 0.08;

/** A room's `lighting` preset as a look with no fog. */
export function lookFromLighting(lighting: Room["lighting"]): AtmosphereLook {
  const p = LIGHTING_PRESETS[lighting];
  return { ...p, fog: { color: p.background, density: 0 } };
}

/**
 * The `custom` preset from the room's sliders: mood color tints the lights and fog, haze sets fog
 * density, brightness scales intensities, lightDirection (degrees) turns the sun around the room.
 * Grain is P2 (no post-processing yet).
 */
export function lookFromCustom(a: Atmosphere): AtmosphereLook {
  const angle = (a.lightDirection * Math.PI) / 180;
  const b = clamp01(a.brightness);
  return {
    ambient: {
      skyColor: mix("#ffffff", a.moodColor, 0.5),
      groundColor: mix("#000000", a.moodColor, 0.35),
      intensity: 0.3 + 1.0 * b,
    },
    directional: {
      color: mix("#ffffff", a.moodColor, 0.3),
      intensity: 0.3 + 1.4 * b,
      direction: [round(Math.sin(angle)), -1, round(-Math.cos(angle))],
    },
    background: mix("#000000", a.moodColor, 0.15 + 0.3 * b),
    fog: {
      color: mix("#000000", a.moodColor, 0.4),
      density: clamp01(a.haze) * MAX_HAZE_DENSITY,
    },
  };
}

/** The look for a room: its atmosphere preset, its custom sliders, or else its lighting preset. */
export function resolveLook(room: {
  lighting: Room["lighting"];
  atmosphere?: Atmosphere;
}): AtmosphereLook {
  const a = room.atmosphere;
  if (!a) return lookFromLighting(room.lighting);
  if (a.preset === "custom") return lookFromCustom(a);
  return ATMOSPHERE_PRESETS[a.preset];
}

/** Ease in-out cubic, 0 → 1 (R4). */
export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Linear blend from `a` (t = 0) to `b` (t = 1): every number and color in the look. */
export function blendLook(
  a: AtmosphereLook,
  b: AtmosphereLook,
  t: number,
): AtmosphereLook {
  const k = clamp01(t);
  if (k === 0) return a;
  if (k === 1) return b;
  return {
    ambient: {
      skyColor: mix(a.ambient.skyColor, b.ambient.skyColor, k),
      groundColor: mix(a.ambient.groundColor, b.ambient.groundColor, k),
      intensity: lerp(a.ambient.intensity, b.ambient.intensity, k),
    },
    directional: {
      color: mix(a.directional.color, b.directional.color, k),
      intensity: lerp(a.directional.intensity, b.directional.intensity, k),
      direction: [
        lerp(a.directional.direction[0], b.directional.direction[0], k),
        lerp(a.directional.direction[1], b.directional.direction[1], k),
        lerp(a.directional.direction[2], b.directional.direction[2], k),
      ],
    },
    background: mix(a.background, b.background, k),
    fog: {
      color: mix(a.fog.color, b.fog.color, k),
      density: lerp(a.fog.density, b.fog.density, k),
    },
  };
}

// ---- small helpers ----

function clamp01(x: number): number {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function round(x: number): number {
  return Math.round(x * 1e6) / 1e6 + 0;
}

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix two #rrggbb colors; t = 0 gives `a`, t = 1 gives `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  const c = (x: number, y: number) =>
    Math.round(lerp(x, y, t))
      .toString(16)
      .padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}
