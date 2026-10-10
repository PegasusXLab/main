import { describe, expect, it } from "vitest";
import {
  ATMOSPHERE_PRESETS,
  blendLook,
  easeInOutCubic,
  lookFromCustom,
  lookFromLighting,
  lookExtras,
  mix,
  resolveLook,
  resolveLightLevel,
  resolveLookOverrides,
} from "./atmosphere";
import { LIGHTING_PRESETS } from "./defaults";
import type { Atmosphere } from "./types";

const custom = (over: Partial<Atmosphere> = {}): Atmosphere => ({
  preset: "custom",
  moodColor: "#ff0000",
  haze: 0.5,
  brightness: 0.5,
  lightDirection: 90,
  grain: 0,
  ...over,
});

describe("resolveLook", () => {
  it("rooms without atmosphere keep their lighting preset, with no fog (no behavior change)", () => {
    for (const lighting of ["gallery", "warm", "moody"] as const) {
      const look = resolveLook({ lighting });
      expect(look).toMatchObject(LIGHTING_PRESETS[lighting]);
      expect(look.fog.density).toBe(0);
    }
  });

  it("named presets win over lighting", () => {
    for (const name of [
      "gallery-white",
      "neon-bunker",
      "golden-hour",
      "moonlit",
    ] as const) {
      expect(
        resolveLook({
          lighting: "gallery",
          atmosphere: custom({ preset: name }),
        }),
      ).toBe(ATMOSPHERE_PRESETS[name]);
    }
  });

  it("custom uses the room's sliders", () => {
    expect(resolveLook({ lighting: "gallery", atmosphere: custom() })).toEqual(
      lookFromCustom(custom()),
    );
  });
});

describe("presets are plain data", () => {
  it("has the four named presets with lights, fog and background", () => {
    expect(Object.keys(ATMOSPHERE_PRESETS).sort()).toEqual([
      "gallery-white",
      "golden-hour",
      "moonlit",
      "neon-bunker",
    ]);
    for (const look of Object.values(ATMOSPHERE_PRESETS)) {
      expect(JSON.parse(JSON.stringify(look))).toEqual(look);
      expect(look.background).toMatch(/^#[0-9a-f]{6}$/);
      expect(look.fog.density).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Moonlit stays night but readable (T-065)", () => {
  const blueish = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return (n & 255) > ((n >> 16) & 255); // more blue than red
  };

  it("has strong enough light to see walls and artwork", () => {
    const m = ATMOSPHERE_PRESETS.moonlit;
    expect(m.ambient.intensity).toBeGreaterThanOrEqual(2);
    expect(m.directional.intensity).toBeGreaterThanOrEqual(1.5);
    expect(m.fog.density).toBeLessThanOrEqual(0.03);
  });

  it("keeps blue night tones", () => {
    const m = ATMOSPHERE_PRESETS.moonlit;
    for (const c of [
      m.ambient.skyColor,
      m.ambient.groundColor,
      m.directional.color,
      m.background,
      m.fog.color,
    ]) {
      expect(blueish(c)).toBe(true);
    }
  });

  it("leaves the other presets unchanged", () => {
    expect(ATMOSPHERE_PRESETS["golden-hour"].ambient.intensity).toBe(0.9);
    expect(ATMOSPHERE_PRESETS["neon-bunker"].ambient.intensity).toBe(0.55);
    expect(ATMOSPHERE_PRESETS["gallery-white"].ambient.intensity).toBe(1.2);
  });
});

describe("lookFromCustom", () => {
  it("haze 0 means no fog; haze 1 the maximum", () => {
    expect(lookFromCustom(custom({ haze: 0 })).fog.density).toBe(0);
    expect(lookFromCustom(custom({ haze: 1 })).fog.density).toBeCloseTo(0.08);
  });

  it("brightness scales intensities", () => {
    const dim = lookFromCustom(custom({ brightness: 0 }));
    const bright = lookFromCustom(custom({ brightness: 1 }));
    expect(bright.ambient.intensity).toBeGreaterThan(dim.ambient.intensity);
    expect(bright.directional.intensity).toBeGreaterThan(
      dim.directional.intensity,
    );
  });

  it("lightDirection turns the sun around the room (degrees)", () => {
    expect(
      lookFromCustom(custom({ lightDirection: 0 })).directional.direction,
    ).toEqual([0, -1, -1]);
    expect(
      lookFromCustom(custom({ lightDirection: 90 })).directional.direction,
    ).toEqual([1, -1, 0]);
  });

  it("mood color tints the lights", () => {
    expect(
      lookFromCustom(custom({ moodColor: "#ff0000" })).directional.color,
    ).toBe(mix("#ffffff", "#ff0000", 0.3));
  });

  it("clamps out-of-range or non-finite sliders", () => {
    expect(lookFromCustom(custom({ haze: 5 })).fog.density).toBeCloseTo(0.08);
    expect(
      lookFromCustom(custom({ brightness: Number.NaN })).ambient.intensity,
    ).toBeCloseTo(0.3);
  });
});

describe("blend math", () => {
  const a = lookFromLighting("gallery");
  const b = ATMOSPHERE_PRESETS["neon-bunker"];

  it("t = 0 is the start, t = 1 the target", () => {
    expect(blendLook(a, b, 0)).toBe(a);
    expect(blendLook(a, b, 1)).toBe(b);
    expect(blendLook(a, b, -1)).toBe(a);
    expect(blendLook(a, b, 2)).toBe(b);
  });

  it("t = 0.5 is halfway for numbers and colors", () => {
    const mid = blendLook(a, b, 0.5);
    expect(mid.ambient.intensity).toBeCloseTo(
      (a.ambient.intensity + b.ambient.intensity) / 2,
    );
    expect(mid.fog.density).toBeCloseTo(b.fog.density / 2);
    expect(mid.background).toBe(mix(a.background, b.background, 0.5));
    expect(mid.directional.direction[0]).toBeCloseTo(
      (a.directional.direction[0] + b.directional.direction[0]) / 2,
    );
  });

  it("mix blends hex colors channel by channel", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#ff0000");
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#0000ff");
  });

  it("easeInOutCubic runs 0 → 1, symmetric, clamped", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75));
    expect(easeInOutCubic(-3)).toBe(0);
    expect(easeInOutCubic(4)).toBe(1);
  });
});

describe("lookExtras (T-125)", () => {
  it("gives bright rooms more fill and dark rooms stronger picture lights", () => {
    const bright = lookExtras(ATMOSPHERE_PRESETS["gallery-white"]);
    const dark = lookExtras(ATMOSPHERE_PRESETS["neon-bunker"]);
    expect(bright.envIntensity).toBeGreaterThan(dark.envIntensity);
    expect(dark.pictureLight.intensity).toBeGreaterThan(
      bright.pictureLight.intensity,
    );
  });

  it("keeps values in range for every preset", () => {
    for (const look of Object.values(ATMOSPHERE_PRESETS)) {
      const x = lookExtras(look);
      expect(x.envIntensity).toBeGreaterThanOrEqual(0.25);
      expect(x.envIntensity).toBeLessThanOrEqual(0.8);
      expect(x.pictureLight.intensity).toBeGreaterThanOrEqual(8);
      expect(x.pictureLight.intensity).toBeLessThanOrEqual(18);
      expect(x.pictureLight.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gives dark foggy rooms more dust and grain than bright ones (look L2)", () => {
    const bright = lookExtras(ATMOSPHERE_PRESETS["gallery-white"]);
    const dark = lookExtras(ATMOSPHERE_PRESETS["neon-bunker"]);
    expect(dark.dust.count).toBeGreaterThan(bright.dust.count);
    expect(dark.dust.opacity).toBeGreaterThan(bright.dust.opacity);
    expect(dark.grain).toBeGreaterThan(bright.grain);
    for (const look of Object.values(ATMOSPHERE_PRESETS)) {
      const x = lookExtras(look);
      expect(x.dust.count).toBeGreaterThan(0);
      expect(x.dust.opacity).toBeGreaterThan(0);
      expect(x.dust.opacity).toBeLessThanOrEqual(0.5);
      expect(x.dust.size).toBeGreaterThan(0);
      expect(x.dust.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(x.grain).toBeGreaterThanOrEqual(0.02);
      expect(x.grain).toBeLessThanOrEqual(0.1);
    }
  });

  it("keeps the post chain subtle on bright rooms, stronger in the dark (post)", () => {
    const bright = lookExtras(ATMOSPHERE_PRESETS["gallery-white"]);
    const dark = lookExtras(ATMOSPHERE_PRESETS["neon-bunker"]);
    expect(dark.bloom.intensity).toBeGreaterThan(bright.bloom.intensity);
    expect(dark.vignette).toBeGreaterThan(bright.vignette);
    for (const look of Object.values(ATMOSPHERE_PRESETS)) {
      const x = lookExtras(look);
      expect(x.bloom.intensity).toBeGreaterThan(0);
      expect(x.bloom.intensity).toBeLessThanOrEqual(0.45);
      expect(x.bloom.luminanceThreshold).toBeGreaterThanOrEqual(0.7);
      expect(x.bloom.luminanceThreshold).toBeLessThanOrEqual(0.9);
      expect(x.vignette).toBeGreaterThanOrEqual(0.08);
      expect(x.vignette).toBeLessThanOrEqual(0.3);
    }
  });
});

describe("resolveLookOverrides (creator look controls)", () => {
  it("is empty for named presets (derived look wins)", () => {
    expect(
      resolveLookOverrides({
        atmosphere: {
          preset: "neon-bunker",
          moodColor: "#000",
          haze: 0,
          brightness: 1,
          lightDirection: 0,
          grain: 0.5,
        },
      }),
    ).toEqual({});
    expect(resolveLookOverrides({})).toEqual({});
  });

  it("passes custom grain/glow/vignette through (unset stays derived)", () => {
    expect(
      resolveLookOverrides({
        atmosphere: {
          preset: "custom",
          moodColor: "#fff",
          haze: 0,
          brightness: 1,
          lightDirection: 0,
          grain: 0.4,
          glow: 0.8,
        },
      }),
    ).toEqual({ grain: 0.4, glow: 0.8, vignette: undefined, spots: undefined });
  });
});

describe("resolveLightLevel (brightness moves all the light)", () => {
  it("is 1 for named presets (their look is unchanged)", () => {
    expect(resolveLightLevel({})).toBe(1);
    expect(
      resolveLightLevel({
        atmosphere: {
          preset: "moonlit",
          moodColor: "#000",
          haze: 0,
          brightness: 0,
          lightDirection: 0,
          grain: 0,
        },
      }),
    ).toBe(1);
  });

  it("maps custom brightness 0–1 to level 0.25–1", () => {
    const custom = (brightness: number) =>
      resolveLightLevel({
        atmosphere: {
          preset: "custom",
          moodColor: "#fff",
          haze: 0,
          brightness,
          lightDirection: 0,
          grain: 0,
        },
      });
    expect(custom(1)).toBe(1);
    expect(custom(0)).toBe(0.25);
    expect(custom(0.5)).toBeCloseTo(0.625);
  });
});
