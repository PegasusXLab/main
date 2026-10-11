import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { DEFAULT_VOICE, CURATED_VOICES } from "@/lib/elevenlabs/voices";
import { clientIp, jsonError, rateLimited } from "@/lib/auth/http";

const MAX_TEXT_LENGTH = 2000;
/** ElevenLabs voice ids are short alphanumeric strings. */
const VOICE_ID = /^[A-Za-z0-9]{8,40}$/;
/** Anything smaller than this is not real speech (a failed / empty synthesis). */
const MIN_AUDIO_BYTES = 1024;
/** Each request spends ElevenLabs credits: cap per visitor and per server instance. */
export const PER_IP_LIMIT = { max: 12, windowMs: 10 * 60_000 };
export const GLOBAL_LIMIT = { max: 150, windowMs: 60 * 60_000 };

/**
 * Most natural-sounding ElevenLabs model (turbo trades realism for speed, which sounded robotic),
 * with a little expressiveness: lower stability lets the read vary like a person, style adds
 * emphasis, and similarity keeps it true to the chosen voice.
 */
export const TTS_MODEL = "eleven_multilingual_v2";
export const VOICE_SETTINGS = {
  stability: 0.4,
  similarity_boost: 0.8,
  style: 0.3,
  use_speaker_boost: true,
};

export const NOT_CONFIGURED =
  "ElevenLabs isn't connected: set ELEVENLABS_API_KEY on the server, then generate again.";

function apiKey(): string | undefined {
  const k = process.env.ELEVENLABS_API_KEY?.trim();
  return k ? k : undefined;
}

/** Lets the editor show "ElevenLabs not connected" before anyone presses Generate. */
export async function GET() {
  return NextResponse.json({ configured: Boolean(apiKey()) });
}

/** Only the editor on this site may spend the credits (blocks cross-site use of the endpoint). */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers / server tests omit it
  try {
    return new URL(origin).host === (req.headers.get("host") ?? new URL(req.url).host);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError(403, "Narration can only be generated from the editor");

  let body: { text?: unknown; voiceId?: unknown; voiceName?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return jsonError(400, "Text is required for narration");
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(400, `Text exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters`);
  }

  const voiceId =
    typeof body?.voiceId === "string" && body.voiceId.trim() ? body.voiceId.trim() : DEFAULT_VOICE.id;
  if (!VOICE_ID.test(voiceId)) return jsonError(400, "That doesn't look like an ElevenLabs voice ID");
  const voiceName =
    typeof body?.voiceName === "string" && body.voiceName.trim()
      ? body.voiceName.trim().slice(0, 80)
      : (CURATED_VOICES.find((v) => v.id === voiceId)?.name ?? "Docent");

  const key = apiKey();
  if (!key) {
    // Never fake it: a silent placeholder looked "Active" in the editor and played nothing.
    return NextResponse.json({ error: NOT_CONFIGURED, code: "elevenlabs_not_configured" }, { status: 503 });
  }

  if (rateLimited(`narration:${clientIp(req)}`, PER_IP_LIMIT.max, PER_IP_LIMIT.windowMs)) {
    return jsonError(429, "Too many voiceovers in a short time. Try again in a few minutes.");
  }
  if (rateLimited("narration:all", GLOBAL_LIMIT.max, GLOBAL_LIMIT.windowMs)) {
    return jsonError(429, "Voice generation is busy right now. Try again later.");
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: TTS_MODEL, voice_settings: VOICE_SETTINGS }),
      },
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let message = `ElevenLabs request failed (${response.status})`;
      try {
        const parsed = JSON.parse(errText) as { detail?: { message?: string } | string; message?: string };
        const detail = typeof parsed.detail === "string" ? parsed.detail : parsed.detail?.message;
        message = detail || parsed.message || message;
      } catch {
        // keep the generic message (never echo raw upstream bodies)
      }
      const status = response.status === 401 ? 502 : response.status >= 500 ? 502 : response.status;
      return NextResponse.json(
        {
          error: response.status === 401 ? "ElevenLabs rejected the API key. Check ELEVENLABS_API_KEY." : message,
        },
        { status },
      );
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < MIN_AUDIO_BYTES) {
      return jsonError(502, "ElevenLabs returned no audio. Try again or pick another voice.");
    }

    const storage = getStorage();
    const objectKey = `audio/narration-${nanoid(12)}.mp3`;
    await storage.putObject(objectKey, bytes, "audio/mpeg", { public: true });

    const res = NextResponse.json({
      url: storage.publicUrl(objectKey),
      text,
      voiceId,
      voiceName,
      source: "elevenlabs",
      bytes: bytes.length,
    });
    res.headers.set("X-Content-Type-Options", "nosniff");
    return res;
  } catch {
    return jsonError(502, "Couldn't reach ElevenLabs. Check the connection and try again.");
  }
}
