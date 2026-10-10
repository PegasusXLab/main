import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { roomOrder } from "./roomOrder";

const rooms = (...ids: string[]) =>
  ids.map((roomId) => ({
    roomId,
    center: [0, 0, 0] as [number, number, number],
    lighting: "gallery" as const,
    view: {
      position: [0, 0, 0] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
    },
  }));
const door = (a: string, b: string) => ({
  roomIds: [a, b] as [string, string],
  center: [0, 0, 0] as [number, number, number],
  width: 1.2,
  height: 2.2,
  side: "e" as const,
});

describe("roomOrder", () => {
  it("starts at the entrance", () => {
    expect(roomOrder({ rooms: rooms("A"), doorways: [] }, "A")).toEqual(["A"]);
  });

  it("is breadth-first through doorways", () => {
    // A — B — D, A — C
    const scene = {
      rooms: rooms("A", "B", "C", "D"),
      doorways: [door("A", "B"), door("B", "D"), door("A", "C")],
    };
    expect(roomOrder(scene, "A")).toEqual(["A", "B", "C", "D"]);
  });

  it("breaks ties by document order, whichever side of the doorway a room is on", () => {
    // entrance E connects to C, A, B (doorways listed in a different order)
    const scene = {
      rooms: rooms("A", "B", "C", "E"),
      doorways: [door("C", "E"), door("E", "B"), door("A", "E")],
    };
    expect(roomOrder(scene, "E")).toEqual(["E", "A", "B", "C"]);
  });

  it("appends unconnected rooms last, in document order", () => {
    const scene = {
      rooms: rooms("X", "A", "B", "Y"),
      doorways: [door("A", "B")],
    };
    expect(roomOrder(scene, "B")).toEqual(["B", "A", "X", "Y"]);
  });

  it("an entrance that isn't in the scene falls back to document order", () => {
    expect(
      roomOrder({ rooms: rooms("A", "B"), doorways: [door("A", "B")] }, "nope"),
    ).toEqual(["A", "B"]);
  });

  it("the sample fixture: entrance, then east hall, then south room", () => {
    const g = sample as Gallery;
    expect(roomOrder(compile(g).scene, g.entranceRoomId)).toEqual([
      "room-entrance",
      "room-east",
      "room-south",
    ]);
  });

  it("starting elsewhere still reaches every connected room", () => {
    const g = sample as Gallery;
    expect(roomOrder(compile(g).scene, "room-south")).toEqual([
      "room-south",
      "room-entrance",
      "room-east",
    ]);
  });
});
