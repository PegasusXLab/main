import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { GET, NOT_CONFIGURED, PER_IP_LIMIT, POST } from "./route";
import { resetAttemptsForTests } from "@/lib/auth/http";
import { getStorage } from "@/lib/storage";

const speech = () => new Uint8Array(4096).fill(0x55); // stands in for a real MP3 body

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/narration/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost", ...headers },
    body: JSON.stringify(body),
  });
}

describe("/api/narration/generate", () => {
  const originalEnv = process.env.ELEVENLABS_API_KEY;
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-narration-test-"));
    process.env.PEGASUS_DATA_DIR = dir;
    delete process.env.ELEVENLABS_API_KEY;
    resetAttemptsForTests();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    if (originalEnv === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = originalEnv;
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("reports whether ElevenLabs is configured (never the key)", async () => {
    expect(await (await GET()).json()).toEqual({ configured: false });
    process.env.ELEVENLABS_API_KEY = "k";
    expect(await (await GET()).json()).toEqual({ configured: true });
  });

  it("rejects empty and over-long text", async () => {
    expect((await POST(req({ text: "   " }))).status).toBe(400);
    expect((await POST(req({ text: "a".repeat(2001) }))).status).toBe(400);
  });

  it("refuses with 503 (no silent placeholder) when the key is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await POST(req({ text: "Welcome to the impressionist wing." }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe(NOT_CONFIGURED);
    expect(data.code).toBe("elevenlabs_not_configured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("calls ElevenLabs and stores the real audio", async () => {
    process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(speech(), { status: 200, headers: { "Content-Type": "audio/mpeg" } }));

    const res = await POST(
      req({ text: "Step through the archway.", voiceId: "JBFqnCBsd6RMkjVDRZzb", voiceName: "Marcus" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toMatch(/^\/api\/files\/audio\/narration-/);
    expect(data.voiceName).toBe("Marcus");
    expect(data.bytes).toBe(4096);
    const stored = await getStorage().getObject(data.url.replace(/^\/api\/files\//, ""));
    expect(stored?.bytes.length).toBe(4096);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
      expect.objectContaining({ headers: expect.objectContaining({ "xi-api-key": "test-elevenlabs-key" }) }),
    );
  });

  it("refuses to save an empty synthesis", async () => {
    process.env.ELEVENLABS_API_KEY = "k";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(new Uint8Array(20), { status: 200 }));
    const res = await POST(req({ text: "Hello" }));
    expect(res.status).toBe(502);
  });

  it("explains a rejected API key", async () => {
    process.env.ELEVENLABS_API_KEY = "bad";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: { message: "Invalid API key" } }), { status: 401 }),
    );
    const res = await POST(req({ text: "Hello" }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("rejected the API key");
  });

  it("blocks other sites and malformed voice ids", async () => {
    process.env.ELEVENLABS_API_KEY = "k";
    expect((await POST(req({ text: "Hi" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(req({ text: "Hi", voiceId: "../../v1/user" }))).status).toBe(400);
  });

  it("rate-limits one visitor", async () => {
    process.env.ELEVENLABS_API_KEY = "k";
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(speech(), { status: 200 }));
    const headers = { "x-forwarded-for": "203.0.113.9" };
    for (let i = 0; i < PER_IP_LIMIT.max; i++) expect((await POST(req({ text: "Hi" }, headers))).status).toBe(200);
    expect((await POST(req({ text: "Hi" }, headers))).status).toBe(429);
  });
});
