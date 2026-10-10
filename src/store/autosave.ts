// Autosave the gallery being edited to localStorage (F7), so a creator never loses work.
// Debounced; restores only documents that pass validate(); never throws on storage errors
// (quota, private mode) or corrupt data. Only URLs are saved, never image data (ADR-009).

import type { Gallery } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";

export const AUTOSAVE_PREFIX = "pegasus:gallery:";
export const AUTOSAVE_DELAY_MS = 500;
/** Anything bigger means something other than URLs got into the document; don't save it. */
export const AUTOSAVE_MAX_CHARS = 1_000_000;

/** The parts of a zustand store autosave needs (works with useGalleryStore and createGalleryStore). */
export interface GalleryStoreLike {
  getState(): { gallery: Gallery };
  subscribe(
    listener: (state: { gallery: Gallery }, prev: { gallery: Gallery }) => void,
  ): () => void;
}

export interface AutosaveOptions {
  /** Defaults to window.localStorage when available. */
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  delayMs?: number;
}

export const autosaveKey = (id: string) => `${AUTOSAVE_PREFIX}${id}`;

/** localStorage, or null when it's missing or access throws (SSR, privacy settings). */
function defaultStorage(): AutosaveOptions["storage"] | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isDataUrl = (url: string | undefined) =>
  typeof url === "string" && url.startsWith("data:");

/** Drops any artwork whose image is inline data instead of a URL (ADR-009). */
function urlsOnly(gallery: Gallery): Gallery {
  const artworks = gallery.artworks.filter(
    (a) =>
      !isDataUrl(a.image.small) &&
      !isDataUrl(a.image.medium) &&
      !isDataUrl(a.image.large),
  );
  return artworks.length === gallery.artworks.length
    ? gallery
    : { ...gallery, artworks };
}

/** Writes one gallery now. Returns false (without throwing) when it couldn't be saved. */
export function saveAutosave(
  gallery: Gallery,
  key: string = gallery.id,
  opts: AutosaveOptions = {},
): boolean {
  const storage = opts.storage ?? defaultStorage();
  if (!storage) return false;
  try {
    const json = JSON.stringify(urlsOnly(gallery));
    if (json.length > AUTOSAVE_MAX_CHARS) return false;
    storage.setItem(autosaveKey(key), json);
    return true;
  } catch {
    return false; // quota exceeded, private mode, …
  }
}

/** The saved gallery for `id`, or null if there is none or it's corrupt / invalid. Never throws. */
export function loadAutosave(
  id: string,
  opts: AutosaveOptions = {},
): Gallery | null {
  const storage = opts.storage ?? defaultStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(autosaveKey(id));
    if (!raw) return null;
    const result = validate(JSON.parse(raw));
    return result.ok ? result.gallery : null;
  } catch {
    return null;
  }
}

export function clearAutosave(id: string, opts: AutosaveOptions = {}): void {
  try {
    (opts.storage ?? defaultStorage())?.removeItem(autosaveKey(id));
  } catch {
    // ignore
  }
}

/**
 * Saves the store's gallery under `pegasus:gallery:<key>` (default: the gallery's id) whenever it
 * changes, debounced. Returns a stop function that flushes a pending save and unsubscribes.
 */
export function startAutosave(
  store: GalleryStoreLike,
  key?: string,
  opts: AutosaveOptions = {},
): () => void {
  const delay = opts.delayMs ?? AUTOSAVE_DELAY_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    const { gallery } = store.getState();
    saveAutosave(gallery, key ?? gallery.id, opts);
  };

  const unsubscribe = store.subscribe((state, prev) => {
    if (state.gallery === prev.gallery) return; // selection / view changes don't touch the document
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(flush, delay);
  });

  return () => {
    unsubscribe();
    flush();
  };
}
