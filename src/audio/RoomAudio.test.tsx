import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { crossfadeTo, RoomAudio } from "./RoomAudio";
import { CROSSFADE_MS } from "./tracks";
import type { Gallery } from "@/lib/schema/types";

vi.mock("howler", () => {
  return {
    Howl: class {
      calls: string[] = [];
      play() {
        this.calls.push("play");
        return 1;
      }
      stop() {
        this.calls.push("stop");
      }
      unload() {
        this.calls.push("unload");
      }
      fade() {
        this.calls.push("fade");
      }
      volume() {
        return 1;
      }
      playing() {
        return true;
      }
    },
    Howler: { volume: () => 1, mute: () => {} },
  };
});

function makeGallery(music?: { trackId?: string; url?: string }): Gallery {
  const now = "2026-10-10T00:00:00.000Z";
  return {
    id: "g-1",
    version: 1,
    title: "Audio gallery",
    entranceRoomId: "room-1",
    rooms: [
      {
        id: "room-1",
        name: "Atrium",
        description: "",
        x: 0,
        y: 0,
        w: 6,
        d: 6,
        wallHeight: 3,
        wallColor: "#f2efe9",
        floor: "wood",
        lighting: "gallery",
        music,
      },
    ],
    artworks: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe("RoomAudio rendering", () => {
  it("renders nothing when the room has no music (zero audio work)", () => {
    const html = renderToString(<RoomAudio gallery={makeGallery()} />);
    expect(html).toBe("");
  });

  it("renders the tap-to-start prompt and mute toggle for a room with music", () => {
    const html = renderToString(
      <RoomAudio
        gallery={makeGallery({ trackId: "still-air" })}
        currentRoomId="room-1"
      />,
    );
    expect(html).toContain('data-testid="room-audio"');
    expect(html).toContain('data-testid="room-audio-start"');
    expect(html).toContain("Tap to start sound");
    expect(html).toContain('data-testid="room-audio-mute"');
    expect(html).toContain("Mute");
  });

  it("falls back to the entrance room when currentRoomId is unknown", () => {
    const html = renderToString(
      <RoomAudio
        gallery={makeGallery({ trackId: "warm-hum" })}
        currentRoomId="missing"
      />,
    );
    expect(html).toContain('data-testid="room-audio"');
  });
});

describe("crossfadeTo (Howler faked)", () => {
  function fakeHowl(volumeValue = 0.8) {
    return {
      calls: [] as string[],
      volumeValue,
      volume(v?: number) {
        if (v === undefined) return this.volumeValue;
        this.calls.push(`volume:${v}`);
        return v;
      },
      play() {
        this.calls.push("play");
        return 1;
      },
      stop() {
        this.calls.push("stop");
      },
      unload() {
        this.calls.push("unload");
      },
      fade(from: number, to: number, duration: number) {
        this.calls.push(`fade:${from}->${to}:${duration}`);
      },
    };
  }

  it("fades the new loop in over ~1.5 s and the old loop out", () => {
    vi.useFakeTimers();
    try {
      const previous = fakeHowl(0.9);
      const incoming = fakeHowl(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = crossfadeTo(previous as any, incoming as any);
      expect(current).toBe(incoming);
      expect(incoming.calls).toContain("volume:0");
      expect(incoming.calls).toContain("play");
      expect(
        incoming.calls.some((c) => c === `fade:0->1:${CROSSFADE_MS}`),
      ).toBe(true);
      expect(
        previous.calls.some((c) => c === `fade:0.9->0:${CROSSFADE_MS}`),
      ).toBe(true);
      // Old loop is stopped and unloaded after the fade.
      vi.advanceTimersByTime(CROSSFADE_MS + 100);
      expect(previous.calls).toContain("stop");
      expect(previous.calls).toContain("unload");
    } finally {
      vi.useRealTimers();
    }
  });

  it("starts cleanly when there is no previous loop", () => {
    const incoming = fakeHowl(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crossfadeTo(null, incoming as any);
    expect(incoming.calls).toContain("play");
    expect(incoming.calls.some((c) => c === `fade:0->1:${CROSSFADE_MS}`)).toBe(
      true,
    );
  });
});
