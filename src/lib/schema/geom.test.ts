import { describe, expect, it } from "vitest";
import {
  fromGrid,
  isOnGrid,
  rangeOverlap,
  rectsOverlap,
  sameLine,
  snap,
  snapRect,
  toGrid,
} from "./geom";

describe("grid conversion", () => {
  it("converts meters to half-meter units and back", () => {
    expect(toGrid(3)).toBe(6);
    expect(toGrid(0.5)).toBe(1);
    expect(fromGrid(7)).toBe(3.5);
  });

  it("snaps to the nearest 0.5 m", () => {
    expect(snap(1.2)).toBe(1);
    expect(snap(1.3)).toBe(1.5);
    expect(snap(-0.7)).toBe(-0.5);
    expect(snapRect({ x: 0.2, y: 5.9, w: 6.1, d: 2.26 })).toEqual({
      x: 0,
      y: 6,
      w: 6,
      d: 2.5,
    });
  });

  it("knows what is on the grid", () => {
    expect(isOnGrid(2.5)).toBe(true);
    expect(isOnGrid(-1)).toBe(true);
    expect(isOnGrid(0.1 + 0.2 + 0.2)).toBe(true); // 0.5000000000000001
    expect(isOnGrid(0.25)).toBe(false);
    expect(isOnGrid(1.1)).toBe(false);
  });
});

describe("sameLine", () => {
  it("treats float noise as equal (0.1 + 0.2 vs 0.3)", () => {
    expect(0.1 + 0.2 === 0.3).toBe(false);
    expect(sameLine(0.1 + 0.2 + 0.2, 0.5)).toBe(true);
    expect(sameLine(2.5 + 3.5, 6)).toBe(true);
  });

  it("matches one room's east edge to the next room's west edge", () => {
    const a = { x: 0.1 + 0.2 + 0.2, w: 5.5 }; // east edge ≈ 6
    expect(sameLine(a.x + a.w, 6)).toBe(true);
  });

  it("separates different grid lines", () => {
    expect(sameLine(6, 6.5)).toBe(false);
  });
});

describe("rangeOverlap", () => {
  it("returns the shared interval", () => {
    expect(rangeOverlap(0, 6, 4, 10)).toEqual([4, 6]);
    expect(rangeOverlap(0, 6, 0, 6)).toEqual([0, 6]);
    expect(rangeOverlap(1, 2, 0, 6)).toEqual([1, 2]);
  });

  it("accepts reversed endpoints", () => {
    expect(rangeOverlap(6, 0, 10, 4)).toEqual([4, 6]);
  });

  it("returns null when ranges only touch or are apart", () => {
    expect(rangeOverlap(0, 6, 6, 12)).toBeNull();
    expect(rangeOverlap(0, 2, 3, 5)).toBeNull();
  });

  it("is not fooled by float noise at the touching point", () => {
    expect(rangeOverlap(0, 0.1 + 0.2 + 0.2, 0.5, 2)).toBeNull();
  });
});

describe("rectsOverlap (strict)", () => {
  const a = { x: 0, y: 0, w: 6, d: 6 };

  it("rooms that share an edge do not overlap", () => {
    expect(rectsOverlap(a, { x: 6, y: 0, w: 6, d: 6 })).toBe(false); // east
    expect(rectsOverlap(a, { x: 0, y: 6, w: 4, d: 5 })).toBe(false); // south, partial
    expect(rectsOverlap(a, { x: -3, y: -2, w: 3, d: 4 })).toBe(false); // west
  });

  it("rooms that only touch at a corner do not overlap", () => {
    expect(rectsOverlap(a, { x: 6, y: 6, w: 2, d: 2 })).toBe(false);
  });

  it("rooms that share area overlap", () => {
    expect(rectsOverlap(a, { x: 5.5, y: 0, w: 6, d: 6 })).toBe(true);
    expect(rectsOverlap(a, { x: 2, y: 2, w: 2, d: 2 })).toBe(true); // contained
    expect(rectsOverlap(a, a)).toBe(true);
  });

  it("touching with float noise still does not overlap", () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, w: 0.1 + 0.2 + 0.2, d: 2 },
        { x: 0.5, y: 0, w: 2, d: 2 },
      ),
    ).toBe(false);
  });

  it("apart rooms do not overlap", () => {
    expect(rectsOverlap(a, { x: 10, y: 10, w: 2, d: 2 })).toBe(false);
  });
});
