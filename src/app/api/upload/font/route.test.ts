import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { POST } from "./route";
import { getStorage } from "@/lib/storage";
import {
  FONT_TOO_LARGE,
  MAX_FONT_BYTES,
  checkFontSize,
  detectFontType,
  isSafeFontUrl,
} from "@/lib/fontLimit";

function fontBytes(tag: string | number[], size = 64): Uint8Array {
  const out = new Uint8Array(size);
  const head = typeof tag === "string" ? [...tag].map((c) => c.charCodeAt(0)) : tag;
  out.set(head, 0);
  return out;
}

function post(bytes: Uint8Array, name: string): Request {
  const form = new FormData();
  form.append("file", new Blob([bytes as unknown as BlobPart]), name);
  return new Request("http://localhost:3000/api/upload/font", { method: "POST", body: form });
}

describe("font type, size and URL safety", () => {
  it("detects WOFF2, WOFF, OTF and TTF by signature only", () => {
    expect(detectFontType(fontBytes("wOF2"))?.contentType).toBe("font/woff2");
    expect(detectFontType(fontBytes("wOFF"))?.contentType).toBe("font/woff");
    expect(detectFontType(fontBytes("OTTO"))?.contentType).toBe("font/otf");
    expect(detectFontType(fontBytes([0, 1, 0, 0]))?.contentType).toBe("font/ttf");
    expect(detectFontType(fontBytes("<svg"))).toBeNull();
    expect(detectFontType(new Uint8Array(4))).toBeNull();
  });

  it("caps fonts at 1.5 MB", () => {
    expect(checkFontSize(MAX_FONT_BYTES)).toBeNull();
    expect(checkFontSize(MAX_FONT_BYTES + 1)).toBe(FONT_TOO_LARGE);
  });

  it("only trusts our own stored font URLs", () => {
    expect(isSafeFontUrl("/api/files/fonts/abc_DEF-123.woff2")).toBe(true);
    expect(isSafeFontUrl("https://evil.example/f.woff2")).toBe(false);
    expect(isSafeFontUrl("/api/files/fonts/a.woff2') ; } body { background:red")).toBe(false);
    expect(isSafeFontUrl("/api/files/images/a.woff2")).toBe(false);
    expect(isSafeFontUrl("/api/files/fonts/../x.ttf")).toBe(false);
    expect(isSafeFontUrl(undefined)).toBe(false);
  });
});

describe("POST /api/upload/font", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-font-test-"));
    process.env.PEGASUS_DATA_DIR = dir;
  });
  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("stores a WOFF2 under fonts/ and returns a safe same-origin URL with nosniff", async () => {
    const res = await POST(post(fontBytes("wOF2"), "Gallery Serif.woff2"));
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const body = await res.json();
    expect(isSafeFontUrl(body.url)).toBe(true);
    const stored = await getStorage().getObject(body.url.replace(/^\/api\/files\//, ""));
    expect(stored?.contentType).toBe("font/woff2");
    expect(stored?.public).toBe(true);
  });

  it("rejects a renamed non-font", async () => {
    const res = await POST(post(new TextEncoder().encode("<html><script>x</script></html>"), "f.woff2"));
    expect(res.status).toBe(400);
  });

  it("rejects fonts over the size cap with 413", async () => {
    const res = await POST(post(fontBytes("wOF2", MAX_FONT_BYTES + 1), "big.woff2"));
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe(FONT_TOO_LARGE);
  });

  it("returns 400 without a file", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/upload/font", { method: "POST", body: new FormData() }),
    );
    expect(res.status).toBe(400);
  });
});
