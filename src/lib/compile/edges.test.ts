import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newRoom } from "@/lib/schema/defaults";
import type { Gallery, Room } from "@/lib/schema/types";
import { findSharedEdges } from "./edges";

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

describe("findSharedEdges", () => {
  it("a single room has no shared edges", () => {
    expect(findSharedEdges([room("A", 0, 0, 6, 6)])).toEqual([]);
  });

  it("rooms apart have no shared edges", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", 7, 0, 6, 6)]),
    ).toEqual([]);
  });

  it("full shared wall, B east of A", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", 6, 0, 6, 6)]),
    ).toEqual([
      { a: "A", b: "B", sideA: "e", sideB: "w", line: 6, from: 0, to: 6 },
    ]);
  });

  it("full shared wall, B west of A", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", -4, 0, 4, 6)]),
    ).toEqual([
      { a: "A", b: "B", sideA: "w", sideB: "e", line: 0, from: 0, to: 6 },
    ]);
  });

  it("partial overlap, B south of A", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", 3, 6, 6, 4)]),
    ).toEqual([
      { a: "A", b: "B", sideA: "s", sideB: "n", line: 6, from: 3, to: 6 },
    ]);
  });

  it("partial overlap, B north of A", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", -2, -3, 4, 3)]),
    ).toEqual([
      { a: "A", b: "B", sideA: "n", sideB: "s", line: 0, from: 0, to: 2 },
    ]);
  });

  it("an overlap below the doorway minimum is still a shared edge", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", 6, 5.5, 4, 4)]),
    ).toEqual([
      { a: "A", b: "B", sideA: "e", sideB: "w", line: 6, from: 5.5, to: 6 },
    ]);
  });

  it("rooms touching only at a corner share nothing", () => {
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", 6, 6, 4, 4)]),
    ).toEqual([]);
    expect(
      findSharedEdges([room("A", 0, 0, 6, 6), room("B", -4, -4, 4, 4)]),
    ).toEqual([]);
  });

  it("handles float noise on the shared line", () => {
    const edges = findSharedEdges([
      room("A", 0, 0, 6, 6),
      { ...room("B", 6, 0, 6, 6), x: 0.1 + 0.2 + 5.7 },
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ sideA: "e", sideB: "w", from: 0, to: 6 });
  });

  it("L-shape: the sample fixture has two shared edges", () => {
    const { rooms } = sample as Gallery;
    expect(findSharedEdges(rooms)).toEqual([
      {
        a: "room-entrance",
        b: "room-east",
        sideA: "e",
        sideB: "w",
        line: 6,
        from: 0,
        to: 6,
      },
      {
        a: "room-entrance",
        b: "room-south",
        sideA: "s",
        sideB: "n",
        line: 6,
        from: 0,
        to: 4,
      },
    ]);
  });

  it("a room between two others shares an edge with each", () => {
    const edges = findSharedEdges([
      room("A", 0, 0, 4, 4),
      room("B", 4, 0, 4, 4),
      room("C", 8, 0, 4, 4),
    ]);
    expect(edges.map((e) => `${e.a}${e.sideA}-${e.b}${e.sideB}`)).toEqual([
      "Ae-Bw",
      "Be-Cw",
    ]);
  });
});
