import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newGallery } from "./defaults";
import { rangeOverlap, rectsOverlap, sameLine } from "./geom";
import type { Gallery } from "./types";
import { validate } from "./validate";

const fixture = () => structuredClone(sample) as Gallery;

function issuePaths(doc: unknown): string[] {
  const result = validate(doc);
  expect(result.ok).toBe(false);
  return result.issues.map((i) => i.path);
}

describe("sample-3room fixture", () => {
  it("passes validation", () => {
    const result = validate(sample);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("is an L shape with one full and one partial (≥ 1 m) shared wall", () => {
    const [entrance, east, south] = fixture().rooms;
    // Entrance east edge = East Hall west edge, full length
    expect(sameLine(entrance.x + entrance.w, east.x)).toBe(true);
    expect(
      rangeOverlap(
        entrance.y,
        entrance.y + entrance.d,
        east.y,
        east.y + east.d,
      ),
    ).toEqual([0, 6]);
    // Entrance south edge = South Room north edge, partial
    expect(sameLine(entrance.y + entrance.d, south.y)).toBe(true);
    const partial = rangeOverlap(
      entrance.x,
      entrance.x + entrance.w,
      south.x,
      south.x + south.w,
    )!;
    expect(partial[1] - partial[0]).toBeGreaterThanOrEqual(1);
    expect(partial[1] - partial[0]).toBeLessThan(entrance.w);
    // East Hall and South Room don't touch
    expect(rectsOverlap(east, south)).toBe(false);
    expect(
      rangeOverlap(east.x, east.x + east.w, south.x, south.x + south.w),
    ).toBeNull();
  });

  it("has 2 artworks using the placeholder image", () => {
    const { artworks } = fixture();
    expect(artworks).toHaveLength(2);
    for (const art of artworks)
      expect(art.image.medium).toBe("/fixtures/placeholder.webp");
  });
});

describe("validate rejects", () => {
  it("a bad hex color", () => {
    const g = fixture();
    g.rooms[0].wallColor = "beige";
    expect(issuePaths(g)).toContain("rooms.0.wallColor");
    g.rooms[0].wallColor = "#fff";
    expect(issuePaths(g)).toContain("rooms.0.wallColor");
  });

  it("rooms under 2 × 2 m", () => {
    const g = fixture();
    g.rooms[1].w = 1.5;
    expect(issuePaths(g)).toContain("rooms.1.w");
    const h = fixture();
    h.rooms[2].d = 0;
    expect(issuePaths(h)).toContain("rooms.2.d");
  });

  it("accepts exactly 2 × 2 m", () => {
    const g = fixture();
    g.rooms[2].w = 2;
    g.rooms[2].d = 2;
    expect(validate(g).ok).toBe(true);
  });

  it("coordinates off the 0.5 m grid", () => {
    const g = fixture();
    g.rooms[1].x = 6.25;
    g.rooms[1].d = 5.1;
    const paths = issuePaths(g);
    expect(paths).toContain("rooms.1.x");
    expect(paths).toContain("rooms.1.d");
  });

  it("accepts float noise on a grid line", () => {
    const g = fixture();
    g.rooms[2].d = 0.1 + 0.2 + 4.7; // 5.000000000000001
    expect(validate(g).ok).toBe(true);
  });

  it("an unknown entranceRoomId", () => {
    const g = fixture();
    g.entranceRoomId = "nope";
    expect(issuePaths(g)).toEqual(["entranceRoomId"]);
  });

  it("artwork with an unknown roomId", () => {
    const g = fixture();
    g.artworks[1].roomId = "deleted-room";
    expect(issuePaths(g)).toEqual(["artworks.1.roomId"]);
  });

  it("duplicate ids", () => {
    const g = fixture();
    g.rooms[2].id = g.rooms[0].id;
    g.artworks[1].id = g.artworks[0].id;
    const paths = issuePaths(g);
    expect(paths).toContain("rooms.2.id");
    expect(paths).toContain("artworks.1.id");
  });

  it("overlapping rooms, but not touching ones", () => {
    const g = fixture();
    g.rooms[1].x = 5.5;
    expect(issuePaths(g)).toEqual(["rooms.1"]);
  });

  it("a gallery with no rooms", () => {
    const g = fixture();
    g.rooms = [];
    g.artworks = [];
    expect(issuePaths(g)).toContain("rooms");
  });

  it("unknown enum values and wrong version", () => {
    const g = fixture() as unknown as Record<string, unknown> & Gallery;
    (g.rooms[0] as unknown as Record<string, unknown>).floor = "carpet";
    (g as Record<string, unknown>).version = 2;
    const paths = issuePaths(g);
    expect(paths).toContain("rooms.0.floor");
    expect(paths).toContain("version");
  });
});

describe("validate never throws", () => {
  it.each([
    null,
    undefined,
    42,
    "gallery",
    [],
    {},
    { rooms: "x" },
    { ...sample, rooms: [null] },
  ])("returns issues for %j", (doc) => {
    expect(() => validate(doc)).not.toThrow();
    const result = validate(doc);
    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("survives a document whose getter throws", () => {
    const evil = {
      ...sample,
      get title(): string {
        throw new Error("boom");
      },
    };
    expect(() => validate(evil)).not.toThrow();
    expect(validate(evil).ok).toBe(false);
  });
});

describe("newGallery", () => {
  it("produces a valid document", () => {
    expect(validate(newGallery()).issues).toEqual([]);
  });
});

describe("animated artwork contract", () => {
  it("preserves old galleries without adding fields and round-trips both media kinds", () => {
    const old = fixture();
    const parsed = validate(old);
    expect(parsed.ok && parsed.gallery).toEqual(old);
    for (const kind of ["gif", "video"] as const) {
      const g = fixture();
      g.artworks[0].media = {
        kind,
        url: "/api/files/media/test.mp4",
        posterUrl: "https://example.com/poster.webp",
        aspect: 0.75,
      };
      g.artworks[0].frameStyle = "tv";
      const result = validate(JSON.parse(JSON.stringify(g)));
      expect(result.ok && result.gallery).toEqual(g);
    }
  });
  it("rejects unsafe URLs, invalid media kind/aspect and frame style at the correct path", () => {
    for (const value of [
      "http://example.com/art.mp4",
      "javascript:alert(1)",
      "//example.com/a",
      "/api/files/images/a",
      "/api/files/media/",
    ]) {
      const g = fixture();
      g.artworks[0].media = { kind: "video", url: value, aspect: 1 };
      expect(issuePaths(g)).toContain("artworks.0.media.url");
    }
    for (const aspect of [0.19, 5.01, Infinity, NaN]) {
      const g = fixture();
      g.artworks[0].media = {
        kind: "gif",
        url: "https://example.com/a.gif",
        aspect,
      };
      expect(issuePaths(g)).toContain("artworks.0.media.aspect");
    }
    const g = fixture();
    Object.assign(g.artworks[0], {
      media: { kind: "audio", url: "/api/files/media/a.mp4", aspect: 1 },
      frameStyle: "invalid",
    });
    expect(issuePaths(g)).toContain("artworks.0.media.kind");
    expect(issuePaths(g)).toContain("artworks.0.frameStyle");
  });
});
