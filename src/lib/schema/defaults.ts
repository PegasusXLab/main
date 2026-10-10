import { nanoid } from "nanoid";
import { snapRect } from "./geom";
import type { Gallery, Room } from "./types";

export const DEFAULT_ROOM_SIZE = 6; // meters, both w and d
export const DEFAULT_WALL_HEIGHT = 3;
export const DEFAULT_WALL_COLOR = "#f2efe9";
export const MIN_ROOM_SIZE = 2; // meters, both w and d

/** A new room at (x, y), 6 × 6 m unless w / d are given. The rect is snapped to the grid. */
export function newRoom(
  rect: { x: number; y: number; w?: number; d?: number },
  name = "Room",
): Room {
  const { x, y, w, d } = snapRect({
    x: rect.x,
    y: rect.y,
    w: rect.w ?? DEFAULT_ROOM_SIZE,
    d: rect.d ?? DEFAULT_ROOM_SIZE,
  });
  return {
    id: nanoid(),
    name,
    description: "",
    x,
    y,
    w,
    d,
    wallHeight: DEFAULT_WALL_HEIGHT,
    wallColor: DEFAULT_WALL_COLOR,
    floor: "wood",
    lighting: "gallery",
  };
}

/** A new gallery with one default room at the origin, which is also the entrance. */
export function newGallery(title = "Untitled gallery"): Gallery {
  const entrance = newRoom({ x: 0, y: 0 }, "Entrance");
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    version: 1,
    title,
    entranceRoomId: entrance.id,
    rooms: [entrance],
    artworks: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Lighting presets as plain data (reference note R7): the renderer (T-013) reads these,
 * so atmosphere presets (F11) can later blend between them without code changes.
 * Intensities are three.js light intensities; directions are unit-free and normalized by the renderer.
 */
export interface LightingPreset {
  ambient: { skyColor: string; groundColor: string; intensity: number }; // hemisphere light
  directional: {
    color: string;
    intensity: number;
    direction: [number, number, number];
  };
  background: string;
}

export const LIGHTING_PRESETS: Record<Room["lighting"], LightingPreset> = {
  gallery: {
    ambient: { skyColor: "#ffffff", groundColor: "#d9d4cc", intensity: 1.1 },
    directional: {
      color: "#ffffff",
      intensity: 1.2,
      direction: [0.3, -1, 0.2],
    },
    background: "#f4f2ee",
  },
  warm: {
    ambient: { skyColor: "#fff1dc", groundColor: "#a8896a", intensity: 0.9 },
    directional: {
      color: "#ffd6a0",
      intensity: 1.4,
      direction: [-0.5, -1, 0.3],
    },
    background: "#2a2018",
  },
  moody: {
    ambient: { skyColor: "#8d98b8", groundColor: "#1c1e26", intensity: 0.45 },
    directional: {
      color: "#c9d4ff",
      intensity: 0.8,
      direction: [0.6, -1, -0.4],
    },
    background: "#0e1016",
  },
};
