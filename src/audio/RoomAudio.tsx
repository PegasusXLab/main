"use client";

// RoomAudio: plays the current room's music (built-in CC0 ambient loops or custom uploaded songs).
// Each room's song plays while the visitor is in that room, fades out when they leave, and
// RESUMES where it left off when they come back (T-144). One Howl is kept per song+clip, so a
// return is a fade-in of the paused sound, not a reload.

import { useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";
import type { Gallery } from "@/lib/schema/types";
import {
  CROSSFADE_MS,
  clampSegmentPosition,
  getResumePosition,
  resolveMusicSegment,
  resolveRoomSrc,
  resumeKey,
  saveResumePosition,
  type MusicSegment,
} from "./tracks";

export interface RoomAudioProps {
  gallery: Gallery;
  currentRoomId?: string;
}

type HowlInstance = InstanceType<typeof Howl>;

/** Fade-out on leave before the sound is paused (keeps its position). */
export const LEAVE_FADE_MS = 600;
/** At most this many songs stay loaded (paused) for instant resume; older ones unload. */
export const MAX_CACHED_SOUNDS = 4;

function stopAndUnload(sound: HowlInstance | null): void {
  if (!sound) return;
  try {
    sound.stop();
  } catch {
    // ignore: never throw from cleanup
  }
  try {
    sound.unload();
  } catch {
    // ignore: never throw from cleanup
  }
}

/**
 * Fade the old loop out and the new loop in. Exported for tests (Howler faked).
 * Returns the incoming sound so callers can track it as current.
 */
export function crossfadeTo(
  previous: HowlInstance | null,
  incoming: HowlInstance,
  durationMs: number = CROSSFADE_MS,
): HowlInstance {
  incoming.volume(0);
  incoming.play();
  incoming.fade(0, 1, durationMs);
  if (previous) {
    const previousVolume =
      typeof previous.volume() === "number" ? (previous.volume() as number) : 1;
    previous.fade(previousVolume, 0, durationMs);
    globalThis.setTimeout(() => stopAndUnload(previous), durationMs + 50);
  }
  return incoming;
}

/**
 * HTML5 audio only for cross-origin URLs (no CORS for Web Audio). Same-origin files
 * (built-in /audio/*, uploaded /api/files/*, capped at 4 MB) use Web Audio: exact
 * seeking, no HTML5 pool exhaustion, unlocked once by the first gesture.
 */
export function shouldUseHtml5(src: string, origin?: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false;
  try {
    return new URL(src).origin !== (origin ?? globalThis.location?.origin);
  } catch {
    return true;
  }
}

/** The subset of Howl the player uses (so tests can fake it). */
export interface SoundLike {
  play(): number;
  pause(): void;
  stop(): void;
  unload(): void;
  fade(from: number, to: number, durationMs: number): void;
  volume(value?: number): number;
  playing(): boolean;
  seek(position?: number): number;
  duration(): number;
  state(): string;
  on(event: string, cb: () => void): void;
  once(event: string, cb: () => void): void;
}

export type SoundFactory = (src: string, loop: boolean) => SoundLike;

interface Entry {
  key: string;
  sound: SoundLike;
  seg: MusicSegment | null;
  loaded: boolean;
  /** Generation counter: a fade-out pause from an old leave never pauses a newer entry. */
  gen: number;
  pauseTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Per-room music player (framework-free, unit-tested with a fake factory).
 * `setTarget` is called on every room/mute change; `unlock` on every user gesture.
 */
export class RoomPlayer {
  private entries = new Map<string, Entry>();
  private current: Entry | null = null;
  private muted = false;
  private segTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly create: SoundFactory,
    private readonly fadeInMs: number = CROSSFADE_MS,
    private readonly leaveFadeMs: number = LEAVE_FADE_MS,
  ) {}

  /** The sound that should be audible now (tests + the gesture unlock). */
  get currentSound(): SoundLike | null {
    return this.current?.sound ?? null;
  }

  setTarget(src: string | undefined, seg: MusicSegment | null, muted: boolean): void {
    this.muted = muted;
    const key = src ? resumeKey(src, seg) : null;
    if (!src || !key || muted) {
      this.leaveCurrent();
      return;
    }
    if (this.current?.key === key) {
      this.ensurePlaying(this.current);
      return;
    }
    this.leaveCurrent();
    let entry = this.entries.get(key);
    if (!entry) {
      entry = this.createEntry(key, src, seg);
    } else {
      // Refresh LRU order.
      this.entries.delete(key);
      this.entries.set(key, entry);
    }
    this.current = entry;
    entry.gen++;
    if (entry.pauseTimer) {
      globalThis.clearTimeout(entry.pauseTimer);
      entry.pauseTimer = null;
    }
    if (entry.loaded) this.enter(entry);
    // else: the load handler enters it.
    this.evict();
  }

  /** Call on every user gesture: starts a sound the browser blocked. Never throws. */
  unlock(): void {
    const entry = this.current;
    if (!entry || this.muted || !entry.loaded) return;
    try {
      if (!entry.sound.playing()) this.enter(entry);
    } catch {
      // ignore
    }
  }

  dispose(): void {
    this.stopSegTimer();
    for (const e of this.entries.values()) {
      if (e.pauseTimer) globalThis.clearTimeout(e.pauseTimer);
      stopAndUnload(e.sound as unknown as HowlInstance);
    }
    this.entries.clear();
    this.current = null;
  }

  private createEntry(key: string, src: string, seg: MusicSegment | null): Entry {
    const sound = this.create(src, !seg);
    const entry: Entry = { key, sound, seg, loaded: false, gen: 0, pauseTimer: null };
    this.entries.set(key, entry);
    const onReady = () => {
      if (entry.loaded) return;
      entry.loaded = true;
      if (this.current === entry && !this.muted) this.enter(entry);
    };
    sound.once("load", onReady);
    if (sound.state() === "loaded") onReady();
    // Autoplay blocked: retry as soon as Howler unlocks audio on the next gesture.
    sound.on("playerror", () => {
      sound.once("unlock", () => {
        if (this.current === entry && !this.muted) this.enter(entry);
      });
    });
    // An unplayable URL (streaming page, dead link) stays silent; the editor panel explains it.
    sound.on("loaderror", () => {
      entry.loaded = false;
    });
    return entry;
  }

  /** Seek to the saved position (clamped to the clip) and fade in. */
  private enter(entry: Entry): void {
    const { sound, seg, key } = entry;
    try {
      if (sound.playing()) {
        sound.fade(sound.volume(), 1, this.fadeInMs);
        return;
      }
      const saved = getResumePosition(key);
      let duration: number | undefined;
      try {
        duration = sound.duration();
      } catch {
        duration = undefined;
      }
      const pos = clampSegmentPosition(saved ?? seg?.start ?? 0, seg, duration);
      sound.seek(pos);
      sound.volume(0);
      sound.play();
      sound.fade(0, 1, this.fadeInMs);
      if (seg) this.startSegLoop(entry);
    } catch {
      // ignore: an unlock/gesture retries
    }
  }

  private ensurePlaying(entry: Entry): void {
    if (entry.loaded && !entry.sound.playing()) this.enter(entry);
  }

  /** Save the position NOW (even if paused or blocked), fade out, then pause (keeps position). */
  private leaveCurrent(): void {
    const entry = this.current;
    this.current = null;
    this.stopSegTimer();
    if (!entry) return;
    const { sound, key } = entry;
    try {
      const pos = sound.seek();
      if (typeof pos === "number") saveResumePosition(key, pos);
    } catch {
      // ignore
    }
    try {
      if (!sound.playing()) return;
      sound.fade(sound.volume(), 0, this.leaveFadeMs);
      const gen = entry.gen;
      entry.pauseTimer = globalThis.setTimeout(() => {
        entry.pauseTimer = null;
        if (entry.gen !== gen || this.current === entry) return;
        try {
          const p = sound.seek();
          if (typeof p === "number") saveResumePosition(key, p);
          sound.pause();
        } catch {
          // ignore
        }
      }, this.leaveFadeMs + 30);
    } catch {
      // ignore
    }
  }

  private evict(): void {
    while (this.entries.size > MAX_CACHED_SOUNDS) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) return;
      const e = this.entries.get(oldest);
      if (!e || e === this.current) return;
      this.entries.delete(oldest);
      try {
        const p = e.sound.seek();
        if (typeof p === "number") saveResumePosition(e.key, p);
      } catch {
        // ignore
      }
      if (e.pauseTimer) globalThis.clearTimeout(e.pauseTimer);
      stopAndUnload(e.sound as unknown as HowlInstance);
    }
  }

  /** Loop a 30–60 s clip: poll the position, jump back to the clip start at its end. */
  private startSegLoop(entry: Entry): void {
    this.stopSegTimer();
    const seg = entry.seg;
    if (!seg) return;
    this.segTimer = globalThis.setInterval(() => {
      if (this.current !== entry) {
        this.stopSegTimer();
        return;
      }
      try {
        if (!entry.sound.playing()) return;
        const pos = entry.sound.seek();
        if (pos >= seg.start + seg.length - 0.15) entry.sound.seek(seg.start);
      } catch {
        // ignore: a failed seek retries next tick
      }
    }, 250);
  }

  private stopSegTimer(): void {
    if (this.segTimer) {
      globalThis.clearInterval(this.segTimer);
      this.segTimer = null;
    }
  }
}

const howlFactory: SoundFactory = (src, loop) =>
  new Howl({
    src: [src],
    loop,
    volume: 0,
    html5: shouldUseHtml5(src),
  }) as unknown as SoundLike;

export function RoomAudio({ gallery, currentRoomId }: RoomAudioProps) {
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<RoomPlayer | null>(null);

  const room =
    gallery.rooms.find((r) => r.id === currentRoomId) ??
    gallery.rooms.find((r) => r.id === gallery.entranceRoomId) ??
    gallery.rooms[0];
  const src = resolveRoomSrc(room?.music);
  // Memoized: a fresh object identity every render would restart playback.
  const segment = useMemo(() => resolveMusicSegment(room?.music), [room?.music]);

  // One player for the page; disposed on unmount.
  useEffect(() => {
    const player = new RoomPlayer(howlFactory);
    playerRef.current = player;
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  // Every gesture (not just the first) may unlock a blocked sound for the current room.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onGesture = () => playerRef.current?.unlock();
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", onGesture, opts);
    window.addEventListener("touchend", onGesture, opts);
    window.addEventListener("keydown", onGesture, opts);
    return () => {
      window.removeEventListener("pointerdown", onGesture, opts);
      window.removeEventListener("touchend", onGesture, opts);
      window.removeEventListener("keydown", onGesture, opts);
    };
  }, []);

  // Room / mute changes: leave the old song (fade + pause, position saved), enter the new one.
  useEffect(() => {
    playerRef.current?.setTarget(src, segment, muted);
  }, [src, segment, muted]);

  if (!src) return null;

  return (
    <div data-testid="room-audio" className="flex items-center gap-2">
      <button
        type="button"
        data-testid="room-audio-mute"
        aria-pressed={muted}
        onClick={() => setMuted((m) => !m)}
        className="flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-graphite/80 px-2.5 py-1 text-xs font-medium text-paper shadow-md backdrop-blur-md transition-colors hover:bg-graphite focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${muted ? "bg-pencil" : "bg-accent"}`}
        />
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
