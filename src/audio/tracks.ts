import type { Room } from "@/lib/schema/types";

/** Crossfade duration in ms (~1.5 s, T-061 AC). */
export const CROSSFADE_MS = 1500;

export interface AudioTrack {
  id: string;
  title: string;
  /** Credit line, e.g. "Team-made (CC0)". */
  credit: string;
  /** Public URL under /audio. */
  file: string;
}

/**
 * Built-in track list (T-061 AC). All four loops are team-made sine pads,
 * dedicated to the public domain (CC0); see `public/audio/CREDITS.md`.
 * Keep ids stable: rooms store `music.trackId`.
 */
export const TRACKS: AudioTrack[] = [
  {
    id: "still-air",
    title: "Still Air",
    credit: "Team-made (CC0)",
    file: "/audio/still-air.wav",
  },
  {
    id: "warm-hum",
    title: "Warm Hum",
    credit: "Team-made (CC0)",
    file: "/audio/warm-hum.wav",
  },
  {
    id: "night-gallery",
    title: "Night Gallery",
    credit: "Team-made (CC0)",
    file: "/audio/night-gallery.wav",
  },
  {
    id: "soft-drift",
    title: "Soft Drift",
    credit: "Team-made (CC0)",
    file: "/audio/soft-drift.wav",
  },
];

/** Look up a built-in track by id. Returns undefined for unknown ids. */
export function getTrack(trackId?: string): AudioTrack | undefined {
  if (!trackId) return undefined;
  return TRACKS.find((t) => t.id === trackId);
}

const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|webm|opus)$/i;

/**
 * A song's display name from its file name or URL: "My_Song - Artist.mp3" -> "My Song - Artist".
 * Drops the folder and extension, turns underscores into spaces, tidies whitespace.
 */
export function songDisplayName(fileOrUrl: string | undefined): string {
  if (!fileOrUrl) return "";
  let base = fileOrUrl.split(/[?#]/)[0].split(/[\\/]/).pop() ?? "";
  try {
    base = decodeURIComponent(base);
  } catch {
    // keep as is
  }
  return base.replace(AUDIO_EXT, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Our uploads are stored under random ids, so their URLs carry no song name. */
function isStoredUpload(url: string): boolean {
  return /^\/api\/files\/audio\//.test(url);
}

/** What the player shows for a room's music: its saved name, a built-in title, or a fallback. */
export function roomTrackTitle(music?: Room["music"]): string {
  if (!music) return "";
  if (music.title?.trim()) return music.title.trim();
  if (music.url) {
    if (!isStoredUpload(music.url)) {
      const fromUrl = songDisplayName(music.url);
      if (fromUrl) return fromUrl;
    }
    return "Room soundtrack";
  }
  return getTrack(music.trackId)?.title ?? "Room soundtrack";
}

/**
 * Resolve the audio URL for a room's `music` field (plan.md §6 Room.music).
 * A custom `url` wins; otherwise the built-in `trackId` resolves to its file.
 * Returns undefined when the room has no music or an unknown track id.
 */
export function resolveRoomSrc(music?: Room["music"]): string | undefined {
  if (!music) return undefined;
  if (music.url) return music.url;
  return getTrack(music.trackId)?.file;
}

/**
 * Linear crossfade schedule for the ~1.5 s room change (T-061 AC).
 * `elapsedMs` is clamped to [0, durationMs].
 * Returns `{ from, to }` volumes in [0, 1].
 */
export function computeCrossfadeVolumes(
  elapsedMs: number,
  durationMs: number = CROSSFADE_MS,
): { from: number; to: number } {
  const clamped = Math.max(0, Math.min(durationMs, elapsedMs));
  const progress = durationMs === 0 ? 1 : clamped / durationMs;
  return { from: 1 - progress, to: progress };
}

/** True when the player should switch the playing source. */
export function shouldSwitchTrack(
  currentSrc: string | null,
  nextSrc: string | undefined,
): boolean {
  if (!nextSrc) return currentSrc !== null;
  return currentSrc !== nextSrc;
}

/** A playback clip (Instagram-story style): start offset + length in seconds. */
export interface MusicSegment {
  start: number;
  length: number;
}

/**
 * Resolve the clip for a room's music: `{ start, length }` when `length` is set,
 * otherwise null (the whole song loops, today's behavior).
 */
export function resolveMusicSegment(music?: Room["music"]): MusicSegment | null {
  if (!music?.length) return null;
  return { start: Math.max(0, music.start ?? 0), length: music.length };
}

/** Resume key: same file + same clip share a position; different clips don't. */
export function resumeKey(src: string, seg: MusicSegment | null): string {
  return seg ? `${src}::${seg.start}-${seg.length}` : src;
}

/**
 * Clamp a saved position into a clip (and the file when its duration is known):
 * inside [start, start + length], never past duration - 1 s.
 */
export function clampSegmentPosition(
  pos: number,
  seg: MusicSegment | null,
  duration?: number,
): number {
  if (!Number.isFinite(pos) || pos < 0) return seg?.start ?? 0;
  let end = seg ? seg.start + seg.length : Number.POSITIVE_INFINITY;
  if (duration !== undefined && Number.isFinite(duration) && duration > 0) {
    end = Math.min(end, Math.max(0, duration - 1));
  }
  const lo = seg ? Math.min(seg.start, end) : 0;
  return Math.min(Math.max(pos, lo), end);
}

/**
 * Where each track+clip was paused, so coming back to a room resumes instead of
 * restarting. Module-level: it lives as long as the session, across remounts.
 */
const resumePositions = new Map<string, number>();

export function saveResumePosition(key: string, pos: number): void {
  if (Number.isFinite(pos) && pos >= 0) resumePositions.set(key, pos);
}

export function getResumePosition(key: string): number | undefined {
  return resumePositions.get(key);
}

export function clearResumePositions(): void {
  resumePositions.clear();
}
