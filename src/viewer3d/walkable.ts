// Where a visitor can stand (ADR-018). Pure geometry over the SceneModel, used by the free-moving
// camera every frame:
// - each room floor, shrunk by the wall thickness + a body radius;
// - doorway passages, so the only way between rooms is through an opening;
// - free-standing objects (plinths, sculptures, furniture) as circles to walk around.

import type { SceneModel } from "@/lib/compile/types";
import { WALL_THICKNESS } from "@/lib/compile/walls";

/** The visitor's "body": how close the eye can get to a wall or an object (meters). */
export const BODY_RADIUS = 0.3;

type Rect = { x0: number; x1: number; z0: number; z1: number };
type Circle = { x: number; z: number; r: number };

export interface WalkMap {
  /** Room floors you can stand on (already inset). */
  rooms: Rect[];
  /** Openings joining two rooms, wide enough to cross the gap between their inset floors. */
  passages: Rect[];
  /** Objects to walk around (radius already includes the body). */
  obstacles: Circle[];
}

const inRect = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;

export function walkMap(model: Pick<SceneModel, "floors" | "doorways" | "objects">): WalkMap {
  const inset = WALL_THICKNESS + BODY_RADIUS;
  const rooms: Rect[] = [];
  for (const f of model.floors) {
    const [cx, , cz] = f.center;
    const [w, d] = f.size;
    if (w <= 2 * inset || d <= 2 * inset) continue;
    rooms.push({ x0: cx - w / 2 + inset, x1: cx + w / 2 - inset, z0: cz - d / 2 + inset, z1: cz + d / 2 - inset });
  }

  const passages: Rect[] = [];
  for (const d of model.doorways) {
    const half = d.width / 2 - BODY_RADIUS;
    if (half <= 0.05) continue; // too narrow to walk through
    const [cx, , cz] = d.center;
    // Deep enough to reach both rooms' inset floors (a hair more, so the two always overlap).
    const depth = inset + 0.02;
    passages.push(
      d.side === "e" || d.side === "w"
        ? { x0: cx - depth, x1: cx + depth, z0: cz - half, z1: cz + half }
        : { x0: cx - half, x1: cx + half, z0: cz - depth, z1: cz + depth },
    );
  }

  const obstacles: Circle[] = model.objects.map((o) => ({
    x: o.base[0],
    z: o.base[2],
    r: o.plinth.size / 2 + BODY_RADIUS,
  }));

  return { rooms, passages, obstacles };
}

/** Inside a room or a doorway passage (walls only, ignoring objects). */
export function onFloor(map: WalkMap, x: number, z: number): boolean {
  return map.rooms.some((r) => inRect(r, x, z)) || map.passages.some((p) => inRect(p, x, z));
}

/** True when the visitor can stand at (x, z): on a floor or in a doorway, clear of every object. */
export function canStand(map: WalkMap, x: number, z: number): boolean {
  if (!onFloor(map, x, z)) return false;
  return map.obstacles.every((o) => (x - o.x) ** 2 + (z - o.z) ** 2 >= o.r * o.r);
}

/**
 * Move from (fx, fz) toward (tx, tz), sliding along whatever blocks the way: the full step if it's
 * clear, else just its x part, else just its z part, else stay. A start that's already blocked (a
 * camera placed inside an object's circle, or above the plan) may move anywhere that isn't worse,
 * so the visitor can always walk out.
 */
export function slide(map: WalkMap, fx: number, fz: number, tx: number, tz: number): [number, number] {
  const ok = canStand(map, fx, fz)
    ? (x: number, z: number) => canStand(map, x, z)
    : onFloor(map, fx, fz)
      ? (x: number, z: number) => onFloor(map, x, z) && clearance(map, x, z) >= clearance(map, fx, fz)
      : () => true;
  if (ok(tx, tz)) return [tx, tz];
  if (ok(tx, fz)) return [tx, fz];
  if (ok(fx, tz)) return [fx, tz];
  return [fx, fz];
}

/** How far (x, z) is outside the nearest object's circle (negative when inside one). */
function clearance(map: WalkMap, x: number, z: number): number {
  let best = Infinity;
  for (const o of map.obstacles) best = Math.min(best, Math.hypot(x - o.x, z - o.z) - o.r);
  return best;
}
