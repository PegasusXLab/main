import { describe, expect, it } from "vitest";
import { MAX_ZOOM, MIN_ZOOM, clampZoom, fitView, isTrackpadPan, wheelZoomFactor } from "./canvasView";

const wheel = (o: Partial<{ deltaX: number; deltaY: number; deltaMode: number; ctrlKey: boolean }>) => ({
  deltaX: 0,
  deltaY: 0,
  deltaMode: 0,
  ctrlKey: false,
  ...o,
});

describe("canvas navigation math", () => {
  it("zooms proportionally: small pinch steps are small, never a fixed 20% jump", () => {
    const tiny = wheelZoomFactor(wheel({ deltaY: -2, ctrlKey: true }));
    expect(tiny).toBeGreaterThan(1);
    expect(tiny).toBeLessThan(1.03);
    const notch = wheelZoomFactor(wheel({ deltaY: -100 }));
    expect(notch).toBeGreaterThan(1.1);
    expect(notch).toBeLessThan(1.2);
    // In and out are symmetric.
    expect(wheelZoomFactor(wheel({ deltaY: 100 })) * notch).toBeCloseTo(1);
  });

  it("treats trackpad two-finger scrolls as pans, wheels and pinches as zoom", () => {
    expect(isTrackpadPan(wheel({ deltaX: 3, deltaY: 1.5 }))).toBe(true);
    expect(isTrackpadPan(wheel({ deltaY: 12 }))).toBe(true);
    expect(isTrackpadPan(wheel({ deltaY: 100 }))).toBe(false);
    expect(isTrackpadPan(wheel({ deltaY: 3, ctrlKey: true }))).toBe(false);
    expect(isTrackpadPan(wheel({ deltaY: 3, deltaMode: 1 }))).toBe(false);
  });

  it("clamps zoom", () => {
    expect(clampZoom(100)).toBe(MAX_ZOOM);
    expect(clampZoom(0)).toBe(MIN_ZOOM);
  });

  it("fits every room in view, centered", () => {
    const rooms = [
      { x: 0, y: 0, w: 6, d: 6 },
      { x: 6, y: 0, w: 6, d: 6 },
      { x: 0, y: 6, w: 12, d: 6 },
    ];
    const size = { width: 600, height: 500 };
    const v = fitView(rooms, size, 40)!;
    const ppm = 40 * v.zoom;
    // Plan spans 12 x 12 m; it fits inside the padded box and is centered.
    expect(12 * ppm).toBeLessThanOrEqual(size.height - 2 * 56 + 1e-6);
    expect(v.pan.x + 6 * ppm).toBeCloseTo(300);
    expect(v.pan.y + 6 * ppm).toBeCloseTo(250);
    expect(fitView([], size, 40)).toBeNull();
  });
});
