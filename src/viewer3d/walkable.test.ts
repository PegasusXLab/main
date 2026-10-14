import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { SceneObject } from "@/lib/compile/types";
import type { Gallery } from "@/lib/schema/types";
import { BODY_RADIUS, canReach, canStand, findPath, onFloor, slide, walkMap, wallBetween } from "./walkable";

// Sample plan: Entrance (0..6, 0..6), East Hall (6..12, 0..6), South Room (0..4, 6..11).
// Doorways: Entrance|East at x = 6, z 2.4..3.6; Entrance|South at z = 6, x 1.4..2.6.
const scene = compile(sample as Gallery).scene;
const map = walkMap(scene);

/**
 * Hold a direction like a key press: each frame steps 2 cm from where you are now (as the camera
 * does), toward `to`'s direction, for as many frames as the straight line would take.
 */
function walk(from: [number, number], to: [number, number], m = map): [number, number] {
  let [x, z] = from;
  const len = Math.hypot(to[0] - x, to[1] - z);
  const [ux, uz] = [(to[0] - x) / len, (to[1] - z) / len];
  for (let i = 0; i < Math.ceil(len / 0.02); i++) {
    const step = Math.min(0.02, Math.hypot(to[0] - x, to[1] - z));
    [x, z] = slide(m, x, z, x + ux * step, z + uz * step);
  }
  return [x, z];
}

describe("walkMap / canStand", () => {
  it("has one floor per room and one passage per doorway", () => {
    expect(map.rooms).toHaveLength(3);
    expect(map.passages).toHaveLength(scene.doorways.length);
  });

  it("stands in a room, not against its walls", () => {
    expect(canStand(map, 3, 3)).toBe(true);
    expect(canStand(map, 0.2, 3)).toBe(false); // inside the wall + body margin
    expect(canStand(map, 3, -1)).toBe(false); // outside the plan
  });

  it("stands in a doorway only within its opening", () => {
    expect(canStand(map, 6, 3)).toBe(true); // middle of the Entrance|East doorway
    expect(canStand(map, 6, 1)).toBe(false); // same wall, no opening there
  });
});

describe("slide", () => {
  it("walks through a doorway into the next room", () => {
    const [x, z] = walk([5, 3], [7.5, 3]);
    expect(x).toBeCloseTo(7.5, 5);
    expect(z).toBeCloseTo(3, 5);
  });

  it("can't walk through a wall beside the doorway", () => {
    const [x] = walk([5, 1], [7.5, 1]);
    expect(x).toBeLessThan(6 - BODY_RADIUS); // stopped on the Entrance side
  });

  it("slides along a wall instead of stopping dead", () => {
    // Walking diagonally into the east wall keeps the z part of the move.
    const [x, z] = walk([5, 1], [7, 2]);
    expect(x).toBeLessThan(6);
    expect(z).toBeCloseTo(2, 1);
  });

  it("walks around furniture", () => {
    const bench = {
      objectId: "bench", roomId: "room-entrance", base: [3, 0, 3], rotationY: 0, height: 0.5,
      plinth: { shape: "none", height: 0, size: 1 }, render: { kind: "library", libraryId: "bench" },
    } as unknown as SceneObject;
    const m = walkMap({ ...scene, objects: [bench] });
    expect(canStand(m, 3, 3)).toBe(false);
    expect(canStand(m, 3, 3 + 0.5 + BODY_RADIUS + 0.01)).toBe(true);
    // Head straight at it: you stop at its edge, never inside.
    const [, z] = walk([3, 5], [3, 1], m);
    expect(z).toBeGreaterThanOrEqual(3 + 0.5 + BODY_RADIUS - 1e-6);
    // Starting inside its circle (a badly placed camera), you can still walk out.
    const [ox, oz] = walk([3, 3.2], [3, 5], m);
    expect(Math.hypot(ox - 3, oz - 3)).toBeGreaterThan(0.5 + BODY_RADIUS);
  });

  it("from the margin along a wall, you can step back in but never through the wall", () => {
    // (0.2, 3): inside the Entrance's west wall margin (an inspect spot hard against the wall).
    expect(onFloor(map, 0.2, 3)).toBe(false);
    expect(slide(map, 0.2, 3, 0.25, 3)).toEqual([0.25, 3]); // toward the floor: ok
    expect(slide(map, 0.2, 3, 0.15, 3)).toEqual([0.2, 3]); // into the wall: blocked
    const [x] = walk([0.2, 3], [-3, 3]);
    expect(x).toBeGreaterThanOrEqual(0.2); // holding "west" never leaves the building
    const [bx] = walk([0.2, 3], [3, 3]);
    expect(bx).toBeCloseTo(3, 5); // and walking back in works
  });
});

describe("findPath (click-to-walk)", () => {
  const legsClear = (path: [number, number][], m = map) =>
    path.slice(1).every((b, i) => {
      const a = path[i];
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05);
      return Array.from({ length: n }, (_, s) => (s + 1) / n).every((t) =>
        canStand(m, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t),
      );
    });

  it("walks straight across a room", () => {
    const path = findPath(map, [3, 5], [1.5, 1.5])!;
    expect(path).toEqual([
      [3, 5],
      [1.5, 1.5],
    ]);
  });

  it("goes through the doorway to reach the next room", () => {
    // Straight east at z = 5 would hit the wall beside the doorway (z 2.4..3.6).
    const path = findPath(map, [3, 5], [9, 5])!;
    expect(path[0]).toEqual([3, 5]);
    expect(path.at(-1)).toEqual([9, 5]);
    expect(path.length).toBeGreaterThan(2); // it has to turn at the door
    expect(legsClear(path)).toBe(true); // never through a wall
  });

  it("walks around furniture in the way", () => {
    const bench = {
      objectId: "bench", roomId: "room-entrance", base: [3, 0, 3], rotationY: 0, height: 0.5,
      plinth: { shape: "none", height: 0, size: 1 }, render: { kind: "library", libraryId: "bench" },
    } as unknown as SceneObject;
    const m = walkMap({ ...scene, objects: [bench] });
    const path = findPath(m, [3, 5], [3, 1])!;
    expect(path.length).toBeGreaterThan(2);
    expect(legsClear(path, m)).toBe(true);
  });

  it("refuses spots you can't stand on or can't reach", () => {
    expect(findPath(map, [3, 5], [0.1, 3])).toBeNull(); // inside a wall
    expect(findPath(map, [3, 5], [20, 20])).toBeNull(); // off the plan
    // A room with no doorway: standable, but not reachable from the Entrance.
    const island = walkMap({ ...scene, doorways: scene.doorways.filter((d) => !d.roomIds.includes("room-south")) });
    expect(canStand(island, 2, 9)).toBe(true);
    expect(canReach(island, [3, 5], [2, 9])).toBe(false);
    expect(findPath(island, [3, 5], [2, 9])).toBeNull();
  });
});

describe("wallBetween (what the eye can see of the floor)", () => {
  const eye = (x: number, z: number): [number, number, number] => [x, 1.6, z];

  it("sees the floor of its own room", () => {
    expect(wallBetween(scene.walls, eye(3, 5), [1.5, 1.5])).toBe(false);
  });

  it("sees the next room's floor through the doorway", () => {
    // From (3, 3) straight east: crosses x = 6 at z = 3, inside the opening (z 2.4..3.6).
    expect(wallBetween(scene.walls, eye(3, 3), [9, 3])).toBe(false);
  });

  it("doesn't see a floor spot behind the wall beside the doorway", () => {
    // From (3, 5) to (9, 3): crosses x = 6 at z = 4, beside the opening.
    expect(wallBetween(scene.walls, eye(3, 5), [9, 3])).toBe(true);
  });

  it("is shared: the camera and the cursor get one walk map per scene", () => {
    expect(walkMap(scene)).toBe(walkMap(scene));
  });
});
