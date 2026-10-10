import React from "react";
import { THEME } from "@/lib/theme";
import { snap } from "./snapping";
import { MIN_ROOM_SIZE } from "@/lib/schema/defaults";
import type { Rect } from "@/lib/schema/geom";
import type { Room } from "@/lib/schema/types";

export type ResizeEdge = "n" | "s" | "e" | "w" | "se";

/**
 * Computes a snapped candidate rectangle when dragging a resize handle.
 * Clamps dimensions to at least `minSize` (default 2 × 2 m).
 */
export function computeResizeRect(
  original: Rect,
  edge: ResizeEdge,
  dxMeters: number,
  dyMeters: number,
  minSize = MIN_ROOM_SIZE,
): Rect {
  let { x, y, w, d } = original;

  if (edge === "e" || edge === "se") {
    w = Math.max(minSize, snap(original.w + dxMeters));
  }
  if (edge === "s" || edge === "se") {
    d = Math.max(minSize, snap(original.d + dyMeters));
  }
  if (edge === "w") {
    const candidateX = snap(original.x + dxMeters);
    const maxAllowedX = original.x + original.w - minSize;
    x = Math.min(candidateX, maxAllowedX);
    w = original.x + original.w - x;
  }
  if (edge === "n") {
    const candidateY = snap(original.y + dyMeters);
    const maxAllowedY = original.y + original.d - minSize;
    y = Math.min(candidateY, maxAllowedY);
    d = original.y + original.d - y;
  }

  return { x, y, w, d };
}

export interface ResizeHandlesProps {
  room: Room;
  ppm: number;
  onResizeStart: (edge: ResizeEdge, e: React.MouseEvent<SVGElement>) => void;
}

export function ResizeHandles({
  room,
  ppm,
  onResizeStart,
}: ResizeHandlesProps) {
  const handleThickness = 8 / ppm;
  const handleLength = Math.max(12 / ppm, Math.min(room.w * 0.3, 30 / ppm));
  const cornerSize = 10 / ppm;

  const createHandler =
    (edge: ResizeEdge) => (e: React.MouseEvent<SVGElement>) => {
      e.stopPropagation();
      if (e.button === 0) {
        onResizeStart(edge, e);
      }
    };

  const stopClick = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
  };

  return (
    <g data-testid="resize-handles" className="select-none">
      {/* North handle */}
      <rect
        data-testid="resize-handle-n"
        x={room.x + room.w / 2 - handleLength / 2}
        y={room.y - handleThickness / 2}
        width={handleLength}
        height={handleThickness}
        rx={handleThickness / 2}
        fill={THEME.colors.accent}
        stroke="white"
        strokeWidth={1.5 / ppm}
        className="cursor-ns-resize"
        onMouseDown={createHandler("n")}
        onClick={stopClick}
      />

      {/* South handle */}
      <rect
        data-testid="resize-handle-s"
        x={room.x + room.w / 2 - handleLength / 2}
        y={room.y + room.d - handleThickness / 2}
        width={handleLength}
        height={handleThickness}
        rx={handleThickness / 2}
        fill={THEME.colors.accent}
        stroke="white"
        strokeWidth={1.5 / ppm}
        className="cursor-ns-resize"
        onMouseDown={createHandler("s")}
        onClick={stopClick}
      />

      {/* West handle */}
      <rect
        data-testid="resize-handle-w"
        x={room.x - handleThickness / 2}
        y={room.y + room.d / 2 - handleLength / 2}
        width={handleThickness}
        height={handleLength}
        rx={handleThickness / 2}
        fill={THEME.colors.accent}
        stroke="white"
        strokeWidth={1.5 / ppm}
        className="cursor-ew-resize"
        onMouseDown={createHandler("w")}
        onClick={stopClick}
      />

      {/* East handle */}
      <rect
        data-testid="resize-handle-e"
        x={room.x + room.w - handleThickness / 2}
        y={room.y + room.d / 2 - handleLength / 2}
        width={handleThickness}
        height={handleLength}
        rx={handleThickness / 2}
        fill={THEME.colors.accent}
        stroke="white"
        strokeWidth={1.5 / ppm}
        className="cursor-ew-resize"
        onMouseDown={createHandler("e")}
        onClick={stopClick}
      />

      {/* Southeast corner handle (◢) */}
      <rect
        data-testid="resize-handle-se"
        x={room.x + room.w - cornerSize / 2}
        y={room.y + room.d - cornerSize / 2}
        width={cornerSize}
        height={cornerSize}
        rx={2 / ppm}
        fill={THEME.colors.accent}
        stroke="white"
        strokeWidth={1.5 / ppm}
        className="cursor-nwse-resize"
        onMouseDown={createHandler("se")}
        onClick={stopClick}
      />
    </g>
  );
}

export default ResizeHandles;
