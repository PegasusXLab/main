import { describe, expect, it } from "vitest";
import { anchoredRect, clampRect } from "./FloatingPanel";

describe("FloatingPanel geometry", () => {
  const box = { width: 1000, height: 700 };
  it("anchors to a corner with an inset", () => {
    expect(anchoredRect("top-right", { w: 300, h: 200 }, box, { x: 16, y: 64 })).toEqual({
      x: 684,
      y: 64,
      w: 300,
      h: 200,
    });
    expect(anchoredRect("bottom-left", { w: 300, h: 200 }, box, { x: 16, y: 16 })).toMatchObject({
      x: 16,
      y: 484,
    });
  });
  it("keeps panels inside the container and at least their minimum size", () => {
    const min = { w: 200, h: 140 };
    expect(clampRect({ x: 950, y: -50, w: 300, h: 200 }, box, min)).toEqual({ x: 692, y: 8, w: 300, h: 200 });
    expect(clampRect({ x: 0, y: 0, w: 50, h: 50 }, box, min)).toMatchObject({ w: 200, h: 140 });
    expect(clampRect({ x: 0, y: 0, w: 5000, h: 5000 }, box, min)).toMatchObject({ w: 984, h: 684 });
  });
});
