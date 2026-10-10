"use client";

import { useMemo, useState } from "react";
import type { SceneModel } from "@/lib/compile/types";
import { computeMinimapBounds, scaleFloorToMinimap } from "./minimapMath";

export interface MinimapProps {
  model: SceneModel;
  currentRoomId?: string;
  onRoomClick?: (roomId: string) => void;
  className?: string;
}

const MINIMAP_SIZE = 160;

export function Minimap({
  model,
  currentRoomId,
  onRoomClick,
  className = "",
}: MinimapProps) {
  const [collapsed, setCollapsed] = useState(false);

  const bounds = useMemo(
    () => computeMinimapBounds(model.floors, 1),
    [model.floors],
  );

  const scaledFloors = useMemo(() => {
    return model.floors.map((floor) =>
      scaleFloorToMinimap(floor, bounds, MINIMAP_SIZE, MINIMAP_SIZE),
    );
  }, [model.floors, bounds]);

  if (model.floors.length === 0) return null;

  return (
    <div
      data-testid="viewer-minimap"
      className={`pointer-events-auto rounded-lg border border-white/20 bg-black/75 p-2 shadow-lg backdrop-blur-sm transition-all sm:block ${className}`}
    >
      <div className="flex items-center justify-between gap-2 pb-1.5 text-xs text-white">
        <span className="font-medium tracking-wide">Map</span>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded px-1 text-[11px] text-zinc-400 hover:text-white"
          aria-label={collapsed ? "Expand minimap" : "Collapse minimap"}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <svg
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          viewBox={`0 0 ${MINIMAP_SIZE} ${MINIMAP_SIZE}`}
          className="overflow-hidden rounded border border-white/10 bg-zinc-950/80"
        >
          {scaledFloors.map((rect) => {
            const isCurrent = rect.roomId === currentRoomId;
            return (
              <g
                key={rect.roomId}
                className="cursor-pointer"
                onClick={() => onRoomClick?.(rect.roomId)}
                data-testid={`minimap-room-${rect.roomId}`}
              >
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  rx={2}
                  fill={
                    isCurrent
                      ? "rgba(59, 130, 246, 0.45)"
                      : "rgba(255, 255, 255, 0.12)"
                  }
                  stroke={isCurrent ? "#3b82f6" : "rgba(255, 255, 255, 0.4)"}
                  strokeWidth={isCurrent ? 2 : 1}
                  className="transition-colors hover:fill-blue-500/30"
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
