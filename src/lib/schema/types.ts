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
  objects?: GalleryObject[]; // ADR-015 v2: free-standing exhibits; missing means none
  look?: LookName; // gallery-wide Look, default "museum"
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
  music?: { trackId?: string; url?: string; start?: number; length?: number }; // P1
  narration?: { text: string; audioUrl?: string }; // P1
  atmosphere?: Atmosphere; // P1
  mood?: string; // P1
  look?: LookName; // ADR-015 v2: per-room override of gallery.look
  wallFinish?: "smooth" | "plaster" | "concrete" | "brick"; // default "smooth"
  titleFont?: string; // room-arrival title + plaque typography
  /** Where the room's arrival title floats in the viewer ("center" = top center). */
  titlePosition?: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
  /** Uploaded title font (/api/files/fonts/…); used only when titleFont is "custom". */
  customFontUrl?: string;
  /** Room title color, "#rrggbb" (default white). */
  titleColor?: string;
  /** "depth" (default): extruded, pointer-reactive 3D title; "flat": plain type. */
  titleStyle?: "depth" | "flat";
}

export interface Artwork {
  id: string;
  roomId: string;
  type: "image"; // image remains the poster/fallback for animated artwork
  media?: {
    kind: "gif" | "video";
    url: string;
    posterUrl?: string;
    aspect: number;
  };
  frameStyle?: "frame" | "tv";
  placement: { wall: Wall; offset: number; height: number };
  width: number; // meters; height comes from the image aspect ratio
  aspect: number; // height / width of the image
  image: { small: string; medium: string; large?: string }; // URLs: 512 / 1024 / 2048 px
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string }; // P1
}

// ADR-015 v2 (additive): looks and free-standing objects.
export type LookName = "museum" | "film" | "retro" | "noir" | "dream";

export interface ImageSet {
  small: string;
  medium: string;
  large?: string;
}

export interface GalleryObject {
  id: string;
  roomId: string;
  /** Room-relative floor position, meters from the room's top-left (same frame as the 2D plan). */
  position: { x: number; y: number };
  rotation: number; // degrees, [0, 360); the UI snaps to 15
  height: number; // meters, displayed height; width follows the aspect
  plinth: { shape: "none" | "cylinder" | "box"; height: number };
  source: ObjectSource;
  title: string;
  artist: string;
  story: string;
  voiceOver?: { text: string; audioUrl?: string };
}

export type ObjectSource =
  | { kind: "cutout"; image: ImageSet; aspect: number; depth: number }
  | {
      kind: "model";
      modelUrl: string;
      posterUrl?: string;
      origin: "upload" | "generated";
      job?: GenerationJob;
    }
  | { kind: "library"; libraryId: string };

export interface GenerationJob {
  id: string; // provider job id (opaque)
  status: "queued" | "running" | "ready" | "failed";
  /** The cutout shown until the model is ready (and kept if generation fails). */
  fallback: { image: ImageSet; aspect: number };
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
  /** Post overrides (custom preset only): bloom glow + frame vignette. Unset = derived from the look. */
  glow?: number; // 0–1
  vignette?: number; // 0–1
  /** Picture-spot multiplier (custom preset only): 0 = pools off, 1 = derived. Unset = derived. */
  spots?: number; // 0–1
}
