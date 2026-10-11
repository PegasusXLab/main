import { describe, expect, it } from "vitest";
import { CURATED_FONTS, getFontFamily } from "./fonts";

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

  it("resolves custom uploaded font family when customFontUrl is provided", () => {
    expect(getFontFamily(undefined, "https://example.com/custom.woff2")).toBe(
      "'CustomUploadedFont', var(--font-display), sans-serif",
    );
  });

  it("falls back gracefully for unknown or undefined font IDs", () => {
    expect(getFontFamily(undefined)).toBe(
      "var(--font-display), ui-sans-serif, sans-serif",
    );
    expect(getFontFamily("serif")).toBe("ui-serif, Georgia, serif");
  });
});
