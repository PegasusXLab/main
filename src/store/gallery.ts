// The gallery store: the one place the document lives in the browser (plan/architecture.md §4).
// The state and action names are a frozen contract that builder-2's editor codes against.
// Changes go through the senior.
//
// Rules:
// - Rect fields (x, y, w, d) are snapped to the 0.5 m grid (w, d at least 2 m); every document change bumps `updatedAt`.
// - Overlap is NOT checked here. The editor checks it before calling addRoom / updateRoom (T-021).
// - Readers subscribe per field, e.g. useGalleryStore((s) => s.selection), never the whole store (R11).
// - Calls that change nothing (unknown id, same value) don't notify subscribers.

import { nanoid } from "nanoid";
import { create } from "zustand";
import { createStore, type StateCreator } from "zustand/vanilla";
import sample from "@/fixtures/sample-3room.json";
import { MIN_ROOM_SIZE, newObject, newRoom } from "@/lib/schema/defaults";
import { snap } from "@/lib/schema/geom";
import { createHistory } from "./history";
import type {
  Artwork,
  Gallery,
  GalleryObject,
  ObjectSource,
  Room,
} from "@/lib/schema/types";

export type Selection =
  | { kind: "none" }
  | { kind: "room"; id: string }
  | { kind: "artwork"; id: string }
  | { kind: "object"; id: string };

/** Editor views (T-124): "2d" plan, "pov" visitor tour of the live gallery, "3d" top-down orbit
 * (kept as "3d" so older saved/linked state still means Top-down). */
export type View = "2d" | "pov" | "3d";

export type RoomPatch = Partial<Omit<Room, "id">>;
export type ArtworkPatch = Partial<Omit<Artwork, "id">>;
export type ObjectPatch = Partial<Omit<GalleryObject, "id">>;

export interface GalleryState {
  gallery: Gallery;
  /** Bumped by loadGallery so undo history knows a new document arrived (T-076). */
  loadSeq: number;
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

  /** Adds a free-standing object (ADR-015 v2) at the room centre and selects it. Returns the id, or null if `roomId` is not a room in the gallery. */
  addObject: (source: ObjectSource, roomId: string) => string | null;
  updateObject: (id: string, patch: ObjectPatch) => void;
  removeObject: (id: string) => void;

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
  // Sizes never go below the 2 × 2 m minimum, whatever the caller sends (e.g. a panel number input).
  if (out.w !== undefined) out.w = Math.max(out.w, MIN_ROOM_SIZE);
  if (out.d !== undefined) out.d = Math.max(out.d, MIN_ROOM_SIZE);
  return out;
}

/** The gallery's free-standing objects (ADR-015 v2); missing means none. */
function objectsOf(gallery: Gallery): GalleryObject[] {
  return gallery.objects ?? [];
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
      loadSeq: 0,
      view: "2d",

      loadGallery: (g) =>
        set({ gallery: g, selection: NONE, loadSeq: get().loadSeq + 1 }),

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
        room.w = Math.max(room.w, MIN_ROOM_SIZE);
        room.d = Math.max(room.d, MIN_ROOM_SIZE);
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
        // Free-standing objects (ADR-015 v2): drop the room's objects too, but
        // leave old documents without an `objects` key untouched.
        const removedObjects = new Set(
          objectsOf(gallery)
            .filter((o) => o.roomId === id)
            .map((o) => o.id),
        );
        const objects =
          gallery.objects === undefined
            ? undefined
            : objectsOf(gallery).filter((o) => !removedObjects.has(o.id));
        const entranceRoomId =
          gallery.entranceRoomId === id ? rooms[0].id : gallery.entranceRoomId;
        const selectionGone =
          (selection.kind === "room" && selection.id === id) ||
          (selection.kind === "artwork" && removedArt.has(selection.id)) ||
          (selection.kind === "object" && removedObjects.has(selection.id));
        commit(
          objects === undefined
            ? { ...gallery, rooms, artworks, entranceRoomId }
            : { ...gallery, rooms, artworks, objects, entranceRoomId },
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

      addObject: (source, roomId) => {
        const { gallery } = get();
        const room = gallery.rooms.find((r) => r.id === roomId);
        if (!room) return null;
        const object = newObject(roomId, source, room);
        commit(
          { ...gallery, objects: [...objectsOf(gallery), object] },
          { selection: { kind: "object", id: object.id } },
        );
        return object.id;
      },

      updateObject: (id, patch) => {
        const { gallery } = get();
        const objects = objectsOf(gallery);
        const i = objects.findIndex((o) => o.id === id);
        if (i < 0) return;
        if (
          patch.roomId !== undefined &&
          !gallery.rooms.some((r) => r.id === patch.roomId)
        )
          return;
        if (isNoop(objects[i], patch)) return;
        const next = objects.slice();
        next[i] = { ...next[i], ...patch };
        commit({ ...gallery, objects: next });
      },

      removeObject: (id) => {
        const { gallery, selection } = get();
        const objects = objectsOf(gallery);
        if (!objects.some((o) => o.id === id)) return;
        const selectionGone =
          selection.kind === "object" && selection.id === id;
        commit(
          { ...gallery, objects: objects.filter((o) => o.id !== id) },
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

/** Undo / redo for the app store (T-076). Selection and view changes aren't history. */
export const galleryHistory = createHistory(useGalleryStore);
export const undo = () => galleryHistory.undo();
export const redo = () => galleryHistory.redo();
export const canUndo = () => galleryHistory.canUndo();
export const canRedo = () => galleryHistory.canRedo();
