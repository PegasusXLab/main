import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { FONT_TOO_LARGE, checkFontSize, detectFontType } from "@/lib/fontLimit";
import { getStorage } from "@/lib/storage";

/**
 * Upload a custom room-title font. The type comes from the file's signature only (a renamed
 * non-font is rejected); stored under fonts/ and served same-origin with nosniff.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'Missing required "file" font upload' }, { status: 400 });
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "Font file is empty" }, { status: 400 });
  }
  if (checkFontSize(bytes.length)) {
    return NextResponse.json({ error: FONT_TOO_LARGE }, { status: 413 });
  }
  const type = detectFontType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: "Invalid font: use a .woff2, .woff, .otf or .ttf file" },
      { status: 400 },
    );
  }

  const storage = getStorage();
  const key = `fonts/${nanoid()}.${type.ext}`;
  await storage.putObject(key, bytes, type.contentType, { public: true });

  const res = NextResponse.json(
    {
      url: storage.publicUrl(key),
      filename: fileEntry.name,
      size: bytes.length,
      contentType: type.contentType,
    },
    { status: 201 },
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}
