"use client";

import React from "react";
import type { Room } from "@/lib/schema/types";

export interface RoomShapeProps {
  room: Room;
  isSelected?: boolean;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number } | null;
  hasDragOverlap?: boolean;
  ppm: number;
  onSelect: (roomId: string) => void;
  onDragStart: (room: Room, e: React.MouseEvent<SVGGElement>) => void;
}

export function RoomShape({
  room,
  isSelected = false,
  isDragging = false,
  dragOffset,
  hasDragOverlap = false,
  ppm,
  onSelect,
  onDragStart,
}: RoomShapeProps) {
  const x = room.x + (isDragging && dragOffset ? dragOffset.x : 0);
  const y = room.y + (isDragging && dragOffset ? dragOffset.y : 0);

  // Overlap during drag gets red alert styling; selected gets blue highlight; normal gets neutral zinc
  let stroke = "#3f3f46";
  let strokeWidth = 2 / ppm;
  let fill = "white";

  if (isDragging && hasDragOverlap) {
    stroke = "#ef4444";
    strokeWidth = 3 / ppm;
    fill = "#fef2f2";
  } else if (isSelected) {
    stroke = "#2563eb";
    strokeWidth = 3 / ppm;
    fill = isDragging ? "#f8fafc" : "white";
  }

  const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    // Left click starts drag / selection
    if (e.button === 0) {
      e.stopPropagation();
      onSelect(room.id);
      onDragStart(room, e);
    }
  };

  return (
    <g
      data-testid={`room-${room.id}`}
      data-room-id={room.id}
      className="cursor-move select-none"
      onMouseDown={handleMouseDown}
    >
      <rect
        x={x}
        y={y}
        width={room.w}
        height={room.d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={0.05}
        className={isSelected ? "shadow-md" : "shadow-sm"}
      />
      {/* Room Name */}
      <text
        x={x + room.w / 2}
        y={y + room.d / 2 - Math.max(8 / ppm, 0.2)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#27272a"
        fontSize={Math.max(12 / ppm, 0.35)}
        fontWeight="600"
        className="pointer-events-none select-none"
      >
        {room.name}
      </text>
      {/* Room Dimensions */}
      <text
        x={x + room.w / 2}
        y={y + room.d / 2 + Math.max(8 / ppm, 0.25)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#71717a"
        fontSize={Math.max(10 / ppm, 0.28)}
        fontWeight="400"
        className="pointer-events-none select-none"
      >
        {`${room.w} × ${room.d} m`}
      </text>
    </g>
  );
}

export default RoomShape;
