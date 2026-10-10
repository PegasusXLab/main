import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { validate } from "@/lib/schema/validate";
import type { Gallery } from "@/lib/schema/types";
import { getStorage } from "@/lib/storage";
import { generateEditKey, hashEditKey } from "@/lib/server/editKey";
import { getSessionUserId, recordGalleryOwner } from "@/lib/auth/ownership";

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

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return new NextResponse("Payload Too Large", { status: 413 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return new NextResponse("Payload Too Large", { status: 413 });
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

  // Assign new server id and timestamps
  const id = nanoid();
  const now = new Date().toISOString();
  gallery.id = id;
  gallery.createdAt = gallery.createdAt || now;
  gallery.updatedAt = now;

  // Generate edit key and hash
  const editKey = generateEditKey();
  const keyHash = await hashEditKey(editKey);

  const storage = getStorage();

  // Store JSON and key hash privately
  await storage.putObject(
    `galleries/${id}.json`,
    Buffer.from(JSON.stringify(gallery)),
    "application/json",
    { public: false },
  );

  await storage.putObject(
    `edit-keys/${id}.hash`,
    Buffer.from(keyHash),
    "text/plain",
    { public: false },
  );

  // Record ownership if the creator is logged in (T-102); index failure never fails the publish
  try {
    const userId = getSessionUserId(request);
    if (userId) {
      await recordGalleryOwner(
        {
          userId,
          id,
          title: gallery.title,
          createdAt: gallery.createdAt,
          editUrl: `/edit/${id}?key=${editKey}`,
          viewUrl: `/g/${id}`,
        },
        storage,
      );
    }
  } catch (err) {
    console.error("[ownership] failed to record gallery owner:", err);
  }

  return NextResponse.json(
    {
      id,
      editKey,
      viewUrl: `/g/${id}`,
      editUrl: `/edit/${id}?key=${editKey}`,
    },
    { status: 201 },
  );
}
