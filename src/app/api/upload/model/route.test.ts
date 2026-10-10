import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { POST, detectModelType } from "./route";
import { getStorage } from "@/lib/storage";
import { MODEL_TOO_LARGE, checkModelSize } from "@/lib/modelLimit";

/** Minimal binary glTF: 12-byte header (magic "glTF", version 2, length) + JSON chunk. */
function createMockGlb(): Uint8Array {
  const json = new TextEncoder().encode('{"asset":{"version":"2.0"}}');
  const total = 12 + 8 + json.length;
  const out = new Uint8Array(total);
  out[0] = 0x67; // g
  out[1] = 0x6c; // l
  out[2] = 0x54; // T
  out[3] = 0x46; // F
  out[4] = 2;
  new DataView(out.buffer).setUint32(8, total, true);
  new DataView(out.buffer).setUint32(12, json.length, true);
  out.set([0x4a, 0x53, 0x4f, 0x4e], 16); // JSON
  out.set(json, 20);
  return out;
}

describe("detectModelType helper", () => {
  it("detects binary glTF by magic bytes", () => {
    expect(detectModelType(createMockGlb())).toEqual({
      contentType: "model/gltf-binary",
      ext: "glb",
    });
  });

  it("never trusts the filename: non-GLB bytes are null", () => {
    expect(detectModelType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(detectModelType(new Uint8Array(11))).toBeNull();
    expect(
      detectModelType(
        new TextEncoder().encode("<html><script>alert(1)</script></html>"),
      ),
    ).toBeNull();
  });
});

describe("checkModelSize helper", () => {
  it("rejects files over 4 MB", () => {
    expect(checkModelSize(4 * 1024 * 1024)).toBeNull();
    expect(checkModelSize(4 * 1024 * 1024 + 1)).toBe(MODEL_TOO_LARGE);
  });
});

function toBlob(bytes: Uint8Array, type = "model/gltf-binary"): Blob {
  return new Blob([bytes as unknown as BlobPart], { type });
}

describe("Model Upload API Route (POST /api/upload/model)", () => {
  let localDataDir: string;

  beforeEach(async () => {
    localDataDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "pegasus-model-test-"),
    );
    process.env.PEGASUS_DATA_DIR = localDataDir;
  });

  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("accepts a valid .glb upload and returns a storage URL with nosniff", async () => {
    const formData = new FormData();
    formData.append("file", toBlob(createMockGlb()), "vase.glb");

    const req = new Request("http://localhost:3000/api/upload/model", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/files\/models\/[A-Za-z0-9_-]+\.glb$/);
    expect(body.filename).toBe("vase.glb");
    expect(body.contentType).toBe("model/gltf-binary");

    const storage = getStorage();
    const key = body.url.replace(/^\/api\/files\//, "");
    const stored = await storage.getObject(key);
    expect(stored).not.toBeNull();
    expect(stored?.contentType).toBe("model/gltf-binary");
    expect(stored?.public).toBe(true);
  });

  it("returns 400 when no file is provided", async () => {
    const req = new Request("http://localhost:3000/api/upload/model", {
      method: "POST",
      body: new FormData(),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing required "file"');
  });

  it("returns 400 when the file is not a GLB, whatever its name", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["not a model"], { type: "model/gltf-binary" }),
      "fake.glb",
    );

    const req = new Request("http://localhost:3000/api/upload/model", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain(".glb");
  });
});
