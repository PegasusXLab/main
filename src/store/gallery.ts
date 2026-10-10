// The gallery store: the one place the document lives in the browser (plan/architecture.md §4).
// The state and action names are a frozen contract that builder-2's editor codes against.
// Changes go through the senior.
//
// Rules:
// - Rect fields (x, y, w, d) are snapped to the 0.5 m grid; every document change bumps `updatedAt`.
// - Overlap is NOT checked here. The editor checks it before calling addRoom / updateRoom (T-021).
// - Readers subscribe per field, e.g. useGalleryStore((s) => s.selection), never the whole store (R11).
// - Calls that change nothing (unknown id, same value) don't notify subscribers.

import { nanoid } from "nanoid";
import { create } from "zustand";
import { createStore, type StateCreator } from "zustand/vanilla";
import sample from "@/fixtures/sample-3room.json";
import { newRoom } from "@/lib/schema/defaults";
import { snap } from "@/lib/schema/geom";
import type { Artwork, Gallery, Room } from "@/lib/schema/types";

export type Selection =
  | { kind: "none" }
  | { kind: "room"; id: string }
  | { kind: "artwork"; id: string };

export type View = "2d" | "3d";

export type RoomPatch = Partial<Omit<Room, "id">>;
export type ArtworkPatch = Partial<Omit<Artwork, "id">>;

export interface GalleryState {
  gallery: Gallery;
  selection: Selection;
  view: View;

  loadGallery: (g: Gallery) => void;
  setTitle: (t: string) => void;
  setEntrance: (roomId: string) => void;

  /** Adds a room (6 × 6 m unless w / d are given), snapped to the grid. Returns the new id. */
  addRoom: (rect: { x: number; y: number; w?: number; d?: number }) => string;
  updateRoom: (id: string, patch: RoomPatch) => void;
  /** Deletes the room and its artwork. Refuses (returns false) for the last room. */
  deleteRoom: (id: string) => boolean;

  /** Adds an artwork and returns its id, or null if `a.roomId` is not a room in the gallery. */
  addArtwork: (a: Omit<Artwork, "id">) => string | null;
  updateArtwork: (id: string, patch: ArtworkPatch) => void;
  deleteArtwork: (id: string) => void;

  select: (selection: Selection) => void;
  setView: (v: View) => void;
}

const NONE: Selection = { kind: "none" };
const RECT_KEYS = ["x", "y", "w", "d"] as const;

const now = () => new Date().toISOString();

/** The sample gallery, used when no document is given. */
export function sampleGallery(): Gallery {
  return structuredClone(sample) as Gallery;
}

function snapPatch(patch: RoomPatch): RoomPatch {
  const out = { ...patch };
  for (const k of RECT_KEYS) if (out[k] !== undefined) out[k] = snap(out[k]);
  return out;
}

/** True when applying `patch` to `target` would change nothing (shallow compare per field). */
function isNoop<T extends object>(target: T, patch: Partial<T>): boolean {
  return (Object.keys(patch) as (keyof T)[]).every((k) =>
    Object.is(target[k], patch[k]),
  );
}

function sameSelection(a: Selection, b: Selection): boolean {
  return (
    a.kind === b.kind &&
    (a.kind === "none" || a.id === (b as { id: string }).id)
  );
}

const initializer =
  (initial?: Gallery): StateCreator<GalleryState> =>
  (set, get) => {
    /** Replace the document and bump updatedAt. */
    const commit = (
      gallery: Omit<Gallery, "updatedAt">,
      extra: Partial<GalleryState> = {},
    ) => set({ gallery: { ...gallery, updatedAt: now() }, ...extra });

    return {
      gallery: initial ?? sampleGallery(),
      selection: NONE,
      view: "2d",

      loadGallery: (g) => set({ gallery: g, selection: NONE }),

      setTitle: (t) => {
        const { gallery } = get();
        if (gallery.title !== t) commit({ ...gallery, title: t });
      },

      setEntrance: (roomId) => {
        const { gallery } = get();
        if (gallery.entranceRoomId === roomId) return;
        if (!gallery.rooms.some((r) => r.id === roomId)) return;
        commit({ ...gallery, entranceRoomId: roomId });
      },

      addRoom: (rect) => {
        const { gallery } = get();
        const room = newRoom(rect, `Room ${gallery.rooms.length + 1}`);
        commit({ ...gallery, rooms: [...gallery.rooms, room] });
        return room.id;
      },

      updateRoom: (id, patch) => {
        const { gallery } = get();
        const i = gallery.rooms.findIndex((r) => r.id === id);
        if (i < 0) return;
        const snapped = snapPatch(patch);
        if (isNoop(gallery.rooms[i], snapped)) return;
        const rooms = gallery.rooms.slice();
        rooms[i] = { ...rooms[i], ...snapped };
        commit({ ...gallery, rooms });
      },

      deleteRoom: (id) => {
        const { gallery, selection } = get();
        if (!gallery.rooms.some((r) => r.id === id)) return false;
        if (gallery.rooms.length === 1) return false; // a gallery always keeps one room (G9)
        const rooms = gallery.rooms.filter((r) => r.id !== id);
        const removedArt = new Set(
          gallery.artworks.filter((a) => a.roomId === id).map((a) => a.id),
        );
        const artworks = gallery.artworks.filter((a) => !removedArt.has(a.id));
        const entranceRoomId =
          gallery.entranceRoomId === id ? rooms[0].id : gallery.entranceRoomId;
        const selectionGone =
          (selection.kind === "room" && selection.id === id) ||
          (selection.kind === "artwork" && removedArt.has(selection.id));
        commit(
          { ...gallery, rooms, artworks, entranceRoomId },
          selectionGone ? { selection: NONE } : {},
        );
        return true;
      },

      addArtwork: (a) => {
        const { gallery } = get();
        if (!gallery.rooms.some((r) => r.id === a.roomId)) return null;
        const artwork: Artwork = { ...a, id: nanoid() };
        commit({ ...gallery, artworks: [...gallery.artworks, artwork] });
        return artwork.id;
      },

      updateArtwork: (id, patch) => {
        const { gallery } = get();
        const i = gallery.artworks.findIndex((a) => a.id === id);
        if (i < 0) return;
        if (
          patch.roomId !== undefined &&
          !gallery.rooms.some((r) => r.id === patch.roomId)
        )
          return;
        if (isNoop(gallery.artworks[i], patch)) return;
        const artworks = gallery.artworks.slice();
        artworks[i] = { ...artworks[i], ...patch };
        commit({ ...gallery, artworks });
      },

      deleteArtwork: (id) => {
        const { gallery, selection } = get();
        if (!gallery.artworks.some((a) => a.id === id)) return;
        const artworks = gallery.artworks.filter((a) => a.id !== id);
        const selectionGone =
          selection.kind === "artwork" && selection.id === id;
        commit(
          { ...gallery, artworks },
          selectionGone ? { selection: NONE } : {},
        );
      },

      select: (selection) => {
        if (!sameSelection(get().selection, selection)) set({ selection });
      },

      setView: (v) => {
        if (get().view !== v) set({ view: v });
      },
    };
  };

/** A standalone store (no React), for tests and non-React code. Starts from the sample gallery unless one is given. */
export function createGalleryStore(initial?: Gallery) {
  return createStore<GalleryState>()(initializer(initial));
}

/** The app's store hook. Subscribe per field: useGalleryStore((s) => s.gallery.rooms). */
export const useGalleryStore = create<GalleryState>()(initializer());
