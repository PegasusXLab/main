/**
 * Curated typography for Galleriverse room titles & plaques (editorial, monumental, luxury and
 * modernist faces). The curated faces are self-hosted via next/font (src/app/titleFonts.ts);
 * creators can also upload their own (stored by /api/upload/font, loaded with the FontFace API).
 */

import { isSafeFontUrl } from "./fontLimit";

export interface FontOption {
  id: string;
  name: string;
  category: "serif" | "sans" | "mono";
  vibe: string;
  fontFamily: string;
}

export const CURATED_FONTS: FontOption[] = [
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    category: "serif",
    vibe: "Poetic Fine-Art Serif",
    fontFamily: "var(--font-title-cormorant), 'Cormorant Garamond', Georgia, serif",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    category: "serif",
    vibe: "Classical Roman Monument",
    fontFamily: "var(--font-title-cinzel), 'Cinzel', Trajan, Georgia, serif",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    category: "serif",
    vibe: "Haute Couture & Editorial",
    fontFamily: "var(--font-title-playfair), 'Playfair Display', Didot, Georgia, serif",
  },
  {
    id: "fraunces",
    name: "Fraunces",
    category: "serif",
    vibe: "Warm Velvet Display",
    fontFamily: "var(--font-title-fraunces), 'Fraunces', Georgia, serif",
  },
  {
    id: "bodoni",
    name: "Bodoni Moda",
    category: "serif",
    vibe: "Ultra-Chic Italian Luxury",
    fontFamily: "var(--font-title-bodoni), 'Bodoni Moda', Didot, Georgia, serif",
  },
  {
    id: "syne",
    name: "Syne",
    category: "sans",
    vibe: "Avant-Garde Biennial",
    fontFamily: "var(--font-title-syne), 'Syne', system-ui, sans-serif",
  },
  {
    id: "archivo",
    name: "Archivo",
    category: "sans",
    vibe: "Modernist Architectural",
    fontFamily: "var(--font-display), ui-sans-serif, sans-serif",
  },
  {
    id: "mono",
    name: "Space Mono",
    category: "mono",
    vibe: "Curatorial Catalog",
    fontFamily: "var(--font-title-mono), 'Space Mono', ui-monospace, monospace",
  },
];

/** The `titleFont` value that means "use the room's uploaded font". */
export const CUSTOM_FONT_ID = "custom";

const FALLBACK_FAMILY = "var(--font-display), ui-sans-serif, sans-serif";

/** A stable, CSS-safe family name per uploaded font file (so two rooms never collide). */
export function customFontFamily(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return `gv-custom-${(h >>> 0).toString(36)}`;
}

/**
 * CSS font-family for a room title. An uploaded font is used only when the room chose it and its
 * URL is one of our own stored fonts; otherwise the curated face, else the display font.
 */
export function getFontFamily(fontId?: string, customFontUrl?: string): string {
  if (fontId === CUSTOM_FONT_ID) {
    return isSafeFontUrl(customFontUrl)
      ? `'${customFontFamily(customFontUrl)}', ${FALLBACK_FAMILY}`
      : FALLBACK_FAMILY;
  }
  const match = CURATED_FONTS.find((f) => f.id === fontId);
  if (match) return match.fontFamily;
  if (fontId === "serif") return "ui-serif, Georgia, serif";
  return FALLBACK_FAMILY;
}

const loading = new Map<string, Promise<void>>();

/**
 * Load an uploaded font with the FontFace API (no <style> injection). Unsafe URLs are refused,
 * each file loads once per page, and failures fall back silently to the display font.
 */
export function loadCustomFont(url: string | undefined): Promise<void> {
  if (typeof document === "undefined" || typeof FontFace === "undefined") {
    return Promise.resolve();
  }
  if (!isSafeFontUrl(url)) return Promise.resolve();
  const existing = loading.get(url);
  if (existing) return existing;
  const face = new FontFace(customFontFamily(url), `url("${url}")`, { display: "swap" });
  const done = face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
    })
    .catch(() => {
      // Broken or missing file: keep the fallback face.
    });
  loading.set(url, done);
  return done;
}
