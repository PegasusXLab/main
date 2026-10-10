import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import type { SceneFloor, SceneModel } from "@/lib/compile/types";
import { Minimap } from "./Minimap";
import { computeMinimapBounds, scaleFloorToMinimap } from "./minimapMath";

describe("minimap math and scaling", () => {
  const sampleFloors: SceneFloor[] = [
    {
      roomId: "room-1",
      center: [5, 0, 5],
      size: [6, 4],
      floor: "wood",
    },
    {
      roomId: "room-2",
      center: [15, 0, 5],
      size: [8, 6],
      floor: "concrete",
    },
  ];

  it("computes bounds accurately across all room floors with padding", () => {
    const bounds = computeMinimapBounds(sampleFloors, 1);
    expect(bounds.minX).toBe(1);
    expect(bounds.maxX).toBe(20);
    expect(bounds.minZ).toBe(1);
    expect(bounds.maxZ).toBe(9);
    expect(bounds.width).toBe(19);
    expect(bounds.height).toBe(8);
  });

  it("scales world floor coordinates proportionally into target minimap box", () => {
    const bounds = computeMinimapBounds(sampleFloors, 1);
    const rect1 = scaleFloorToMinimap(sampleFloors[0], bounds, 160, 160);

    expect(rect1.roomId).toBe("room-1");
    expect(rect1.width).toBeGreaterThan(0);
    expect(rect1.height).toBeGreaterThan(0);
    expect(rect1.x).toBeGreaterThanOrEqual(0);
    expect(rect1.y).toBeGreaterThanOrEqual(0);

    const rect2 = scaleFloorToMinimap(sampleFloors[1], bounds, 160, 160);
    expect(rect2.x).toBeGreaterThan(rect1.x); // room-2 is to the right of room-1
  });
});

describe("Minimap component", () => {
  const model: SceneModel = {
    objects: [],
    floors: [
      {
        roomId: "room-a",
        center: [0, 0, 0],
        size: [4, 4],
        floor: "wood",
      },
      {
        roomId: "room-b",
        center: [6, 0, 0],
        size: [4, 4],
        floor: "concrete",
      },
    ],
    walls: [],
    doorways: [
      {
        roomIds: ["room-a", "room-b"],
        center: [3, 1, 0],
        width: 1.2,
        height: 2.1,
        side: "e",
      },
    ],
    frames: [],
    rooms: [
      {
        roomId: "room-a",
        center: [0, 0, 0],
        lighting: "warm",
        view: { position: [0, 1.6, 0], target: [0, 1.6, 1] },
      },
      {
        roomId: "room-b",
        center: [6, 0, 0],
        lighting: "warm",
        view: { position: [6, 1.6, 0], target: [6, 1.6, 1] },
      },
    ],
  };

  it("renders minimap with rooms, doorways, highlights current room in Klein blue, and includes phone toggle", () => {
    const html = renderToString(
      <Minimap model={model} currentRoomId="room-a" />,
    );

    expect(html).toContain('data-testid="viewer-minimap"');
    expect(html).toContain('data-testid="minimap-toggle"');
    expect(html).toContain('aria-label="Show map"');
    expect(html).toContain('data-testid="minimap-room-room-a"');
    expect(html).toContain('data-testid="minimap-room-room-b"');
    expect(html).toContain('data-testid="minimap-doorway"');
    expect(html).toContain('stroke="#002fa7"'); // active Klein blue border
  });

  it("returns null when no floors are in the model", () => {
    const emptyModel: SceneModel = {
      objects: [],
      floors: [],
      walls: [],
      doorways: [],
      frames: [],
      rooms: [],
    };
    const html = renderToString(<Minimap model={emptyModel} />);
    expect(html).toBe("");
  });
});
