/**
 * Curated typography engine for Galleriverse room titles & plaques.
 * Provides decadent editorial, monumental, luxury, and modernist typefaces.
 */

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
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    category: "serif",
    vibe: "Classical Roman Monument",
    fontFamily: "'Cinzel', Trajan, Georgia, serif",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    category: "serif",
    vibe: "Haute Couture & Editorial",
    fontFamily: "'Playfair Display', Didot, Georgia, serif",
  },
  {
    id: "fraunces",
    name: "Fraunces",
    category: "serif",
    vibe: "Warm Velvet Display",
    fontFamily: "'Fraunces', Georgia, serif",
  },
  {
    id: "bodoni",
    name: "Bodoni Moda",
    category: "serif",
    vibe: "Ultra-Chic Italian Luxury",
    fontFamily: "'Bodoni Moda', Didot, Georgia, serif",
  },
  {
    id: "syne",
    name: "Syne",
    category: "sans",
    vibe: "Avant-Garde Biennial",
    fontFamily: "'Syne', system-ui, sans-serif",
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
    fontFamily: "'Space Mono', ui-monospace, monospace",
  },
];

/**
 * Returns the CSS font-family string for a given font ID or custom font.
 */
export function getFontFamily(fontId?: string, customFontUrl?: string): string {
  if (customFontUrl) {
    return "'CustomUploadedFont', var(--font-display), sans-serif";
  }
  const match = CURATED_FONTS.find((f) => f.id === fontId);
  if (match) return match.fontFamily;
  if (fontId === "serif") return "ui-serif, Georgia, serif";
  if (fontId && fontId.trim()) return `"${fontId}", sans-serif`;
  return "var(--font-display), ui-sans-serif, sans-serif";
}

/**
 * Helper to dynamically inject a custom @font-face rule into the document for custom uploaded fonts.
 */
export function loadCustomFont(fontUrl: string, fontFamily = "CustomUploadedFont") {
  if (typeof window === "undefined" || !fontUrl) return;
  const styleId = `custom-font-${fontFamily}`;
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @font-face {
      font-family: '${fontFamily}';
      src: url('${fontUrl}') format('woff2'), url('${fontUrl}') format('truetype');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}
