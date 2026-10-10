// The single equality / overlap helper (plan/architecture.md §2, overview G5, G8).
// Every edge, overlap and adjacency comparison in compile and editor2d goes through here.
// Grid-line tests (sameLine, isOnGrid) work in whole half-meter grid units; range tests work in raw
// meters with a tiny epsilon, so off-grid spans (doorways, frames) stay exact. Either way, float noise
// like 0.1 + 0.2 never matters.

/** Axis-aligned rectangle in meters, in 2D editor space (x right, y down). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

/** Grid size in meters. */
export const GRID = 0.5;

const UNITS_PER_METER = 1 / GRID;
/** Tolerance for float noise, in meters (or grid units for isOnGrid). */
export const EPSILON = 1e-6;

/** Meters → whole grid units (rounded). */
export function toGrid(m: number): number {
  return Math.round(m * UNITS_PER_METER);
}

/** Grid units → meters. */
export function fromGrid(units: number): number {
  return units / UNITS_PER_METER;
}

/** Rounds meters to the nearest grid line. */
export function snap(m: number): number {
  return fromGrid(toGrid(m)) + 0; // + 0 turns -0 into 0
}

/** True when `m` already sits on a grid line (within float noise). */
export function isOnGrid(m: number): boolean {
  return (
    Math.abs(m * UNITS_PER_METER - Math.round(m * UNITS_PER_METER)) < EPSILON
  );
}

/** Snaps every field of a rect to the grid. */
export function snapRect(r: Rect): Rect {
  return { x: snap(r.x), y: snap(r.y), w: snap(r.w), d: snap(r.d) };
}

/** True when two coordinates fall on the same grid line, e.g. A's east edge and B's west edge. */
export function sameLine(a: number, b: number): boolean {
  return toGrid(a) === toGrid(b);
}

/**
 * Overlap of [a0, a1] and [b0, b1] in meters, or null when it has no positive length.
 * Works for any spans, on the grid or not (rooms, doorways, frames). Values are returned unrounded.
 * Ranges that only touch end to end (within EPSILON) don't overlap.
 */
export function rangeOverlap(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
): [number, number] | null {
  const start = Math.max(Math.min(a0, a1), Math.min(b0, b1));
  const end = Math.min(Math.max(a0, a1), Math.max(b0, b1));
  return end - start > EPSILON ? [start, end] : null;
}

/** Strict overlap: true only when the rects share positive area. Rooms that share an edge don't overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    rangeOverlap(a.x, a.x + a.w, b.x, b.x + b.w) !== null &&
    rangeOverlap(a.y, a.y + a.d, b.y, b.y + b.d) !== null
  );
}
