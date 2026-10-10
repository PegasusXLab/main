"use client";

import React from "react";
import { hasOverlap } from "./overlap";
import type { Rect } from "@/lib/schema/geom";
import type { Room } from "@/lib/schema/types";

export type Side = "north" | "south" | "east" | "west";

export const SIDES: readonly Side[] = [
  "north",
  "south",
  "east",
  "west",
] as const;

/**
 * Computes the candidate room rectangle adjacent to `room` on `side`.
 * The new room is flush against the shared wall, matches the length along that side,
 * and extends by `depth` (default 6 m).
 */
export function getAdjacentRoomRect(room: Rect, side: Side, depth = 6): Rect {
  switch (side) {
    case "north":
      return {
        x: room.x,
        y: room.y - depth,
        w: room.w,
        d: depth,
      };
    case "south":
      return {
        x: room.x,
        y: room.y + room.d,
        w: room.w,
        d: depth,
      };
    case "east":
      return {
        x: room.x + room.w,
        y: room.y,
        w: depth,
        d: room.d,
      };
    case "west":
      return {
        x: room.x - depth,
        y: room.y,
        w: depth,
        d: room.d,
      };
  }
}

export interface AddRoomButtonsProps {
  room: Room;
  rooms: readonly Room[];
  ppm: number;
  onAddAdjacent: (candidateRect: Rect) => void;
}

export function AddRoomButtons({
  room,
  rooms,
  ppm,
  onAddAdjacent,
}: AddRoomButtonsProps) {
  const r = Math.max(10 / ppm, 0.28);
  const offset = r * 1.4;

  const buttonConfigs: Record<Side, { cx: number; cy: number; label: string }> =
    {
      north: {
        cx: room.x + room.w / 2,
        cy: room.y - offset,
        label: "North",
      },
      south: {
        cx: room.x + room.w / 2,
        cy: room.y + room.d + offset,
        label: "South",
      },
      east: {
        cx: room.x + room.w + offset,
        cy: room.y + room.d / 2,
        label: "East",
      },
      west: {
        cx: room.x - offset,
        cy: room.y + room.d / 2,
        label: "West",
      },
    };

  return (
    <g data-testid="add-room-buttons" className="select-none">
      {SIDES.map((side) => {
        const candidate = getAdjacentRoomRect(room, side);
        const overlaps = hasOverlap(candidate, rooms);
        const { cx, cy, label } = buttonConfigs[side];

        const handleClick = (e: React.MouseEvent<SVGGElement>) => {
          e.stopPropagation();
          if (!overlaps) {
            onAddAdjacent(candidate);
          }
        };

        const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
          e.stopPropagation();
        };

        return (
          <g
            key={side}
            role="button"
            aria-label={
              overlaps
                ? `Cannot add ${label} room: overlaps existing room`
                : `Add room to the ${label}`
            }
            aria-disabled={overlaps}
            data-testid={`add-room-${side}`}
            data-disabled={overlaps ? "true" : undefined}
            className={
              overlaps
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer group"
            }
            onClick={handleClick}
            onMouseDown={handleMouseDown}
          >
            <title>
              {overlaps
                ? `Cannot add ${label} room: overlaps existing room`
                : `Add room to the ${label}`}
            </title>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={overlaps ? "#e4e4e7" : "#2563eb"}
              stroke={overlaps ? "#a1a1aa" : "white"}
              strokeWidth={1.5 / ppm}
              className={
                overlaps ? "" : "transition-colors group-hover:fill-blue-700"
              }
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={r * 1.3}
              fontWeight="bold"
              fill={overlaps ? "#71717a" : "white"}
              className="pointer-events-none select-none"
            >
              +
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default AddRoomButtons;
