// Compile stage 1: find where rooms share a wall (plan.md §5.2 step 1, architecture §3).
// Pure data. All comparisons go through src/lib/schema/geom.ts (G5).

import { rangeOverlap, sameLine } from "@/lib/schema/geom";
import type { Room, Wall } from "@/lib/schema/types";

/**
 * A stretch of wall shared by rooms `a` and `b`.
 * - `sideA` / `sideB`: which side of each room it is (e.g. A's "e" and B's "w").
 * - `line`: the shared edge's coordinate (x for e/w sides, y for n/s sides), in meters.
 * - `from` / `to`: the shared interval along the edge, in world meters (y for e/w, x for n/s), from < to.
 */
export interface SharedEdge {
  a: string;
  b: string;
  sideA: Wall;
  sideB: Wall;
  line: number;
  from: number;
  to: number;
}

/**
 * Every shared interval between pairs of rooms, in document order (a before b).
 * Only edges that lie on the same line and overlap by a positive length count;
 * rooms that touch only at a corner share nothing.
 */
export function findSharedEdges(rooms: readonly Room[]): SharedEdge[] {
  const edges: SharedEdge[] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const A = rooms[i];
      const B = rooms[j];
      const ys = rangeOverlap(A.y, A.y + A.d, B.y, B.y + B.d);
      const xs = rangeOverlap(A.x, A.x + A.w, B.x, B.x + B.w);

      if (ys && sameLine(A.x + A.w, B.x)) {
        edges.push({
          a: A.id,
          b: B.id,
          sideA: "e",
          sideB: "w",
          line: B.x,
          from: ys[0],
          to: ys[1],
        });
      } else if (ys && sameLine(A.x, B.x + B.w)) {
        edges.push({
          a: A.id,
          b: B.id,
          sideA: "w",
          sideB: "e",
          line: A.x,
          from: ys[0],
          to: ys[1],
        });
      }

      if (xs && sameLine(A.y + A.d, B.y)) {
        edges.push({
          a: A.id,
          b: B.id,
          sideA: "s",
          sideB: "n",
          line: B.y,
          from: xs[0],
          to: xs[1],
        });
      } else if (xs && sameLine(A.y, B.y + B.d)) {
        edges.push({
          a: A.id,
          b: B.id,
          sideA: "n",
          sideB: "s",
          line: A.y,
          from: xs[0],
          to: xs[1],
        });
      }
    }
  }
  return edges;
}
