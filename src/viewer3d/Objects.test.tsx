import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { SceneModel, SceneObject } from "@/lib/compile/types";
import {
  Objects,
  createObjectClickHandler,
  floorDragPosition,
  plinthToneForRoom,
} from "./Objects";

const rooms: SceneModel["rooms"] = [
  {
    roomId: "room-1",
    center: [3, 0, 2.5],
    lighting: "gallery",
    atmosphere: { preset: "gallery-white", moodColor: "#ffffff", haze: 0, brightness: 1, lightDirection: 0, grain: 0 },
    view: { position: [3, 1.6, 2.5], target: [3, 1.2, 2.5] },
  },
  {
    roomId: "room-2",
    center: [9, 0, 2.5],
    lighting: "moody",
    atmosphere: { preset: "moonlit", moodColor: "#000000", haze: 0, brightness: 0.5, lightDirection: 0, grain: 0 },
    view: { position: [9, 1.6, 2.5], target: [9, 1.2, 2.5] },
  },
];

const cutoutObj: SceneObject = {
  objectId: "obj-vase",
  roomId: "room-1",
  base: [3, 0.9, 2.5],
  rotationY: 0,
  height: 0.4,
  plinth: { shape: "box", height: 0.9, size: 0.6 },
  render: { kind: "cutout", imageUrl: "/art/vase.webp", aspect: 0.75, depth: 0.02 },
  view: { position: [3, 1.6, 4.5], target: [3, 1.1, 2.5] },
};

const libraryObj: SceneObject = {
  objectId: "obj-bench",
  roomId: "room-1",
  base: [4, 0, 2.5],
  rotationY: Math.PI / 2,
  height: 0.889,
  plinth: { shape: "none", height: 0, size: 0.6 },
  render: { kind: "library", libraryId: "bench-painted" },
  view: { position: [4, 1.6, 4.5], target: [4, 0.4, 2.5] },
};

describe("Objects (T-131)", () => {
  it("renders nothing for galleries without objects", () => {
    const html = renderToString(<Objects objects={[]} rooms={rooms} />);
    expect(html).not.toContain("data-object-id");
  });

  it("renders each object with a stable marker for tests", () => {
    const html = renderToString(<Objects objects={[cutoutObj, libraryObj]} rooms={rooms} />);
    expect(html).toContain('data-object-id="obj-vase"');
    expect(html).toContain('data-object-id="obj-bench"');
  });

  it("click handler calls back with the object id", () => {
    const onObjectClick = vi.fn();
    const handler = createObjectClickHandler("obj-vase", onObjectClick);
    handler?.({ stopPropagation: () => {} });
    expect(onObjectClick).toHaveBeenCalledWith("obj-vase");
    expect(createObjectClickHandler("obj-vase")).toBeUndefined();
  });
});

describe("plinthToneForRoom", () => {
  it("is light on gallery-white and dark on moonlit", () => {
    expect(plinthToneForRoom(rooms, "room-1")).toBe("light");
    expect(plinthToneForRoom(rooms, "room-2")).toBe("dark");
    expect(plinthToneForRoom(rooms, "missing")).toBe("light");
  });
});

describe("floorDragPosition", () => {
  // A 6 x 4 m room whose top-left corner is at world (10, 0, 20).
  const floor = { center: [13, 0, 22] as [number, number, number], size: [6, 4] as [number, number] };

  it("maps the world floor hit to room-relative meters and snaps to 0.1 m", () => {
    expect(floorDragPosition({ x: 12.04, z: 21.46 }, floor, 1, false)).toEqual({ x: 2, y: 1.5 });
  });

  it("Shift moves freely (no snap), rounded to the centimeter", () => {
    expect(floorDragPosition({ x: 12.043, z: 21.468 }, floor, 1, true)).toEqual({ x: 2.04, y: 1.47 });
  });

  it("clamps like the 2D marker: edge margin plus half the footprint", () => {
    // height 1 -> 1 m footprint -> 0.3 + 0.5 = 0.8 m from each wall.
    expect(floorDragPosition({ x: 0, z: 0 }, floor, 1, false)).toEqual({ x: 0.8, y: 0.8 });
    expect(floorDragPosition({ x: 99, z: 99 }, floor, 1, false)).toEqual({ x: 5.2, y: 3.2 });
  });
});
