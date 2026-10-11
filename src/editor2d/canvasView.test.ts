import { describe, expect, it } from "vitest";
import { MAX_ZOOM, MIN_ZOOM, clampZoom, fitView, isTrackpadPan, overlayInsets, wheelZoomFactor } from "./canvasView";

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

  it("reserves the cheaper side for each floating panel", () => {
    const canvas = { left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700 };
    // Wide, short panel at the bottom right: reserving the bottom strip costs less than the right.
    const wide = overlayInsets(canvas, [{ left: 500, top: 560, right: 984, bottom: 680 }]);
    expect(wide.bottom).toBe(152);
    expect(wide.right).toBe(0);
    // Tall panel on the right reserves the right side.
    const tall = overlayInsets(canvas, [{ left: 800, top: 20, right: 980, bottom: 680 }]);
    expect(tall.right).toBe(212);
    expect(tall.bottom).toBe(0);
    // Panels outside the canvas don't count.
    expect(overlayInsets(canvas, [{ left: 1100, top: 0, right: 1200, bottom: 100 }])).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });
});
