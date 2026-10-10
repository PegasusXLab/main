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

  it("renders the mute toggle for a room with music (autoplay enabled, no tap-to-start prompt)", () => {
    const html = renderToString(
      <RoomAudio
        gallery={makeGallery({ trackId: "still-air" })}
        currentRoomId="room-1"
      />,
    );
    expect(html).toContain('data-testid="room-audio"');
    expect(html).toContain('data-testid="room-audio-mute"');
    expect(html).toContain("Mute");
    expect(html).not.toContain('data-testid="room-audio-start"');
  });

  it("supports rooms with custom uploaded audio URL", () => {
    const html = renderToString(
      <RoomAudio
        gallery={makeGallery({ url: "/api/files/audio/custom-track.mp3" })}
        currentRoomId="room-1"
      />,
    );
    expect(html).toContain('data-testid="room-audio"');
    expect(html).toContain('data-testid="room-audio-mute"');
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
      fade(from: number, to: number, dur: number) {
        this.calls.push(`fade(${from},${to},${dur})`);
      },
      volume(v?: number) {
        if (typeof v === "number") {
          this.volumeValue = v;
          this.calls.push(`volume(${v})`);
        }
        return this.volumeValue;
      },
    };
  }

  it("fades incoming from 0 to 1 over CROSSFADE_MS and starts playback", () => {
    const incoming = fakeHowl();
    const result = crossfadeTo(
      null,
      incoming as unknown as InstanceType<typeof import("howler").Howl>,
    );
    expect(result).toBe(incoming);
    expect(incoming.calls).toContain("volume(0)");
    expect(incoming.calls).toContain("play");
    expect(incoming.calls).toContain(`fade(0,1,${CROSSFADE_MS})`);
  });

  it("fades previous from its current volume to 0 and stops/unloads it after duration", () => {
    vi.useFakeTimers();
    try {
      const prev = fakeHowl(0.7);
      const incoming = fakeHowl();
      crossfadeTo(
        prev as unknown as InstanceType<typeof import("howler").Howl>,
        incoming as unknown as InstanceType<typeof import("howler").Howl>,
      );
      expect(prev.calls).toContain(`fade(0.7,0,${CROSSFADE_MS})`);

      // Timer has not fired yet
      expect(prev.calls).not.toContain("stop");
      expect(prev.calls).not.toContain("unload");

      vi.advanceTimersByTime(CROSSFADE_MS + 60);

      expect(prev.calls).toContain("stop");
      expect(prev.calls).toContain("unload");
    } finally {
      vi.useRealTimers();
    }
  });
});
