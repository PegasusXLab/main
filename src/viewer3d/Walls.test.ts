import { describe, expect, it } from "vitest";
import type { SceneWall } from "@/lib/compile/types";
import { BASEBOARD_DEPTH, BASEBOARD_HEIGHT, baseboardBox } from "./Walls";

const piece = (over: Partial<SceneWall>): SceneWall => ({
  roomId: "r",
  side: "n",
  start: [0, 0],
  end: [4, 0],
  bottom: 0,
  top: 3,
  thickness: 0.075,
  color: "#ffffff",
  ...over,
});

describe("baseboardBox (T-125)", () => {
  it("puts trim on the room side of a floor-level piece", () => {
    const n = baseboardBox(piece({}))!;
    expect(n.size).toEqual([4, BASEBOARD_HEIGHT, BASEBOARD_DEPTH]);
    expect(n.center[1]).toBeCloseTo(BASEBOARD_HEIGHT / 2);
    expect(n.center[2]).toBeCloseTo(0.075 + BASEBOARD_DEPTH / 2);
    const e = baseboardBox(piece({ side: "e", start: [5, 0], end: [5, 3] }))!;
    expect(e.center[0]).toBeCloseTo(5 - 0.075 - BASEBOARD_DEPTH / 2);
  });

  it("skips header pieces over doorways", () => {
    expect(baseboardBox(piece({ bottom: 2.2 }))).toBeNull();
  });
});
