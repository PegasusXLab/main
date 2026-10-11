// Tour routes (viewer travel): which doorways a visitor walks through to reach a room, and where
// they stand when they arrive. Pure data over the SceneModel; CameraRig turns it into a smooth
// walk so the camera goes *through* each threshold instead of sliding across walls.

import type { SceneDoorway, SceneModel, Vec3 } from "@/lib/compile/types";
import type { Wall } from "@/lib/schema/types";

/** Eye height while walking (matches compile's EYE_HEIGHT). */
export const WALK_EYE_HEIGHT = 1.6;
/** How far before / after a doorway the walk lines up, so it crosses the threshold square-on. */
export const DOORWAY_APPROACH = 0.9;
/** How far into the new room the visitor stops after the last doorway. */
export const ARRIVAL_DEPTH = 1.6;
/** Never stop closer than this to the far wall. */
export const ARRIVAL_WALL_MARGIN = 1.0;

const SIDE_DIR: Record<Wall, [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
};

/** Stable key for a doorway (its two rooms). */
export function doorwayKey(d: Pick<SceneDoorway, "roomIds">): string {
  return d.roomIds.join("|");
}

/** The room whose floor contains (x, z), if any. */
export function roomAt(
  floors: SceneModel["floors"],
  x: number,
  z: number,
): string | undefined {
  for (const f of floors) {
    const [cx, , cz] = f.center;
    const [w, d] = f.size;
    if (Math.abs(x - cx) <= w / 2 && Math.abs(z - cz) <= d / 2) return f.roomId;
  }
  return undefined;
}

/** The room on the other side of a doorway from `fromRoomId`. */
export function otherRoom(d: SceneDoorway, fromRoomId: string): string {
  return d.roomIds[0] === fromRoomId ? d.roomIds[1] : d.roomIds[0];
}

/** Unit (x, z) direction for walking through `d` out of `fromRoomId`. */
export function doorwayDirection(d: SceneDoorway, fromRoomId: string): [number, number] {
  const [dx, dz] = SIDE_DIR[d.side];
  // `|| 0` turns -0 into 0, so callers can compare directions exactly.
  return d.roomIds[0] === fromRoomId ? [dx, dz] : [-dx || 0, -dz || 0];
}

/**
 * Doorways to walk through from one room to another, shortest first (breadth-first). `[]` when
 * already there; `null` when the rooms aren't connected.
 */
export function doorwayRoute(
  doorways: readonly SceneDoorway[],
  fromRoomId: string,
  toRoomId: string,
): SceneDoorway[] | null {
  if (fromRoomId === toRoomId) return [];
  const prev = new Map<string, { room: string; door: SceneDoorway }>();
  const seen = new Set([fromRoomId]);
  const queue = [fromRoomId];
  while (queue.length) {
    const room = queue.shift()!;
    for (const d of doorways) {
      if (!d.roomIds.includes(room)) continue;
      const next = otherRoom(d, room);
      if (seen.has(next)) continue;
      seen.add(next);
      prev.set(next, { room, door: d });
      if (next === toRoomId) {
        const route: SceneDoorway[] = [];
        let at = toRoomId;
        while (at !== fromRoomId) {
          const step = prev.get(at)!;
          route.unshift(step.door);
          at = step.room;
        }
        return route;
      }
      queue.push(next);
    }
  }
  return null;
}

/**
 * Points to walk through, in order, for a route: a little before and a little after each doorway,
 * at eye height, so the path crosses every threshold straight on.
 */
export function routeWaypoints(route: readonly SceneDoorway[], fromRoomId: string): Vec3[] {
  const points: Vec3[] = [];
  let room = fromRoomId;
  for (const d of route) {
    const [dx, dz] = doorwayDirection(d, room);
    const [cx, , cz] = d.center;
    points.push([cx - dx * DOORWAY_APPROACH, WALK_EYE_HEIGHT, cz - dz * DOORWAY_APPROACH]);
    points.push([cx + dx * DOORWAY_APPROACH, WALK_EYE_HEIGHT, cz + dz * DOORWAY_APPROACH]);
    room = otherRoom(d, room);
  }
  return points;
}

/**
 * Where a visitor stands after walking in through `d` (from `fromRoomId`): a step past the
 * threshold, facing straight on into the room, never too close to the far wall.
 */
export function arrivalPose(
  d: SceneDoorway,
  fromRoomId: string,
  floors: SceneModel["floors"],
): { position: Vec3; target: Vec3 } {
  const [dx, dz] = doorwayDirection(d, fromRoomId);
  const into = otherRoom(d, fromRoomId);
  const floor = floors.find((f) => f.roomId === into);
  // Room depth along the walking direction.
  const depth = floor ? (dx !== 0 ? floor.size[0] : floor.size[1]) : ARRIVAL_DEPTH * 2;
  const step = Math.max(
    DOORWAY_APPROACH,
    Math.min(ARRIVAL_DEPTH, depth - ARRIVAL_WALL_MARGIN),
  );
  const [cx, , cz] = d.center;
  const px = cx + dx * step;
  const pz = cz + dz * step;
  return {
    position: [px, WALK_EYE_HEIGHT, pz],
    target: [px + dx * 3, WALK_EYE_HEIGHT, pz + dz * 3],
  };
}

/** Yaw (radians) for looking along (dx, dz); 0 looks toward -z (three.js camera default). */
export function yawOf(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz);
}

/** Pitch (radians, up positive) for looking from `from` to `to`. */
export function pitchOf(from: Vec3, to: Vec3): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  return Math.atan2(dy, Math.hypot(dx, dz));
}

/** Unit look direction for a yaw / pitch pair (inverse of yawOf + pitchOf). */
export function directionOf(yaw: number, pitch: number): Vec3 {
  const c = Math.cos(pitch);
  return [-Math.sin(yaw) * c, Math.sin(pitch), -Math.cos(yaw) * c];
}

/** Shortest signed angle from `a` to `b`, in (-PI, PI]. */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Interpolate angles along the shortest arc. */
export function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDelta(a, b) * t;
}

/** Hermite smoothstep of x over [e0, e1]. */
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Walking pace (m/s) and the bounds on how long a walk takes. */
export const WALK_SPEED = 2.4;
export const MIN_WALK_SECONDS = 1.1;
export const MAX_WALK_SECONDS = 4.2;

/** Seconds a walk of `length` meters takes. */
export function walkDuration(length: number): number {
  return Math.min(MAX_WALK_SECONDS, Math.max(MIN_WALK_SECONDS, length / WALK_SPEED));
}
