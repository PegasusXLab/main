// Compile stage 4: hang artwork on its wall (plan.md §5.3, ADR-007). Pure data.
// Problems come back as issues, never exceptions; the frame is still placed so the editor can
// show it in red (G10).

import { EPSILON, rangeOverlap } from "@/lib/schema/geom";
import type { Artwork, Room } from "@/lib/schema/types";
import { DOOR_HEIGHT, type DoorwayCut } from "./doorways";
import { doorsOnSide } from "./walls";

/** Frame surface distance from the room edge: wall surface (0.075) + 5 mm (ADR-007). */
export const FRAME_INSET = 0.08;

export interface Frame {
  artworkId: string;
  roomId: string;
  position: [number, number, number]; // center of the frame, world meters
  rotationY: number; // radians; 0 faces +z (a north wall)
  width: number;
  height: number; // width × aspect
  imageUrl: string;
}

export type CompileIssueCode =
  | "artwork-unknown-room"
  | "artwork-past-wall-end"
  | "artwork-past-wall-top"
  | "artwork-below-floor"
  | "artwork-over-doorway";

export interface CompileIssue {
  code: CompileIssueCode;
  artworkId: string;
  message: string;
}

/**
 * Where artwork hangs. `placement.offset` is the frame center, measured along the wall from its
 * left end as seen from inside the room; `placement.height` is the center height.
 */
export function frames(
  artworks: readonly Artwork[],
  rooms: readonly Room[],
  cuts: readonly DoorwayCut[] = [],
): { frames: Frame[]; issues: CompileIssue[] } {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const out: Frame[] = [];
  const issues: CompileIssue[] = [];

  for (const art of artworks) {
    const room = byId.get(art.roomId);
    if (!room) {
      issues.push({
        code: "artwork-unknown-room",
        artworkId: art.id,
        message: `"${art.title}" is in a room that doesn't exist`,
      });
      continue;
    }

    const { wall, offset, height: centerY } = art.placement;
    const width = art.width;
    const height = width * art.aspect;
    const { x, y, w, d } = room;

    // Center position and facing per plan.md §5.3; `along` = the frame center in world
    // coordinates along the wall's edge (x for n/s, z for e/w), for the doorway check.
    let position: [number, number, number];
    let rotationY: number;
    let along: number;
    let wallLength: number;
    switch (wall) {
      case "n":
        position = [x + offset, centerY, y + FRAME_INSET];
        rotationY = 0;
        along = x + offset;
        wallLength = w;
        break;
      case "s":
        position = [x + w - offset, centerY, y + d - FRAME_INSET];
        rotationY = Math.PI;
        along = x + w - offset;
        wallLength = w;
        break;
      case "w":
        position = [x + FRAME_INSET, centerY, y + d - offset];
        rotationY = Math.PI / 2;
        along = y + d - offset;
        wallLength = d;
        break;
      case "e":
        position = [x + w - FRAME_INSET, centerY, y + offset];
        rotationY = -Math.PI / 2;
        along = y + offset;
        wallLength = d;
        break;
    }

    out.push({
      artworkId: art.id,
      roomId: room.id,
      position,
      rotationY,
      width,
      height,
      imageUrl: art.image.medium,
    });

    if (
      offset - width / 2 < -EPSILON ||
      offset + width / 2 > wallLength + EPSILON
    ) {
      issues.push({
        code: "artwork-past-wall-end",
        artworkId: art.id,
        message: `"${art.title}" hangs past the end of the ${wall.toUpperCase()} wall of ${room.name}`,
      });
    }

    if (centerY + height / 2 > room.wallHeight + EPSILON) {
      issues.push({
        code: "artwork-past-wall-top",
        artworkId: art.id,
        message: `"${art.title}" sticks out above the top of the ${wall.toUpperCase()} wall of ${room.name}`,
      });
    }
    if (centerY - height / 2 < -EPSILON) {
      issues.push({
        code: "artwork-below-floor",
        artworkId: art.id,
        message: `"${art.title}" hangs below the floor on the ${wall.toUpperCase()} wall of ${room.name}`,
      });
    }

    const reachesDoorHeight = centerY - height / 2 < DOOR_HEIGHT - EPSILON;
    const overDoor = doorsOnSide(room.id, wall, cuts).some(
      ([from, to]) =>
        rangeOverlap(along - width / 2, along + width / 2, from, to) !== null,
    );
    if (reachesDoorHeight && overDoor) {
      issues.push({
        code: "artwork-over-doorway",
        artworkId: art.id,
        message: `"${art.title}" overlaps a doorway on the ${wall.toUpperCase()} wall of ${room.name}`,
      });
    }
  }
  return { frames: out, issues };
}
