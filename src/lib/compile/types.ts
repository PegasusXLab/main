// SceneModel: the renderer's only input (plan.md §5.4, ADR-004, ADR-007, architecture §3).
// Derived data only; never stored. Coordinates are world meters: x right, y up, z = the editor's y.

import type { Atmosphere, Room, Wall } from "@/lib/schema/types";
import type { CompileIssue, Frame } from "./frames";
import type { WallPiece } from "./walls";

export type Vec3 = [number, number, number];

export interface SceneFloor {
  roomId: string;
  center: Vec3; // (x + w/2, 0, y + d/2)
  size: [number, number]; // [w, d]
  floor: Room["floor"]; // preset, so the renderer can pick a floor material without reading the Gallery
}

/** A wall piece: `start` / `end` (x, z) on the room-edge line; extends `thickness` into the room (ADR-001). */
export type SceneWall = WallPiece;

export interface SceneDoorway {
  roomIds: [string, string];
  center: Vec3; // middle of the opening: on the shared edge line, y = height / 2
  width: number;
  height: number;
  side: Wall; // as seen from roomIds[0]
}

export type SceneFrame = Frame;

export interface SceneRoom {
  roomId: string;
  center: Vec3; // floor center
  lighting: Room["lighting"];
  /** The room's atmosphere (F11), when set; renderers fall back to `lighting` (ADR-007 amendment 3). */
  atmosphere?: Atmosphere;
  /** Where a visitor's camera stands in this room and what it looks at (ADR-002, ADR-007). */
  view: { position: Vec3; target: Vec3 };
}

/** A free-standing object (ADR-015 v2). A model still generating arrives as its fallback cutout. */
export interface SceneObject {
  objectId: string;
  roomId: string;
  base: Vec3; // world (room.x + x, plinth top, room.y + y)
  rotationY: number; // radians; 0 faces +z, like frames
  height: number;
  plinth: { shape: "none" | "cylinder" | "box"; height: number; size: number }; // size = square footprint side
  render:
    | { kind: "cutout"; imageUrl: string; aspect: number; depth: number }
    | { kind: "model"; modelUrl: string; fallback?: { imageUrl: string; aspect: number; depth: number } }
    | { kind: "library"; libraryId: string };
  /** Inspect spot: eye height, in front of the object, looking at its middle. */
  view: { position: Vec3; target: Vec3 };
}

export interface SceneModel {
  floors: SceneFloor[];
  walls: SceneWall[];
  doorways: SceneDoorway[];
  frames: SceneFrame[];
  rooms: SceneRoom[];
  objects: SceneObject[]; // always present; [] when the gallery has none
}

export type { CompileIssue };
