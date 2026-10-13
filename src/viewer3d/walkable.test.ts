import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { SceneObject } from "@/lib/compile/types";
import type { Gallery } from "@/lib/schema/types";
import { BODY_RADIUS, canStand, onFloor, slide, walkMap } from "./walkable";

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

  it("lets a camera that's off the plan move freely (no trap)", () => {
    expect(onFloor(map, -5, -5)).toBe(false);
    expect(slide(map, -5, -5, -4, -4)).toEqual([-4, -4]);
  });
});
