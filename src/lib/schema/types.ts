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
  /** Who made it: shown as "by <name>" in the tour, opening their profile and links. */
  creator?: GalleryCreator;
}

export interface GalleryCreator {
  name: string;
  bio?: string;
  /** Profile links (https): Spotify, Instagram, Bandcamp, a website, … (labels auto-detected). */
  links?: CreatorLink[];
}

export interface CreatorLink {
  url: string;
  /** Overrides the auto-detected platform name. */
  label?: string;
}

/** What a piece's link does, shown as the panel's main button ("Buy · $40", "Pre-save"). */
export type PieceAction = "learn" | "buy" | "stream" | "presave" | "watch" | "book" | "tip";

export interface VoiceOverData {
  text: string;
  audioUrl?: string;
  voiceId?: string;
  voiceName?: string;
  source?: "elevenlabs" | "recorded" | "uploaded";
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
  /** title: display name of an uploaded / linked song ("Song - Artist"), shown in the player. */
  music?: { trackId?: string; url?: string; start?: number; length?: number; title?: string }; // P1
  narration?: VoiceOverData; // P1
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
  voiceOver?: VoiceOverData; // P1
  /** Visitors can click it to open its inspection panel (see isInspectable for the default). */
  inspectable?: boolean;
  /** Inspection details shown as a table ("Year · 2024", "Medium · Oil on canvas"). */
  facts?: InspectFact[];
  /** "Learn more" link in the inspection panel (https). */
  link?: string;
  /** What the link does (default "learn"). */
  action?: PieceAction;
  /** Shown with the action, free text ("$40", "Free", "Sold out"). */
  price?: string;
  /** Album wall: opening this piece offers its song (played through the room's music). */
  track?: Track;
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
  voiceOver?: VoiceOverData;
  /** Visitors can click it to open its inspection panel (see isInspectable for the default). */
  inspectable?: boolean;
  /** Inspection details shown as a table ("Year · 2024", "Medium · Oil on canvas"). */
  facts?: InspectFact[];
  /** "Learn more" link in the inspection panel (https). */
  link?: string;
  /** What the link does (default "learn"). */
  action?: PieceAction;
  /** Shown with the action, free text ("$40", "Free", "Sold out"). */
  price?: string;
  /** Something visitors use, set on top of this object (a TV on a cabinet, a turntable on a console). */
  device?: ObjectDevice;
}

/** A song: album-wall covers and listening stations play these through the room's music. */
export interface Track {
  title: string;
  artist?: string;
  url: string;
  coverUrl?: string;
}

export type ObjectDevice =
  /** A screen playing a looping video (muted until a visitor turns the sound on). */
  | { kind: "tv"; video: { url: string; posterUrl?: string; aspect: number }; screen: number }
  /** A turntable: opening it shows the tracklist; the record spins while one plays. */
  | { kind: "turntable"; tracks: Track[]; accent?: string }
  /** An open book visitors sign; the latest signatures show in its panel. */
  | { kind: "guestbook"; prompt?: string };

export interface InspectFact {
  label: string;
  value: string;
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
