import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";

const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15 MB per audio file

export interface AudioFileType {
  contentType: string;
  ext: string;
}

/**
 * Audio type from the file's signature (magic bytes) only. The filename and the declared
 * Content-Type are never trusted, so a renamed non-audio file is rejected (T-123).
 */
export function detectAudioType(bytes: Uint8Array): AudioFileType | null {
  // 1. ID3v2 tag (MP3)
  if (
    bytes.length >= 3 &&
    bytes[0] === 0x49 &&
    bytes[1] === 0x44 &&
    bytes[2] === 0x33
  ) {
    return { contentType: "audio/mpeg", ext: "mp3" };
  }

  // 2. MP3 frame sync (0xFF followed by high 3 bits set)
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return { contentType: "audio/mpeg", ext: "mp3" };
  }

  // 3. RIFF WAVE
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45
  ) {
    return { contentType: "audio/wav", ext: "wav" };
  }

  // 4. OggS
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return { contentType: "audio/ogg", ext: "ogg" };
  }

  // 5. ISO base media file / M4A (ftyp)
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return { contentType: "audio/mp4", ext: "m4a" };
  }

  return null;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file") ?? formData.get("audio");
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required "file" audio upload' },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
  }

  if (bytes.length > MAX_AUDIO_SIZE) {
    return new NextResponse("Payload Too Large: audio exceeds 15 MB limit", {
      status: 413,
    });
  }

  const type = detectAudioType(bytes);
  if (!type) {
    return NextResponse.json(
      {
        error:
          "Invalid audio format: must be an MP3, WAV, OGG, or M4A audio file",
      },
      { status: 400 },
    );
  }

  const storage = getStorage();
  const audioId = nanoid();
  const key = `audio/${audioId}.${type.ext}`;

  await storage.putObject(key, bytes, type.contentType, { public: true });
  const url = storage.publicUrl(key);

  return NextResponse.json(
    {
      url,
      filename: fileEntry.name,
      size: bytes.length,
      contentType: type.contentType,
    },
    { status: 201 },
  );
}
