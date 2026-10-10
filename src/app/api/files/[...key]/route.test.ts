import { afterEach, describe, expect, it, vi } from "vitest";
import type { Storage, StorageObject } from "@/lib/storage";

// The route must serve through whichever adapter getStorage() returns (Vultr in production).
const objects = new Map<string, StorageObject>();
const fakeVultr: Storage = {
  putObject: vi.fn(),
  getObject: vi.fn(async (key: string) => objects.get(key) ?? null),
  publicUrl: (key: string) => `/api/files/${key}`,
};
vi.mock("@/lib/storage", () => ({ getStorage: () => fakeVultr }));

const { GET } = await import("./route");

const call = (...key: string[]) =>
  GET(new Request(`http://localhost/api/files/${key.join("/")}`), {
    params: Promise.resolve({ key }),
  });

afterEach(() => objects.clear());

describe("GET /api/files/[...key] through the active adapter (T-072)", () => {
  it("serves a public object with its content type and long cache headers", async () => {
    objects.set("images/abc/medium.webp", {
      bytes: new Uint8Array([82, 73, 70, 70]),
      contentType: "image/webp",
      public: true,
    });
    const res = await call("images", "abc", "medium.webp");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array([82, 73, 70, 70]),
    );
    expect(fakeVultr.getObject).toHaveBeenCalledWith("images/abc/medium.webp");
  });

  it("returns 404 for a private object (e.g. gallery JSON)", async () => {
    objects.set("galleries/g1.json", {
      bytes: new Uint8Array([123]),
      contentType: "application/json",
      public: false,
    });
    expect((await call("galleries", "g1.json")).status).toBe(404);
  });

  it("returns 404 for a missing object", async () => {
    expect((await call("images", "nope.webp")).status).toBe(404);
  });

  it("still refuses path traversal", async () => {
    expect((await call("images", "..", "galleries", "g1.json")).status).toBe(
      400,
    );
    expect((await call("images", "%2e%2e", "x")).status).toBe(400);
  });

  it("returns a generic 500 when the adapter throws", async () => {
    vi.mocked(fakeVultr.getObject).mockRejectedValueOnce(
      new Error("Vultr storage operation failed"),
    );
    const res = await call("images", "x.webp");
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("Vultr");
  });
});
