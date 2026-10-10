"use client";

// RoomAudio: plays the current room's music (built-in CC0 ambient loops or custom uploaded MP3s)
// with a ~1.5 s crossfade on room change. Autoplays seamlessly across room transitions.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Howl, Howler } from "howler";
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

export function RoomAudio({ gallery, currentRoomId }: RoomAudioProps) {
  const [muted, setMuted] = useState(false);
  const currentRef = useRef<HowlInstance | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  const segmentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const room =
    gallery.rooms.find((r) => r.id === currentRoomId) ??
    gallery.rooms.find((r) => r.id === gallery.entranceRoomId) ??
    gallery.rooms[0];
  const src = resolveRoomSrc(room?.music);
  // Memoized: a fresh object identity every render would restart playback.
  const segment = useMemo(() => resolveMusicSegment(room?.music), [room?.music]);
  const key = src ? resumeKey(src, segment) : null;

  // Resume Web Audio context automatically on first user gesture anywhere if browser paused it
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resumeContext = () => {
      try {
        if (
          Howler &&
          "ctx" in Howler &&
          Howler.ctx &&
          (Howler.ctx as AudioContext).state === "suspended"
        ) {
          (Howler.ctx as AudioContext).resume();
        }
        if (currentRef.current && !currentRef.current.playing()) {
          currentRef.current.play();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("pointerdown", resumeContext, { once: true });
    window.addEventListener("touchstart", resumeContext, { once: true });
    window.addEventListener("keydown", resumeContext, { once: true });
    window.addEventListener("click", resumeContext, { once: true });

    return () => {
      window.removeEventListener("pointerdown", resumeContext);
      window.removeEventListener("touchstart", resumeContext);
      window.removeEventListener("keydown", resumeContext);
      window.removeEventListener("click", resumeContext);
    };
  }, []);

  const stopSegmentTimer = useCallback(() => {
    if (segmentTimerRef.current) {
      globalThis.clearInterval(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
  }, []);

  const teardownCurrent = useCallback(() => {
    stopSegmentTimer();
    const cur = currentRef.current;
    const curKey = currentKeyRef.current;
    currentRef.current = null;
    if (!cur) return;
    if (curKey) {
      try {
        if (cur.playing()) saveResumePosition(curKey, cur.seek() as number);
      } catch {
        // ignore
      }
    }
    const previousVolume =
      typeof cur.volume() === "number" ? (cur.volume() as number) : 1;
    cur.fade(previousVolume, 0, Math.min(CROSSFADE_MS, 300));
    const stopped = cur;
    globalThis.setTimeout(() => stopAndUnload(stopped), 400);
  }, [stopSegmentTimer]);

  /** Loop a 30–60 s clip: poll the position, jump back to the clip start at its end. */
  const startSegmentLoop = useCallback(
    (sound: HowlInstance, seg: MusicSegment) => {
      stopSegmentTimer();
      segmentTimerRef.current = globalThis.setInterval(() => {
        if (currentRef.current !== sound) {
          stopSegmentTimer();
          return;
        }
        try {
          if (!sound.playing()) return;
          const pos = sound.seek() as number;
          if (pos >= seg.start + seg.length - 0.15) sound.seek(seg.start);
        } catch {
          // ignore: a failed seek retries next tick
        }
      }, 250);
    },
    [stopSegmentTimer],
  );

  // Stop everything on unmount.
  useEffect(() => {
    return () => {
      teardownCurrent();
      currentKeyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to room / mute changes with smooth crossfade
  useEffect(() => {
    // Zero audio work when muted or with no track (T-061 AC)
    if (muted || !src || !key) {
      teardownCurrent();
      currentKeyRef.current = null;
      return;
    }

    // Already playing this exact file + clip: keep going (resume for free).
    if (currentKeyRef.current === key && currentRef.current) return;

    const seg: MusicSegment | null = segment;
    const incoming = new Howl({
      src: [src],
      loop: !seg,
      volume: 0,
      html5: src.startsWith("http") || src.includes("/api/files/"),
    });

    const previous = currentRef.current;
    const previousKey = currentKeyRef.current;
    currentRef.current = null;
    currentKeyRef.current = null;

    // Seek only after load: html5 streams can't seek before they know the file.
    // A load error means an unplayable URL (streaming page, dead link): stay silent,
    // the editor panel explains it.
    incoming.once("load", () => {
      let startPos = getResumePosition(key) ?? seg?.start ?? 0;
      try {
        const duration = incoming.duration();
        startPos = clampSegmentPosition(startPos, seg, duration);
      } catch {
        startPos = clampSegmentPosition(startPos, seg);
      }
      try {
        incoming.seek(startPos);
      } catch {
        // ignore: play from wherever the stream starts
      }
      // Drop a stale previous that changed again while we loaded.
      if (currentRef.current && currentRef.current !== incoming) return;
      currentRef.current = crossfadeTo(previous, incoming);
      currentKeyRef.current = key;
      if (seg) startSegmentLoop(incoming, seg);
    });
    if (previousKey && previous) {
      try {
        if (previous.playing()) saveResumePosition(previousKey, previous.seek());
      } catch {
        // ignore
      }
    }
  }, [key, src, muted, segment, teardownCurrent, startSegmentLoop]);

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
