import { describe, expect, it } from "vitest";
import { dustPositions, hashRoomId, seededRandom } from "./Dust";

describe("dust helpers (look L2)", () => {
  it("is deterministic per seed", () => {
    const a = dustPositions(42, 50, 6, 3, 5);
    const b = dustPositions(42, 50, 6, 3, 5);
    expect(a).toEqual(b);
    expect(a).toHaveLength(150);
  });

  it("stays inside the room box", () => {
    const pts = dustPositions(7, 200, 6, 3, 5);
    for (let i = 0; i < 200; i++) {
      const x = pts[i * 3];
      const y = pts[i * 3 + 1];
      const z = pts[i * 3 + 2];
      expect(Math.abs(x)).toBeLessThanOrEqual(3);
      expect(y).toBeGreaterThanOrEqual(0.15);
      expect(y).toBeLessThanOrEqual(3);
      expect(Math.abs(z)).toBeLessThanOrEqual(2.5);
    }
  });

  it("hashes room ids to stable seeds", () => {
    expect(hashRoomId("room-1")).toBe(hashRoomId("room-1"));
    expect(hashRoomId("room-1")).not.toBe(hashRoomId("room-2"));
    const r = seededRandom(1);
    expect(r()).toBeGreaterThanOrEqual(0);
    expect(r()).toBeLessThan(1);
  });
});
