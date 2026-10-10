import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ResizeHandles, computeResizeRect } from "./ResizeHandles";
import type { Room } from "@/lib/schema/types";

const mockRoom: Room = {
  id: "room-1",
  name: "Entrance",
  description: "",
  x: 0,
  y: 0,
  w: 6,
  d: 6,
  wallHeight: 3,
  wallColor: "#f2efe9",
  floor: "wood",
  lighting: "gallery",
};

describe("computeResizeRect", () => {
  const base = { x: 0, y: 0, w: 6, d: 6 };

  it("resizes east edge with 0.5m snapping and 2m minimum clamp", () => {
    expect(computeResizeRect(base, "e", 1.2, 0)).toEqual({
      x: 0,
      y: 0,
      w: 7.0,
      d: 6,
    });
    // Shrink past minimum 2m clamps to 2m
    expect(computeResizeRect(base, "e", -5.5, 0)).toEqual({
      x: 0,
      y: 0,
      w: 2.0,
      d: 6,
    });
  });

  it("resizes south edge with 0.5m snapping and 2m minimum clamp", () => {
    expect(computeResizeRect(base, "s", 0, 0.6)).toEqual({
      x: 0,
      y: 0,
      w: 6,
      d: 6.5,
    });
    expect(computeResizeRect(base, "s", 0, -10)).toEqual({
      x: 0,
      y: 0,
      w: 6,
      d: 2.0,
    });
  });

  it("resizes west edge, moving x and adjusting w while anchoring east edge", () => {
    const resized = computeResizeRect(base, "w", 1.1, 0);
    // dx = 1.1 -> candidateX = snap(1.1) = 1.0 -> w = 6 - 1 = 5.0
    expect(resized).toEqual({
      x: 1.0,
      y: 0,
      w: 5.0,
      d: 6,
    });
    expect(resized.x + resized.w).toBe(base.x + base.w);

    // Clamping to min 2m: max allowed x is 4.0
    const clamped = computeResizeRect(base, "w", 10, 0);
    expect(clamped).toEqual({
      x: 4.0,
      y: 0,
      w: 2.0,
      d: 6,
    });
  });

  it("resizes north edge, moving y and adjusting d while anchoring south edge", () => {
    const resized = computeResizeRect(base, "n", 0, 1.4);
    // dy = 1.4 -> candidateY = snap(1.4) = 1.5 -> d = 6 - 1.5 = 4.5
    expect(resized).toEqual({
      x: 0,
      y: 1.5,
      w: 6,
      d: 4.5,
    });
    expect(resized.y + resized.d).toBe(base.y + base.d);

    // Clamping to min 2m: max allowed y is 4.0
    const clamped = computeResizeRect(base, "n", 0, 10);
    expect(clamped).toEqual({
      x: 0,
      y: 4.0,
      w: 6,
      d: 2.0,
    });
  });

  it("resizes southeast corner simultaneously", () => {
    expect(computeResizeRect(base, "se", 1.8, -1.2)).toEqual({
      x: 0,
      y: 0,
      w: 8.0,
      d: 5.0,
    });
  });
});

describe("ResizeHandles markup", () => {
  it("renders 4 edge handles and 1 corner handle for selected room", () => {
    const html = renderToString(
      <svg>
        <ResizeHandles room={mockRoom} ppm={40} onResizeStart={() => {}} />
      </svg>,
    );

    expect(html).toContain('data-testid="resize-handles"');
    expect(html).toContain('data-testid="resize-handle-n"');
    expect(html).toContain('data-testid="resize-handle-s"');
    expect(html).toContain('data-testid="resize-handle-w"');
    expect(html).toContain('data-testid="resize-handle-e"');
    expect(html).toContain('data-testid="resize-handle-se"');
  });
});
