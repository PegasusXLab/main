"use client";

// RoomAudio (T-061, F9): plays the current room's `music.trackId` with a
// ~1.5 s crossfade on room change. Autoplay is blocked by browsers, so audio
// starts only after the visitor taps "start sound". Mounting in the viewer
// page is T-064; the music picker is T-063.

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
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
  const [unlocked, setUnlocked] = useState(false);
  const currentRef = useRef<HowlInstance | null>(null);
  const currentSrcRef = useRef<string | null>(null);

  const room =
    gallery.rooms.find((r) => r.id === currentRoomId) ??
    gallery.rooms.find((r) => r.id === gallery.entranceRoomId) ??
    gallery.rooms[0];
  const src = resolveRoomSrc(room?.music);

  // Stop everything on unmount.
  useEffect(() => {
    return () => {
      stopAndUnload(currentRef.current);
      currentRef.current = null;
      currentSrcRef.current = null;
    };
  }, []);

  // React to room / mute / unlock changes.
  useEffect(() => {
    // Zero audio work when muted, locked, or with no track (T-061 AC).
    if (muted || !unlocked || !src) {
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
    if (currentSrcRef.current === src && currentRef.current) return;

    const incoming = new Howl({ src: [src], loop: true, volume: 0 });
    const previous = currentRef.current;
    currentRef.current = crossfadeTo(previous, incoming);
    currentSrcRef.current = src;
  }, [src, muted, unlocked]);

  if (!src) return null;

  return (
    <div data-testid="room-audio" className="flex items-center gap-2">
      {!unlocked ? (
        <button
          type="button"
          data-testid="room-audio-start"
          onClick={() => setUnlocked(true)}
          className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-100"
        >
          Tap to start sound
        </button>
      ) : null}
      <button
        type="button"
        data-testid="room-audio-mute"
        aria-pressed={muted}
        onClick={() => setMuted((m) => !m)}
        className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-100"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
