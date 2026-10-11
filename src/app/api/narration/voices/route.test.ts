import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, resetVoicesCacheForTests } from "./route";
import { resetAttemptsForTests } from "@/lib/auth/http";

const req = () => new Request("http://localhost/api/narration/voices");

describe("GET /api/narration/voices", () => {
  const original = process.env.ELEVENLABS_API_KEY;
  beforeEach(() => {
    resetVoicesCacheForTests();
    resetAttemptsForTests();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    if (original === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = original;
  });

  it("returns nothing (and calls nothing) without a key", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await (await GET(req())).json()).toEqual({ configured: false, voices: [] });
    expect(spy).not.toHaveBeenCalled();
  });

  it("lists the account's voices, own voices first, with safe preview urls", async () => {
    process.env.ELEVENLABS_API_KEY = "k";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          voices: [
            { voice_id: "aaa111bbb222", name: "Sarah", category: "premade", preview_url: "https://cdn/x.mp3", labels: { accent: "american" } },
            { voice_id: "ccc333ddd444", name: "My voice", category: "cloned", preview_url: "javascript:alert(1)" },
          ],
        }),
        { status: 200 },
      ),
    );
    const data = await (await GET(req())).json();
    expect(data.configured).toBe(true);
    expect(data.voices.map((v: { name: string }) => v.name)).toEqual(["My voice", "Sarah"]);
    expect(data.voices[0].previewUrl).toBeNull();
    expect(data.voices[1].previewUrl).toBe("https://cdn/x.mp3");
    expect(data.voices[1].description).toContain("american");
  });
});
