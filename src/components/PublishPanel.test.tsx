import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { newGallery } from "@/lib/schema/defaults";
import { publishGallery, saveGallery } from "./publishClient";
import { PublishPanel } from "./PublishPanel";

const gallery = newGallery("Test");

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

describe("publishGallery", () => {
  it("POSTs the gallery and returns the links", async () => {
    const result = {
      id: "abc",
      editKey: "k",
      viewUrl: "/g/abc",
      editUrl: "/edit/abc?key=k",
    };
    const fn = fakeFetch(201, result);
    await expect(publishGallery(gallery)).resolves.toEqual(result);
    expect(fn).toHaveBeenCalledWith(
      "/api/galleries",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("turns 400 issues into a readable error", async () => {
    fakeFetch(400, { issues: [{ path: "rooms", message: "need a room" }] });
    await expect(publishGallery(gallery)).rejects.toThrow(
      "Gallery is invalid: rooms: need a room",
    );
  });

  it("reports 413", async () => {
    fakeFetch(413, {});
    await expect(publishGallery(gallery)).rejects.toThrow("too large");
  });
});

describe("saveGallery", () => {
  it("PUTs with the edit key only in the x-edit-key header", async () => {
    const fn = fakeFetch(200, gallery);
    await saveGallery("abc", "secret", gallery);
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe("/api/galleries/abc");
    expect(init.method).toBe("PUT");
    expect(init.headers["x-edit-key"]).toBe("secret");
    expect(init.body).not.toContain("secret");
  });

  it("reports 403 as a wrong key", async () => {
    fakeFetch(403, {});
    await expect(saveGallery("abc", "bad", gallery)).rejects.toThrow(
      "Wrong or missing edit key",
    );
  });
});

describe("PublishPanel", () => {
  it("before publishing: Publish button, no links", () => {
    const html = renderToString(<PublishPanel gallery={gallery} />);
    expect(html).toContain("Publish");
    expect(html).not.toContain("View link");
    expect(html).not.toContain("Save changes");
  });

  it("after publishing: both links, copy buttons, secret warning, Save changes", () => {
    const html = renderToString(
      <PublishPanel gallery={gallery} id="abc" editKey="k" />,
    );
    expect(html).toContain("Save changes");
    expect(html).toContain("/g/abc");
    expect(html).toContain("/edit/abc?key=k");
    expect(html.match(/>Copy</g)).toHaveLength(2);
    expect(html).toContain("edit link is secret");
  });
});
