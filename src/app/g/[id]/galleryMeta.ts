// Link-preview data for /g/<id> (T-136): only the public title and room count,
// never the edit key or its hash.

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getStorage, type Storage } from "@/lib/storage";

export const SITE_URL = "https://galleriverse.vercel.app";
export const DESCRIPTION = "A 3D gallery. Walk through it in your browser.";

export type GalleryMeta = { title: string; rooms: number };

// Gallery ids are nanoid-style; anything else is not a gallery (and never reaches storage).
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export async function readGalleryMeta(
  id: string,
  storage: Pick<Storage, "getObject">,
): Promise<GalleryMeta | null> {
  if (!ID_PATTERN.test(id)) return null;
  try {
    const obj = await storage.getObject(`galleries/${id}.json`);
    if (!obj) return null;
    const data = JSON.parse(Buffer.from(obj.bytes).toString("utf8")) as {
      title?: unknown;
      rooms?: unknown;
    };
    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title.trim().slice(0, 120)
        : "Untitled gallery";
    const rooms = Array.isArray(data.rooms) ? data.rooms.length : 0;
    return { title, rooms };
  } catch {
    return null;
  }
}

/** Cached read for metadata and the OG image (refreshes within minutes of a save). */
export async function getGalleryMeta(id: string): Promise<GalleryMeta | null> {
  "use cache";
  cacheLife("minutes");
  return readGalleryMeta(id, getStorage());
}

export function buildGalleryMetadata(
  id: string,
  meta: GalleryMeta | null,
): Metadata {
  if (!meta) return { metadataBase: new URL(SITE_URL) };
  const title = `${meta.title} · Galleriverse`;
  const url = `/g/${id}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Galleriverse",
      title,
      description: DESCRIPTION,
      url,
    },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION },
  };
}
