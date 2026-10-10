// Compile stage 3: split each room side into solid wall pieces around its doorways
// (plan.md §5.2 steps 3–4, ADR-001, ADR-007). Pure data.

import { EPSILON } from "@/lib/schema/geom";
import type { Room, Wall } from "@/lib/schema/types";
import { DOOR_HEIGHT, type DoorwayCut } from "./doorways";

/** Each room's walls are 0.075 m thick, from the room edge inward (Q6, ADR-001). */
export const WALL_THICKNESS = 0.075;

/**
 * One solid wall piece.
 * - `start` / `end`: points (x, z) on the room-edge line, in increasing x (n/s) or z (e/w).
 *   The piece extends `thickness` from that line into the room.
 * - `bottom` / `top`: heights in meters (0 → wallHeight, or 2.2 → wallHeight above a doorway).
 */
export interface WallPiece {
  roomId: string;
  side: Wall;
  start: [number, number];
  end: [number, number];
  bottom: number;
  top: number;
  thickness: number;
  color: string;
}

const SIDES: Wall[] = ["n", "e", "s", "w"];

/** The side's edge line and its span along the edge, in world meters. */
export function sideSpan(
  room: Room,
  side: Wall,
): { line: number; from: number; to: number } {
  switch (side) {
    case "n":
      return { line: room.y, from: room.x, to: room.x + room.w };
    case "s":
      return { line: room.y + room.d, from: room.x, to: room.x + room.w };
    case "w":
      return { line: room.x, from: room.y, to: room.y + room.d };
    case "e":
      return { line: room.x + room.w, from: room.y, to: room.y + room.d };
  }
}

/** The doorway openings on one side of one room, sorted along the edge. */
export function doorsOnSide(
  roomId: string,
  side: Wall,
  cuts: readonly DoorwayCut[],
): [number, number][] {
  return cuts
    .filter(
      (c) =>
        (c.a === roomId && c.sideA === side) ||
        (c.b === roomId && c.sideB === side),
    )
    .map((c): [number, number] => [c.from, c.to])
    .sort((p, q) => p[0] - q[0]);
}

/** A point on the side's edge line at distance `t` along it, as (x, z). */
function point(side: Wall, line: number, t: number): [number, number] {
  return side === "n" || side === "s" ? [t, line] : [line, t];
}

/**
 * Solid pieces for every side of `room`: the full side minus its doorway openings,
 * plus one piece above each doorway from 2.2 m up to the room's wall height.
 * Rooms build their own walls, so each room's over-door piece reaches its own height (G6).
 */
export function walls(room: Room, cuts: readonly DoorwayCut[]): WallPiece[] {
  const pieces: WallPiece[] = [];
  const piece = (
    side: Wall,
    line: number,
    from: number,
    to: number,
    bottom: number,
  ): WallPiece => ({
    roomId: room.id,
    side,
    start: point(side, line, from),
    end: point(side, line, to),
    bottom,
    top: room.wallHeight,
    thickness: WALL_THICKNESS,
    color: room.wallColor,
  });

  for (const side of SIDES) {
    const { line, from, to } = sideSpan(room, side);
    let cursor = from;
    for (const [doorFrom, doorTo] of doorsOnSide(room.id, side, cuts)) {
      if (doorFrom - cursor > EPSILON)
        pieces.push(piece(side, line, cursor, doorFrom, 0));
      if (room.wallHeight - DOOR_HEIGHT > EPSILON)
        pieces.push(piece(side, line, doorFrom, doorTo, DOOR_HEIGHT));
      cursor = Math.max(cursor, doorTo);
    }
    if (to - cursor > EPSILON) pieces.push(piece(side, line, cursor, to, 0));
  }
  return pieces;
}
