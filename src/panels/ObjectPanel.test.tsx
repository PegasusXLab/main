import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ObjectPanel } from "./ObjectPanel";
import type { Artwork, Room } from "@/lib/schema/types";

describe("ObjectPanel", () => {
  const room: Room = {
    id: "r1",
    name: "Main Gallery",
    x: 0,
    y: 0,
    w: 8,
    d: 6,
    wallHeight: 3.5,
    wallColor: "#fff",
    floor: "wood",
    lighting: "gallery",
    description: "",
  };

  const artwork: Artwork = {
    id: "a1",
    roomId: "r1",
    type: "image",
    title: "Water Lilies",
    artist: "Monet",
    story: "Impressionist pond",
    width: 2.0,
    aspect: 0.75,
    placement: { wall: "n", offset: 4.0, height: 1.8 },
    image: { small: "/s.webp", medium: "/m.webp" },
  };

  it("renders Add Artwork form with room bounds on sliders", () => {
    const html = renderToString(<ObjectPanel roomId="r1" room={room} />);
    expect(html).toContain("Add Artwork");
    expect(html).toContain("Main Gallery");
    expect(html).toContain('id="art-wall"');
    expect(html).toContain('id="art-offset"');
    expect(html).toContain('id="art-height"');
    expect(html).toContain('max="8"'); // north wall length is room.w = 8
    expect(html).toContain('max="3.5"'); // wall height is 3.5
    expect(html).toContain("Add artwork");
  });

  it("renders Edit Artwork form with existing artwork data and Delete button", () => {
    const html = renderToString(
      <ObjectPanel roomId="r1" artworkId="a1" room={room} artwork={artwork} />,
    );
    expect(html).toContain("Edit Artwork");
    expect(html).toContain('value="Water Lilies"');
    expect(html).toContain('value="Monet"');
    expect(html).toContain("Save changes");
    expect(html).toContain("Delete");
  });

  it("displays compile issues next to respective position sliders", () => {
    const html = renderToString(
      <ObjectPanel
        roomId="r1"
        artworkId="a1"
        room={room}
        artwork={artwork}
        issues={[
          {
            code: "artwork-over-doorway",
            artworkId: "a1",
            message: "Overlaps doorway",
          },
          {
            code: "artwork-past-wall-top",
            artworkId: "a1",
            message: "Sticks out above wall top",
          },
        ]}
      />,
    );
    expect(html).toContain('data-testid="issue-offset"');
    expect(html).toContain("Overlaps doorway");
    expect(html).toContain('data-testid="issue-height"');
    expect(html).toContain("Sticks out above wall top");
  });
});
