import { NextResponse } from "next/server";
import { validate } from "@/lib/schema/validate";
import type { Gallery } from "@/lib/schema/types";
import { getStorage } from "@/lib/storage";
import { verifyEditKey } from "@/lib/server/editKey";
import {
  getGalleryOwner,
  getSessionUserId,
  updateGalleryTitleInIndex,
} from "@/lib/auth/ownership";

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB limit

function hasImageData(gallery: Gallery): boolean {
  for (const art of gallery.artworks) {
    const { small, medium, large } = art.image;
    if (
      small.startsWith("data:") ||
      medium.startsWith("data:") ||
      (large && large.startsWith("data:"))
    ) {
      return true;
    }
  }
  return false;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id?: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const storage = getStorage();
  const obj = await storage.getObject(`galleries/${id}.json`);
  if (!obj) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(Buffer.from(obj.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id?: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Enforce body size limit
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  // Authorized by a valid edit key (header) OR by the session of the gallery's owner (T-130).
  const storage = getStorage();
  const editKey = request.headers.get("x-edit-key");
  const sessionUserId = getSessionUserId(request);
  let authorized = false;
  if (editKey) {
    const hashObj = await storage.getObject(`edit-keys/${id}.hash`);
    if (hashObj) {
      const storedHash = new TextDecoder().decode(hashObj.bytes).trim();
      authorized = await verifyEditKey(editKey, storedHash);
    }
  }
  if (!authorized && sessionUserId) {
    authorized = (await getGalleryOwner(id, storage)) === sessionUserId;
  }
  if (!authorized) {
    return new NextResponse(
      editKey ? "Forbidden: invalid edit key" : "Forbidden: missing edit key",
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { issues: [{ path: "", message: "Invalid JSON body" }] },
      { status: 400 },
    );
  }

  const validation = validate(body);
  if (!validation.ok) {
    return NextResponse.json({ issues: validation.issues }, { status: 400 });
  }

  const gallery = validation.gallery;
  if (hasImageData(gallery)) {
    return NextResponse.json(
      {
        issues: [
          {
            path: "artworks",
            message:
              "Image data URLs not allowed; upload images first (ADR-009)",
          },
        ],
      },
      { status: 400 },
    );
  }

  // Keep original gallery id and bump updatedAt
  gallery.id = id;
  gallery.updatedAt = new Date().toISOString();

  await storage.putObject(
    `galleries/${id}.json`,
    Buffer.from(JSON.stringify(gallery)),
    "application/json",
    { public: false },
  );

  // Update title in owner's index if the gallery is in it (T-102)
  try {
    await updateGalleryTitleInIndex(id, gallery.title, storage, sessionUserId);
  } catch (err) {
    console.error("[ownership] failed to update title in index:", err);
  }

  return NextResponse.json(gallery, { status: 200 });
}
