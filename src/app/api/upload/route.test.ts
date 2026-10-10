import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { POST } from "./route";
import { getStorage } from "@/lib/storage";

// Helper to create a minimal valid WebP byte array
function createMockWebP(extraLength = 0): Uint8Array {
  const header = new Uint8Array([
    0x52,
    0x49,
    0x46,
    0x46, // "RIFF"
    0x24,
    0x00,
    0x00,
    0x00, // file size placeholder
    0x57,
    0x45,
    0x42,
    0x50, // "WEBP"
    0x56,
    0x50,
    0x38,
    0x20, // "VP8 "
    0x18,
    0x00,
    0x00,
    0x00, // chunk size
  ]);
  const out = new Uint8Array(header.length + extraLength);
  out.set(header, 0);
  return out;
}

function toBlob(bytes: Uint8Array, type = "image/webp"): Blob {
  return new Blob([bytes as unknown as BlobPart], { type });
}

describe("Upload API Route (POST /api/upload)", () => {
  const localDataDir = path.join(process.cwd(), ".data");

  beforeEach(async () => {
    await fs.mkdir(localDataDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("accepts valid small and medium WebP images and returns their URLs", async () => {
    const webpBytes = createMockWebP();
    const formData = new FormData();
    formData.append("small", toBlob(webpBytes), "small.webp");
    formData.append("medium", toBlob(webpBytes), "medium.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.small).toBeDefined();
    expect(data.medium).toBeDefined();
    expect(data.large).toBeUndefined();
    expect(data.small).toMatch(/\/api\/files\/images\/.*\/small\.webp/);
    expect(data.medium).toMatch(/\/api\/files\/images\/.*\/medium\.webp/);

    // Verify stored objects are marked public
    const storage = getStorage();
    const key = data.small.replace("/api/files/", "");
    const obj = await storage.getObject(key);
    expect(obj).not.toBeNull();
    expect(obj?.public).toBe(true);
    expect(obj?.contentType).toBe("image/webp");
  });

  it("accepts optional large WebP image alongside small and medium", async () => {
    const webpBytes = createMockWebP();
    const formData = new FormData();
    formData.append("small", toBlob(webpBytes), "small.webp");
    formData.append("medium", toBlob(webpBytes), "medium.webp");
    formData.append("large", toBlob(webpBytes), "large.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();

    expect(data.small).toBeDefined();
    expect(data.medium).toBeDefined();
    expect(data.large).toBeDefined();
    expect(data.large).toMatch(/\/api\/files\/images\/.*\/large\.webp/);
  });

  it("returns 400 when medium image is missing", async () => {
    const webpBytes = createMockWebP();
    const formData = new FormData();
    formData.append("small", toBlob(webpBytes), "small.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("medium");
  });

  it("returns 400 when small image is missing", async () => {
    const webpBytes = createMockWebP();
    const formData = new FormData();
    formData.append("medium", toBlob(webpBytes), "medium.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("small");
  });

  it("returns 400 when file has wrong magic bytes (non-WebP)", async () => {
    const fakeWebP = new TextEncoder().encode("not a real webp file");
    const validWebP = createMockWebP();

    const formData = new FormData();
    formData.append("small", toBlob(fakeWebP), "fake.webp");
    formData.append("medium", toBlob(validWebP), "medium.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("magic bytes");
  });

  it("returns 413 when file exceeds the 2 MB size cap", async () => {
    // 2 MB + 1 byte
    const oversizedBytes = createMockWebP(2 * 1024 * 1024 + 1);
    const validWebP = createMockWebP();

    const formData = new FormData();
    formData.append("small", toBlob(validWebP), "small.webp");
    formData.append("medium", toBlob(oversizedBytes), "huge.webp");

    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(413);
  });
});
