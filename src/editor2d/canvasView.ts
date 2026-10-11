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

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Space to keep clear for floating panels over the canvas: each panel reserves the side it hugs
 * that costs the least area (e.g. a bottom-right preview reserves the bottom strip if that's
 * thinner than its width), so "fit" puts the plan beside the panels, not under them.
 */
export function overlayInsets(
  canvas: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  overlays: readonly { left: number; top: number; right: number; bottom: number }[],
  gap = 12,
): Insets {
  const out: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const o of overlays) {
    if (o.right <= canvas.left || o.left >= canvas.right || o.bottom <= canvas.top || o.top >= canvas.bottom)
      continue;
    const cx = (o.left + o.right) / 2 - canvas.left;
    const cy = (o.top + o.bottom) / 2 - canvas.top;
    const options: [keyof Insets, number, number][] = [
      cx > canvas.width / 2
        ? ["right", canvas.right - o.left + gap, canvas.width]
        : ["left", o.right - canvas.left + gap, canvas.width],
      cy > canvas.height / 2
        ? ["bottom", canvas.bottom - o.top + gap, canvas.height]
        : ["top", o.bottom - canvas.top + gap, canvas.height],
    ];
    const [side, px] = options.reduce((a, b) => (a[1] / a[2] <= b[1] / b[2] ? a : b));
    out[side] = Math.max(out[side], px);
  }
  return out;
}
