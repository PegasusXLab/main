import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TourNav } from "./TourNav";

const names = { a: "Entrance", b: "East Hall", c: "South Room" };

describe("TourNav", () => {
  it("names the current room, its position, and the neighbours on the arrows", () => {
    const html = renderToString(
      <TourNav order={["a", "b", "c"]} currentRoomId="b" roomNames={names} onGo={vi.fn()} />,
    );
    expect(html).toContain("East Hall");
    expect(html).toContain("02 / 03");
    expect(html).toContain('aria-label="Previous room"');
    expect(html).toContain('title="Previous: Entrance"');
    expect(html).toContain('aria-label="Next room"');
    expect(html).toContain('title="Next: South Room"');
    expect(html).toContain('aria-label="Go to South Room"');
    expect(html.match(/aria-current="location"/g)).toHaveLength(1);
  });

  it("shows only the room name for a single-room gallery", () => {
    const html = renderToString(
      <TourNav order={["a"]} currentRoomId="a" roomNames={names} onGo={vi.fn()} />,
    );
    expect(html).toContain("Entrance");
    expect(html).not.toContain("Next room");
    expect(html).not.toContain("Go to");
  });
});
