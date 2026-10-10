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
      fog: { color: "#1a0630", density: 0.06 },
    },
    "golden-hour": {
      ambient: { skyColor: "#ffd8a8", groundColor: "#7a4a2a", intensity: 0.9 },
      directional: {
        color: "#ffb35c",
        intensity: 1.6,
        direction: [-1, -0.45, 0.3],
      },
      background: "#3a2414",
      fog: { color: "#e8a86a", density: 0.028 },
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

/**
 * Creator post overrides (custom preset only): explicit grain, bloom glow and vignette.
 * Unset (or any named preset) means "derive from the look" — the one exception is grain,
 * whose slider is explicit on custom (it defaults to 0, i.e. clean until raised).
 */
export interface LookOverrides {
  grain?: number;
  glow?: number;
  vignette?: number;
}

export function resolveLookOverrides(room: {
  atmosphere?: Atmosphere;
}): LookOverrides {
  const a = room.atmosphere;
  if (!a || a.preset !== "custom") return {};
  return { grain: a.grain, glow: a.glow, vignette: a.vignette };
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

/**
 * Renderer extras for a look (T-125, look-foundation): image-based light strength and the color and
 * strength of the picture lights over each artwork. Derived from the look itself, so they follow
 * every preset, custom slider and blend without new preset data. Darker rooms get less fill and
 * relatively stronger picture lights, so the art stays the brightest thing in the room.
 * Look L2 (bunker recipe): the same derivation drives dust motes and film grain — foggy dark
 * rooms get visible air, bright rooms stay clean.
 */
export interface LookExtras {
  envIntensity: number; // scene.environmentIntensity (RoomEnvironment IBL)
  pictureLight: { color: string; intensity: number }; // SpotLight candela, decay 2
  dust: { count: number; opacity: number; size: number; color: string };
  grain: number; // film-grain overlay opacity, 0–1
  /** Post chain (Quang-approved): bloom glows lights, vignette closes the frame. */
  bloom: { intensity: number; luminanceThreshold: number };
  vignette: number; // Vignette darkness, 0–1
}

export function lookExtras(look: AtmosphereLook): LookExtras {
  const lum = luminance(look.background);
  const dark = 1 - lum;
  const fogN = Math.min(1, look.fog.density / 0.06);
  return {
    envIntensity: round(0.25 + 0.55 * lum),
    pictureLight: {
      color: mix("#fff2dc", look.directional.color, 0.35),
      intensity: round(8 + 10 * (1 - lum)),
    },
    dust: {
      count: Math.round(120 + 480 * dark),
      opacity: round(0.1 + 0.3 * dark),
      size: round(0.008 + 0.006 * fogN),
      color: mix("#ffffff", look.fog.color, 0.5),
    },
    grain: round(0.02 + 0.07 * dark),
    bloom: {
      intensity: round(0.1 + 0.35 * dark),
      luminanceThreshold: round(0.7 + 0.2 * lum),
    },
    vignette: round(0.08 + 0.22 * dark),
  };
}

/**
 * Creator brightness as a light level (custom preset only): 0.25–1, so the slider
 * moves ALL of the light — IBL and picture spots follow it, not just the preset
 * intensities. Named presets return 1 (their look is the design, unchanged).
 */
export function resolveLightLevel(room: { atmosphere?: Atmosphere }): number {
  const a = room.atmosphere;
  if (!a || a.preset !== "custom") return 1;
  const b = Number.isFinite(a.brightness) ? Math.min(1, Math.max(0, a.brightness)) : 1;
  return 0.25 + 0.75 * b;
}

// ---- small helpers ----

/** Relative luminance of a #rrggbb color, 0–1 (sRGB, Rec. 709 weights). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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
