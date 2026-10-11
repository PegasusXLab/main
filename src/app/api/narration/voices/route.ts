import { NextResponse } from "next/server";
import { clientIp, jsonError, rateLimited } from "@/lib/auth/http";
import { shortVoiceName } from "@/lib/elevenlabs/voices";

export interface VoiceSummary {
  id: string;
  name: string;
  /** "premade" (ElevenLabs library), "cloned", "generated", "professional"… */
  category: string;
  description: string;
  previewUrl: string | null;
}

const CACHE_MS = 10 * 60_000;
let cache: { at: number; voices: VoiceSummary[] } | null = null;

export function resetVoicesCacheForTests(): void {
  cache = null;
}

/** Your ElevenLabs account's voices (library + your clones), so the editor offers real ones with previews. */
export async function GET(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return NextResponse.json({ configured: false, voices: [] });
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({ configured: true, voices: cache.voices });
  }
  if (rateLimited(`voices:${clientIp(req)}`, 20, 10 * 60_000)) {
    return jsonError(429, "Too many requests. Try again in a few minutes.");
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": key } });
    if (!res.ok) return jsonError(502, `Couldn't load ElevenLabs voices (${res.status})`);
    const data = (await res.json()) as {
      voices?: {
        voice_id?: string;
        name?: string;
        category?: string;
        description?: string | null;
        preview_url?: string | null;
        labels?: Record<string, string>;
      }[];
    };
    const voices: VoiceSummary[] = (data.voices ?? [])
      .filter((v) => typeof v.voice_id === "string" && typeof v.name === "string")
      .map((v) => {
        const labels = v.labels ?? {};
        const bits = [labels.accent, labels.description ?? labels.descriptive, labels.use_case]
          .filter(Boolean)
          .join(" · ");
        // "Jessica - Playful, Bright, Warm": name "Jessica", the rest describes it.
        const name = shortVoiceName(v.name!);
        const tail = v.name!.slice(name.length).replace(/^\s*[-–—|(]\s*|\)\s*$/g, "").trim();
        return {
          id: v.voice_id!,
          name,
          category: v.category ?? "premade",
          description: (tail || v.description || bits || "").slice(0, 140),
          previewUrl: typeof v.preview_url === "string" && v.preview_url.startsWith("https://") ? v.preview_url : null,
        };
      })
      // Your own voices first, then the library, alphabetically.
      .sort((a, b) => Number(a.category === "premade") - Number(b.category === "premade") || a.name.localeCompare(b.name));
    cache = { at: Date.now(), voices };
    return NextResponse.json({ configured: true, voices });
  } catch {
    return jsonError(502, "Couldn't reach ElevenLabs");
  }
}
