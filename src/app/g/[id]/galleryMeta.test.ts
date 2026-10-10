import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheLife: () => {} }));

import { buildGalleryMetadata, readGalleryMeta } from "./galleryMeta";

function storageWith(objects: Record<string, unknown>) {
  return {
    getObject: async (key: string) =>
      key in objects
        ? {
            bytes: new TextEncoder().encode(JSON.stringify(objects[key])),
            contentType: "application/json",
          }
        : null,
  };
}

describe("readGalleryMeta", () => {
  it("returns only the title and room count", async () => {
    const storage = storageWith({
      "galleries/abc123.json": {
        title: "  Cobalt Orchard  ",
        rooms: [{}, {}, {}],
        editKeyHash: "secret-hash",
      },
    });
    const meta = await readGalleryMeta("abc123", storage);
    expect(meta).toEqual({ title: "Cobalt Orchard", rooms: 3 });
    expect(JSON.stringify(meta)).not.toContain("secret");
  });

  it("returns null for unknown or malformed ids without reading storage", async () => {
    const storage = storageWith({});
    const spy = vi.spyOn(storage, "getObject");
    expect(await readGalleryMeta("missing", storage)).toBeNull();
    expect(await readGalleryMeta("../users/x", storage)).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns null when the stored JSON is broken", async () => {
    const storage = {
      getObject: async () => ({
        bytes: new TextEncoder().encode("{not json"),
        contentType: "application/json",
      }),
    };
    expect(await readGalleryMeta("abc", storage)).toBeNull();
  });
});

describe("buildGalleryMetadata", () => {
  it("uses the gallery title for a known gallery", () => {
    const md = buildGalleryMetadata("abc123", { title: "Cobalt Orchard", rooms: 3 });
    expect(md.title).toBe("Cobalt Orchard · Galleriverse");
    expect(md.openGraph).toMatchObject({ title: "Cobalt Orchard · Galleriverse", url: "/g/abc123" });
    expect(md.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the site defaults for an unknown gallery", () => {
    const md = buildGalleryMetadata("nope", null);
    expect(md.title).toBeUndefined();
    expect(md.openGraph).toBeUndefined();
  });
});
