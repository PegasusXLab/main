import { describe, expect, it } from "vitest";
import type { SceneDoorway, SceneModel } from "@/lib/compile/types";
import {
  angleDelta,
  arrivalPose,
  directionOf,
  doorwayDirection,
  doorwayRoute,
  pitchOf,
  roomAt,
  routeWaypoints,
  walkDuration,
  yawOf,
  DOORWAY_APPROACH,
  MAX_WALK_SECONDS,
  MIN_WALK_SECONDS,
  WALK_EYE_HEIGHT,
} from "./tourRoute";

// Plan:  A (0..6, 0..6) | B (6..12, 0..6)   and   C (0..4, 6..11) south of A.
const floors: SceneModel["floors"] = [
  { roomId: "A", center: [3, 0, 3], size: [6, 6], floor: "wood" },
  { roomId: "B", center: [9, 0, 3], size: [6, 6], floor: "wood" },
  { roomId: "C", center: [2, 0, 8.5], size: [4, 5], floor: "wood" },
];
const ab: SceneDoorway = { roomIds: ["A", "B"], center: [6, 1.1, 3], width: 1.2, height: 2.2, side: "e" };
const ac: SceneDoorway = { roomIds: ["A", "C"], center: [2, 1.1, 6], width: 1.2, height: 2.2, side: "s" };
const doorways = [ab, ac];

describe("tourRoute", () => {
  it("finds the room under a point", () => {
    expect(roomAt(floors, 1, 1)).toBe("A");
    expect(roomAt(floors, 10, 2)).toBe("B");
    expect(roomAt(floors, 2, 10)).toBe("C");
    expect(roomAt(floors, 20, 20)).toBeUndefined();
  });

  it("walks through doorways in the direction of travel, either way", () => {
    expect(doorwayDirection(ab, "A")).toEqual([1, 0]);
    expect(doorwayDirection(ab, "B")).toEqual([-1, 0]);
    expect(doorwayDirection(ac, "A")).toEqual([0, 1]);
    expect(doorwayDirection(ac, "C")).toEqual([0, -1]);
  });

  it("routes through every doorway on the way (B → C goes via A)", () => {
    expect(doorwayRoute(doorways, "A", "A")).toEqual([]);
    expect(doorwayRoute(doorways, "A", "B")).toEqual([ab]);
    expect(doorwayRoute(doorways, "B", "C")).toEqual([ab, ac]);
    expect(doorwayRoute([ab], "A", "C")).toBeNull();
  });

  it("lines the walk up square-on before and after each threshold", () => {
    const pts = routeWaypoints([ab, ac], "B");
    expect(pts).toEqual([
      [6 + DOORWAY_APPROACH, WALK_EYE_HEIGHT, 3],
      [6 - DOORWAY_APPROACH, WALK_EYE_HEIGHT, 3],
      [2, WALK_EYE_HEIGHT, 6 - DOORWAY_APPROACH],
      [2, WALK_EYE_HEIGHT, 6 + DOORWAY_APPROACH],
    ]);
  });

  it("arrives a step into the new room, facing straight in", () => {
    const pose = arrivalPose(ab, "A", floors);
    expect(pose.position).toEqual([7.6, WALK_EYE_HEIGHT, 3]);
    expect(pose.target[0]).toBeGreaterThan(pose.position[0]);
    expect(pose.target[2]).toBe(3);
    // Coming back the other way faces west.
    const back = arrivalPose(ab, "B", floors);
    expect(back.position[0]).toBeLessThan(6);
    expect(back.target[0]).toBeLessThan(back.position[0]);
  });

  it("converts between look directions and yaw / pitch without roll", () => {
    expect(yawOf(0, -1)).toBeCloseTo(0);
    expect(yawOf(1, 0)).toBeCloseTo(-Math.PI / 2);
    const [x, y, z] = directionOf(yawOf(1, 0), 0.3);
    expect(x).toBeGreaterThan(0.9);
    expect(y).toBeCloseTo(Math.sin(0.3));
    expect(z).toBeCloseTo(0);
    expect(pitchOf([0, 1.6, 0], [0, 1.6, -3])).toBeCloseTo(0);
  });

  it("takes the short way round when turning", () => {
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(-3, 3)).toBeCloseTo(6 - 2 * Math.PI);
  });

  it("paces walks by distance, within bounds", () => {
    expect(walkDuration(0.1)).toBe(MIN_WALK_SECONDS);
    expect(walkDuration(100)).toBe(MAX_WALK_SECONDS);
    expect(walkDuration(6)).toBeCloseTo(2.5);
  });
});
