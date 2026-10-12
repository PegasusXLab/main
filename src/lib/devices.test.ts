import { describe, expect, it } from "vitest";
import { DEVICE_PRESETS, deviceHeight, playableTracks, TV_STAND } from "./devices";
import { cleanText, GUESTBOOK_BURST, parseSignature, signatureRefusal, timeAgo } from "./guestbook";
import { gallerySchema } from "./schema/validate";
import { LIBRARY_IDS } from "./objects/library";
import sample from "../fixtures/sample-3room.json";

describe("devices", () => {
  it("measures how tall each device stands", () => {
    expect(deviceHeight({ kind: "tv", screen: 1.2, video: { url: "", aspect: 0.5 } })).toBeCloseTo(TV_STAND + 0.6);
    expect(deviceHeight({ kind: "guestbook" })).toBeGreaterThan(0);
  });

  it("plays a turntable's tracks or an album cover's song, skipping empty ones", () => {
    const a = { title: "A", url: "/a.wav" };
    expect(playableTracks({ kind: "turntable", tracks: [a, { title: "B", url: "" }] })).toEqual([a]);
    expect(playableTracks(undefined, a)).toEqual([a]);
    expect(playableTracks()).toEqual([]);
  });

  it("presets use real library hosts and validate (even before media is chosen)", () => {
    const g = JSON.parse(JSON.stringify(sample));
    g.objects = Object.entries(DEVICE_PRESETS).map(([k, p], i) => {
      expect(LIBRARY_IDS).toContain(p.libraryId);
      return {
        id: `d${i}`,
        roomId: g.entranceRoomId,
        position: { x: 1 + i, y: 1 },
        rotation: 0,
        height: p.height,
        source: { kind: "library", libraryId: p.libraryId },
        artist: "",
        ...p.object,
        title: k,
      };
    });
    expect(gallerySchema.safeParse(g).success).toBe(true);
  });

  it("refuses off-site http media and javascript URLs on devices and songs", () => {
    const g = JSON.parse(JSON.stringify(sample));
    g.artworks[0].track = { title: "x", url: "javascript:alert(1)" };
    expect(gallerySchema.safeParse(g).success).toBe(false);
    g.artworks[0].track = { title: "x", url: "//evil.example/a.mp3" };
    expect(gallerySchema.safeParse(g).success).toBe(false);
    g.artworks[0].track = { title: "x", url: "/\\evil.example/a.mp3" };
    expect(gallerySchema.safeParse(g).success).toBe(false);
    g.artworks[0].track = { title: "x", url: "/api/files/audio/a.mp3" };
    expect(gallerySchema.safeParse(g).success).toBe(true);
  });
});

describe("guestbook rules", () => {
  it("cleans names and messages", () => {
    expect(cleanText("  a\tb\n c ", 40)).toBe("a b c");
    expect(cleanText("x".repeat(50), 40)).toHaveLength(40);
    expect(cleanText("line1\n\n\n\nline2", 280, true)).toBe("line1\n\nline2");
    expect(parseSignature({ name: "A", message: "" })).toBeNull();
    expect(parseSignature("nope")).toBeNull();
  });
  it("says how long ago", () => {
    const now = Date.parse("2026-10-11T12:00:00Z");
    expect(timeAgo("2026-10-11T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-11T11:30:00Z", now)).toBe("30 min ago");
    expect(timeAgo("2026-10-11T09:00:00Z", now)).toBe("3 h ago");
  });
  it("refuses bursts and repeats from the stored book", () => {
    const now = Date.parse("2026-10-11T12:00:00Z");
    const at = (msAgo: number) => new Date(now - msAgo).toISOString();
    const sig = { name: "Ada", message: "Loved it" };
    expect(signatureRefusal([], sig, now)).toBeNull();
    expect(signatureRefusal([{ id: "1", name: "ada", message: "Loved it", at: at(3_600_000) }], sig, now)?.status).toBe(409);
    expect(signatureRefusal([{ id: "1", name: "Ada", message: "Other", at: at(1000) }], sig, now)).toBeNull();
    const busy = Array.from({ length: GUESTBOOK_BURST }, (_, i) => ({ id: `${i}`, name: `n${i}`, message: "m", at: at(1000) }));
    expect(signatureRefusal(busy, sig, now)?.status).toBe(429);
    const calm = busy.map((e) => ({ ...e, at: at(120_000) }));
    expect(signatureRefusal(calm, sig, now)).toBeNull();
  });
});
