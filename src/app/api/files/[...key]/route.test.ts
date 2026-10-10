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
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array([82, 73, 70, 70]),
    );
    expect(fakeVultr.getObject).toHaveBeenCalledWith("images/abc/medium.webp");
  });

  it("serves uploaded audio with its audio/* type and nosniff (T-123)", async () => {
    objects.set("audio/abc.mp3", {
      bytes: new Uint8Array([0x49, 0x44, 0x33]),
      contentType: "audio/mpeg",
      public: true,
    });
    const res = await call("audio", "abc.mp3");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
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

describe("GET /api/files/[...key] byte ranges (T-144: media seek + Safari)", () => {
  const callRange = (range: string | null, ...key: string[]) =>
    GET(
      new Request(`http://localhost/api/files/${key.join("/")}`, {
        headers: range ? { Range: range } : {},
      }),
      { params: Promise.resolve({ key }) },
    );
  const ten = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  it("advertises Accept-Ranges and keeps the full 200 without a Range header", async () => {
    objects.set("audio/a.wav", { bytes: ten, contentType: "audio/wav", public: true });
    const res = await callRange(null, "audio", "a.wav");
    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(ten);
  });

  it("serves 206 with Content-Range for bytes=a-b, a- and -n", async () => {
    objects.set("audio/a.wav", { bytes: ten, contentType: "audio/wav", public: true });
    const r1 = await callRange("bytes=2-4", "audio", "a.wav");
    expect(r1.status).toBe(206);
    expect(r1.headers.get("Content-Range")).toBe("bytes 2-4/10");
    expect(r1.headers.get("Content-Type")).toBe("audio/wav");
    expect(r1.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(new Uint8Array(await r1.arrayBuffer())).toEqual(new Uint8Array([2, 3, 4]));
    const r2 = await callRange("bytes=7-", "audio", "a.wav");
    expect(r2.headers.get("Content-Range")).toBe("bytes 7-9/10");
    const r3 = await callRange("bytes=-3", "audio", "a.wav");
    expect(new Uint8Array(await r3.arrayBuffer())).toEqual(new Uint8Array([7, 8, 9]));
    const r4 = await callRange("bytes=0-99", "audio", "a.wav");
    expect(r4.headers.get("Content-Range")).toBe("bytes 0-9/10");
  });

  it("returns 416 for an unsatisfiable range and ignores multi-ranges (200)", async () => {
    objects.set("audio/a.wav", { bytes: ten, contentType: "audio/wav", public: true });
    const bad = await callRange("bytes=10-12", "audio", "a.wav");
    expect(bad.status).toBe(416);
    expect(bad.headers.get("Content-Range")).toBe("bytes */10");
    const multi = await callRange("bytes=0-1,4-5", "audio", "a.wav");
    expect(multi.status).toBe(200);
  });

  it("keeps the users/ guard even with a Range header", async () => {
    objects.set("users/x.json", { bytes: ten, contentType: "application/json", public: true });
    expect((await callRange("bytes=0-1", "users", "x.json")).status).toBe(404);
  });
});
