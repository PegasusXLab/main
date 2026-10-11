import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { POST } from "./route";

describe("POST /api/narration/generate", () => {
  const originalEnv = process.env.ELEVENLABS_API_KEY;
  let localDataDir: string;

  beforeEach(async () => {
    localDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-narration-test-"));
    process.env.PEGASUS_DATA_DIR = localDataDir;
    delete process.env.ELEVENLABS_API_KEY;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("rejects empty text with 400", async () => {
    const req = new Request("http://localhost/api/narration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Text is required");
  });

  it("rejects text exceeding max character limit", async () => {
    const longText = "a".repeat(2001);
    const req = new Request("http://localhost/api/narration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: longText }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("maximum allowed length");
  });

  it("returns mock audio URL when ELEVENLABS_API_KEY is unset", async () => {
    const req = new Request("http://localhost/api/narration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Welcome to the impressionist wing of the gallery.",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        voiceName: "Rachel",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(/^\/api\/files\/audio\/narration-/);
    expect(data.text).toBe("Welcome to the impressionist wing of the gallery.");
    expect(data.voiceName).toBe("Rachel");
    expect(data.source).toBe("elevenlabs");
  });

  it("calls ElevenLabs TTS API when ELEVENLABS_API_KEY is configured", async () => {
    process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";

    const mockAudioBytes = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00]);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(mockAudioBytes, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    );

    const req = new Request("http://localhost/api/narration/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Step through the archway into the sculpture garden.",
        voiceId: "JBFqnCBsd6RMkjVDRZzb",
        voiceName: "Marcus",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(/^\/api\/files\/audio\/narration-/);
    expect(data.voiceId).toBe("JBFqnCBsd6RMkjVDRZzb");
    expect(data.voiceName).toBe("Marcus");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "xi-api-key": "test-elevenlabs-key",
        }),
      }),
    );

    process.env.ELEVENLABS_API_KEY = originalEnv;
  });
});
