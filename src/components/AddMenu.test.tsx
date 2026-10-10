import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AddMenu, targetRoomId } from "./AddMenu";
import type { Room } from "@/lib/schema/types";

const rooms: Room[] = [
  {
    id: "r1",
    name: "Entrance",
    x: 0,
    y: 0,
    w: 6,
    d: 6,
    wallHeight: 3,
    wallColor: "#fff",
    floor: "wood",
    lighting: "gallery",
    description: "",
  },
];

describe("targetRoomId", () => {
  it("uses the selected room", () => {
    expect(
      targetRoomId(rooms, { kind: "room", id: "r1" }, [], []),
    ).toBe("r1");
  });

  it("falls back to the room of the selected artwork or object", () => {
    expect(
      targetRoomId(
        rooms,
        { kind: "artwork", id: "a1" },
        [{ id: "a1", roomId: "r1" }],
        [],
      ),
    ).toBe("r1");
    expect(
      targetRoomId(
        rooms,
        { kind: "object", id: "o1" },
        [],
        [{ id: "o1", roomId: "r1" }],
      ),
    ).toBe("r1");
  });

  it("is null with no usable selection", () => {
    expect(targetRoomId(rooms, { kind: "none" }, [], [])).toBeNull();
    expect(
      targetRoomId(rooms, { kind: "room", id: "missing" }, [], []),
    ).toBeNull();
  });
});

describe("AddMenu", () => {
  it("renders the + Add trigger positioned for the canvas", () => {
    const html = renderToString(
      <AddMenu
        rooms={rooms}
        selection={{ kind: "room", id: "r1" }}
        onAddArtwork={vi.fn()}
        onAddObject={vi.fn()}
      />,
    );
    expect(html).toContain("+ Add");
    expect(html).toContain('data-testid="add-menu-trigger"');
    expect(html).toContain('aria-haspopup="menu"');
  });

  it("disables the trigger with a tooltip hint when no room is targeted", () => {
    const html = renderToString(
      <AddMenu
        rooms={rooms}
        selection={{ kind: "none" }}
        onAddArtwork={vi.fn()}
        onAddObject={vi.fn()}
      />,
    );
    expect(html).toContain("disabled");
    expect(html).toContain("Select a room first");
  });
});
