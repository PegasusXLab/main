// Walk motion (ADR-018): how a scripted walk moves and turns. Pure helpers, used by CameraRig's
// TravelCamera every frame and tested on their own.
//
// - Speed: ease in, cruise at a constant pace, ease out (a smoothstep-shaped trapezoid). The old
//   easeInOutCubic peaked at 3x the average speed; this peaks at ~1.2x.
// - Heading: look at a point a little ahead on the path (not the instantaneous tangent), and never
//   turn faster than MAX_TURN_RATE, so doorway bends read as a calm turn, not a whip-pan.

import { angleDelta, WALK_RAMP_IN, WALK_RAMP_OUT } from "./tourRoute";

/** Heading follows its target with this exponential rate (1/s)... */
export const TURN_DAMPING = 7;
/** ...but never faster than this (rad/s, ~120 deg/s). */
export const MAX_TURN_RATE = 2.1;
/** How far ahead on the path the walker looks (meters). */
export const LOOK_AHEAD = 1.2;

/** Integral of smoothstep over [0, u] (u in 0..1): distance covered while ramping. */
function rampDistance(u: number): number {
  return u * u * u - (u * u * u * u) / 2;
}

/**
 * Distance fraction (0..1) covered after `t` seconds of a walk lasting `duration` seconds. Speed
 * ramps up over `rampIn`, holds, and ramps down over `rampOut`; on short walks the ramps shrink to
 * fit. Starts and ends at zero speed, so a walk never snaps into or out of motion.
 */
export function cruiseProgress(
  t: number,
  duration: number,
  rampIn = WALK_RAMP_IN,
  rampOut = WALK_RAMP_OUT,
): number {
  if (!(duration > 0) || t >= duration) return 1;
  if (t <= 0) return 0;
  const fit = Math.min(1, duration / (rampIn + rampOut));
  const a = rampIn * fit;
  const d = rampOut * fit;
  const v = 1 / (duration - (a + d) / 2); // cruise speed, in distance fractions per second
  if (a > 0 && t < a) return v * a * rampDistance(t / a);
  if (d > 0 && t > duration - d) return 1 - v * d * rampDistance((duration - t) / d);
  return v * (a / 2 + (t - a));
}

/**
 * Turn `current` toward `target` (radians, shortest way) for one frame of `dt` seconds: an
 * exponential approach, capped at `maxRate` rad/s.
 */
export function approachAngle(
  current: number,
  target: number,
  dt: number,
  rate = TURN_DAMPING,
  maxRate = MAX_TURN_RATE,
): number {
  const d = angleDelta(current, target);
  const step = d * (1 - Math.exp(-rate * dt));
  const cap = maxRate * dt;
  return current + Math.max(-cap, Math.min(cap, step));
}
