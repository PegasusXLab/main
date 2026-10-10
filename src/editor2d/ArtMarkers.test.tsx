import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  computeArtSegment,
  computeDragOffset,
  createMarkerClickHandler,
  ArtMarkers,
} from "./ArtMarkers";
import type { Artwork, Room } from "@/lib/schema/types";

describe("computeArtSegment (pure position math)", () => {
  const room: Room = {
    id: "r1",
    name: "Gallery Room",
    x: 0,
    y: 0,
    w: 6,
    d: 4,
    wallHeight: 3,
    wallColor: "#fff",
    lighting: "gallery",
    description: "",
    floor: "wood",
  };

  it("calculates north wall segment correctly", () => {
    // North wall: y = room.y = 0. Offset 3, width 1.2 => center at (3, 0)
    const seg = computeArtSegment(room, "n", 3, 1.2);
    expect(seg.cx).toBe(3);
    expect(seg.cy).toBe(0);
    expect(seg.x1).toBeCloseTo(2.4);
    expect(seg.y1).toBe(0);
    expect(seg.x2).toBeCloseTo(3.6);
    expect(seg.y2).toBe(0);
    expect(seg.wallLength).toBe(6);
  });

  it("calculates south wall segment correctly", () => {
    // South wall: y = room.y + room.d = 4. Offset 2, width 1.0 => center at (6 - 2 = 4, 4)
    const seg = computeArtSegment(room, "s", 2, 1.0);
    expect(seg.cx).toBe(4);
    expect(seg.cy).toBe(4);
    expect(seg.x1).toBeCloseTo(3.5);
    expect(seg.y1).toBe(4);
    expect(seg.x2).toBeCloseTo(4.5);
    expect(seg.y2).toBe(4);
    expect(seg.wallLength).toBe(6);
  });

  it("calculates west wall segment correctly", () => {
    // West wall: x = room.x = 0. Offset 1, width 1.0 => center at (0, 4 - 1 = 3)
    const seg = computeArtSegment(room, "w", 1, 1.0);
    expect(seg.cx).toBe(0);
    expect(seg.cy).toBe(3);
    expect(seg.x1).toBe(0);
    expect(seg.y1).toBeCloseTo(2.5);
    expect(seg.x2).toBe(0);
    expect(seg.y2).toBeCloseTo(3.5);
    expect(seg.wallLength).toBe(4);
  });

  it("calculates east wall segment correctly", () => {
    // East wall: x = room.x + room.w = 6. Offset 1.5, width 1.0 => center at (6, 0 + 1.5 = 1.5)
    const seg = computeArtSegment(room, "e", 1.5, 1.0);
    expect(seg.cx).toBe(6);
    expect(seg.cy).toBe(1.5);
    expect(seg.x1).toBe(6);
    expect(seg.y1).toBeCloseTo(1.0);
    expect(seg.x2).toBe(6);
    expect(seg.y2).toBeCloseTo(2.0);
    expect(seg.wallLength).toBe(4);
  });
});

describe("computeDragOffset (pure drag and clamping math)", () => {
  it("snaps to 0.1 m and clamps to wall length for north wall", () => {
    // Move +0.26m right => snaps to +0.3m => 2.0 + 0.3 = 2.3m
    expect(computeDragOffset("n", 2.0, 0.26, 0, 6.0)).toBe(2.3);

    // Clamps at 0 (left end)
    expect(computeDragOffset("n", 0.5, -1.0, 0, 6.0)).toBe(0);

    // Clamps at wallLength (right end)
    expect(computeDragOffset("n", 5.5, 2.0, 0, 6.0)).toBe(6.0);
  });

  it("inverts delta for south and west walls", () => {
    // South: moving right (+dx) decreases offset from room's left end
    expect(computeDragOffset("s", 3.0, 0.5, 0, 6.0)).toBe(2.5);

    // West: moving down (+dy) decreases offset from room's left end
    expect(computeDragOffset("w", 3.0, 0, 0.5, 4.0)).toBe(2.5);

    // East: moving down (+dy) increases offset from room's left end
    expect(computeDragOffset("e", 1.0, 0, 0.5, 4.0)).toBe(1.5);
  });
});

describe("ArtMarkers component", () => {
  const room: Room = {
    id: "r1",
    name: "Room",
    x: 0,
    y: 0,
    w: 6,
    d: 4,
    wallHeight: 3,
    wallColor: "#fff",
    lighting: "gallery",
    description: "",
    floor: "wood",
  };

  const artworks: Artwork[] = [
    {
      id: "a1",
      roomId: "r1",
      type: "image",
      title: "Mona Lisa",
      artist: "Da Vinci",
      story: "Famous portrait",
      width: 1.0,
      aspect: 1.5,
      placement: { wall: "n", offset: 3, height: 1.5 },
      image: { small: "/s1", medium: "/m1" },
    },
    {
      id: "a2",
      roomId: "r1",
      type: "image",
      title: "Starry Night",
      artist: "Van Gogh",
      story: "Post-impressionist masterpiece",
      width: 1.2,
      aspect: 0.8,
      placement: { wall: "s", offset: 2, height: 1.5 },
      image: { small: "/s2", medium: "/m2" },
    },
  ];

  it("renders markers for each artwork", () => {
    const html = renderToString(
      <svg>
        <ArtMarkers ppm={50} rooms={[room]} artworks={artworks} />
      </svg>,
    );
    expect(html).toContain('data-testid="art-markers"');
    expect(html).toContain('data-testid="art-marker-a1"');
    expect(html).toContain('data-testid="art-marker-a2"');
  });

  it("renders marker with compile issue in red (#ef4444)", () => {
    const html = renderToString(
      <svg>
        <ArtMarkers
          ppm={50}
          rooms={[room]}
          artworks={artworks}
          issues={[
            {
              code: "artwork-past-wall-end",
              artworkId: "a1",
              message: "past end",
            },
          ]}
        />
      </svg>,
    );
    // a1 should be red
    expect(html).toContain('stroke="#ef4444"');
  });

  it("renders selected marker in blue (#2563eb)", () => {
    const html = renderToString(
      <svg>
        <ArtMarkers
          ppm={50}
          rooms={[room]}
          artworks={artworks}
          selection={{ kind: "artwork", id: "a2" }}
        />
      </svg>,
    );
    expect(html).toContain('stroke="#2563eb"');
  });

  it("handles marker click by selecting artwork and stopping propagation", () => {
    const onSelect = vi.fn();
    const handler = createMarkerClickHandler("a1", onSelect);
    const stopPropagation = vi.fn();

    handler({ stopPropagation });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("a1");
  });
});
