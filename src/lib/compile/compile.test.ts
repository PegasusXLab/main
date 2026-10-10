import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newGallery, newRoom } from "@/lib/schema/defaults";
import type { Artwork, Gallery, Room, Wall } from "@/lib/schema/types";
import { EYE_HEIGHT, compile } from "./compile";

const fixture = () => structuredClone(sample) as Gallery;

const room = (
  id: string,
  x: number,
  y: number,
  w: number,
  d: number,
): Room => ({
  ...newRoom({ x, y, w, d }),
  id,
});

const gallery = (rooms: Room[], artworks: Artwork[] = []): Gallery => ({
  ...newGallery(),
  rooms,
  artworks,
  entranceRoomId: rooms[0].id,
});

const art = (
  id: string,
  roomId: string,
  wall: Wall,
  offset: number,
  width = 1,
): Artwork => ({
  id,
  roomId,
  type: "image",
  placement: { wall, offset, height: 1.5 },
  width,
  aspect: 0.75,
  image: { small: "/s.webp", medium: "/m.webp" },
  title: id,
  artist: "",
  story: "",
});

describe("compile: F4 matrix (architecture §3)", () => {
  it("single room: floor, 4 walls, no doorways, a camera view", () => {
    const { scene, issues } = compile(gallery([room("A", 0, 0, 6, 4)]));
    expect(issues).toEqual([]);
    expect(scene.floors).toEqual([
      { roomId: "A", center: [3, 0, 2], size: [6, 4], floor: "wood" },
    ]);
    expect(scene.walls).toHaveLength(4);
    expect(scene.doorways).toEqual([]);
    expect(scene.frames).toEqual([]);
    expect(scene.rooms).toEqual([
      {
        roomId: "A",
        center: [3, 0, 2],
        lighting: "gallery",
        view: { position: [3, EYE_HEIGHT, 3], target: [3, EYE_HEIGHT, 2] },
      },
    ]);
  });

  it("two rooms sharing a full wall: one doorway on the shared line", () => {
    const { scene } = compile(
      gallery([room("A", 0, 0, 6, 6), room("B", 6, 0, 6, 6)]),
    );
    expect(scene.doorways).toEqual([
      {
        roomIds: ["A", "B"],
        center: [6, 1.1, 3],
        width: 1.2,
        height: 2.2,
        side: "e",
      },
    ]);
    expect(scene.walls).toHaveLength(12); // each room: 3 sides + 2 solid + 1 over-door
  });

  it("two rooms with a partial overlap: doorway centered on the overlap", () => {
    const { scene } = compile(
      gallery([room("A", 0, 0, 6, 6), room("B", 3, 6, 6, 4)]),
    );
    expect(scene.doorways).toHaveLength(1);
    const [door] = scene.doorways;
    expect(door).toMatchObject({ roomIds: ["A", "B"], side: "s", width: 1.2 });
    expect(door.center[0]).toBeCloseTo(4.5);
    expect(door.center[2]).toBe(6);
  });

  it("an overlap below the minimum: no doorway, walls stay solid", () => {
    const { scene } = compile(
      gallery([room("A", 0, 0, 6, 6), room("B", 6, 5.5, 4, 4)]),
    );
    expect(scene.doorways).toEqual([]);
    expect(scene.walls).toHaveLength(8);
  });

  it("L-shaped three rooms (sample fixture): 2 doorways, 20 wall pieces, no issues", () => {
    const { scene, issues } = compile(fixture());
    expect(issues).toEqual([]);
    expect(scene.floors.map((f) => [f.roomId, f.floor])).toEqual([
      ["room-entrance", "wood"],
      ["room-east", "concrete"],
      ["room-south", "marble"],
    ]);
    expect(scene.doorways).toHaveLength(2);
    expect(scene.doorways[0]).toEqual({
      roomIds: ["room-entrance", "room-east"],
      center: [6, 1.1, 3],
      width: 1.2,
      height: 2.2,
      side: "e",
    });
    expect(scene.doorways[1].roomIds).toEqual(["room-entrance", "room-south"]);
    expect(scene.doorways[1].center[0]).toBeCloseTo(2);
    expect(scene.doorways[1].center[2]).toBe(6);
    expect(scene.walls).toHaveLength(20);
    expect(scene.frames.map((f) => f.artworkId)).toEqual([
      "art-sunrise",
      "art-portrait",
    ]);
    expect(scene.rooms.map((r) => r.lighting)).toEqual([
      "gallery",
      "warm",
      "moody",
    ]);
  });

  it("artwork on each of n/e/s/w lands on the right wall facing into the room", () => {
    const A = room("A", 0, 0, 6, 4);
    const { scene, issues } = compile(
      gallery(
        [A],
        [
          art("n", "A", "n", 3),
          art("e", "A", "e", 2),
          art("s", "A", "s", 3),
          art("w", "A", "w", 2),
        ],
      ),
    );
    expect(issues).toEqual([]);
    const at = (id: string) => scene.frames.find((f) => f.artworkId === id)!;
    expect(at("n").position).toEqual([3, 1.5, 0.08]);
    expect(at("e").position[0]).toBeCloseTo(5.92);
    expect(at("e").position[2]).toBe(2);
    expect(at("s").position[0]).toBe(3);
    expect(at("s").position[2]).toBeCloseTo(3.92);
    expect(at("w").position).toEqual([0.08, 1.5, 2]);
    expect(
      [at("n"), at("e"), at("s"), at("w")].map((f) => f.rotationY),
    ).toEqual([0, -Math.PI / 2, Math.PI, Math.PI / 2]);
  });

  it("artwork over a doorway is reported as an issue, and the scene still compiles", () => {
    const g = fixture();
    g.artworks.push(art("blocker", "room-entrance", "e", 3)); // east wall door at y 2.4..3.6
    const { scene, issues } = compile(g);
    expect(issues.map((i) => [i.code, i.artworkId])).toEqual([
      ["artwork-over-doorway", "blocker"],
    ]);
    expect(scene.frames).toHaveLength(3);
  });
});

describe("compile: artwork must fit the wall vertically", () => {
  const A = room("A", 0, 0, 6, 6); // 3 m walls
  const at = (height: number, width = 1) => ({
    ...art("x", "A", "e", 3, width),
    placement: { wall: "e" as const, offset: 3, height },
  });

  it("reports artwork sticking out above the wall top", () => {
    // center 3.0, frame height 0.75 → top 3.375 > 3
    expect(compile(gallery([A], [at(3)])).issues.map((i) => i.code)).toEqual([
      "artwork-past-wall-top",
    ]);
  });

  it("reports artwork hanging below the floor", () => {
    // center 0.2, frame height 0.75 → bottom −0.175
    expect(compile(gallery([A], [at(0.2)])).issues.map((i) => i.code)).toEqual([
      "artwork-below-floor",
    ]);
  });

  it("artwork touching the floor or the wall top exactly is fine", () => {
    expect(compile(gallery([A], [at(0.375), at(2.625)])).issues).toEqual([]);
  });
});

describe("compile: camera views (ADR-007)", () => {
  it("stands at eye height inside the room, looking at its center", () => {
    for (const r of compile(fixture()).scene.rooms) {
      const [px, py, pz] = r.view.position;
      const [tx, ty, tz] = r.view.target;
      expect(py).toBe(EYE_HEIGHT);
      expect(ty).toBe(EYE_HEIGHT);
      expect([tx, tz]).toEqual([r.center[0], r.center[2]]);
      const floor = compile(fixture()).scene.floors.find(
        (f) => f.roomId === r.roomId,
      )!;
      expect(Math.abs(px - floor.center[0])).toBeLessThan(floor.size[0] / 2);
      expect(Math.abs(pz - floor.center[2])).toBeLessThan(floor.size[1] / 2);
    }
  });

  it("small rooms keep the camera inside (standoff ≤ a quarter of the depth)", () => {
    const { scene } = compile(gallery([room("A", 0, 0, 2, 2)]));
    expect(scene.rooms[0].view.position).toEqual([1, EYE_HEIGHT, 1.5]);
  });
});

describe("compile: atmosphere pass-through (T-060)", () => {
  it("copies a room's atmosphere into scene.rooms, and omits it when unset", () => {
    const atmosphere = {
      preset: "moonlit" as const,
      moodColor: "#223344",
      haze: 0.3,
      brightness: 0.4,
      lightDirection: 120,
      grain: 0,
    };
    const A = { ...room("A", 0, 0, 6, 6), atmosphere };
    const B = room("B", 6, 0, 6, 6);
    const { scene } = compile(gallery([A, B]));
    expect(scene.rooms[0].atmosphere).toEqual(atmosphere);
    expect("atmosphere" in scene.rooms[1]).toBe(false);
  });
});

describe("compile: purity", () => {
  it("is deterministic and does not mutate its input", () => {
    const g = fixture();
    const before = structuredClone(g);
    expect(compile(g)).toEqual(compile(g));
    expect(g).toEqual(before);
  });

  it("no three.js, React or store imports anywhere under src/lib/compile/", () => {
    const dir = __dirname;
    const sources = readdirSync(dir).filter((f) => f.endsWith(".ts"));
    expect(sources.length).toBeGreaterThan(5);
    for (const file of sources) {
      const text = readFileSync(join(dir, file), "utf8");
      expect(text, file).not.toMatch(
        /(?:from|import)\s+["'](three|react|@react-three\/[^"']+|zustand|@\/store[^"']*)["']/,
      );
    }
  });
});
