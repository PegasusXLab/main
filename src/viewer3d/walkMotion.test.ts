import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { approachAngle, cruiseProgress, LOOK_AHEAD, MAX_TURN_RATE } from "./walkMotion";
import { angleDelta, lerpAngle, smoothstep, walkDuration, yawOf } from "./tourRoute";

describe("cruiseProgress", () => {
  it("starts at 0, ends at 1 and never goes backwards", () => {
    const d = 3;
    let prev = 0;
    for (let t = 0; t <= d; t += 1 / 120) {
      const p = cruiseProgress(t, d);
      expect(p).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = p;
    }
    expect(cruiseProgress(0, d)).toBe(0);
    expect(cruiseProgress(d, d)).toBe(1);
    expect(cruiseProgress(d + 1, d)).toBe(1);
  });

  it("is continuous at the ramp joins and starts/ends at rest", () => {
    const d = 3;
    for (const t of [0.45, d - 0.6]) {
      expect(cruiseProgress(t + 1e-6, d) - cruiseProgress(t - 1e-6, d)).toBeLessThan(1e-5);
    }
    const h = 1e-4;
    expect(cruiseProgress(h, d) / h).toBeLessThan(0.01); // ~zero speed at the start
    expect((1 - cruiseProgress(d - h, d)) / h).toBeLessThan(0.01); // ...and at the end
  });

  it("fits its ramps into short walks (all ramp, no cruise) and stays monotonic", () => {
    const d = 1; // shorter than the two ramps together
    let prev = 0;
    let peak = 0;
    const h = 1 / 240;
    for (let t = h; t <= d; t += h) {
      const p = cruiseProgress(t, d);
      expect(p).toBeGreaterThanOrEqual(prev);
      peak = Math.max(peak, (p - prev) / h);
      prev = p;
    }
    expect(cruiseProgress(d, d)).toBe(1);
    expect(peak).toBeLessThanOrEqual(2.01); // the ramps alone peak at 2x the average speed
  });
});

describe("approachAngle", () => {
  it("never turns faster than the cap and takes the short way round", () => {
    const dt = 1 / 60;
    const next = approachAngle(0, Math.PI * 0.9, dt);
    expect(next).toBeCloseTo(MAX_TURN_RATE * dt, 6);
    expect(approachAngle(3, -3, dt)).toBeGreaterThan(3); // across +-PI, not the long way
  });

  it("settles on the target", () => {
    let a = 0;
    for (let i = 0; i < 240; i++) a = approachAngle(a, 1, 1 / 60);
    expect(a).toBeCloseTo(1, 4);
  });
});

/**
 * Replays a one-doorway walk the way CameraRig's TravelCamera does (same curve type, waypoints,
 * duration, progress, look-ahead and heading blend), returning peak speed, average speed and peak
 * turn rate.
 */
function replay(start: [number, number], startYaw: number, door: [number, number], dir: [number, number]) {
  const [dx, dz] = dir;
  const [cx, cz] = door;
  const pts = [start, [cx - dx * 0.9, cz - dz * 0.9], [cx + dx * 0.9, cz + dz * 0.9], [cx + dx * 1.6, cz + dz * 1.6]].map(
    ([x, z]) => new THREE.Vector3(x, 1.6, z),
  );
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const length = curve.getLength();
  const duration = walkDuration(length);
  const endYaw = yawOf(dx, dz);
  const fps = 60;
  const dt = 1 / fps;
  const pos = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  let yaw = startYaw;
  let walkYaw = startYaw;
  let peakSpeed = 0;
  let peakTurn = 0;
  curve.getPointAt(0, prev);
  // Run past the end so the heading can finish settling, as the rig does.
  for (let t = dt; t < duration + 2; t += dt) {
    const a = cruiseProgress(t, duration);
    curve.getPointAt(a, pos);
    curve.getPointAt(Math.min(1, a + LOOK_AHEAD / length), ahead);
    const lx = ahead.x - pos.x;
    const lz = ahead.z - pos.z;
    if (lx * lx + lz * lz > 1e-4) walkYaw = yawOf(lx, lz);
    const wanted = lerpAngle(lerpAngle(startYaw, walkYaw, smoothstep(0, 0.22, a)), endYaw, smoothstep(0.72, 1, a));
    const next = approachAngle(yaw, wanted, dt);
    peakTurn = Math.max(peakTurn, Math.abs(angleDelta(yaw, next)) / dt);
    peakSpeed = Math.max(peakSpeed, pos.distanceTo(prev) / dt);
    yaw = next;
    prev.copy(pos);
  }
  return { peakSpeed, avgSpeed: length / duration, peakTurnDeg: (peakTurn * 180) / Math.PI, end: pos, endYaw, yaw };
}

describe("walk feel on the reference routes (ADR-018)", () => {
  const routes: [string, [number, number], number, [number, number], [number, number]][] = [
    ["doorway to the side", [3.5, 3.5], yawOf(0, -1), [7, 2.5], [1, 0]],
    ["doorway behind you", [3.0, 3.0], yawOf(-1, 0), [7, 4.5], [1, 0]],
    ["doorway straight ahead", [3.5, 7.5], yawOf(0, -1), [3.5, 0], [0, -1]],
  ];
  for (const [name, start, startYaw, door, dir] of routes) {
    it(`${name}: steady pace, calm turns, arrives facing in`, () => {
      const r = replay(start, startYaw, door, dir);
      expect(r.peakSpeed / r.avgSpeed).toBeLessThanOrEqual(1.35); // was 3.0x with easeInOutCubic
      expect(r.peakTurnDeg).toBeLessThanOrEqual(130); // was up to 490 deg/s
      expect(r.end.x).toBeCloseTo(door[0] + dir[0] * 1.6, 5);
      expect(r.end.z).toBeCloseTo(door[1] + dir[1] * 1.6, 5);
      expect(Math.abs(angleDelta(r.yaw, r.endYaw))).toBeLessThan(2e-3);
    });
  }
});
