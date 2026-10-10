import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { RoomShape } from "./RoomShape";
import type { Room } from "@/lib/schema/types";

const mockRoom: Room = {
  id: "room-1",
  name: "Main Gallery",
  description: "",
  x: 2,
  y: 3,
  w: 6,
  d: 6,
  wallHeight: 3,
  wallColor: "#f2efe9",
  floor: "wood",
  lighting: "gallery",
};

describe("RoomShape", () => {
  it("renders room name, dimensions, and rect in SVG", () => {
    const html = renderToString(
      <svg>
        <RoomShape
          room={mockRoom}
          ppm={40}
          onSelect={() => {}}
          onDragStart={() => {}}
        />
      </svg>,
    );

    expect(html).toContain('data-testid="room-room-1"');
    expect(html).toContain("Main Gallery");
    expect(html).toContain("6 × 6 m");
    expect(html).toContain('x="2"');
    expect(html).toContain('y="3"');
    expect(html).toContain('stroke="#3f3f46"'); // unselected border
  });

  it("applies blue outline when selected", () => {
    const html = renderToString(
      <svg>
        <RoomShape
          room={mockRoom}
          isSelected={true}
          ppm={40}
          onSelect={() => {}}
          onDragStart={() => {}}
        />
      </svg>,
    );

    expect(html).toContain('stroke="#2563eb"');
  });

  it("applies red error styling and fill when dragging with overlap", () => {
    const html = renderToString(
      <svg>
        <RoomShape
          room={mockRoom}
          isSelected={true}
          isDragging={true}
          hasDragOverlap={true}
          dragOffset={{ x: 1, y: 1 }}
          ppm={40}
          onSelect={() => {}}
          onDragStart={() => {}}
        />
      </svg>,
    );

    expect(html).toContain('stroke="#ef4444"');
    expect(html).toContain('fill="#fef2f2"');
    expect(html).toContain('x="3"'); // 2 + 1
    expect(html).toContain('y="4"'); // 3 + 1
  });
});
