import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { UploadButton, uploadArtwork } from "./UploadButton";
import type { ResizedImages } from "./resizeImage";

const webp = (s: string) => new Blob([s], { type: "image/webp" });
const file = new File(["x"], "a.png", { type: "image/png" });

function fakeResize(withLarge: boolean) {
  return vi.fn().mockResolvedValue({
    small: webp("s"),
    medium: webp("m"),
    ...(withLarge ? { large: webp("l") } : {}),
    aspect: 0.75,
  } satisfies ResizedImages);
}

function fakeFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("uploadArtwork", () => {
  it("posts small, medium and large to /api/upload and returns urls + aspect", async () => {
    const urls = { small: "/s", medium: "/m", large: "/l" };
    const fn = fakeFetch(201, urls);
    const out = await uploadArtwork(file, fakeResize(true));
    expect(out).toEqual({ image: urls, aspect: 0.75 });
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe("/api/upload");
    const form = init.body as FormData;
    expect([...form.keys()]).toEqual(["small", "medium", "large"]);
  });

  it("omits large when the resize has none", async () => {
    const fn = fakeFetch(201, { small: "/s", medium: "/m" });
    await uploadArtwork(file, fakeResize(false));
    expect([...(fn.mock.calls[0][1].body as FormData).keys()]).toEqual([
      "small",
      "medium",
    ]);
  });

  it("surfaces resize errors (wrong type / too big) without calling fetch", async () => {
    const fn = fakeFetch(201, {});
    const resize = vi.fn().mockRejectedValue(new Error("File is not an image"));
    await expect(uploadArtwork(file, resize)).rejects.toThrow(
      "File is not an image",
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it.each([
    [413, {}, "too large"],
    [400, { error: "Invalid file format" }, "Invalid file format"],
    [500, {}, "Upload failed (500)"],
  ])("maps server %i to a readable error", async (status, body, msg) => {
    fakeFetch(status, body);
    await expect(uploadArtwork(file, fakeResize(false))).rejects.toThrow(msg);
  });
});

describe("UploadButton", () => {
  it("renders an accessible file picker for images", () => {
    const html = renderToString(<UploadButton onUploaded={() => {}} />);
    expect(html).toContain("Upload image");
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/*"');
  });
});
