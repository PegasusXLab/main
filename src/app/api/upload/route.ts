import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per image

export function isWebP(bytes: Uint8Array): boolean {
  if (bytes.length < 12) return false;
  // RIFF header: 0x52, 0x49, 0x46, 0x46 ("RIFF")
  if (
    bytes[0] !== 0x52 ||
    bytes[1] !== 0x49 ||
    bytes[2] !== 0x46 ||
    bytes[3] !== 0x46
  ) {
    return false;
  }
  // WEBP container: 0x57, 0x45, 0x42, 0x50 ("WEBP")
  if (
    bytes[8] !== 0x57 ||
    bytes[9] !== 0x45 ||
    bytes[10] !== 0x42 ||
    bytes[11] !== 0x50
  ) {
    return false;
  }
  return true;
}

/** Images we accept, identified by magic bytes (never the declared type). WebP is preferred;
 * JPEG and PNG are the fallback for browsers that can't encode WebP from a canvas (Safari, T-070). */
export interface ImageType {
  contentType: "image/webp" | "image/jpeg" | "image/png";
  ext: "webp" | "jpg" | "png";
}

export function imageType(bytes: Uint8Array): ImageType | null {
  if (isWebP(bytes)) return { contentType: "image/webp", ext: "webp" };
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: "image/png", ext: "png" };
  }
  return null;
}

const INVALID_FORMAT =
  "Invalid file format: must be a WebP, JPEG or PNG image (checked by magic bytes)";

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

  const smallEntry = formData.get("small");
  const mediumEntry = formData.get("medium");
  const largeEntry = formData.get("large");

  if (!smallEntry || !(smallEntry instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required "small" image file' },
      { status: 400 },
    );
  }

  if (!mediumEntry || !(mediumEntry instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required "medium" image file' },
      { status: 400 },
    );
  }

  const smallBytes = new Uint8Array(await smallEntry.arrayBuffer());
  const mediumBytes = new Uint8Array(await mediumEntry.arrayBuffer());

  // Size cap checks
  if (smallBytes.length > MAX_FILE_SIZE || mediumBytes.length > MAX_FILE_SIZE) {
    return new NextResponse("Payload Too Large: image exceeds 2 MB limit", {
      status: 413,
    });
  }

  // Magic bytes checks
  const smallType = imageType(smallBytes);
  const mediumType = imageType(mediumBytes);
  if (!smallType || !mediumType) {
    return NextResponse.json({ error: INVALID_FORMAT }, { status: 400 });
  }

  let largeBytes: Uint8Array | null = null;
  let largeType: ImageType | null = null;
  if (largeEntry) {
    if (!(largeEntry instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid "large" image entry' },
        { status: 400 },
      );
    }
    largeBytes = new Uint8Array(await largeEntry.arrayBuffer());
    if (largeBytes.length > MAX_FILE_SIZE) {
      return new NextResponse("Payload Too Large: image exceeds 2 MB limit", {
        status: 413,
      });
    }
    largeType = imageType(largeBytes);
    if (!largeType) {
      return NextResponse.json({ error: INVALID_FORMAT }, { status: 400 });
    }
  }

  const storage = getStorage();
  const imageId = nanoid();

  const put = async (name: string, bytes: Uint8Array, type: ImageType) => {
    const key = `images/${imageId}/${name}.${type.ext}`;
    await storage.putObject(key, bytes, type.contentType, { public: true });
    return storage.publicUrl(key);
  };

  const urls: { small: string; medium: string; large?: string } = {
    small: await put("small", smallBytes, smallType),
    medium: await put("medium", mediumBytes, mediumType),
  };
  if (largeBytes && largeType) {
    urls.large = await put("large", largeBytes, largeType);
  }

  return NextResponse.json(urls, { status: 201 });
}
