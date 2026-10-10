import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AddRoomButtons, getAdjacentRoomRect, SIDES } from "./AddRoomButtons";
import type { Room } from "@/lib/schema/types";

const mockRoom: Room = {
  id: "room-1",
  name: "Entrance",
  description: "",
  x: 10,
  y: 10,
  w: 6,
  d: 4,
  wallHeight: 3,
  wallColor: "#f2efe9",
  floor: "wood",
  lighting: "gallery",
};

describe("getAdjacentRoomRect", () => {
  it("computes North candidate flush against north edge with matching width and 6m depth", () => {
    const candidate = getAdjacentRoomRect(mockRoom, "north");
    expect(candidate).toEqual({
      x: 10,
      y: 4, // 10 - 6
      w: 6,
      d: 6,
    });
    // Shares north boundary without interior overlap
    expect(candidate.y + candidate.d).toBe(mockRoom.y);
  });

  it("computes South candidate flush against south edge with matching width and 6m depth", () => {
    const candidate = getAdjacentRoomRect(mockRoom, "south");
    expect(candidate).toEqual({
      x: 10,
      y: 14, // 10 + 4
      w: 6,
      d: 6,
    });
    expect(candidate.y).toBe(mockRoom.y + mockRoom.d);
  });

  it("computes East candidate flush against east edge with matching depth and 6m width", () => {
    const candidate = getAdjacentRoomRect(mockRoom, "east");
    expect(candidate).toEqual({
      x: 16, // 10 + 6
      y: 10,
      w: 6,
      d: 4,
    });
    expect(candidate.x).toBe(mockRoom.x + mockRoom.w);
  });

  it("computes West candidate flush against west edge with matching depth and 6m width", () => {
    const candidate = getAdjacentRoomRect(mockRoom, "west");
    expect(candidate).toEqual({
      x: 4, // 10 - 6
      y: 10,
      w: 6,
      d: 4,
    });
    expect(candidate.x + candidate.w).toBe(mockRoom.x);
  });

  it("supports custom depth parameter", () => {
    const candidate = getAdjacentRoomRect(mockRoom, "north", 8);
    expect(candidate).toEqual({
      x: 10,
      y: 2, // 10 - 8
      w: 6,
      d: 8,
    });
  });
});

describe("AddRoomButtons component", () => {
  it("renders 4 add buttons with SVG markup and accessibility attributes", () => {
    const html = renderToString(
      <svg>
        <AddRoomButtons
          room={mockRoom}
          rooms={[mockRoom]}
          ppm={40}
          onAddAdjacent={() => {}}
        />
      </svg>,
    );

    expect(html).toContain('data-testid="add-room-buttons"');
    for (const side of SIDES) {
      expect(html).toContain(`data-testid="add-room-${side}"`);
      expect(html).toContain('role="button"');
    }
    // No overlap with only self present
    expect(html).not.toContain('data-disabled="true"');
  });

  it("disables button and adds tooltip when candidate position overlaps another room", () => {
    // Room placed directly where the East adjacent candidate would be
    const blockingRoom: Room = {
      ...mockRoom,
      id: "room-blocking-east",
      x: 16,
      y: 10,
      w: 6,
      d: 4,
    };

    const html = renderToString(
      <svg>
        <AddRoomButtons
          room={mockRoom}
          rooms={[mockRoom, blockingRoom]}
          ppm={40}
          onAddAdjacent={() => {}}
        />
      </svg>,
    );

    // East button is disabled
    expect(html).toContain('data-testid="add-room-east"');
    expect(html).toContain('data-disabled="true"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Cannot add East room: overlaps existing room");

    // Other buttons remain enabled
    expect(html).toContain('data-testid="add-room-north"');
    expect(html).toContain('aria-disabled="false"');
    expect(html).toContain("Add room to the North");
  });
});
