import { describe, expect, it } from "vitest";
import {
  clampSegmentPosition,
  clearResumePositions,
  computeCrossfadeVolumes,
  CROSSFADE_MS,
  getResumePosition,
  getTrack,
  resolveMusicSegment,
  resolveRoomSrc,
  resumeKey,
  saveResumePosition,
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

describe("music clips (resume + 30–60 s segments)", () => {
  it("resolves no segment without length (whole song loops)", () => {
    expect(resolveMusicSegment(undefined)).toBeNull();
    expect(resolveMusicSegment({ url: "/a.mp3" })).toBeNull();
    expect(resolveMusicSegment({ url: "/a.mp3", length: 45 })).toEqual({
      start: 0,
      length: 45,
    });
    expect(resolveMusicSegment({ url: "/a.mp3", start: 12, length: 30 })).toEqual({
      start: 12,
      length: 30,
    });
    expect(resolveMusicSegment({ url: "/a.mp3", start: -5, length: 30 })?.start).toBe(0);
  });

  it("keys resume positions by file + clip", () => {
    expect(resumeKey("/a.mp3", null)).toBe("/a.mp3");
    expect(resumeKey("/a.mp3", { start: 10, length: 30 })).toBe("/a.mp3::10-30");
    expect(resumeKey("/a.mp3", { start: 10, length: 30 })).not.toBe(
      resumeKey("/a.mp3", { start: 20, length: 30 }),
    );
  });

  it("clamps saved positions into the clip and the file", () => {
    const seg = { start: 10, length: 30 };
    expect(clampSegmentPosition(25, seg)).toBe(25);
    expect(clampSegmentPosition(5, seg)).toBe(10);
    expect(clampSegmentPosition(99, seg)).toBe(40);
    expect(clampSegmentPosition(99, seg, 30)).toBe(29);
    expect(clampSegmentPosition(-3, seg)).toBe(10);
    expect(clampSegmentPosition(NaN, seg)).toBe(10);
    expect(clampSegmentPosition(200, null, 100)).toBe(99);
  });

  it("remembers positions per key across lookups", () => {
    clearResumePositions();
    expect(getResumePosition("/a.mp3::10-30")).toBeUndefined();
    saveResumePosition("/a.mp3::10-30", 22.5);
    expect(getResumePosition("/a.mp3::10-30")).toBe(22.5);
    expect(getResumePosition("/a.mp3")).toBeUndefined();
    saveResumePosition("/bad", NaN);
    expect(getResumePosition("/bad")).toBeUndefined();
    clearResumePositions();
  });
});

import { roomTrackTitle, songDisplayName } from "./tracks";

describe("song display names", () => {
  it("drops the folder and extension and tidies the name", () => {
    expect(songDisplayName("Midnight City - M83.mp3")).toBe("Midnight City - M83");
    expect(songDisplayName("my_song__mix.WAV")).toBe("my song mix");
    expect(songDisplayName("https://cdn.example/audio/Song%20Name%20-%20Artist.m4a?x=1")).toBe("Song Name - Artist");
    expect(songDisplayName(undefined)).toBe("");
  });

  it("shows the saved name, else a built-in title, else a link's name, else a fallback", () => {
    expect(roomTrackTitle({ url: "/api/files/audio/abc.mp3", title: "Nights - Frank Ocean" })).toBe(
      "Nights - Frank Ocean",
    );
    expect(roomTrackTitle({ trackId: "night-gallery" })).toBe("Night Gallery");
    expect(roomTrackTitle({ url: "https://cdn.example/Blue%20in%20Green.mp3" })).toBe("Blue in Green");
    // Our uploads are stored under random ids: no name to show.
    expect(roomTrackTitle({ url: "/api/files/audio/-NUcPbOaUFxPBOV3__jG2.mp3" })).toBe("Room soundtrack");
  });
});
