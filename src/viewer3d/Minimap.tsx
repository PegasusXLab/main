"use client";

import { useEffect, useMemo, useState } from "react";
import { THEME } from "@/lib/theme";
import { FloatingPanel } from "@/components/FloatingPanel";
import type { SceneModel } from "@/lib/compile/types";
import {
  computeMinimapBounds,
  scaleDoorwayToMinimap,
  scaleFloorToMinimap,
} from "./minimapMath";

export interface MinimapProps {
  model: SceneModel;
  currentRoomId?: string;
  onRoomClick?: (roomId: string) => void;
  className?: string;
}

const MINIMAP_SIZE = 160;
const COLOR_ACCENT = THEME.colors.accent;

export function Minimap({
  model,
  currentRoomId,
  onRoomClick,
  className = "",
}: MinimapProps) {
  const [phoneOpen, setPhoneOpen] = useState(false);

  const bounds = useMemo(
    () => computeMinimapBounds(model.floors, 1),
    [model.floors],
  );

  const scaledFloors = useMemo(() => {
    return model.floors.map((floor) =>
      scaleFloorToMinimap(floor, bounds, MINIMAP_SIZE, MINIMAP_SIZE),
    );
  }, [model.floors, bounds]);

  const scaledDoorways = useMemo(() => {
    return (model.doorways ?? []).map((d) =>
      scaleDoorwayToMinimap(d, bounds, MINIMAP_SIZE, MINIMAP_SIZE),
    );
  }, [model.doorways, bounds]);

  // Handle escape key to close phone overlay
  useEffect(() => {
    if (!phoneOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPhoneOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phoneOpen]);

  if (model.floors.length === 0) return null;

  const handleRoomSelect = (roomId: string) => {
    onRoomClick?.(roomId);
    if (phoneOpen) {
      setPhoneOpen(false);
    }
  };

  const renderSvg = (fill = false) => (
    <svg
      width={fill ? "100%" : MINIMAP_SIZE}
      height={fill ? "100%" : MINIMAP_SIZE}
      viewBox={`0 0 ${MINIMAP_SIZE} ${MINIMAP_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-hidden rounded border border-white/10 bg-zinc-950/80"
    >
      {scaledFloors.map((rect) => {
        const isCurrent = rect.roomId === currentRoomId;
        return (
          <g
            key={rect.roomId}
            className="cursor-pointer"
            onClick={() => handleRoomSelect(rect.roomId)}
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
                  ? THEME.colors.accentSubtle
                  : "rgba(255, 255, 255, 0.12)"
              }
              stroke={isCurrent ? COLOR_ACCENT : THEME.colors.hairline}
              strokeWidth={isCurrent ? 2 : 1}
              className="transition-colors hover:fill-blue-500/30"
            />
          </g>
        );
      })}
      {scaledDoorways.map((d, idx) => (
        <line
          key={idx}
          x1={d.x1}
          y1={d.y1}
          x2={d.x2}
          y2={d.y2}
          stroke={THEME.colors.pencil}
          strokeWidth={2}
          strokeLinecap="round"
          data-testid="minimap-doorway"
        />
      ))}
    </svg>
  );

  return (
    <>
      {/* Phone toggle button (visible below 640 px: min 44x44 px touch target) */}
      <div className="absolute right-4 top-16 z-10 sm:hidden">
        <button
          type="button"
          data-testid="minimap-toggle"
          aria-label="Show map"
          onClick={() => setPhoneOpen(true)}
          className="pointer-events-auto flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-lg border border-white/20 bg-black/75 text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/90 active:scale-95 sm:hidden"
        >
          Map
        </button>
      </div>

      {/* Phone modal sheet / overlay */}
      {phoneOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Floor plan map"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhoneOpen(false);
          }}
        >
          <div className="relative rounded-xl border border-white/20 bg-zinc-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-semibold tracking-wide text-white">
                Floor Plan
              </span>
              <button
                type="button"
                onClick={() => setPhoneOpen(false)}
                aria-label="Close map"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
            {renderSvg()}
          </div>
        </div>
      )}

      {/* Desktop minimap (640 px and up): a floating panel you can move, resize and collapse. */}
      <FloatingPanel
        id="tour-minimap"
        label="Map"
        testId="viewer-minimap"
        collapseTestId="minimap-collapse"
        collapsedTestId="minimap-expand"
        tone="dark"
        anchor="top-right"
        inset={{ x: 16, y: 80 }}
        defaultSize={{ w: 196, h: 214 }}
        minSize={{ w: 150, h: 160 }}
        title={<span className="font-medium tracking-wide">Map</span>}
        className={`pointer-events-auto hidden sm:flex ${className}`}
      >
        <div className="absolute inset-0 p-2">{renderSvg(true)}</div>
      </FloatingPanel>
    </>
  );
}
