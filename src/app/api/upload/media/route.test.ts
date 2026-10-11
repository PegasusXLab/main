import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const { putObject } = vi.hoisted(() => ({ putObject: vi.fn() }));
vi.mock("@/lib/storage", () => ({ getStorage: () => ({ putObject }) }));
const ascii = (s: string) => Buffer.from(s);
const box = (type: string, body: Buffer) => {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length + 8);
  header.write(type, 4);
  return Buffer.concat([header, body]);
};
function mp4(handler = "vide", brand = "isom", late = false) {
  const ftyp = box("ftyp", Buffer.concat([ascii(brand), Buffer.alloc(4)]));
  const moov = box(
    "moov",
    box(
      "trak",
      box(
        "mdia",
        box("hdlr", Buffer.concat([Buffer.alloc(8), ascii(handler)])),
      ),
    ),
  );
  return Buffer.concat([
    ftyp,
    ...(late ? [box("mdat", Buffer.alloc(70000))] : []),
    moov,
  ]);
}
const gif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
async function upload(bytes: Buffer, filename = "anything.bin") {
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(bytes)], { type: "text/plain" }),
    filename,
  );
  return POST(
    new Request("http://localhost/api/upload/media", {
      method: "POST",
      body: form,
    }),
  );
}
beforeEach(() => {
  putObject.mockReset();
  putObject.mockResolvedValue(undefined);
});
describe("animated media upload", () => {
  it.each(["GIF87a", "GIF89a"])(
    "stores %s by signature, ignoring declared type/name",
    async (signature) => {
      const bytes = Buffer.from(gif);
      bytes.write(signature);
      const res = await upload(bytes);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({
        kind: "gif",
        url: expect.stringMatching(/^\/api\/files\/media\/.+\.gif$/),
      });
      expect(putObject).toHaveBeenCalledWith(
        expect.stringMatching(/^media\/.+\.gif$/),
        new Uint8Array(bytes),
        "image/gif",
        { public: true },
      );
    },
  );
  it.each(["isom", "mp42", "avc1", "iso2", "mp41"])(
    "accepts video brand %s with a real video handler",
    async (brand) => {
      const res = await upload(mp4("vide", brand, true));
      expect(res.status).toBe(201);
      expect((await res.json()).kind).toBe("video");
      expect(putObject.mock.calls[0][2]).toBe("video/mp4");
    },
  );
  it("rejects audio-only MP4, audio brands, forged mdat signatures, malformed boxes and HTML", async () => {
    for (const bytes of [
      mp4("soun"),
      mp4("vide", "M4A "),
      box("mdat", mp4()),
      Buffer.from([0, 0, 0, 1]),
      ascii("<script>alert(1)</script>"),
      Buffer.from("GIF89a"),
    ]) {
      expect((await upload(bytes, "fake.mp4")).status).toBe(415);
    }
    expect(putObject).not.toHaveBeenCalled();
  });
  it("accepts exactly 4 MB and rejects one byte over with the size guidance", async () => {
    const exact = Buffer.alloc(4 * 1024 * 1024);
    gif.copy(exact);
    expect((await upload(exact)).status).toBe(201);
    putObject.mockClear();
    const res = await upload(Buffer.alloc(exact.length + 1));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toContain("10-15 s at 720p");
    expect(putObject).not.toHaveBeenCalled();
  });
  it("handles missing, empty and malformed multipart uploads", async () => {
    expect((await upload(Buffer.alloc(0))).status).toBe(400);
    expect(
      (
        await POST(
          new Request("http://localhost", {
            method: "POST",
            body: new FormData(),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          new Request("http://localhost", { method: "POST", body: "bad" }),
        )
      ).status,
    ).toBe(400);
  });
  it("returns a retry message without exposing storage errors", async () => {
    putObject.mockRejectedValue(new Error("private detail"));
    const res = await upload(gif);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Upload failed. Please try again.",
    });
  });
});
