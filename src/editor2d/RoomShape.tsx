import React from "react";
import { THEME } from "@/lib/theme";
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

  // Overlap during drag gets danger alert; selected gets Klein blue accent; normal gets neutral graphite/pencil
  let stroke: string = THEME.colors.pencil;
  let strokeWidth = 2 / ppm;
  let fill: string = THEME.colors.paper;

  if (isDragging && hasDragOverlap) {
    stroke = THEME.colors.danger;
    strokeWidth = 3 / ppm;
    fill = "#fef2f2"; // light danger wash
  } else if (isSelected) {
    stroke = THEME.colors.accent;
    strokeWidth = 3 / ppm;
    fill = isDragging ? THEME.colors.plaster : THEME.colors.paper;
  }

  const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    // Left click starts drag / selection
    if (e.button === 0) {
      e.stopPropagation();
      onSelect(room.id);
      onDragStart(room, e);
    }
  };

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    e.stopPropagation();
    onSelect(room.id);
  };

  return (
    <g
      data-testid={`room-${room.id}`}
      data-room-id={room.id}
      className="cursor-move select-none"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
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
        fill={THEME.colors.graphite}
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
        fill={THEME.colors.pencil}
        fontSize={Math.max(10 / ppm, 0.28)}
        fontWeight="400"
        className="pointer-events-none select-none font-mono"
      >
        {`${room.w} × ${room.d} m`}
      </text>
    </g>
  );
}

export default RoomShape;
