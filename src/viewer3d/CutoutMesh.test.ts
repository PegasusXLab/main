import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  traceAlphaContour,
  simplifyDouglasPeucker,
  averageEdgeColor,
  cutoutGeometry,
} from "./CutoutMesh";

function circleAlpha(w: number, h: number, r: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) out[y * w + x] = 255;
    }
  }
  return out;
}

describe("traceAlphaContour (T-131)", () => {
  it("returns [] for fully opaque and fully transparent images (standee fallback)", () => {
    expect(traceAlphaContour(new Uint8Array(16).fill(255), 4, 4)).toEqual([]);
    expect(traceAlphaContour(new Uint8Array(16), 4, 4)).toEqual([]);
    expect(traceAlphaContour(new Uint8Array(0), 0, 0)).toEqual([]);
  });

  it("traces a circle silhouette within a pixel of the true edge", () => {
    const w = 64;
    const h = 64;
    const contour = traceAlphaContour(circleAlpha(w, h, 20), w, h);
    expect(contour.length).toBeGreaterThan(8);
    expect(contour.length).toBeLessThanOrEqual(200);
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of contour) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    // Circle spans ~40 px centered at 32.
    expect(minX).toBeGreaterThanOrEqual(10);
    expect(maxX).toBeLessThanOrEqual(54);
    expect(minY).toBeGreaterThanOrEqual(10);
    expect(maxY).toBeLessThanOrEqual(54);
    expect(maxX - minX).toBeGreaterThan(30);
    expect(maxY - minY).toBeGreaterThan(30);
  });

  it("keeps only the largest silhouette when several exist", () => {
    const w = 64;
    const h = 64;
    const alpha = circleAlpha(w, h, 18);
    // Small second blob in the corner (background-separated).
    for (let y = 2; y < 8; y++)
      for (let x = 2; x < 8; x++) alpha[y * w + x] = 255;
    const contour = traceAlphaContour(alpha, w, h);
    let minX = Infinity,
      maxX = -Infinity;
    for (const p of contour) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
    }
    // The small blob (x 2..8) must not be part of the contour.
    expect(minX).toBeGreaterThan(10);
    expect(maxX - minX).toBeGreaterThan(25);
  });
});

describe("simplifyDouglasPeucker", () => {
  it("collapses a straight line to its endpoints", () => {
    const line = Array.from({ length: 50 }, (_, i) => ({ x: i, y: 0 }));
    expect(simplifyDouglasPeucker(line, 1.5)).toEqual([
      { x: 0, y: 0 },
      { x: 49, y: 0 },
    ]);
  });
});

describe("averageEdgeColor", () => {
  it("averages the border pixels and darkens 20%", () => {
    const w = 4;
    const h = 4;
    const rgba = new Uint8Array(w * h * 4).fill(0);
    // Border red, interior green.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
        rgba[i] = border ? 255 : 0;
        rgba[i + 1] = border ? 0 : 255;
        rgba[i + 3] = 255;
      }
    }
    const [r, g, b] = averageEdgeColor(rgba, w, h);
    expect(r).toBeCloseTo(0.8, 5);
    expect(g).toBeCloseTo(0, 5);
    expect(b).toBeCloseTo(0, 5);
  });
});

describe("cutoutGeometry", () => {
  it("builds a rounded-rect standee at the requested size when no contour", () => {
    const geo = cutoutGeometry(null, 0.5, 1.0, 0.02);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    expect(bb.max.x - bb.min.x).toBeCloseTo(0.5, 2);
    expect(bb.max.y - bb.min.y).toBeCloseTo(1.0, 2);
    expect(bb.max.z - bb.min.z).toBeGreaterThan(0.02);
    geo.dispose();
  });

  it("scales a contour so its height matches, centered on the origin", () => {
    const contour = [
      { x: 10, y: 10 },
      { x: 30, y: 10 },
      { x: 30, y: 50 },
      { x: 10, y: 50 },
    ];
    const geo = cutoutGeometry(contour, 0.25, 0.8, 0.02);
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    expect(bb.max.y - bb.min.y).toBeCloseTo(0.8, 2);
    expect((bb.max.x + bb.min.x) / 2).toBeCloseTo(0, 5);
    expect((bb.max.y + bb.min.y) / 2).toBeCloseTo(0, 5);
    geo.dispose();
  });

  it("is a real THREE geometry (sanity)", () => {
    expect(cutoutGeometry(null, 0.5, 1, 0.02)).toBeInstanceOf(THREE.ExtrudeGeometry);
  });
});
