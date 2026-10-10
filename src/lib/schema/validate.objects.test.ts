import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newObject } from "./defaults";
import type { Gallery, GalleryObject, ObjectSource } from "./types";
import { validate } from "./validate";

const IMG = { small: "/s.webp", medium: "/m.webp" };
const CUTOUT: ObjectSource = {
  kind: "cutout",
  image: IMG,
  aspect: 1.5,
  depth: 0.05,
};
const ENTRANCE = { w: 6, d: 6 };

function withObjects(objects: unknown[], extra: object = {}): unknown {
  return { ...structuredClone(sample), objects, ...extra };
}

function obj(patch: Partial<GalleryObject> = {}): GalleryObject {
  return {
    ...newObject("room-entrance", CUTOUT, ENTRANCE),
    id: "obj-1",
    ...patch,
  };
}

function pathsOf(doc: unknown, library?: readonly string[]): string[] {
  const r = validate(doc, library ? { library } : {});
  return r.ok ? [] : r.issues.map((i) => i.path);
}

describe("objects: additive schema (ADR-015 v2)", () => {
  it("a gallery without objects or look fields validates as before", () => {
    expect(validate(sample).ok).toBe(true);
    expect(validate(withObjects([])).ok).toBe(true);
  });

  it("accepts every source kind, a generating model, and the look fields", () => {
    const doc = withObjects(
      [
        obj({ id: "cut", position: { x: 1.5, y: 1.5 } }),
        obj({
          id: "model-ready",
          position: { x: 3, y: 1.5 },
          source: { kind: "model", modelUrl: "/m.glb", origin: "upload" },
        }),
        obj({
          id: "model-gen",
          position: { x: 3, y: 3 },
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
        obj({
          id: "lib",
          position: { x: 1.5, y: 3 },
          source: { kind: "library", libraryId: "bench" },
        }),
      ],
      { look: "noir" },
    ) as Gallery;
    doc.rooms[0] = {
      ...doc.rooms[0],
      look: "film",
      wallFinish: "brick",
      titleFont: "serif",
    };
    const r = validate(doc, { library: ["bench"] });
    expect(r.ok ? [] : r.issues).toEqual([]);
  });

  it("rejects an unknown room", () => {
    expect(pathsOf(withObjects([obj({ roomId: "nope" })]))).toEqual([
      "objects.0.roomId",
    ]);
  });

  it("rejects ids shared with artworks or other objects", () => {
    expect(pathsOf(withObjects([obj({ id: "art-sunrise" })]))).toEqual([
      "objects.0.id",
    ]);
    expect(pathsOf(withObjects([obj(), obj()]))).toEqual(["objects.1.id"]);
  });

  it("keeps objects 0.3 m inside the walls", () => {
    expect(pathsOf(withObjects([obj({ position: { x: 0.2, y: 3 } })]))).toEqual(
      ["objects.0.position"],
    );
    expect(pathsOf(withObjects([obj({ position: { x: 3, y: 5.8 } })]))).toEqual(
      ["objects.0.position"],
    );
    expect(
      pathsOf(withObjects([obj({ position: { x: 0.3, y: 5.7 } })])),
    ).toEqual([]);
  });

  it("limits height, plinth height, rotation and cutout depth", () => {
    expect(pathsOf(withObjects([obj({ height: 0 })]))).toEqual([
      "objects.0.height",
    ]);
    expect(pathsOf(withObjects([obj({ height: 4.5 })]))).toEqual([
      "objects.0.height",
    ]);
    expect(
      pathsOf(withObjects([obj({ plinth: { shape: "box", height: 1.6 } })])),
    ).toEqual(["objects.0.plinth.height"]);
    expect(pathsOf(withObjects([obj({ rotation: 360 })]))).toEqual([
      "objects.0.rotation",
    ]);
    expect(
      pathsOf(withObjects([obj({ source: { ...CUTOUT, depth: 0.5 } })])),
    ).toEqual(["objects.0.source.depth"]);
  });

  it("rejects empty URLs", () => {
    expect(
      pathsOf(
        withObjects([
          obj({ source: { kind: "model", modelUrl: "", origin: "upload" } }),
        ]),
      ),
    ).toEqual(["objects.0.source.modelUrl"]);
    expect(
      pathsOf(
        withObjects([
          obj({ source: { ...CUTOUT, image: { small: "", medium: "/m" } } }),
        ]),
      ),
    ).toEqual(["objects.0.source.image.small"]);
  });

  it("rejects a library id that isn't in the library", () => {
    const lib = obj({ source: { kind: "library", libraryId: "bench" } });
    expect(pathsOf(withObjects([lib]))).toEqual(["objects.0.source.libraryId"]);
    expect(pathsOf(withObjects([lib]), ["bench"])).toEqual([]);
  });

  it("rejects an object wider than 0.9 × the room's smaller side", () => {
    // Cutout width = height / aspect = 4 / 0.5 = 8 m in a 6 m room (limit 5.4 m).
    const wide = obj({ height: 4, source: { ...CUTOUT, aspect: 0.5 } });
    expect(pathsOf(withObjects([wide]))).toEqual(["objects.0.height"]);
  });

  it("rejects look values outside the literal unions", () => {
    expect(pathsOf(withObjects([], { look: "vapor" }))).toEqual(["look"]);
    const doc = structuredClone(sample) as Gallery;
    (doc.rooms[0] as unknown as Record<string, unknown>).wallFinish = "marble";
    expect(pathsOf(doc)).toEqual(["rooms.0.wallFinish"]);
  });
});

describe("newObject", () => {
  it("centres the object on a 0.8 m box plinth with kind-specific height", () => {
    const cut = newObject("r", CUTOUT, { w: 6, d: 4 });
    expect(cut).toMatchObject({
      roomId: "r",
      position: { x: 3, y: 2 },
      rotation: 0,
      height: 1,
      plinth: { shape: "box", height: 0.8 },
      title: "",
      artist: "",
      story: "",
    });
    const model = newObject(
      "r",
      { kind: "model", modelUrl: "/m.glb", origin: "upload" },
      { w: 6, d: 4 },
    );
    expect(model.height).toBe(1.2);
  });
});
