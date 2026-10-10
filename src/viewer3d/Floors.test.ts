import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { THEME } from "@/lib/theme";
import { SELECTION_COLOR, selectionOutline } from "./Floors";
import { SELECTED_FRAME_COLOR } from "./Frames";

describe("3D selection highlight (T-071)", () => {
  const { scene } = compile(sample as Gallery);
  const east = scene.floors.find((f) => f.roomId === "room-east")!; // x 6..12, z 0..6, walls 3.5 m

  it("uses the canonical design system Klein blue selection accent (ADR-013)", () => {
    expect(SELECTION_COLOR).toBe(THEME.colors.accent);
    expect(SELECTED_FRAME_COLOR).toBe(THEME.colors.accent);
    expect(SELECTION_COLOR).toBe("#002fa7");
  });

  it("outlines the selected room at floor level and at its wall tops", () => {
    const [floorLoop, topLoop] = selectionOutline(east, 3.5);
    expect(floorLoop).toHaveLength(5);
    expect(floorLoop[0]).toEqual(floorLoop[4]); // closed
    const xs = floorLoop.map((p) => p[0]);
    const zs = floorLoop.map((p) => p[2]);
    expect([Math.min(...xs), Math.max(...xs)]).toEqual([6, 12]);
    expect([Math.min(...zs), Math.max(...zs)]).toEqual([0, 6]);
    expect(floorLoop.every((p) => p[1] > 0 && p[1] < 0.1)).toBe(true);
    expect(topLoop.every((p) => p[1] > 3.5 && p[1] < 3.6)).toBe(true);
    expect(topLoop.map((p) => [p[0], p[2]])).toEqual(
      floorLoop.map((p) => [p[0], p[2]]),
    );
  });

  it("the wall-top height comes from the room's own walls (Scene uses max wall top)", () => {
    const tops = scene.walls
      .filter((w) => w.roomId === "room-east")
      .map((w) => w.top);
    expect(Math.max(...tops)).toBe(3.5);
  });
});
