"use client";

// Cut-out sculptures (T-131, object-render spec): a photo's silhouette extruded into a thick
// standee. The trace is pure (traceAlphaContour) so it's unit-testable without a browser:
// binary alpha mask -> marching-squares segments -> longest loop -> Douglas-Peucker (<= 200 pts).
// Images with no transparency fall back to a rounded-rectangle "standee".
// Front and back caps share the image texture (the back reads mirrored, as it should); the sides
// use the image's average edge colour darkened 20%.

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

export interface ContourPoint {
  x: number; // pixels, image space (y down)
  y: number;
}

const ALPHA_THRESHOLD = 127;
const MAX_CONTOUR_POINTS = 200;
const SIMPLIFY_EPSILON_PX = 1.5;
/** Long side of the working bitmap for the trace; keeps the worker-free trace under ~8 ms. */
export const TRACE_MAX_SIDE = 256;
/** Corner radius of the no-alpha "standee" fallback, meters. */
export const STANDOFF_CORNER_RADIUS = 0.004;

function opaqueAt(
  alpha: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
): boolean {
  if (x < 0 || y < 0 || x >= w || y >= h) return false; // outside the image is background
  return alpha[y * w + x] > ALPHA_THRESHOLD;
}

/**
 * Trace the largest opaque silhouette in an alpha mask. Returns pixel-space contour points
 * (y down), or [] when the image is fully opaque (caller uses the rounded-rect fallback).
 */
export function traceAlphaContour(
  alpha: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
): ContourPoint[] {
  if (w < 2 || h < 2 || alpha.length < w * h) return [];
  let opaqueCount = 0;
  for (let i = 0; i < w * h; i++) if (alpha[i] > ALPHA_THRESHOLD) opaqueCount++;
  if (opaqueCount === 0 || opaqueCount === w * h) return [];

  // Boundary edges, each emitted once. A horizontal edge from (i, j) to (i + 1, j)
  // separates the pixel above (i, j - 1) from the one below (i, j); a vertical edge from
  // (i, j) to (i, j + 1) separates left (i - 1, j) from right (i, j). Outside = background.
  type Seg = [number, number, number, number];
  const segs: Seg[] = [];
  for (let j = 0; j <= h; j++) {
    for (let i = 0; i < w; i++) {
      if (opaqueAt(alpha, w, h, i, j - 1) !== opaqueAt(alpha, w, h, i, j)) {
        segs.push([i, j, i + 1, j]);
      }
    }
  }
  for (let i = 0; i <= w; i++) {
    for (let j = 0; j < h; j++) {
      if (opaqueAt(alpha, w, h, i - 1, j) !== opaqueAt(alpha, w, h, i, j)) {
        segs.push([i, j, i, j + 1]);
      }
    }
  }
  if (segs.length === 0) return [];

  // Join segments into loops, treating them as undirected (emitted edges all run
  // left-to-right / top-to-bottom, but a loop traverses them in both directions).
  const key = (x: number, y: number) => `${x},${y}`;
  const byEndpoint = new Map<string, Seg[]>();
  for (const s of segs) {
    for (const k of [key(s[0], s[1]), key(s[2], s[3])]) {
      const list = byEndpoint.get(k);
      if (list) list.push(s);
      else byEndpoint.set(k, [s]);
    }
  }
  const used = new Set<Seg>();
  const loops: ContourPoint[][] = [];
  for (const first of segs) {
    if (used.has(first)) continue;
    used.add(first);
    const loop: ContourPoint[] = [
      { x: first[0], y: first[1] },
      { x: first[2], y: first[3] },
    ];
    for (;;) {
      const tail = loop[loop.length - 1];
      const next = byEndpoint.get(key(tail.x, tail.y))?.find((s) => !used.has(s));
      if (!next) break;
      used.add(next);
      // Append the far endpoint.
      if (next[0] === tail.x && next[1] === tail.y) loop.push({ x: next[2], y: next[3] });
      else loop.push({ x: next[0], y: next[1] });
      if (loop.length > segs.length + 1) break; // safety
      const head = loop[0];
      const end = loop[loop.length - 1];
      if (end.x === head.x && end.y === head.y) break; // closed
    }
    if (loop.length >= 4) loops.push(loop);
  }
  if (loops.length === 0) return [];

  // Largest loop by bbox area (holes are smaller by construction).
  const area = (loop: ContourPoint[]) => {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of loop) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    return (maxX - minX) * (maxY - minY);
  };
  let best = loops[0];
  let bestArea = -1;
  for (const loop of loops) {
    const a = area(loop);
    if (a > bestArea) {
      bestArea = a;
      best = loop;
    }
  }
  const simplified = simplifyDouglasPeucker(best, SIMPLIFY_EPSILON_PX);
  return simplified.length > MAX_CONTOUR_POINTS
    ? subsample(simplified, MAX_CONTOUR_POINTS)
    : simplified;
}

function perpDistance(p: ContourPoint, a: ContourPoint, b: ContourPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Douglas-Peucker polyline simplification (pure, pixel units). */
export function simplifyDouglasPeucker(
  points: ContourPoint[],
  epsilon: number,
): ContourPoint[] {
  if (points.length <= 2) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyDouglasPeucker(points.slice(0, index + 1), epsilon);
    const right = simplifyDouglasPeucker(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function subsample(points: ContourPoint[], max: number): ContourPoint[] {
  const step = (points.length - 1) / (max - 1);
  const out: ContourPoint[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

/** Average edge colour of an RGBA bitmap, darkened 20% for the extrusion sides. */
export function averageEdgeColor(
  rgba: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
): [number, number, number] {
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  const push = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    r += rgba[i];
    g += rgba[i + 1];
    b += rgba[i + 2];
    n++;
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    if (h > 1) push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    push(0, y);
    if (w > 1) push(w - 1, y);
  }
  if (n === 0) return [0.5, 0.5, 0.5];
  const k = 0.8 / 255; // darkened 20%
  return [(r / n) * k, (g / n) * k, (b / n) * k];
}

/**
 * Build the extruded cutout geometry from a contour (or null contour = rounded-rect standee).
 * Pixel space (y down) is mapped to meters: shape height = `height`, centered at the origin,
 * extruded `depth` upward from z = 0. Caller positions the mesh on the plinth top.
 */
export function cutoutGeometry(
  contour: ContourPoint[] | null,
  width: number,
  height: number,
  depth: number,
): THREE.ExtrudeGeometry {
  let shape: THREE.Shape;
  if (contour && contour.length >= 3) {
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
    const spanY = Math.max(maxY - minY, 1e-6);
    const s = height / spanY;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    shape = new THREE.Shape();
    contour.forEach((p, i) => {
      const x = (p.x - cx) * s;
      const y = (cy - p.y) * s; // y up
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
  } else {
    shape = roundedRectShape(width, height, STANDOFF_CORNER_RADIUS);
  }
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 2,
  });
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export interface CutoutMeshProps {
  imageUrl: string;
  /** Displayed height, meters; width follows `aspect` (height / width). */
  height: number;
  aspect: number;
  depth: number;
  /** 0..1 during the model cross-fade; 1 (default) is fully opaque. */
  opacity?: number;
}

/**
 * The extruded silhouette. Async (image decode + trace); renders a neutral placeholder box
 * until ready, and on error. SSR-safe: without a document it renders the placeholder.
 */
export function CutoutMesh({
  imageUrl,
  height,
  aspect,
  depth,
  opacity = 1,
}: CutoutMeshProps) {
  const [ready, setReady] = useState<{
    geometry: THREE.ExtrudeGeometry;
    texture: THREE.Texture;
    edge: [number, number, number];
  } | null>(null);

  useEffect(() => {
    if (typeof document === "undefined" || !imageUrl) return;
    let active = true;
    let texture: THREE.Texture | null = null;
    let geometry: THREE.ExtrudeGeometry | null = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!active) return;
      try {
        const scale = Math.min(1, TRACE_MAX_SIDE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const pixels = ctx.getImageData(0, 0, w, h).data;
        const alpha = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = pixels[i * 4 + 3];
        const contour = traceAlphaContour(alpha, w, h);
        const width = height / Math.max(aspect, 1e-6);
        geometry = cutoutGeometry(contour.length >= 3 ? contour : null, width, height, depth);
        // Shift so the shape base sits at y = 0 (extrude centers vertically on the shape).
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox;
        if (bb) geometry.translate(0, -bb.min.y, 0);
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        const edge = averageEdgeColor(pixels, w, h);
        setReady({ geometry, texture, edge });
      } catch {
        // Stays on the placeholder.
      }
    };
    img.onerror = () => {
      // Stays on the placeholder.
    };
    img.src = imageUrl;
    return () => {
      active = false;
      texture?.dispose();
      geometry?.dispose();
    };
  }, [imageUrl, height, aspect, depth]);

  const materials = useMemo(() => {
    if (!ready) return null;
    const transparent = opacity < 1;
    const cap = new THREE.MeshStandardMaterial({
      map: ready.texture,
      roughness: 0.7,
      envMapIntensity: 0.5,
      transparent,
      opacity,
    });
    const side = new THREE.MeshStandardMaterial({
      color: new THREE.Color(...ready.edge),
      roughness: 0.7,
      envMapIntensity: 0.5,
      transparent,
      opacity,
    });
    return [cap, side] as const;
  }, [ready, opacity]);

  useEffect(() => {
    return () => {
      materials?.[0].dispose();
      materials?.[1].dispose();
    };
  }, [materials]);

  if (!ready || !materials) {
    const width = height / Math.max(aspect, 1e-6);
    return (
      <mesh position={[0, height / 2, depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#e2e2de" roughness={0.9} />
      </mesh>
    );
  }
  return <mesh geometry={ready.geometry} material={materials as unknown as THREE.Material[]} />;
}
