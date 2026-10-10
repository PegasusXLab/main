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
  if (!isWebP(smallBytes) || !isWebP(mediumBytes)) {
    return NextResponse.json(
      {
        error: "Invalid file format: must be valid WebP image with magic bytes",
      },
      { status: 400 },
    );
  }

  let largeBytes: Uint8Array | null = null;
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
    if (!isWebP(largeBytes)) {
      return NextResponse.json(
        {
          error:
            "Invalid file format: must be valid WebP image with magic bytes",
        },
        { status: 400 },
      );
    }
  }

  const storage = getStorage();
  const imageId = nanoid();

  const smallKey = `images/${imageId}/small.webp`;
  await storage.putObject(smallKey, smallBytes, "image/webp", { public: true });

  const mediumKey = `images/${imageId}/medium.webp`;
  await storage.putObject(mediumKey, mediumBytes, "image/webp", {
    public: true,
  });

  const urls: { small: string; medium: string; large?: string } = {
    small: storage.publicUrl(smallKey),
    medium: storage.publicUrl(mediumKey),
  };

  if (largeBytes) {
    const largeKey = `images/${imageId}/large.webp`;
    await storage.putObject(largeKey, largeBytes, "image/webp", {
      public: true,
    });
    urls.large = storage.publicUrl(largeKey);
  }

  return NextResponse.json(urls, { status: 201 });
}
