import { describe, expect, it } from "vitest";
import { THEME } from "./theme";

describe("THEME design system mirror (ADR-013)", () => {
  it("exports canonical colors matching ADR-013", () => {
    expect(THEME.colors.plaster).toBe("#eff0ee");
    expect(THEME.colors.paper).toBe("#ffffff");
    expect(THEME.colors.graphite).toBe("#1e2022");
    expect(THEME.colors.graphiteHover).toBe("#2a2d30");
    expect(THEME.colors.pencil).toBe("#7d8085");
    expect(THEME.colors.hairline).toBe("#d5d7d4");
    expect(THEME.colors.accent).toBe("#002fa7"); // Klein blue
    expect(THEME.colors.accentHover).toBe("#002484");
    expect(THEME.colors.accentSubtle).toBe("rgba(0, 47, 167, 0.08)");
    expect(THEME.colors.danger).toBe("#c7353f");
    expect(THEME.colors.dangerHover).toBe("#aa2b34");
    expect(THEME.colors.kraft).toBe("#c59a6a");
  });

  it("exports radius tokens conforming to ADR-013 2px rule", () => {
    expect(THEME.radius.sm).toBe("2px");
    expect(THEME.radius.default).toBe("2px");
    expect(THEME.radius.md).toBe("4px");
  });

  it("exports font variable references", () => {
    expect(THEME.fonts.display).toBe("var(--font-display)");
    expect(THEME.fonts.sans).toBe("var(--font-sans)");
  });

  it("exports motion durations and easings", () => {
    expect(THEME.motion.durationFast).toBe("120ms");
    expect(THEME.motion.durationNormal).toBe("180ms");
    expect(THEME.motion.durationSlow).toBe("300ms");
    expect(THEME.motion.easeOut).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
  });
});
