import { describe, expect, it } from "vitest";
import {
  clampPitch,
  DRAG_THRESHOLD_PX,
  isDragMovement,
  LOOK_MAX_PITCH,
  LOOK_MIN_PITCH,
  shortestAngleDist,
  wrapYaw,
} from "./LookControls";

describe("LookControls math and thresholds", () => {
  it("clamps pitch to +/- 60 degrees", () => {
    expect(LOOK_MIN_PITCH).toBeCloseTo((-60 * Math.PI) / 180, 5);
    expect(LOOK_MAX_PITCH).toBeCloseTo((60 * Math.PI) / 180, 5);

    expect(clampPitch(0)).toBe(0);
    expect(clampPitch(0.5)).toBe(0.5);
    expect(clampPitch(-0.5)).toBe(-0.5);

    // Clamps exceedings
    expect(clampPitch(2.0)).toBeCloseTo(LOOK_MAX_PITCH, 5);
    expect(clampPitch(-2.0)).toBeCloseTo(LOOK_MIN_PITCH, 5);
  });

  it("wraps yaw across 360 degrees within [-PI, PI]", () => {
    expect(wrapYaw(0)).toBe(0);
    expect(wrapYaw(Math.PI / 2)).toBeCloseTo(Math.PI / 2, 5);
    expect(wrapYaw(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2, 5);

    // > PI wraps to negative
    expect(wrapYaw(Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1, 5);
    // < -PI wraps to positive
    expect(wrapYaw(-Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1, 5);
    // Multiples of 2*PI wrap to 0
    expect(wrapYaw(2 * Math.PI)).toBeCloseTo(0, 5);
    expect(wrapYaw(4 * Math.PI)).toBeCloseTo(0, 5);
  });

  it("detects drag vs click with 5px threshold", () => {
    expect(DRAG_THRESHOLD_PX).toBe(5);

    // Within threshold (< 5px) -> not a drag
    expect(isDragMovement(0, 0)).toBe(false);
    expect(isDragMovement(3, 3)).toBe(false); // hypot(3, 3) = 4.24 <= 5
    expect(isDragMovement(5, 0)).toBe(false); // 5 is not > 5

    // Exceeds threshold (> 5px) -> counts as drag
    expect(isDragMovement(4, 4)).toBe(true); // hypot(4, 4) = 5.65 > 5
    expect(isDragMovement(6, 0)).toBe(true);
    expect(isDragMovement(0, -6)).toBe(true);
  });

  it("ensures a small delta yields a small offset after reset without jumping", () => {
    // Simulate previous look angle in room 1
    let yawOffset = wrapYaw(Math.PI / 2); // 90 degrees turned
    let pitchOffset = clampPitch(0.2);

    // Travel to next room -> reset to 0
    yawOffset = 0;
    pitchOffset = 0;

    // First small drag in new room (e.g., 6 px = ~0.018 rad)
    const smallDelta = 0.018;
    yawOffset = wrapYaw(yawOffset + smallDelta);
    pitchOffset = clampPitch(pitchOffset + smallDelta);

    expect(yawOffset).toBeCloseTo(0.018, 5);
    expect(pitchOffset).toBeCloseTo(0.018, 5);
    // Does not jump back to 90 degrees (~1.57 rad)
    expect(yawOffset).toBeLessThan(0.05);
  });

  it("calculates shortestAngleDist correctly across the +/- PI wrap boundary", () => {
    expect(shortestAngleDist(0, 0.5)).toBeCloseTo(0.5, 5);
    expect(shortestAngleDist(0.5, 0)).toBeCloseTo(-0.5, 5);

    // Crosses +PI to -PI boundary forward (e.g. 175 deg to -175 deg should be +10 deg, not -350 deg)
    const angleA = Math.PI - 0.1;
    const angleB = -Math.PI + 0.1;
    expect(shortestAngleDist(angleA, angleB)).toBeCloseTo(0.2, 5);
    expect(shortestAngleDist(angleB, angleA)).toBeCloseTo(-0.2, 5);

    // Full 360 wrap gives 0
    expect(shortestAngleDist(0, 2 * Math.PI)).toBeCloseTo(0, 5);
  });
});
