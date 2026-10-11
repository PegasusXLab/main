import { describe, expect, it } from "vitest";
import { CURATED_FONTS, customFontFamily, getFontFamily } from "./fonts";

describe("Typography Engine (fonts.ts)", () => {
  it("exports curated decadent typography options", () => {
    expect(CURATED_FONTS.length).toBeGreaterThanOrEqual(8);
    const ids = CURATED_FONTS.map((f) => f.id);
    expect(ids).toContain("cormorant");
    expect(ids).toContain("cinzel");
    expect(ids).toContain("playfair");
    expect(ids).toContain("fraunces");
    expect(ids).toContain("bodoni");
    expect(ids).toContain("syne");
    expect(ids).toContain("archivo");
    expect(ids).toContain("mono");
  });

  it("resolves CSS font-family for curated fonts", () => {
    expect(getFontFamily("cormorant")).toContain("Cormorant Garamond");
    expect(getFontFamily("cinzel")).toContain("Cinzel");
    expect(getFontFamily("playfair")).toContain("Playfair Display");
    expect(getFontFamily("fraunces")).toContain("Fraunces");
    expect(getFontFamily("bodoni")).toContain("Bodoni Moda");
    expect(getFontFamily("syne")).toContain("Syne");
  });

  it("uses an uploaded font only when chosen and stored by us", () => {
    const url = "/api/files/fonts/abc123.woff2";
    expect(getFontFamily("custom", url)).toBe(
      `'${customFontFamily(url)}', var(--font-display), ui-sans-serif, sans-serif`,
    );
    // A curated choice wins even if an old upload URL is still on the room.
    expect(getFontFamily("cinzel", url)).toContain("Cinzel");
    // Third-party or malformed URLs are never used.
    expect(getFontFamily("custom", "https://example.com/custom.woff2")).toBe(
      "var(--font-display), ui-sans-serif, sans-serif",
    );
    expect(getFontFamily("custom", "/api/files/fonts/x.woff2') } body{")).toBe(
      "var(--font-display), ui-sans-serif, sans-serif",
    );
  });

  it("gives each uploaded font its own family name", () => {
    const a = customFontFamily("/api/files/fonts/a.woff2");
    const b = customFontFamily("/api/files/fonts/b.woff2");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^gv-custom-[a-z0-9]+$/);
  });

  it("falls back gracefully for unknown or undefined font IDs", () => {
    expect(getFontFamily(undefined)).toBe(
      "var(--font-display), ui-sans-serif, sans-serif",
    );
    expect(getFontFamily("serif")).toBe("ui-serif, Georgia, serif");
  });
});
