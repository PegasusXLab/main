// Compile stage: free-standing objects (ADR-015 v2). Pure data, like frames.ts.
// A model whose generation job isn't ready compiles to its fallback cutout, so the renderer never
// needs to know about job state. Problems come back as warnings; the object is still placed.

import { rangeOverlap } from "@/lib/schema/geom";
import type { GalleryObject, Room, Wall } from "@/lib/schema/types";
import { DOOR_WIDTH, type DoorwayCut } from "./doorways";
import type { SceneObject, Vec3 } from "./types";

/** Inspect-camera eye height; same value as compile.ts (imported there would be circular). */
const EYE_HEIGHT = 1.6;
/** Smallest plinth/footprint side (meters); larger objects get their width + 0.1. */
export const MIN_FOOTPRINT = 0.6;
/** How far in front of an object the inspect camera stands, before adding half its height. */
const INSPECT_DISTANCE = 1.8;
/** The inspect camera stays this far inside the room's walls. */
const CAMERA_MARGIN = 0.3;
/** Depth of the clear zone in front of a doorway (meters). */
export const DOORWAY_APPROACH = DOOR_WIDTH;

export interface ObjectIssue {
  code: "object-unknown-room" | "object-blocks-doorway";
  objectId: string;
  message: string;
}

function render(obj: GalleryObject): SceneObject["render"] {
  const s = obj.source;
  if (s.kind === "cutout") {
    return {
      kind: "cutout",
      imageUrl: s.image.medium,
      aspect: s.aspect,
      depth: s.depth,
    };
  }
  if (s.kind === "model") {
    if (s.job && s.job.status !== "ready") {
      return {
        kind: "cutout",
        imageUrl: s.job.fallback.image.medium,
        aspect: s.job.fallback.aspect,
        depth: 0.02,
      };
    }
    return { kind: "model", modelUrl: s.modelUrl };
  }
  return { kind: "library", libraryId: s.libraryId };
}

function footprint(obj: GalleryObject, r: SceneObject["render"]): number {
  const width = r.kind === "cutout" ? obj.height / r.aspect : 0;
  return Math.max(MIN_FOOTPRINT, width + 0.1);
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/** The clear zone in front of a doorway, inside the room on `side`, in world x/z. */
function approachZone(cut: DoorwayCut, side: Wall) {
  const along = { from: cut.from, to: cut.to };
  switch (side) {
    case "n":
      return {
        x: along,
        z: { from: cut.line, to: cut.line + DOORWAY_APPROACH },
      };
    case "s":
      return {
        x: along,
        z: { from: cut.line - DOORWAY_APPROACH, to: cut.line },
      };
    case "w":
      return {
        x: { from: cut.line, to: cut.line + DOORWAY_APPROACH },
        z: along,
      };
    case "e":
      return {
        x: { from: cut.line - DOORWAY_APPROACH, to: cut.line },
        z: along,
      };
  }
}

export function objects(
  list: readonly GalleryObject[],
  rooms: readonly Room[],
  cuts: readonly DoorwayCut[] = [],
): { objects: SceneObject[]; issues: ObjectIssue[] } {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const out: SceneObject[] = [];
  const issues: ObjectIssue[] = [];

  for (const obj of list) {
    const room = byId.get(obj.roomId);
    if (!room) {
      issues.push({
        code: "object-unknown-room",
        objectId: obj.id,
        message: `"${obj.title || obj.id}" is in a room that doesn't exist`,
      });
      continue;
    }

    const shown = render(obj);
    const size = footprint(obj, shown);
    const plinthTop = obj.plinth.shape === "none" ? 0 : obj.plinth.height;
    const cx = room.x + obj.position.x;
    const cz = room.y + obj.position.y;
    const rotationY = (obj.rotation * Math.PI) / 180;

    // Inspect spot: in front of the object (0 faces +z, like frames), at eye height.
    const dist = INSPECT_DISTANCE + obj.height / 2;
    const m = CAMERA_MARGIN;
    const position: Vec3 = [
      clamp(cx + Math.sin(rotationY) * dist, room.x + m, room.x + room.w - m),
      EYE_HEIGHT,
      clamp(cz + Math.cos(rotationY) * dist, room.y + m, room.y + room.d - m),
    ];
    const target: Vec3 = [cx, plinthTop + obj.height / 2, cz];

    out.push({
      objectId: obj.id,
      roomId: room.id,
      base: [cx, plinthTop, cz],
      rotationY,
      height: obj.height,
      plinth: { shape: obj.plinth.shape, height: obj.plinth.height, size },
      render: shown,
      view: { position, target },
    });

    const half = size / 2;
    const fx = { from: cx - half, to: cx + half };
    const fz = { from: cz - half, to: cz + half };
    const blocks = cuts.some((cut) => {
      const side =
        cut.a === room.id ? cut.sideA : cut.b === room.id ? cut.sideB : null;
      if (!side) return false;
      const zone = approachZone(cut, side);
      return (
        rangeOverlap(fx.from, fx.to, zone.x.from, zone.x.to) !== null &&
        rangeOverlap(fz.from, fz.to, zone.z.from, zone.z.to) !== null
      );
    });
    if (blocks) {
      issues.push({
        code: "object-blocks-doorway",
        objectId: obj.id,
        message: "object blocks doorway",
      });
    }
  }
  return { objects: out, issues };
}
