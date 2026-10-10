import { describe, expect, it } from "vitest";
import { GRID, snap, snapPoint, snapRoom } from "./snapping";

describe("snapping", () => {
  it("exports standard 0.5m grid constant", () => {
    expect(GRID).toBe(0.5);
  });

  it("snaps individual coordinate values via re-exported snap", () => {
    expect(snap(0)).toBe(0);
    expect(snap(0.24)).toBe(0);
    expect(snap(0.25)).toBe(0.5);
    expect(snap(0.74)).toBe(0.5);
    expect(snap(0.76)).toBe(1.0);
    expect(snap(-0.3)).toBe(-0.5);
    expect(snap(-0.2)).toBe(0);
  });

  it("snaps 2D points to 0.5m grid", () => {
    expect(snapPoint({ x: 1.1, y: 2.4 })).toEqual({ x: 1.0, y: 2.5 });
    expect(snapPoint({ x: -0.4, y: 5.66 })).toEqual({ x: -0.5, y: 5.5 });
    expect(snapPoint({ x: 6.0, y: 0.0 })).toEqual({ x: 6.0, y: 0.0 });
  });

  it("snaps rect fields via snapRoom", () => {
    expect(
      snapRoom({
        x: 1.2,
        y: -3.3,
        w: 5.8,
        d: 6.1,
      }),
    ).toEqual({
      x: 1.0,
      y: -3.5,
      w: 6.0,
      d: 6.0,
    });
  });
});
