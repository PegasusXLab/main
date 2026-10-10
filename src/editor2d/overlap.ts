import { rectsOverlap, type Rect } from "@/lib/schema/geom";
import type { Room } from "@/lib/schema/types";

/**
 * Checks whether a candidate rect strictly overlaps any room in the collection.
 * Touching edges or corners is allowed (rectsOverlap returns false when rects only touch).
 * An optional ignoreRoomId excludes a specific room (e.g. when moving or resizing an existing room).
 */
export function hasOverlap(
  candidate: Rect,
  rooms: readonly (Room | Rect)[],
  ignoreRoomId?: string,
): boolean {
  for (const room of rooms) {
    if ("id" in room && ignoreRoomId && room.id === ignoreRoomId) {
      continue;
    }
    if (rectsOverlap(candidate, room)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the first room that strictly overlaps the candidate rect, or null if none.
 */
export function findOverlappingRoom(
  candidate: Rect,
  rooms: readonly Room[],
  ignoreRoomId?: string,
): Room | null {
  for (const room of rooms) {
    if (ignoreRoomId && room.id === ignoreRoomId) {
      continue;
    }
    if (rectsOverlap(candidate, room)) {
      return room;
    }
  }
  return null;
}
