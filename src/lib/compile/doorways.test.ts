import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newRoom } from "@/lib/schema/defaults";
import type { Gallery, Room, Wall } from "@/lib/schema/types";
import { DOOR_HEIGHT, doorways } from "./doorways";
import { findSharedEdges } from "./edges";

const room = (
  id: string,
  x: number,
  y: number,
  w: number,
  d: number,
  closedWalls?: Wall[],
): Room => ({
  ...newRoom({ x, y, w, d }),
  id,
  ...(closedWalls ? { closedWalls } : {}),
});

const cut = (rooms: Room[]) => doorways(findSharedEdges(rooms), rooms);

describe("doorways", () => {
  it("no neighbors, no doorways", () => {
    expect(cut([room("A", 0, 0, 6, 6)])).toEqual([]);
  });

  it("full shared wall: one 1.2 m doorway centered on it, 2.2 m high", () => {
    expect(cut([room("A", 0, 0, 6, 6), room("B", 6, 0, 6, 6)])).toEqual([
      {
        a: "A",
        b: "B",
        sideA: "e",
        sideB: "w",
        line: 6,
        from: 2.4,
        to: 3.6,
        width: 1.2,
        height: DOOR_HEIGHT,
      },
    ]);
  });

  it("partial overlap: centered on the overlap, not the wall", () => {
    const [door] = cut([room("A", 0, 0, 6, 6), room("B", 3, 6, 6, 4)]);
    expect(door).toMatchObject({ sideA: "s", sideB: "n", line: 6, width: 1.2 });
    expect(door.from).toBeCloseTo(3.9);
    expect(door.to).toBeCloseTo(5.1);
  });

  it("overlap between 1.0 and 1.2 m: the doorway fills the overlap", () => {
    const [door] = cut([room("A", 0, 0, 6, 6), room("B", 6, 5, 4, 4)]);
    expect(door).toMatchObject({ from: 5, to: 6, width: 1 });
  });

  it("overlap below 1.0 m: no doorway (ADR-007)", () => {
    expect(cut([room("A", 0, 0, 6, 6), room("B", 6, 5.5, 4, 4)])).toEqual([]);
  });

  it("corner touch only: no doorway", () => {
    expect(cut([room("A", 0, 0, 6, 6), room("B", 6, 6, 4, 4)])).toEqual([]);
  });

  it("L-shape: the sample fixture gets two doorways", () => {
    const { rooms } = sample as Gallery;
    const doors = cut(rooms);
    expect(doors).toHaveLength(2);
    expect(doors[0]).toMatchObject({
      a: "room-entrance",
      b: "room-east",
      sideA: "e",
      from: 2.4,
      to: 3.6,
    });
    expect(doors[1]).toMatchObject({
      a: "room-entrance",
      b: "room-south",
      sideA: "s",
      width: 1.2,
    });
    expect(doors[1].from).toBeCloseTo(1.4);
    expect(doors[1].to).toBeCloseTo(2.6);
  });

  it("skipped when either room closes that side (G7)", () => {
    expect(cut([room("A", 0, 0, 6, 6, ["e"]), room("B", 6, 0, 6, 6)])).toEqual(
      [],
    );
    expect(cut([room("A", 0, 0, 6, 6), room("B", 6, 0, 6, 6, ["w"])])).toEqual(
      [],
    );
  });

  it("closing a different side keeps the doorway", () => {
    expect(
      cut([room("A", 0, 0, 6, 6, ["n", "s"]), room("B", 6, 0, 6, 6, ["e"])]),
    ).toHaveLength(1);
  });
});
