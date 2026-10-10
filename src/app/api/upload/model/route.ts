import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { MODEL_TOO_LARGE, checkModelSize } from "@/lib/modelLimit";
import { getStorage } from "@/lib/storage";

/**
 * GLB type from the file's signature (magic bytes) only. The filename and the declared
 * Content-Type are never trusted, so a renamed non-model file is rejected (T-132).
 * A binary glTF file starts with the 12-byte header: magic "glTF", version, length.
 */
export function detectModelType(bytes: Uint8Array): {
  contentType: string;
  ext: string;
} | null {
  if (bytes.length < 12) return null;
  if (
    bytes[0] === 0x67 && // g
    bytes[1] === 0x6c && // l
    bytes[2] === 0x54 && // T
    bytes[3] === 0x46 // F
  ) {
    return { contentType: "model/gltf-binary", ext: "glb" };
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

  const fileEntry = formData.get("file") ?? formData.get("model");
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json(
      { error: 'Missing required "file" model upload' },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.length === 0) {
    return NextResponse.json({ error: "3D file is empty" }, { status: 400 });
  }

  if (checkModelSize(bytes.length)) {
    return NextResponse.json({ error: MODEL_TOO_LARGE }, { status: 413 });
  }

  const type = detectModelType(bytes);
  if (!type) {
    return NextResponse.json(
      {
        error: "Invalid 3D file: must be a .glb (binary glTF) export",
      },
      { status: 400 },
    );
  }

  const storage = getStorage();
  const modelId = nanoid();
  const key = `models/${modelId}.${type.ext}`;

  await storage.putObject(key, bytes, type.contentType, { public: true });
  const url = storage.publicUrl(key);

  const res = NextResponse.json(
    {
      url,
      filename: fileEntry.name,
      size: bytes.length,
      contentType: type.contentType,
    },
    { status: 201 },
  );
  // A model that runs code on load would be an XSS vector; GLBs are data, and nosniff keeps
  // browsers from reinterpreting them (T-132).
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}
