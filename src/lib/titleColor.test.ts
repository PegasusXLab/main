import { describe, expect, it } from "vitest";
import { extrusionShadow, isTitleColor, luminance, mix, titlePalette } from "./titleColor";

describe("titleColor", () => {
  it("accepts only #rrggbb", () => {
    expect(isTitleColor("#D8B35A")).toBe(true);
    expect(isTitleColor("red")).toBe(false);
    expect(isTitleColor("#fff")).toBe(false);
    expect(isTitleColor("#ffffff; background:url(x)")).toBe(false);
  });

  it("mixes and measures colors", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(luminance("#ffffff")).toBeCloseTo(1);
    expect(luminance("#000000")).toBe(0);
  });

  it("derives a dark side and dark scrim for light faces", () => {
    const p = titlePalette("#ffffff");
    expect(p.dark).toBe(false);
    expect(luminance(p.side)).toBeLessThan(0.3);
    expect(p.scrim).toContain("12,12,14");
  });

  it("flips to a light scrim and lighter side for dark faces", () => {
    const p = titlePalette("#16171b");
    expect(p.dark).toBe(true);
    expect(luminance(p.side)).toBeGreaterThan(luminance("#16171b"));
    expect(p.scrim).toContain("255,255,255");
  });

  it("falls back to white for invalid colors", () => {
    expect(titlePalette("javascript:alert(1)").face).toBe("#ffffff");
  });

  it("builds one shadow per layer plus a cast shadow", () => {
    const s = extrusionShadow(titlePalette("#ffffff"), 4);
    expect(s.split(/,\s*calc\(/).length).toBe(5); // 4 layers + cast shadow
    expect((s.match(/calc\(/g) ?? []).length).toBe(10);
  });
});
