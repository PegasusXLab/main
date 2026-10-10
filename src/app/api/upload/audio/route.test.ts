import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { POST, detectAudioType } from "./route";
import { getStorage } from "@/lib/storage";
import {
  AUDIO_TOO_LARGE,
  MAX_AUDIO_BYTES,
  checkAudioSize,
} from "@/lib/audioLimit";

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

  it("detects OGG and M4A headers", () => {
    expect(
      detectAudioType(new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 2])),
    ).toEqual({
      contentType: "audio/ogg",
      ext: "ogg",
    });
    expect(
      detectAudioType(
        new Uint8Array([
          0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20,
        ]),
      ),
    ).toEqual({ contentType: "audio/mp4", ext: "m4a" });
  });

  it("accepts only audio MP4 brands; generic brands only without a video track", () => {
    const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
    const ftyp = (brand: string) => [0, 0, 0, 0x14, ...ascii("ftyp"), ...ascii(brand)];
    const hdlr = (type: string) => [
      0, 0, 0, 0x21, ...ascii("hdlr"), 0, 0, 0, 0, 0, 0, 0, 0, ...ascii(type),
      0, 0, 0, 0,
    ];
    const m4a = { contentType: "audio/mp4", ext: "m4a" };

    expect(detectAudioType(new Uint8Array(ftyp("M4B ")))).toEqual(m4a);
    expect(detectAudioType(new Uint8Array([...ftyp("isom"), ...hdlr("soun")]))).toEqual(m4a);
    expect(detectAudioType(new Uint8Array([...ftyp("mp42"), ...hdlr("soun")]))).toEqual(m4a);
    expect(detectAudioType(new Uint8Array([...ftyp("isom"), ...hdlr("vide")]))).toBeNull();
    expect(detectAudioType(new Uint8Array([...ftyp("mp42"), ...hdlr("vide")]))).toBeNull();
    expect(detectAudioType(new Uint8Array(ftyp("qt  ")))).toBeNull();
    expect(detectAudioType(new Uint8Array(ftyp("avc1")))).toBeNull();
  });

  it("never trusts the filename: unknown bytes are null", () => {
    expect(detectAudioType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(
      detectAudioType(
        new TextEncoder().encode("<html><script>alert(1)</script></html>"),
      ),
    ).toBeNull();
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

  it("rejects a renamed non-audio file (HTML saved as .mp3 with an audio type)", async () => {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob(["<html><script>alert(1)</script></html>"], {
        type: "audio/mpeg",
      }),
      "song.mp3",
    );
    const res = await POST(
      new Request("http://localhost:3000/api/upload/audio", {
        method: "POST",
        body: formData,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Invalid audio format");
  });

  function postMp3OfSize(size: number) {
    const bytes = new Uint8Array(size);
    bytes.set(createMockMp3(), 0);
    const formData = new FormData();
    formData.append("file", toBlob(bytes, "audio/mpeg"), "clip.mp3");
    return POST(
      new Request("http://localhost:3000/api/upload/audio", {
        method: "POST",
        body: formData,
      }),
    );
  }

  it("returns 413 with a clear JSON message for audio over 4 MB", async () => {
    const res = await postMp3OfSize(MAX_AUDIO_BYTES + 1);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: AUDIO_TOO_LARGE });
  });

  it("accepts audio just under the 4 MB limit (3.9 MB)", async () => {
    const res = await postMp3OfSize(Math.floor(3.9 * 1024 * 1024));
    expect(res.status).toBe(201);
  });
});

describe("checkAudioSize (shared with the RoomPanel upload)", () => {
  it("allows up to 4 MB and rejects 4 MB + 1 byte with the same message", () => {
    expect(checkAudioSize(Math.floor(3.9 * 1024 * 1024))).toBeNull();
    expect(checkAudioSize(MAX_AUDIO_BYTES)).toBeNull();
    expect(checkAudioSize(MAX_AUDIO_BYTES + 1)).toBe(
      "Audio files can be up to 4 MB. Try a shorter clip or a 128 kbps MP3.",
    );
  });
});
