import { describe, expect, it } from "vitest";
import { findOverlappingRoom, hasOverlap } from "./overlap";
import type { Room } from "@/lib/schema/types";

function makeRoom(id: string, x: number, y: number, w = 6, d = 6): Room {
  return {
    id,
    name: `Room ${id}`,
    description: "",
    x,
    y,
    w,
    d,
    wallHeight: 3,
    wallColor: "#f2efe9",
    floor: "wood",
    lighting: "gallery",
  };
}

describe("overlap", () => {
  const roomA = makeRoom("a", 0, 0, 6, 6);
  const roomB = makeRoom("b", 6, 0, 6, 6); // Touches East edge of A
  const roomC = makeRoom("c", 0, 6, 6, 6); // Touches South edge of A

  it("permits adjacent rooms sharing an edge (touching is allowed)", () => {
    expect(hasOverlap(roomA, [roomB], "a")).toBe(false);
    expect(hasOverlap(roomA, [roomC], "a")).toBe(false);
    expect(hasOverlap({ x: 6, y: 0, w: 6, d: 6 }, [roomA])).toBe(false);
  });

  it("permits diagonal rooms sharing only a corner point", () => {
    const cornerRoom = makeRoom("d", 6, 6, 6, 6); // Touches corner (6,6)
    expect(hasOverlap(cornerRoom, [roomA])).toBe(false);
  });

  it("detects strict positive-area overlap", () => {
    // Overlaps by 0.5m on x-axis
    const overlapping = { x: 5.5, y: 0, w: 6, d: 6 };
    expect(hasOverlap(overlapping, [roomA])).toBe(true);

    // Fully inside
    const inside = { x: 1, y: 1, w: 2, d: 2 };
    expect(hasOverlap(inside, [roomA])).toBe(true);
  });

  it("ignores the specified room id during move or resize checks", () => {
    expect(hasOverlap(roomA, [roomA, roomB], "a")).toBe(false);
    expect(hasOverlap(roomA, [roomA, roomB])).toBe(true);
  });

  it("finds the overlapping room reference", () => {
    const overlapping = { x: 5.5, y: 0, w: 6, d: 6 };
    const conflict = findOverlappingRoom(overlapping, [roomA, roomB]);
    expect(conflict?.id).toBe("a");

    const nonOverlapping = { x: 12, y: 0, w: 6, d: 6 };
    expect(findOverlappingRoom(nonOverlapping, [roomA, roomB])).toBeNull();
  });
});
