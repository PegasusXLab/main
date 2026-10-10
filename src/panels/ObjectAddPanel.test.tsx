import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ObjectAddPanel } from "./ObjectAddPanel";
import type { Room } from "@/lib/schema/types";

const room: Room = {
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
};

describe("ObjectAddPanel", () => {
  it("asks what the creator has, with library + file + coming-soon photo", () => {
    const html = renderToString(
      <ObjectAddPanel roomId="r1" room={room} onAdded={vi.fn()} />,
    );
    expect(html).toContain("What do you have?");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("Pick from the library");
    expect(html).toContain("A 3D file");
    expect(html).toContain("coming soon");
  });

  it("shows the library grid with every curated object and category filters", () => {
    const html = renderToString(
      <ObjectAddPanel roomId="r1" room={room} onAdded={vi.fn()} />,
    );
    expect(html).toContain('data-testid="object-library-grid"');
    expect(html).toContain("object-library-bust-marble");
    expect(html).toContain("Marble bust");
    expect(html).toContain('data-testid="library-category-all"');
    expect(html).toContain('data-testid="library-category-seating"');
    expect(html).toContain('data-testid="library-category-plants"');
  });

  it("renders Replace object header when replaceObjectId is provided", () => {
    const html = renderToString(
      <ObjectAddPanel
        roomId="r1"
        room={room}
        replaceObjectId="o1"
        onAdded={vi.fn()}
      />,
    );
    expect(html).toContain("Replace object");
  });

  it("reports a missing room", () => {
    const html = renderToString(
      <ObjectAddPanel roomId="missing" onAdded={vi.fn()} />,
    );
    expect(html).toContain("Room not found");
  });
});
