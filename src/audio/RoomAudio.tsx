"use client";

// RoomAudio: plays the current room's music (built-in CC0 ambient loops or custom uploaded MP3s)
// with a ~1.5 s crossfade on room change. Autoplays seamlessly across room transitions.

import { useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import type { Gallery } from "@/lib/schema/types";
import { CROSSFADE_MS, resolveRoomSrc } from "./tracks";

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
  const currentSrcRef = useRef<string | null>(null);

  const room =
    gallery.rooms.find((r) => r.id === currentRoomId) ??
    gallery.rooms.find((r) => r.id === gallery.entranceRoomId) ??
    gallery.rooms[0];
  const src = resolveRoomSrc(room?.music);

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

  // Stop everything on unmount.
  useEffect(() => {
    return () => {
      stopAndUnload(currentRef.current);
      currentRef.current = null;
      currentSrcRef.current = null;
    };
  }, []);

  // React to room / mute changes with smooth crossfade
  useEffect(() => {
    // Zero audio work when muted or with no track (T-061 AC)
    if (muted || !src) {
      if (currentRef.current) {
        const previous = currentRef.current;
        currentRef.current = null;
        currentSrcRef.current = null;
        const previousVolume =
          typeof previous.volume() === "number"
            ? (previous.volume() as number)
            : 1;
        previous.fade(previousVolume, 0, Math.min(CROSSFADE_MS, 300));
        globalThis.setTimeout(() => stopAndUnload(previous), 400);
      }
      return;
    }

    // Already playing this source
    if (currentSrcRef.current === src && currentRef.current) return;

    const incoming = new Howl({
      src: [src],
      loop: true,
      volume: 0,
      html5: src.startsWith("http") || src.includes("/api/files/"),
    });

    const previous = currentRef.current;
    currentRef.current = crossfadeTo(previous, incoming);
    currentSrcRef.current = src;
  }, [src, muted]);

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
