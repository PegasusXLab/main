// Room title colors: the creator picks the face color; everything that keeps it readable and
// three-dimensional (extrusion shade, drop shadow, legibility scrim) is derived from it. Pure.

export const DEFAULT_TITLE_COLOR = "#ffffff";

/** Swatches offered in the editor (any #rrggbb is allowed). */
export const TITLE_COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: "Gallery white", hex: "#ffffff" },
  { name: "Bone", hex: "#efe6d2" },
  { name: "Gilded", hex: "#d8b35a" },
  { name: "Rose", hex: "#e8b4b8" },
  { name: "Klein blue", hex: "#2f5bff" },
  { name: "Oxblood", hex: "#7a1e22" },
  { name: "Ink", hex: "#16171b" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isTitleColor(v: unknown): v is string {
  return typeof v === "string" && HEX.test(v);
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix `hex` toward `toward` by t (0..1). */
export function mix(hex: string, toward: string, t: number): string {
  const a = rgb(hex);
  const b = rgb(toward);
  return toHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as [number, number, number]);
}

/** WCAG relative luminance (0 black … 1 white). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface TitlePalette {
  /** Face color. */
  face: string;
  /** Extruded side (a deep shade of the face). */
  side: string;
  /** Soft cast shadow under the letters. */
  cast: string;
  /** Radial scrim behind the block, light for dark faces and dark for light ones. */
  scrim: string;
  /** Eyebrow / description color. */
  muted: string;
  dark: boolean;
}

/** Everything the title needs, from one color. Invalid input falls back to white. */
export function titlePalette(color?: string): TitlePalette {
  const face = isTitleColor(color) ? color.toLowerCase() : DEFAULT_TITLE_COLOR;
  const dark = luminance(face) < 0.22;
  return {
    face,
    side: dark ? mix(face, "#ffffff", 0.35) : mix(face, "#000000", 0.55),
    cast: dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)",
    scrim: dark ? "rgba(255,255,255,0.42)" : "rgba(12,12,14,0.32)",
    // Supporting text stays near white (or near black) with a hint of the face, for contrast.
    muted: dark ? mix("#16171b", face, 0.25) : mix("#ffffff", face, 0.15),
    dark,
  };
}

/**
 * Stacked text-shadow that extrudes the letters `layers` px deep along (dx, dy) per layer, plus a
 * soft cast shadow. `dx` / `dy` may be CSS expressions (so the edge can follow the pointer).
 */
export function extrusionShadow(
  p: Pick<TitlePalette, "side" | "cast">,
  layers = 6,
  dx = "var(--gv-ex, 0.6px)",
  dy = "var(--gv-ey, 0.9px)",
): string {
  const steps = Array.from(
    { length: layers },
    (_, i) => `calc(${dx} * ${i + 1}) calc(${dy} * ${i + 1}) 0 ${p.side}`,
  );
  steps.push(`calc(${dx} * ${layers + 4}) calc(${dy} * ${layers + 10}) 28px ${p.cast}`);
  return steps.join(", ");
}
