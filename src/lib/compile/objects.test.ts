import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newObject } from "@/lib/schema/defaults";
import type { Gallery, GalleryObject, ObjectSource } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { compile } from "./compile";

const IMG = { small: "/s.webp", medium: "/m.webp" };
const CUTOUT: ObjectSource = {
  kind: "cutout",
  image: IMG,
  aspect: 1.5,
  depth: 0.05,
};

function obj(
  id: string,
  x: number,
  y: number,
  patch: Partial<GalleryObject> = {},
): GalleryObject {
  return {
    ...newObject("room-entrance", CUTOUT, { w: 6, d: 6 }),
    id,
    position: { x, y },
    ...patch,
  };
}

function galleryWith(objects: GalleryObject[]): Gallery {
  return { ...(structuredClone(sample) as Gallery), objects };
}

const FOUR: GalleryObject[] = [
  obj("cut", 1.5, 1.5),
  obj("ready", 3, 1.5, {
    source: { kind: "model", modelUrl: "/ready.glb", origin: "upload" },
  }),
  obj("gen", 3, 3, {
    source: {
      kind: "model",
      modelUrl: "/pending.glb",
      origin: "generated",
      job: {
        id: "job-1",
        status: "running",
        fallback: { image: IMG, aspect: 1.2 },
      },
    },
  }),
  obj("lib", 1.5, 3, { source: { kind: "library", libraryId: "bench" } }),
];

describe("compile: objects stage", () => {
  it("round-trips one of each kind: validates, compiles, survives JSON", () => {
    const g = galleryWith(FOUR);
    const reloaded = JSON.parse(JSON.stringify(g));
    const v = validate(reloaded, { library: ["bench"] });
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.gallery).toEqual(g);

    const { scene, objectIssues } = compile(v.gallery);
    expect(objectIssues).toEqual([]);
    expect(scene.objects.map((o) => [o.objectId, o.render.kind])).toEqual([
      ["cut", "cutout"],
      ["ready", "model"],
      ["gen", "cutout"], // still generating → its fallback cutout
      ["lib", "library"],
    ]);
    const gen = scene.objects[2].render;
    expect(gen).toEqual({
      kind: "cutout",
      imageUrl: "/m.webp",
      aspect: 1.2,
      depth: 0.02,
    });
  });

  it("a ready generated model renders as the model", () => {
    const ready = obj("g", 3, 3, {
      source: {
        kind: "model",
        modelUrl: "/done.glb",
        origin: "generated",
        job: { id: "j", status: "ready", fallback: { image: IMG, aspect: 1 } },
      },
    });
    const { scene } = compile(galleryWith([ready]));
    expect(scene.objects[0].render).toEqual({
      kind: "model",
      modelUrl: "/done.glb",
    });
  });

  it("places objects in world space on top of the plinth", () => {
    const g = galleryWith([
      obj("a", 2, 1.5, { rotation: 90, plinth: { shape: "box", height: 0.8 } }),
    ]);
    g.rooms[1] = { ...g.rooms[1] }; // room-east starts at x = 6
    const east = obj("b", 1, 2, {
      roomId: "room-east",
      plinth: { shape: "none", height: 0.8 },
    });
    const { scene } = compile({ ...g, objects: [...g.objects!, east] });
    const [a, b] = scene.objects;
    expect(a.base).toEqual([2, 0.8, 1.5]);
    expect(a.rotationY).toBeCloseTo(Math.PI / 2);
    expect(b.base).toEqual([7, 0, 2]); // world x = 6 + 1; no plinth → on the floor
  });

  it("sizes the plinth from the footprint (0.6 m minimum)", () => {
    const small = obj("s", 3, 3); // 1 m tall, aspect 1.5 → 0.67 m wide → 0.77 m
    const lib = obj("l", 3, 3, {
      source: { kind: "library", libraryId: "x" },
    });
    const { scene } = compile(galleryWith([small, lib]));
    expect(scene.objects[0].plinth.size).toBeCloseTo(1 / 1.5 + 0.1);
    expect(scene.objects[1].plinth.size).toBe(0.6);
  });

  it("puts the inspect camera in front of the object at eye height, inside the room", () => {
    const { scene } = compile(galleryWith([obj("a", 3, 1.5)]));
    const { view, base, height } = scene.objects[0];
    // rotation 0 faces +z: the camera is 1.8 + height/2 = 2.3 m further along z.
    expect(view.position).toEqual([3, 1.6, 1.5 + 2.3]);
    expect(view.target).toEqual([3, base[1] + height / 2, 1.5]);

    const nearSouth = compile(galleryWith([obj("b", 3, 5)])).scene.objects[0];
    expect(nearSouth.view.position[2]).toBe(6 - 0.3); // clamped inside the south wall
  });

  it("warns when an object stands in a doorway's approach zone", () => {
    // The entrance's east doorway spans z 2.4–3.6 on x = 6; its approach zone is x 4.8–6.
    const blocking = obj("door", 5.4, 3);
    const clear = obj("clear", 2, 1);
    const { scene, objectIssues, issues } = compile(
      galleryWith([blocking, clear]),
    );
    expect(scene.objects).toHaveLength(2); // still rendered
    expect(objectIssues).toEqual([
      {
        code: "object-blocks-doorway",
        objectId: "door",
        message: "object blocks doorway",
      },
    ]);
    expect(issues.every((i) => "artworkId" in i)).toBe(true);
  });

  it("is always present: [] for galleries without objects", () => {
    expect(compile(sample as Gallery).scene.objects).toEqual([]);
  });
});
