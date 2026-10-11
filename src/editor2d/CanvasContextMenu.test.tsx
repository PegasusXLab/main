import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { Room } from "@/lib/schema/types";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { nextRoomRect } from "./Canvas";

const room = (id: string, x: number, y: number, name = id) =>
  ({ id, name, x, y, w: 6, d: 6 }) as unknown as Room;

describe("nextRoomRect", () => {
  it("puts the new room on the first free side of the anchor", () => {
    const a = room("a", 0, 0);
    const r = nextRoomRect([a], a)!;
    expect(r.w).toBe(6);
    expect(r.d).toBe(6);
    // Touches the anchor but doesn't overlap it.
    expect(r.x === 6 || r.x === -6 || r.y === 6 || r.y === -6).toBe(true);
  });
  it("skips taken sides", () => {
    const rooms = [room("a", 0, 0), room("n", 0, -6), room("s", 0, 6), room("e", 6, 0)];
    expect(nextRoomRect(rooms, rooms[0])).toMatchObject({ x: -6, y: 0 });
  });
});

describe("CanvasContextMenu", () => {
  const noop = vi.fn();
  const base = {
    rooms: [room("a", 0, 0, "Entrance"), room("b", 6, 0, "Hall")],
    onClose: noop,
    onAddRoomHere: noop,
    onAddRoomNext: noop,
    onAddArtwork: noop,
    onAddObject: noop,
    onDelete: noop,
    onFit: noop,
  };

  it("offers room-specific actions over a room, with shortcuts", () => {
    const html = renderToString(
      <CanvasContextMenu {...base} canDelete target={{ x: 10, y: 10, at: { x: 2, y: 2 }, roomId: "a" }} />,
    );
    expect(html).toContain('role="menu"');
    expect(html).toContain("Add room next to Entrance");
    expect(html).toContain("Add artwork…");
    expect(html).toContain("Add object…");
    expect(html).toContain("Delete Entrance");
    expect(html).toContain("Fit plan to view");
    expect(html).not.toContain("Add room here");
  });

  it("offers 'Add room here' on a free spot and no delete", () => {
    const html = renderToString(
      <CanvasContextMenu {...base} canDelete={false} target={{ x: 10, y: 10, at: { x: 30, y: 30 } }} />,
    );
    expect(html).toContain("Add room here");
    expect(html).not.toContain("Delete");
    expect(html).not.toContain("Add artwork");
  });
});
