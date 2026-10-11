"use client";

import { checkFontSize } from "@/lib/fontLimit";

const FONT_EXT = /\.(woff2|woff|otf|ttf)$/i;

/** Client-side checks before a font leaves the browser. Pure, unit-tested. */
export function validateFontFile(file: { name: string; size: number }): string | null {
  if (!FONT_EXT.test(file.name)) return "Please choose a .woff2, .woff, .otf or .ttf font";
  return checkFontSize(file.size);
}

/** POST a font to /api/upload/font; the server re-checks size and signature. */
export async function uploadFont(
  file: File,
  fetchImpl: typeof fetch = fetch,
): Promise<{ url: string }> {
  const problem = validateFontFile(file);
  if (problem) throw new Error(problem);
  const form = new FormData();
  form.append("file", file, file.name);
  const res = await fetchImpl("/api/upload/font", { method: "POST", body: form });
  let body: { url?: string; error?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    // fall through
  }
  if (!res.ok || !body.url) throw new Error(body.error ?? `Upload failed (${res.status})`);
  return { url: body.url };
}
