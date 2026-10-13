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
 * camera placed inside an object's circle, or in the margin along a wall) may only move in ways
 * that don't make it worse, so the visitor can always walk out but never through a wall.
 */
export function slide(map: WalkMap, fx: number, fz: number, tx: number, tz: number): [number, number] {
  const ok = canStand(map, fx, fz)
    ? (x: number, z: number) => canStand(map, x, z)
    : onFloor(map, fx, fz)
      ? (x: number, z: number) => onFloor(map, x, z) && clearance(map, x, z) >= clearance(map, fx, fz)
      : (x: number, z: number) => offFloor(map, x, z) <= offFloor(map, fx, fz);
  if (ok(tx, tz)) return [tx, tz];
  if (ok(tx, fz)) return [tx, fz];
  if (ok(fx, tz)) return [fx, tz];
  return [fx, fz];
}

/** How far (x, z) is from the nearest room floor or doorway passage (0 when on one). */
function offFloor(map: WalkMap, x: number, z: number): number {
  let best = Infinity;
  for (const r of [...map.rooms, ...map.passages]) {
    const dx = Math.max(r.x0 - x, 0, x - r.x1);
    const dz = Math.max(r.z0 - z, 0, z - r.z1);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/** How far (x, z) is outside the nearest object's circle (negative when inside one). */
function clearance(map: WalkMap, x: number, z: number): number {
  let best = Infinity;
  for (const o of map.obstacles) best = Math.min(best, Math.hypot(x - o.x, z - o.z) - o.r);
  return best;
}

// ---------- click-to-walk paths (ADR-018 PR C) ----------

/** Grid size for click-to-walk paths (meters). */
export const PATH_CELL = 0.2;

interface NavGrid {
  x0: number;
  z0: number;
  nx: number;
  nz: number;
  /** 1 where you can stand at the cell center. */
  ok: Uint8Array;
  /** Connected region id per cell (0 = blocked), so reachability is a lookup. */
  region: Int32Array;
}

const grids = new WeakMap<WalkMap, NavGrid | null>();

/** The walk map rasterized to PATH_CELL cells, built once per map. */
function navGrid(map: WalkMap): NavGrid | null {
  if (grids.has(map)) return grids.get(map)!;
  const all = [...map.rooms, ...map.passages];
  if (!all.length) {
    grids.set(map, null);
    return null;
  }
  const x0 = Math.min(...all.map((r) => r.x0));
  const z0 = Math.min(...all.map((r) => r.z0));
  const nx = Math.ceil((Math.max(...all.map((r) => r.x1)) - x0) / PATH_CELL) + 1;
  const nz = Math.ceil((Math.max(...all.map((r) => r.z1)) - z0) / PATH_CELL) + 1;
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) ok[j * nx + i] = canStand(map, x0 + i * PATH_CELL, z0 + j * PATH_CELL) ? 1 : 0;

  // Flood-fill regions (4-connected, matching the moves A* allows without cutting corners).
  const region = new Int32Array(nx * nz);
  let next = 0;
  const stack: number[] = [];
  for (let start = 0; start < ok.length; start++) {
    if (!ok[start] || region[start]) continue;
    region[start] = ++next;
    stack.push(start);
    while (stack.length) {
      const c = stack.pop()!;
      const i = c % nx;
      const j = (c - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const n = nj * nx + ni;
        if (ok[n] && !region[n]) {
          region[n] = next;
          stack.push(n);
        }
      }
    }
  }
  const grid = { x0, z0, nx, nz, ok, region };
  grids.set(map, grid);
  return grid;
}

/** Index of the standable cell nearest (x, z), searching a few cells out; -1 if none. */
function nearestCell(g: NavGrid, x: number, z: number, reach = 4): number {
  const ci = Math.round((x - g.x0) / PATH_CELL);
  const cj = Math.round((z - g.z0) / PATH_CELL);
  let best = -1;
  let bestD = Infinity;
  for (let dj = -reach; dj <= reach; dj++)
    for (let di = -reach; di <= reach; di++) {
      const i = ci + di;
      const j = cj + dj;
      if (i < 0 || j < 0 || i >= g.nx || j >= g.nz || !g.ok[j * g.nx + i]) continue;
      const d = (g.x0 + i * PATH_CELL - x) ** 2 + (g.z0 + j * PATH_CELL - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = j * g.nx + i;
      }
    }
  return best;
}

/** True when a visitor standing at `from` could walk to `to` (same connected area). */
export function canReach(map: WalkMap, from: [number, number], to: [number, number]): boolean {
  if (!canStand(map, to[0], to[1])) return false;
  const g = navGrid(map);
  if (!g) return false;
  const a = nearestCell(g, from[0], from[1]);
  const b = nearestCell(g, to[0], to[1], 1);
  return a >= 0 && b >= 0 && g.region[a] === g.region[b];
}

/** Clear to walk the straight line from a to b (sampled every 5 cm). */
function lineClear(map: WalkMap, a: [number, number], b: [number, number]): boolean {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (!canStand(map, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
  }
  return true;
}

/**
 * A walkable path from `from` to `to` (both [x, z]): A* over the grid (8 directions, no corner
 * cutting), then shortened to the fewest straight legs that stay clear. Starts at `from`, ends at
 * `to`. `null` when `to` isn't standable or can't be reached.
 */
export function findPath(map: WalkMap, from: [number, number], to: [number, number]): [number, number][] | null {
  if (!canReach(map, from, to)) return null;
  const g = navGrid(map)!;
  const start = nearestCell(g, from[0], from[1]);
  const goal = nearestCell(g, to[0], to[1], 1);
  const { nx, nz, ok } = g;
  const gx = goal % nx;
  const gz = (goal - gx) / nx;
  const h = (c: number) => {
    const dx = Math.abs((c % nx) - gx);
    const dz = Math.abs(Math.floor(c / nx) - gz);
    return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
  };
  const cost = new Float64Array(nx * nz).fill(Infinity);
  const came = new Int32Array(nx * nz).fill(-1);
  const closed = new Uint8Array(nx * nz);
  // Binary heap of [f, cell].
  const heap: [number, number][] = [];
  const push = (f: number, c: number) => {
    heap.push([f, c]);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  cost[start] = 0;
  push(h(start), start);
  while (heap.length) {
    const [, c] = pop();
    if (c === goal) break;
    if (closed[c]) continue;
    closed[c] = 1;
    const i = c % nx;
    const j = (c - i) / nx;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const n = nj * nx + ni;
        if (!ok[n] || closed[n]) continue;
        if (di && dj && (!ok[j * nx + ni] || !ok[nj * nx + i])) continue; // no corner cutting
        const step = cost[c] + (di && dj ? Math.SQRT2 : 1);
        if (step < cost[n]) {
          cost[n] = step;
          came[n] = c;
          push(step + h(n), n);
        }
      }
  }
  if (start !== goal && came[goal] < 0) return null;

  const cells: [number, number][] = [];
  for (let c = goal; c !== -1 && c !== start; c = came[c]) {
    const i = c % nx;
    cells.push([g.x0 + i * PATH_CELL, g.z0 + ((c - i) / nx) * PATH_CELL]);
  }
  const raw: [number, number][] = [from, ...cells.reverse(), to];

  // Keep only the corners: from each point, jump to the farthest one still in a clear line.
  const path: [number, number][] = [from];
  let k = 0;
  while (k < raw.length - 1) {
    let far = k + 1;
    for (let m = raw.length - 1; m > k + 1; m--) {
      if (lineClear(map, raw[k], raw[m])) {
        far = m;
        break;
      }
    }
    path.push(raw[far]);
    k = far;
  }
  return path;
}
