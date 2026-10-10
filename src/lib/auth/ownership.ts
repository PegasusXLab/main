import { getStorage, type Storage } from "@/lib/storage";
import { getAuthSecret, readSessionCookie, verifySession } from "./session";

export interface UserGalleryEntry {
  id: string;
  title: string;
  createdAt: string;
  editUrl: string;
  viewUrl?: string;
}

export function userGalleriesKey(userId: string): string {
  return `users/galleries/${userId}.json`;
}

export function galleryOwnerKey(galleryId: string): string {
  return `users/gallery-owners/${galleryId}.json`;
}

export function getSessionUserId(
  request: Request,
  secret?: string | null,
): string | null {
  const authSecret = secret !== undefined ? secret : getAuthSecret();
  if (!authSecret) return null;
  const token = readSessionCookie(request);
  if (!token) return null;
  return verifySession(token, authSecret);
}

export async function listUserGalleries(
  userId: string,
  storage: Storage = getStorage(),
): Promise<UserGalleryEntry[]> {
  const key = userGalleriesKey(userId);
  const obj = await storage.getObject(key);
  if (!obj) return [];
  try {
    const raw = JSON.parse(Buffer.from(obj.bytes).toString("utf8"));
    const list: UserGalleryEntry[] = Array.isArray(raw)
      ? raw
      : raw &&
          typeof raw === "object" &&
          Array.isArray((raw as { galleries?: unknown }).galleries)
        ? (raw as { galleries: UserGalleryEntry[] }).galleries
        : [];
    return [...list].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function recordGalleryOwner(
  entry: UserGalleryEntry & { userId: string },
  storage: Storage = getStorage(),
): Promise<void> {
  const { userId, ...galleryItem } = entry;
  const key = userGalleriesKey(userId);

  const obj = await storage.getObject(key);
  let list: UserGalleryEntry[] = [];
  if (obj) {
    try {
      const raw = JSON.parse(Buffer.from(obj.bytes).toString("utf8"));
      list = Array.isArray(raw)
        ? raw
        : raw &&
            typeof raw === "object" &&
            Array.isArray((raw as { galleries?: unknown }).galleries)
          ? (raw as { galleries: UserGalleryEntry[] }).galleries
          : [];
    } catch {
      list = [];
    }
  }

  const existingIdx = list.findIndex((g) => g.id === galleryItem.id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...galleryItem };
  } else {
    list.push(galleryItem);
  }

  await storage.putObject(
    key,
    Buffer.from(JSON.stringify(list)),
    "application/json",
    { public: false },
  );

  await storage.putObject(
    galleryOwnerKey(galleryItem.id),
    Buffer.from(JSON.stringify({ userId })),
    "application/json",
    { public: false },
  );
}

export async function updateGalleryTitleInIndex(
  galleryId: string,
  newTitle: string,
  storage: Storage = getStorage(),
  fallbackUserId?: string | null,
): Promise<boolean> {
  let userId = fallbackUserId ?? null;

  const pointerObj = await storage.getObject(galleryOwnerKey(galleryId));
  if (pointerObj) {
    try {
      const data = JSON.parse(Buffer.from(pointerObj.bytes).toString("utf8"));
      if (typeof data.userId === "string") {
        userId = data.userId;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (!userId) return false;

  const key = userGalleriesKey(userId);
  const obj = await storage.getObject(key);
  if (!obj) return false;

  try {
    const raw = JSON.parse(Buffer.from(obj.bytes).toString("utf8"));
    const list: UserGalleryEntry[] = Array.isArray(raw)
      ? raw
      : raw &&
          typeof raw === "object" &&
          Array.isArray((raw as { galleries?: unknown }).galleries)
        ? (raw as { galleries: UserGalleryEntry[] }).galleries
        : [];

    let modified = false;
    for (const item of list) {
      if (item.id === galleryId) {
        item.title = newTitle;
        modified = true;
      }
    }

    if (modified) {
      await storage.putObject(
        key,
        Buffer.from(JSON.stringify(list)),
        "application/json",
        { public: false },
      );
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
