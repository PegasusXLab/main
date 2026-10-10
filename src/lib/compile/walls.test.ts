import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newRoom } from "@/lib/schema/defaults";
import type { Gallery, Room } from "@/lib/schema/types";
import { doorways } from "./doorways";
import { findSharedEdges } from "./edges";
import { WALL_THICKNESS, walls } from "./walls";

const room = (
  id: string,
  x: number,
  y: number,
  w: number,
  d: number,
  wallHeight = 3,
): Room => ({
  ...newRoom({ x, y, w, d }),
  id,
  wallHeight,
});

const cutsFor = (rooms: Room[]) => doorways(findSharedEdges(rooms), rooms);

/** Compact view of pieces: side, start, end, bottom, top. */
const summary = (rooms: Room[], id: string) =>
  walls(
    rooms.find((r) => r.id === id)!,
    cutsFor(rooms),
  ).map((p) => [p.side, p.start, p.end, p.bottom, p.top]);

describe("walls", () => {
  it("a room with no doorways: one full piece per side", () => {
    const A = room("A", 0, 0, 6, 4);
    const pieces = walls(A, []);
    expect(
      pieces.map((p) => [p.side, p.start, p.end, p.bottom, p.top]),
    ).toEqual([
      ["n", [0, 0], [6, 0], 0, 3],
      ["e", [6, 0], [6, 4], 0, 3],
      ["s", [0, 4], [6, 4], 0, 3],
      ["w", [0, 0], [0, 4], 0, 3],
    ]);
    for (const p of pieces) {
      expect(p).toMatchObject({
        roomId: "A",
        thickness: WALL_THICKNESS,
        color: A.wallColor,
      });
    }
    expect(WALL_THICKNESS).toBe(0.075);
  });

  it("one doorway: the side splits around it, with a piece above the door", () => {
    const rooms = [room("A", 0, 0, 6, 6), room("B", 6, 0, 6, 6)];
    const east = summary(rooms, "A").filter(([side]) => side === "e");
    expect(east).toEqual([
      ["e", [6, 0], [6, 2.4], 0, 3],
      ["e", [6, 2.4], [6, 3.6], 2.2, 3],
      ["e", [6, 3.6], [6, 6], 0, 3],
    ]);
    // the other room cuts the same opening on its own side
    const west = summary(rooms, "B").filter(([side]) => side === "w");
    expect(west).toEqual([
      ["w", [6, 0], [6, 2.4], 0, 3],
      ["w", [6, 2.4], [6, 3.6], 2.2, 3],
      ["w", [6, 3.6], [6, 6], 0, 3],
    ]);
  });

  it("a doorway at the very end of a side leaves no zero-length piece", () => {
    const rooms = [room("A", 0, 0, 6, 6), room("B", 6, 5, 4, 4)]; // overlap y 5..6 → door 5..6
    expect(summary(rooms, "A").filter(([side]) => side === "e")).toEqual([
      ["e", [6, 0], [6, 5], 0, 3],
      ["e", [6, 5], [6, 6], 2.2, 3],
    ]);
    expect(summary(rooms, "B").filter(([side]) => side === "w")).toEqual([
      ["w", [6, 5], [6, 6], 2.2, 3],
      ["w", [6, 6], [6, 9], 0, 3],
    ]);
  });

  it("each room's over-door piece reaches its own wall height (G6)", () => {
    const rooms = [room("A", 0, 0, 6, 6, 3), room("B", 6, 0, 6, 6, 4.5)];
    expect(
      summary(rooms, "A").find(([, , , bottom]) => bottom === 2.2),
    ).toEqual(["e", [6, 2.4], [6, 3.6], 2.2, 3]);
    expect(
      summary(rooms, "B").find(([, , , bottom]) => bottom === 2.2),
    ).toEqual(["w", [6, 2.4], [6, 3.6], 2.2, 4.5]);
  });

  it("no over-door piece when the wall is no taller than the doorway", () => {
    const rooms = [room("A", 0, 0, 6, 6, 2.2), room("B", 6, 0, 6, 6)];
    expect(summary(rooms, "A").filter(([side]) => side === "e")).toEqual([
      ["e", [6, 0], [6, 2.4], 0, 2.2],
      ["e", [6, 3.6], [6, 6], 0, 2.2],
    ]);
  });

  it("the sample fixture: 20 pieces, 2 over-door pieces per doorway", () => {
    const { rooms } = sample as Gallery;
    const cuts = cutsFor(rooms);
    const all = rooms.flatMap((r) => walls(r, cuts));
    expect(all).toHaveLength(20); // entrance 8, east hall 6, south room 6
    const overDoor = all.filter((p) => p.bottom === 2.2);
    expect(overDoor.map((p) => [p.roomId, p.side, p.top])).toEqual([
      ["room-entrance", "e", 3],
      ["room-entrance", "s", 3],
      ["room-east", "w", 3.5],
      ["room-south", "n", 3],
    ]);
  });
});
