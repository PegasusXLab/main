// Undo / redo for the gallery document (T-076). History watches the store from the outside:
// every change to `gallery` becomes a step, except while undoing/redoing. Rapid changes (a drag,
// a slider) coalesce into one step. Selection and view changes aren't history. loadGallery()
// resets it. The store contract (architecture §4) is unchanged.

import { useSyncExternalStore } from "react";
import type { Gallery } from "@/lib/schema/types";
import type { Selection } from "./gallery";

export const HISTORY_LIMIT = 100;
export const COALESCE_MS = 300;

/** What history needs from a zustand store (useGalleryStore or createGalleryStore). */
export interface HistoryStore {
  getState(): { gallery: Gallery; selection: Selection; loadSeq: number };
  setState(partial: { gallery?: Gallery; selection?: Selection }): void;
  subscribe(
    listener: (
      state: { gallery: Gallery; loadSeq: number },
      prev: { gallery: Gallery; loadSeq: number },
    ) => void,
  ): () => void;
}

export interface GalleryHistory {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  /** Forget all steps (loadGallery does this through `loadSeq`). */
  clear(): void;
  /** For React: re-render when canUndo / canRedo change. */
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

/** True when the selection points at a room or artwork that no longer exists in `g`. */
function staleSelection(sel: Selection, g: Gallery): boolean {
  if (sel.kind === "room") return !g.rooms.some((r) => r.id === sel.id);
  if (sel.kind === "artwork") return !g.artworks.some((a) => a.id === sel.id);
  return false;
}

export function createHistory(
  store: HistoryStore,
  opts: { limit?: number; coalesceMs?: number; now?: () => number } = {},
): GalleryHistory {
  const limit = opts.limit ?? HISTORY_LIMIT;
  const coalesceMs = opts.coalesceMs ?? COALESCE_MS;
  const now = opts.now ?? (() => Date.now());

  let past: Gallery[] = [];
  let future: Gallery[] = [];
  let lastChangeAt = -Infinity;
  let applying = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const unsubscribe = store.subscribe((state, prev) => {
    if (state.loadSeq !== prev.loadSeq) {
      // A different document was loaded: its history starts fresh.
      past = [];
      future = [];
      lastChangeAt = -Infinity;
      emit();
      return;
    }
    if (applying || state.gallery === prev.gallery) return;

    const t = now();
    const coalesce = t - lastChangeAt < coalesceMs && past.length > 0;
    lastChangeAt = t;
    if (!coalesce) {
      past.push(prev.gallery);
      if (past.length > limit) past.shift();
    }
    const changed = future.length > 0 || !coalesce;
    future = [];
    if (changed) emit();
  });

  const apply = (gallery: Gallery) => {
    applying = true;
    try {
      const { selection } = store.getState();
      store.setState(
        staleSelection(selection, gallery)
          ? { gallery, selection: { kind: "none" } }
          : { gallery },
      );
    } finally {
      applying = false;
    }
    lastChangeAt = -Infinity; // the next edit starts a new step
    emit();
  };

  return {
    undo() {
      const previous = past.pop();
      if (!previous) return;
      future.push(store.getState().gallery);
      apply(previous);
    },
    redo() {
      const next = future.pop();
      if (!next) return;
      past.push(store.getState().gallery);
      apply(next);
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear() {
      past = [];
      future = [];
      lastChangeAt = -Infinity;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      unsubscribe();
      listeners.clear();
    },
  };
}

/** React hook: { canUndo, canRedo } kept current. */
export function useUndoRedoState(history: GalleryHistory) {
  const canUndo = useSyncExternalStore(
    history.subscribe,
    history.canUndo,
    () => false,
  );
  const canRedo = useSyncExternalStore(
    history.subscribe,
    history.canRedo,
    () => false,
  );
  return { canUndo, canRedo };
}

/** True when the keyboard event comes from somewhere the user is typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== "string")
    return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    el.isContentEditable === true
  );
}

/** Maps a keydown to "undo" / "redo" / null: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y. */
export function undoRedoKey(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey?: boolean;
}): "undo" | "redo" | null {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return null;
  const k = e.key.toLowerCase();
  if (k === "z") return e.shiftKey ? "redo" : "undo";
  if (k === "y" && e.ctrlKey && !e.metaKey) return "redo";
  return null;
}
