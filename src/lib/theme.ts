/**
 * Canonical Galleriverse design system theme mirror (ADR-013).
 * Shared across UI components, 2D SVG canvas (editor2d), and 3D scenes (viewer3d).
 */

export const THEME = {
  colors: {
    plaster: "#eff0ee",
    paper: "#ffffff",
    graphite: "#1e2022",
    graphiteHover: "#2a2d30",
    pencil: "#7d8085",
    hairline: "#d5d7d4",
    accent: "#002fa7", // Canonical Klein blue replacing #2563eb
    accentHover: "#002484",
    accentSubtle: "rgba(0, 47, 167, 0.08)",
    danger: "#c7353f",
    dangerHover: "#aa2b34",
    kraft: "#c59a6a",
  },
  radius: {
    sm: "2px",
    default: "2px",
    md: "4px",
  },
  fonts: {
    display: "var(--font-display)",
    sans: "var(--font-sans)",
  },
  motion: {
    durationFast: "120ms",
    durationNormal: "180ms",
    durationSlow: "300ms",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type Theme = typeof THEME;
export type ThemeColors = typeof THEME.colors;
