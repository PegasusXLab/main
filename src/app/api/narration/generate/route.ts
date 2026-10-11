import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { DEFAULT_VOICE, CURATED_VOICES } from "@/lib/elevenlabs/voices";

const MAX_TEXT_LENGTH = 2000;

/** Minimal valid MP3 byte sequence used when ELEVENLABS_API_KEY is unset in local/test dev. */
function createMockMp3(): Uint8Array {
  return new Uint8Array([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Text is required for narration" }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const voiceId = typeof body?.voiceId === "string" && body.voiceId.trim()
      ? body.voiceId.trim()
      : DEFAULT_VOICE.id;
    const voiceName = typeof body?.voiceName === "string" && body.voiceName.trim()
      ? body.voiceName.trim()
      : (CURATED_VOICES.find((v) => v.id === voiceId)?.name ?? "Docent");

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const storage = getStorage();
    const key = `audio/narration-${nanoid(12)}.mp3`;

    if (!apiKey) {
      // In development / testing without an API key, store a mock audio file
      // so workflows continue without crashing.
      const mockBytes = createMockMp3();
      await storage.putObject(key, mockBytes, "audio/mpeg", { public: true });
      return NextResponse.json({
        url: storage.publicUrl(key),
        text,
        voiceId,
        voiceName,
        source: "elevenlabs",
        warning: "ELEVENLABS_API_KEY not configured; generated mock placeholder audio.",
      });
    }

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let parsedError = "ElevenLabs TTS request failed";
      try {
        const parsed = JSON.parse(errText);
        parsedError = parsed.detail?.message || parsed.message || parsedError;
      } catch {
        if (errText) parsedError = errText;
      }
      return NextResponse.json({ error: parsedError }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await storage.putObject(key, buffer, "audio/mpeg", { public: true });

    return NextResponse.json({
      url: storage.publicUrl(key),
      text,
      voiceId,
      voiceName,
      source: "elevenlabs",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
