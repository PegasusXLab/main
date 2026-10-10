import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { POST, detectAudioType } from "./route";
import { getStorage } from "@/lib/storage";

function createMockMp3(): Uint8Array {
  // ID3v2 header
  return new Uint8Array([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10,
  ]);
}

function createMockWav(): Uint8Array {
  // RIFF .... WAVE
  return new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6d, 0x74, 0x20,
  ]);
}

describe("detectAudioType helper", () => {
  it("detects ID3 MP3 headers", () => {
    const res = detectAudioType(createMockMp3());
    expect(res).toEqual({ contentType: "audio/mpeg", ext: "mp3" });
  });

  it("detects WAV headers", () => {
    const res = detectAudioType(createMockWav());
    expect(res).toEqual({ contentType: "audio/wav", ext: "wav" });
  });

  it("detects file extension fallback", () => {
    const res = detectAudioType(new Uint8Array([1, 2, 3]), "my-song.mp3");
    expect(res).toEqual({ contentType: "audio/mpeg", ext: "mp3" });
  });

  it("returns null for unrecognized formats", () => {
    const res = detectAudioType(new Uint8Array([1, 2, 3]), "random.txt");
    expect(res).toBeNull();
  });
});

function toBlob(bytes: Uint8Array, type = "audio/mpeg"): Blob {
  return new Blob([bytes as unknown as BlobPart], { type });
}

describe("Audio Upload API Route (POST /api/upload/audio)", () => {
  let localDataDir: string;

  beforeEach(async () => {
    localDataDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "pegasus-audio-test-"),
    );
    process.env.PEGASUS_DATA_DIR = localDataDir;
  });

  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("accepts valid MP3 upload and returns storage URL", async () => {
    const mp3Bytes = createMockMp3();
    const formData = new FormData();
    formData.append("file", toBlob(mp3Bytes, "audio/mpeg"), "track.mp3");

    const req = new Request("http://localhost:3000/api/upload/audio", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/files\/audio\/[A-Za-z0-9_-]+\.mp3$/);
    expect(body.filename).toBe("track.mp3");

    // Verify stored object exists
    const storage = getStorage();
    const key = body.url.replace(/^\/api\/files\//, "");
    const stored = await storage.getObject(key);
    expect(stored).not.toBeNull();
    expect(stored?.contentType).toBe("audio/mpeg");
    expect(stored?.public).toBe(true);
  });

  it("accepts WAV upload and returns storage URL", async () => {
    const wavBytes = createMockWav();
    const formData = new FormData();
    formData.append("audio", toBlob(wavBytes, "audio/wav"), "ambient.wav");

    const req = new Request("http://localhost:3000/api/upload/audio", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^\/api\/files\/audio\/[A-Za-z0-9_-]+\.wav$/);
  });

  it("returns 400 when no file is provided", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost:3000/api/upload/audio", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing required "file"');
  });

  it("returns 400 when file format is not audio", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["not audio text"], { type: "text/plain" }),
      "test.txt",
    );

    const req = new Request("http://localhost:3000/api/upload/audio", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid audio format");
  });
});
