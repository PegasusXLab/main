// 2D canvas navigation math (pure): smooth wheel / pinch zoom, trackpad-pan detection, and
// fitting the whole plan into the view.

import type { Room } from "@/lib/schema/types";
import type { CanvasView } from "./Canvas";

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 4;

export function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

interface WheelLike {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey?: boolean;
}

/**
 * A trackpad two-finger scroll (not a pinch, not a mouse wheel): pixel deltas that are fractional,
 * sideways, or small. Those pan the plan; a mouse wheel or pinch zooms.
 */
export function isTrackpadPan(e: WheelLike): boolean {
  if (e.ctrlKey || e.metaKey || e.deltaMode !== 0) return false;
  return e.deltaX !== 0 || !Number.isInteger(e.deltaY) || Math.abs(e.deltaY) < 40;
}

/**
 * Continuous zoom factor for one wheel event: proportional to the delta (no fixed 20% jumps), so a
 * pinch tracks the fingers and a wheel notch is ~14%. Pinch arrives as ctrl+wheel.
 */
export function wheelZoomFactor(e: WheelLike): number {
  const dy = Math.max(-200, Math.min(200, e.deltaY));
  if (e.ctrlKey || e.metaKey) return Math.exp(-dy * 0.01); // pinch / ctrl+scroll
  if (e.deltaMode === 1) return Math.exp(-dy * 0.05); // lines (Firefox wheels)
  return Math.exp(-dy * 0.0015); // pixels (mouse wheel)
}

/**
 * The view that shows every room with `padding` px around them, centered (zoom capped at 1.5x so a
 * tiny plan doesn't balloon). Null when there are no rooms or no size yet.
 */
export function fitView(
  rooms: readonly Pick<Room, "x" | "y" | "w" | "d">[],
  size: { width: number; height: number },
  basePpm: number,
  padding = 56,
): CanvasView | null {
  if (!rooms.length || size.width <= 0 || size.height <= 0) return null;
  const minX = Math.min(...rooms.map((r) => r.x));
  const minY = Math.min(...rooms.map((r) => r.y));
  const maxX = Math.max(...rooms.map((r) => r.x + r.w));
  const maxY = Math.max(...rooms.map((r) => r.y + r.d));
  const w = Math.max(1, maxX - minX);
  const d = Math.max(1, maxY - minY);
  const availW = Math.max(40, size.width - padding * 2);
  const availH = Math.max(40, size.height - padding * 2);
  const zoom = clampZoom(Math.min(availW / (w * basePpm), availH / (d * basePpm), 1.5));
  const ppm = basePpm * zoom;
  return {
    zoom,
    pan: {
      x: size.width / 2 - (minX + w / 2) * ppm,
      y: size.height / 2 - (minY + d / 2) * ppm,
    },
  };
}
