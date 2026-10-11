import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";

const MAX_BYTES = 4 * 1024 * 1024;
const TOO_LARGE =
  "Animated art can be up to 4 MB. Try a shorter clip (10-15 s at 720p) or a smaller GIF.";
const brands = new Set(["isom", "mp42", "avc1", "iso2", "mp41"]);

// Walk ISO BMFF boxes, including moov at the end of non-fast-start MP4s.
// Never treat an arbitrary 'vide' string inside mdat as a video track.
function hasVideo(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (at: number) =>
    String.fromCharCode(...bytes.subarray(at, at + 4));
  let branded = false;
  let video = false;
  function walk(start: number, end: number, parents: string[]): boolean {
    for (let at = start; at < end;) {
      if (end - at < 8) return false;
      let size = view.getUint32(at);
      let header = 8;
      if (size === 1) {
        if (end - at < 16) return false;
        const extended = view.getBigUint64(at + 8);
        if (extended > BigInt(end - at)) return false;
        size = Number(extended);
        header = 16;
      } else if (size === 0) size = end - at;
      if (size < header || size > end - at) return false;
      const type = text(at + 4);
      const data = at + header;
      const stop = at + size;
      if (type === "ftyp" && parents.length === 0) {
        if (size < header + 8 || (size - header) % 4 !== 0) return false;
        for (let p = data; p < stop; p += 4) {
          if (p !== data + 4 && brands.has(text(p))) branded = true;
        }
      }
      if (
        type === "hdlr" &&
        parents.join("/") === "moov/trak/mdia" &&
        stop - data >= 12
      ) {
        if (text(data + 8) === "vide") video = true;
      }
      const expected = ["moov", "trak", "mdia"][parents.length];
      if (type === expected && !walk(data, stop, [...parents, type]))
        return false;
      at = stop;
    }
    return true;
  }
  return walk(0, bytes.length, []) && branded && video;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json(
      { error: "Choose a GIF or MP4 file" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: TOO_LARGE }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  const gif =
    bytes.length >= 13 &&
    (signature === "GIF87a" || signature === "GIF89a") &&
    (bytes[6] | (bytes[7] << 8)) > 0 &&
    (bytes[8] | (bytes[9] << 8)) > 0;
  const kind = gif ? "gif" : hasVideo(bytes) ? "video" : null;
  if (!kind)
    return NextResponse.json(
      {
        error:
          "Choose a valid GIF or MP4 video (audio-only files are not supported).",
      },
      { status: 415 },
    );
  const key = "media/" + nanoid() + "." + (gif ? "gif" : "mp4");
  try {
    await getStorage().putObject(key, bytes, gif ? "image/gif" : "video/mp4", {
      public: true,
    });
    return NextResponse.json(
      { url: "/api/files/" + key, kind },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
