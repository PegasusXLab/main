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

  it("shows the library grid with every curated object", () => {
    const html = renderToString(
      <ObjectAddPanel roomId="r1" room={room} onAdded={vi.fn()} />,
    );
    expect(html).toContain('data-testid="object-library-grid"');
    expect(html).toContain("object-library-bust-marble");
    expect(html).toContain("Marble bust");
  });

  it("reports a missing room", () => {
    const html = renderToString(
      <ObjectAddPanel roomId="missing" onAdded={vi.fn()} />,
    );
    expect(html).toContain("Room not found");
  });
});
