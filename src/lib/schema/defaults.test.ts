import { describe, expect, it } from "vitest";
import { LIGHTING_PRESETS, newGallery, newRoom } from "./defaults";

describe("newRoom", () => {
  it("defaults to a 6 × 6 m room with the standard look", () => {
    const room = newRoom({ x: 2, y: 3 });
    expect(room).toMatchObject({
      x: 2,
      y: 3,
      w: 6,
      d: 6,
      wallHeight: 3,
      wallColor: "#f2efe9",
      floor: "wood",
      lighting: "gallery",
      description: "",
    });
    expect(room.id).toBeTruthy();
  });

  it("snaps the rect to the grid", () => {
    expect(newRoom({ x: 1.2, y: 0.3, w: 4.1, d: 2.8 })).toMatchObject({
      x: 1,
      y: 0.5,
      w: 4,
      d: 3,
    });
  });

  it("gives every room a new id", () => {
    expect(newRoom({ x: 0, y: 0 }).id).not.toBe(newRoom({ x: 0, y: 0 }).id);
  });
});

describe("newGallery", () => {
  it("starts with one room that is the entrance", () => {
    const g = newGallery();
    expect(g.version).toBe(1);
    expect(g.rooms).toHaveLength(1);
    expect(g.entranceRoomId).toBe(g.rooms[0].id);
    expect(g.artworks).toEqual([]);
    expect(g.createdAt).toBe(g.updatedAt);
  });
});

describe("LIGHTING_PRESETS", () => {
  it("has a plain-data preset for every lighting value", () => {
    for (const key of ["gallery", "warm", "moody"] as const) {
      const p = LIGHTING_PRESETS[key];
      expect(p.ambient.intensity).toBeGreaterThan(0);
      expect(p.directional.direction).toHaveLength(3);
      expect(JSON.parse(JSON.stringify(p))).toEqual(p); // data only, no functions or class instances
    }
  });
});
