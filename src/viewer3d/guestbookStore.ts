import { create } from "zustand";
import type { GuestbookEntry } from "@/lib/guestbook";

// The open gallery's guestbook: loaded once by the tour, read by the 3D book (latest names on its
// pages) and the guestbook panel (list + sign form).

export interface GuestbookState {
  galleryId: string | null;
  entries: GuestbookEntry[];
  loaded: boolean;
  load: (galleryId: string) => Promise<void>;
  sign: (name: string, message: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const useGuestbookStore = create<GuestbookState>((set, get) => ({
  galleryId: null,
  entries: [],
  loaded: false,
  load: async (galleryId) => {
    if (get().galleryId === galleryId && get().loaded) return;
    set({ galleryId, entries: [], loaded: false });
    try {
      const res = await fetch(`/api/galleries/${encodeURIComponent(galleryId)}/guestbook`, { cache: "no-store" });
      const data = res.ok ? ((await res.json()) as { entries?: GuestbookEntry[] }) : { entries: [] };
      if (get().galleryId === galleryId) set({ entries: data.entries ?? [], loaded: true });
    } catch {
      if (get().galleryId === galleryId) set({ loaded: true });
    }
  },
  sign: async (name, message) => {
    const id = get().galleryId;
    if (!id) return { ok: false, error: "Guestbook unavailable" };
    try {
      const res = await fetch(`/api/galleries/${encodeURIComponent(id)}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { entry?: GuestbookEntry; error?: string };
      if (!res.ok || !data.entry) return { ok: false, error: data.error ?? "Couldn't sign, try again" };
      set({ entries: [data.entry, ...get().entries] });
      return { ok: true };
    } catch {
      return { ok: false, error: "You're offline, try again" };
    }
  },
}));
