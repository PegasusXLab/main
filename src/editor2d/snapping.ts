import { GRID, snap, snapRect, type Rect } from "@/lib/schema/geom";

export { GRID, snap, snapRect, type Rect };

/** Snaps a point (x, y) in meters to the nearest 0.5 m grid coordinate using geom.snap. */
export function snapPoint(point: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: snap(point.x),
    y: snap(point.y),
  };
}

/** Snaps room coordinates and dimensions to the 0.5 m grid using geom.snapRect. */
export function snapRoom(rect: Rect): Rect {
  return snapRect(rect);
}
