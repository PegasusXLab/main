import { describe, expect, it } from "vitest";
import { compile } from "@/lib/compile/compile";
import sample from "@/fixtures/sample-3room.json";
import type { Gallery } from "@/lib/schema/types";
import { aimPictureLights } from "./PictureLights";

const { scene } = compile(sample as unknown as Gallery);

describe("aimPictureLights (T-125)", () => {
  it("aims one light per frame in the room, out from the wall and below the ceiling", () => {
    const frame = scene.frames[0];
    const aims = aimPictureLights(scene, frame.roomId, 8);
    const inRoom = scene.frames.filter((f) => f.roomId === frame.roomId);
    expect(aims).toHaveLength(Math.min(8, inRoom.length));
    const top = Math.max(
      ...scene.walls.filter((w) => w.roomId === frame.roomId).map((w) => w.top),
    );
    for (const a of aims) {
      expect(a.position[1]).toBeLessThanOrEqual(top);
      expect(a.angle).toBeGreaterThan(0);
      expect(a.angle).toBeLessThanOrEqual(Math.PI / 3);
      const d = Math.hypot(
        a.position[0] - a.target[0],
        a.position[2] - a.target[2],
      );
      expect(d).toBeCloseTo(1.1);
    }
  });

  it("caps at the pool size and handles empty input", () => {
    expect(aimPictureLights(scene, scene.frames[0].roomId, 0)).toEqual([]);
    expect(aimPictureLights(scene, undefined, 8)).toEqual([]);
    expect(aimPictureLights(scene, "nope", 8)).toEqual([]);
  });

  it("fills leftover slots with object spots from above (T-131)", () => {
    const roomId = scene.frames[0].roomId;
    const withObjects = {
      ...scene,
      objects: [
        {
          objectId: "obj-1",
          roomId,
          base: [3, 0.9, 2.5] as [number, number, number],
          rotationY: 0,
          height: 0.4,
          plinth: { shape: "box" as const, height: 0.9, size: 0.6 },
          render: { kind: "cutout" as const, imageUrl: "/m", aspect: 0.75, depth: 0.02 },
          view: {
            position: [3, 1.6, 4.5] as [number, number, number],
            target: [3, 1.1, 2.5] as [number, number, number],
          },
        },
      ],
    };
    const top = Math.max(
      ...scene.walls.filter((w) => w.roomId === roomId).map((w) => w.top),
    );
    const aims = aimPictureLights(withObjects, roomId, 8);
    const frameCount = scene.frames.filter((f) => f.roomId === roomId).length;
    // Sample rooms hold fewer frames than the pool: one object aim joins.
    expect(aims).toHaveLength(frameCount + 1);
    const objAim = aims[aims.length - 1];
    expect(objAim.target).toEqual([3, 0.9 + 0.2, 2.5]);
    expect(objAim.position[1]).toBeLessThanOrEqual(top);
    expect(objAim.position[1]).toBeGreaterThan(objAim.target[1]);
    expect(objAim.angle).toBeGreaterThan(0);
    expect(objAim.angle).toBeLessThanOrEqual(Math.PI / 3);
  });
});
