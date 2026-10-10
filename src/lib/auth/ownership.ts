import crypto from "node:crypto";
import { getStorage, type Storage } from "@/lib/storage";
import { getAuthSecret, readSessionCookie, verifySession } from "./session";

/** What callers see: `editUrl` is rebuilt for the owner on read. */
export interface UserGalleryEntry {
  id: string;
  title: string;
  createdAt: string;
  editUrl: string;
  viewUrl?: string;
}

/**
 * What is stored in `users/galleries/<userId>.json` (T-130): no plain edit key and no
 * editUrl. The key is kept only as AES-256-GCM ciphertext under a key derived from
 * AUTH_SECRET, so read access to storage alone never reveals an edit key. Entries written
 * before T-130 (with a plain `editUrl`) are converted and rewritten the first time they're read.
 */
interface StoredGalleryEntry {
  id: string;
  title: string;
  createdAt: string;
  viewUrl?: string;
  editKeyEnc?: string;
}

type RawEntry = StoredGalleryEntry & { editUrl?: string };

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

function indexCipherKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(`gv-owner-index:${secret}`).digest();
}

export function encryptEditKey(editKey: string, secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", indexCipherKey(secret), iv);
  const ct = Buffer.concat([cipher.update(editKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptEditKey(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  try {
    const [iv, tag, ct] = parts.slice(1).map((x) => Buffer.from(x, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", indexCipherKey(secret), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

function keyFromEditUrl(editUrl: string | undefined): string | null {
  if (!editUrl) return null;
  const q = editUrl.indexOf("?");
  if (q < 0) return null;
  return new URLSearchParams(editUrl.slice(q + 1)).get("key");
}

/** Converts a raw entry to the stored shape; `changed` is true when it held a plain editUrl. */
function toStored(raw: RawEntry, secret: string | null): { entry: StoredGalleryEntry; changed: boolean } {
  const { editUrl, ...rest } = raw;
  if (editUrl === undefined) return { entry: rest, changed: false };
  const entry: StoredGalleryEntry = { ...rest };
  const key = keyFromEditUrl(editUrl);
  if (key && secret && !entry.editKeyEnc) entry.editKeyEnc = encryptEditKey(key, secret);
  return { entry, changed: true };
}

function toPublic(entry: StoredGalleryEntry, secret: string | null): UserGalleryEntry {
  const { editKeyEnc, ...rest } = entry;
  const key = editKeyEnc && secret ? decryptEditKey(editKeyEnc, secret) : null;
  return {
    ...rest,
    editUrl: key ? `/edit/${rest.id}?key=${encodeURIComponent(key)}` : `/edit/${rest.id}`,
  };
}

function parseIndex(bytes: Uint8Array): RawEntry[] {
  try {
    const raw = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as { galleries?: unknown }).galleries)) {
      return (raw as { galleries: RawEntry[] }).galleries;
    }
    return [];
  } catch {
    return [];
  }
}

async function readIndex(
  userId: string,
  storage: Storage,
  secret: string | null,
): Promise<{ list: StoredGalleryEntry[]; changed: boolean }> {
  const obj = await storage.getObject(userGalleriesKey(userId));
  if (!obj) return { list: [], changed: false };
  let changed = false;
  const list = parseIndex(obj.bytes).map((raw) => {
    const r = toStored(raw, secret);
    if (r.changed) changed = true;
    return r.entry;
  });
  return { list, changed };
}

async function writeIndex(userId: string, list: StoredGalleryEntry[], storage: Storage): Promise<void> {
  await storage.putObject(
    userGalleriesKey(userId),
    Buffer.from(JSON.stringify(list)),
    "application/json",
    { public: false },
  );
}

export async function listUserGalleries(
  userId: string,
  storage: Storage = getStorage(),
  secret: string | null = getAuthSecret(),
): Promise<UserGalleryEntry[]> {
  const { list, changed } = await readIndex(userId, storage, secret);
  if (changed) {
    try {
      await writeIndex(userId, list, storage);
    } catch (err) {
      console.error("[ownership] failed to migrate owner index:", err);
    }
  }
  return list
    .map((e) => toPublic(e, secret))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Adds (or refreshes) a gallery in its owner's private index. `createdAt` is the real publish
 * time from `now()`, not the gallery document's own date (which can be a date-only/midnight
 * value that shows as the previous day in US time zones, T-126); re-publishing keeps the
 * original time. A `createdAt` passed in by the caller is ignored. The edit key carried in
 * `editUrl` is stored encrypted only (T-130).
 */
export async function recordGalleryOwner(
  entry: Omit<UserGalleryEntry, "createdAt"> & {
    userId: string;
    createdAt?: string;
  },
  storage: Storage = getStorage(),
  now: () => Date = () => new Date(),
  secret: string | null = getAuthSecret(),
): Promise<void> {
  const { userId, createdAt: _ignored, editUrl, ...rest } = entry;
  void _ignored;

  const { list } = await readIndex(userId, storage, secret);
  const key = keyFromEditUrl(editUrl);
  const editKeyEnc = key && secret ? encryptEditKey(key, secret) : undefined;

  const existingIdx = list.findIndex((g) => g.id === rest.id);
  const galleryItem: StoredGalleryEntry =
    existingIdx >= 0
      ? { ...list[existingIdx], ...rest, ...(editKeyEnc ? { editKeyEnc } : {}) }
      : { ...rest, createdAt: now().toISOString(), ...(editKeyEnc ? { editKeyEnc } : {}) };
  if (existingIdx >= 0) {
    list[existingIdx] = galleryItem;
  } else {
    list.push(galleryItem);
  }

  await writeIndex(userId, list, storage);

  await storage.putObject(
    galleryOwnerKey(galleryItem.id),
    Buffer.from(JSON.stringify({ userId })),
    "application/json",
    { public: false },
  );
}

/** The user id that owns a gallery, from its private pointer, or null. */
export async function getGalleryOwner(
  galleryId: string,
  storage: Storage = getStorage(),
): Promise<string | null> {
  const obj = await storage.getObject(galleryOwnerKey(galleryId));
  if (!obj) return null;
  try {
    const data = JSON.parse(Buffer.from(obj.bytes).toString("utf8"));
    return typeof data.userId === "string" ? data.userId : null;
  } catch {
    return null;
  }
}

export async function updateGalleryTitleInIndex(
  galleryId: string,
  newTitle: string,
  storage: Storage = getStorage(),
  fallbackUserId?: string | null,
  secret: string | null = getAuthSecret(),
): Promise<boolean> {
  const userId = (await getGalleryOwner(galleryId, storage)) ?? fallbackUserId ?? null;
  if (!userId) return false;

  const { list, changed } = await readIndex(userId, storage, secret);
  let modified = changed;
  let found = false;
  for (const item of list) {
    if (item.id === galleryId) {
      item.title = newTitle;
      modified = true;
      found = true;
    }
  }
  if (!found) {
    if (changed) await writeIndex(userId, list, storage);
    return false;
  }
  if (modified) await writeIndex(userId, list, storage);
  return true;
}
