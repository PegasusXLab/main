// Room-title typefaces (curated set, see src/lib/fonts.ts). Self-hosted by next/font: no request
// to Google from visitors, no render-blocking @import. preload is off, so a page downloads only
// the faces a room actually uses; the CSS variables are set on <html> in the root layout.

import {
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Fraunces,
  Playfair_Display,
  Space_Mono,
  Syne,
} from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-title-cormorant",
  display: "swap",
  preload: false,
});
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-title-cinzel",
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-title-playfair",
  display: "swap",
  preload: false,
});
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-title-fraunces",
  display: "swap",
  preload: false,
});
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-title-bodoni",
  display: "swap",
  preload: false,
});
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-title-syne",
  display: "swap",
  preload: false,
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-title-mono",
  display: "swap",
  preload: false,
});

/** Class names that define every title-font CSS variable (apply once, on <html>). */
export const titleFontVariables = [
  cormorant,
  cinzel,
  playfair,
  fraunces,
  bodoni,
  syne,
  spaceMono,
]
  .map((f) => f.variable)
  .join(" ");
