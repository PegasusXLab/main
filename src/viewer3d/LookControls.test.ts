import { describe, expect, it } from "vitest";
import {
  clampPitch,
  DRAG_THRESHOLD_PX,
  isDragMovement,
  LOOK_MAX_PITCH,
  LOOK_MIN_PITCH,
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
});
