import { describe, expect, it } from "vitest";
import {
  computeCrossfadeVolumes,
  CROSSFADE_MS,
  getTrack,
  resolveRoomSrc,
  shouldSwitchTrack,
  TRACKS,
} from "./tracks";

describe("TRACKS", () => {
  it("lists 3-4 license-free loops with stable ids and files", () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(3);
    expect(TRACKS.length).toBeLessThanOrEqual(4);
    for (const track of TRACKS) {
      expect(track.id).toMatch(/^[a-z-]+$/);
      expect(track.file.startsWith("/audio/")).toBe(true);
      expect(track.credit).toContain("CC0");
    }
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
  });

  it("pins the crossfade to ~1.5 s", () => {
    expect(CROSSFADE_MS).toBe(1500);
  });
});

describe("getTrack", () => {
  it("resolves known ids and returns undefined otherwise", () => {
    expect(getTrack("still-air")?.file).toBe("/audio/still-air.wav");
    expect(getTrack("nope")).toBeUndefined();
    expect(getTrack()).toBeUndefined();
    expect(getTrack("")).toBeUndefined();
  });
});

describe("resolveRoomSrc", () => {
  it("returns undefined when the room has no music", () => {
    expect(resolveRoomSrc(undefined)).toBeUndefined();
    expect(resolveRoomSrc({})).toBeUndefined();
  });

  it("resolves a known trackId to its file", () => {
    expect(resolveRoomSrc({ trackId: "warm-hum" })).toBe("/audio/warm-hum.wav");
  });

  it("returns undefined for an unknown trackId", () => {
    expect(resolveRoomSrc({ trackId: "nope" })).toBeUndefined();
  });

  it("prefers a custom url over the trackId", () => {
    expect(
      resolveRoomSrc({
        trackId: "still-air",
        url: "https://example.com/custom.mp3",
      }),
    ).toBe("https://example.com/custom.mp3");
  });
});

describe("computeCrossfadeVolumes", () => {
  it("fades linearly from old to new over the duration", () => {
    expect(computeCrossfadeVolumes(0)).toEqual({ from: 1, to: 0 });
    expect(computeCrossfadeVolumes(CROSSFADE_MS / 2)).toEqual({
      from: 0.5,
      to: 0.5,
    });
    expect(computeCrossfadeVolumes(CROSSFADE_MS)).toEqual({ from: 0, to: 1 });
  });

  it("clamps elapsed time outside [0, duration]", () => {
    expect(computeCrossfadeVolumes(-100)).toEqual({ from: 1, to: 0 });
    expect(computeCrossfadeVolumes(CROSSFADE_MS + 5000)).toEqual({
      from: 0,
      to: 1,
    });
  });
});

describe("shouldSwitchTrack", () => {
  it("switches when the source changes or disappears", () => {
    expect(shouldSwitchTrack(null, "/audio/still-air.wav")).toBe(true);
    expect(shouldSwitchTrack("/audio/a.wav", "/audio/b.wav")).toBe(true);
    expect(shouldSwitchTrack("/audio/a.wav", undefined)).toBe(true);
    expect(shouldSwitchTrack("/audio/a.wav", "/audio/a.wav")).toBe(false);
    expect(shouldSwitchTrack(null, undefined)).toBe(false);
  });
});
