import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { RoomPanel } from "./RoomPanel";
import type { Room } from "@/lib/schema/types";

const mockRoom: Room = {
  id: "room-entrance",
  name: "Main Gallery",
  description: "Grand central hall with high ceilings",
  x: 0,
  y: 0,
  w: 6,
  d: 6,
  wallHeight: 3,
  wallColor: "#f2efe9",
  floor: "wood",
  lighting: "gallery",
};

describe("RoomPanel", () => {
  it("renders empty state when no room is selected or provided", () => {
    const html = renderToString(<RoomPanel />);
    expect(html).toContain('data-testid="room-panel-empty"');
    expect(html).toContain("No room selected.");
  });

  it("renders all editable fields and controls when room is provided", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    expect(html).toContain('data-testid="room-panel"');
    expect(html).toContain('id="room-name-input"');
    expect(html).toContain("Main Gallery");
    expect(html).toContain('id="room-desc-input"');
    expect(html).toContain("Grand central hall with high ceilings");
    expect(html).toContain('id="room-width-input"');
    expect(html).toContain('value="6"');
    expect(html).toContain('id="room-depth-input"');
    expect(html).toContain('id="room-height-input"');
    expect(html).toContain('id="room-wall-color-input"');
    expect(html).toContain('id="room-floor-select"');
    expect(html).toContain('id="room-lighting-select"');
    expect(html).toContain("Objects in room");
    expect(html).toContain("Delete room");
  });

  it("displays read-only objects list for artworks in the room", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    // Sample gallery has artworks in room-entrance
    expect(html).toContain("Objects in room");
  });

  it("disables delete room button when only one room exists in store", () => {
    // With multiple rooms, button is enabled
    const html3 = renderToString(<RoomPanel room={mockRoom} />);
    expect(html3).not.toContain("cursor-not-allowed");

    // When only 1 room exists, button is disabled
    const html1 = renderToString(
      <RoomPanel room={mockRoom} rooms={[mockRoom]} />,
    );
    expect(html1).toContain("cursor-not-allowed");
    expect(html1).toContain("disabled");
  });
});
