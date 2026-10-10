import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  FloorObjects,
  computeObjectFootprint,
  snapPosition,
  clampObjectPosition,
  snapRotation,
  pointerAngleToRotation,
} from "./FloorObjects";
import type { GalleryObject, Room } from "@/lib/schema/types";

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

const obj: GalleryObject = {
  id: "o1",
  roomId: "r1",
  position: { x: 3, y: 3 },
  rotation: 45,
  height: 0.515,
  plinth: { shape: "box", height: 1.0 },
  source: { kind: "library", libraryId: "bust-marble" },
  title: "Bust",
  artist: "",
  story: "",
};

describe("object marker math", () => {
  it("footprints follow the height within 0.4–1.5 m", () => {
    expect(computeObjectFootprint({ height: 0.515 })).toBeCloseTo(0.515, 5);
    expect(computeObjectFootprint({ height: 0.1 })).toBe(0.4);
    expect(computeObjectFootprint({ height: 5 })).toBe(1.5);
  });

  it("snaps to 0.1 m", () => {
    expect(snapPosition(1.05)).toBeCloseTo(1.1, 5);
    expect(snapPosition(1.04)).toBeCloseTo(1.0, 5);
  });

  it("clamps to the room with a 0.3 m margin", () => {
    const side = 0.5;
    expect(clampObjectPosition(6, 0.1, side)).toBeCloseTo(0.55, 5);
    expect(clampObjectPosition(6, 5.9, side)).toBeCloseTo(5.45, 5);
    expect(clampObjectPosition(6, 3, side)).toBe(3);
  });

  it("snaps rotation to 15°", () => {
    expect(snapRotation(44)).toBe(45);
    expect(snapRotation(352)).toBe(345);
    expect(snapRotation(359)).toBe(0);
    expect(snapRotation(-15)).toBe(345);
  });

  it("maps pointer angles with 0 facing +y", () => {
    expect(pointerAngleToRotation(0, 1)).toBe(0);
    expect(pointerAngleToRotation(1, 0)).toBe(90);
  });
});

describe("FloorObjects", () => {
  it("renders a square marker per object with a stable test id", () => {
    const html = renderToString(
      <FloorObjects
        ppm={40}
        objects={[obj]}
        rooms={[room]}
        selection={{ kind: "none" }}
        onSelect={vi.fn()}
        onUpdateObject={vi.fn()}
        onRemoveObject={vi.fn()}
      />,
    );
    expect(html).toContain('data-testid="floor-objects"');
    expect(html).toContain('data-testid="floor-object-o1"');
    expect(html).toContain("<rect");
  });

  it("renders a circle for round plinths and selection chrome when selected", () => {
    const html = renderToString(
      <FloorObjects
        ppm={40}
        objects={[{ ...obj, plinth: { shape: "cylinder", height: 0.6 } }]}
        rooms={[room]}
        selection={{ kind: "object", id: "o1" }}
        onSelect={vi.fn()}
        onUpdateObject={vi.fn()}
        onRemoveObject={vi.fn()}
      />,
    );
    expect(html).toContain("<circle");
    expect(html).toContain("0.60 m plinth · 45°");
    expect(html).toContain('data-testid="floor-object-rotate-o1"');
  });

  it("renders kraft fill and making 3D tag while job is generating", () => {
    const generatingObj: GalleryObject = {
      ...obj,
      source: {
        kind: "model",
        modelUrl: "",
        origin: "generated",
        job: {
          id: "j1",
          status: "queued",
          fallback: { image: { small: "", medium: "" }, aspect: 1 },
        },
      },
    };
    const html = renderToString(
      <FloorObjects
        ppm={40}
        objects={[generatingObj]}
        rooms={[room]}
        selection={{ kind: "object", id: "o1" }}
        onSelect={vi.fn()}
      />,
    );
    expect(html).toContain("making 3D…");
    expect(html).toContain("#c59a6a");
  });

  it("renders nothing for objects in unknown rooms", () => {
    const html = renderToString(
      <FloorObjects
        ppm={40}
        objects={[{ ...obj, roomId: "missing" }]}
        rooms={[room]}
        selection={{ kind: "none" }}
        onSelect={vi.fn()}
        onUpdateObject={vi.fn()}
        onRemoveObject={vi.fn()}
      />,
    );
    expect(html).not.toContain("floor-object-o1");
  });
});
