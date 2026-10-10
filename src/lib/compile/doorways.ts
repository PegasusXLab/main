// Compile stage 2: cut one doorway into each shared edge (plan.md §5.2 step 2, ADR-007).
// Pure data.

import { EPSILON } from "@/lib/schema/geom";
import type { Room } from "@/lib/schema/types";
import type { SharedEdge } from "./edges";

export const DOOR_WIDTH = 1.2; // meters, maximum
export const DOOR_HEIGHT = 2.2; // meters
export const MIN_DOOR_OVERLAP = 1.0; // meters; shorter shared edges stay solid (Q7, ADR-007)

/**
 * A doorway in a shared edge. Same fields as the edge it was cut from, except `from` / `to`
 * are the opening itself (centered on the overlap), plus its `width` and `height`.
 */
export interface DoorwayCut extends SharedEdge {
  width: number;
  height: number;
}

/**
 * One doorway per shared edge: centered on the overlap, `min(1.2, overlap)` wide, 2.2 m high.
 * No doorway when the overlap is under 1.0 m, or when either room has closed that side (P1, G7).
 */
export function doorways(
  edges: readonly SharedEdge[],
  rooms: readonly Room[],
): DoorwayCut[] {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const out: DoorwayCut[] = [];
  for (const edge of edges) {
    const overlap = edge.to - edge.from;
    if (overlap < MIN_DOOR_OVERLAP - EPSILON) continue;
    if (byId.get(edge.a)?.closedWalls?.includes(edge.sideA)) continue;
    if (byId.get(edge.b)?.closedWalls?.includes(edge.sideB)) continue;
    const width = Math.min(DOOR_WIDTH, overlap);
    const center = (edge.from + edge.to) / 2;
    out.push({
      ...edge,
      from: center - width / 2,
      to: center + width / 2,
      width,
      height: DOOR_HEIGHT,
    });
  }
  return out;
}
