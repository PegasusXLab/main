// The Gallery document (plan.md §6). Frozen: changes go through the senior and an ADR.
// Derived data (shared edges, doorways, wall segments, frame positions) is never stored here.

export type Wall = "n" | "e" | "s" | "w";

export interface Gallery {
  id: string;
  version: 1;
  title: string;
  entranceRoomId: string;
  rooms: Room[];
  artworks: Artwork[];
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  x: number; // top-left, meters, grid-snapped
  y: number;
  w: number; // width (x), meters
  d: number; // depth (y), meters
  wallHeight: number; // meters, default 3
  wallColor: string; // hex
  floor: "wood" | "concrete" | "marble";
  lighting: "gallery" | "warm" | "moody";
  closedWalls?: Wall[]; // P1
  music?: { trackId?: string; url?: string }; // P1
  narration?: { text: string; audioUrl?: string }; // P1
  atmosphere?: Atmosphere; // P1
  mood?: string; // P1
}

export interface Artwork {
  id: string;
  roomId: string;
  type: "image"; // more types in P2
  placement: { wall: Wall; offset: number; height: number };
  width: number; // meters; height comes from the image aspect ratio
  aspect: number; // height / width of the image
  image: { small: string; medium: string; large?: string }; // URLs: 512 / 1024 / 2048 px
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string }; // P1
}

// P1
export interface Atmosphere {
  preset:
    "gallery-white" | "neon-bunker" | "golden-hour" | "moonlit" | "custom";
  moodColor: string;
  haze: number; // 0–1
  brightness: number; // 0–1
  lightDirection: number; // 0–360
  grain: number; // 0–1
}
