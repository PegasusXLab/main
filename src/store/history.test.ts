import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newGallery } from "@/lib/schema/defaults";
import type { Artwork, Gallery } from "@/lib/schema/types";
import { AUTOSAVE_DELAY_MS, autosaveKey, startAutosave } from "./autosave";
import { createGalleryStore } from "./gallery";
import {
  COALESCE_MS,
  createHistory,
  isTypingTarget,
  undoRedoKey,
  type GalleryHistory,
} from "./history";

let store: ReturnType<typeof createGalleryStore>;
let history: GalleryHistory;
const s = () => store.getState();

/** Moves the clock past the coalescing window so the next edit is its own step. */
const pause = () => vi.advanceTimersByTime(COALESCE_MS + 1);

const art = (roomId: string): Omit<Artwork, "id"> => ({
  roomId,
  type: "image",
  placement: { wall: "s", offset: 2, height: 1.6 },
  width: 1,
  aspect: 0.75,
  image: { small: "/a.webp", medium: "/a.webp" },
  title: "New",
  artist: "",
  story: "",
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-10T12:00:00Z"));
  store = createGalleryStore();
  history = createHistory(store);
});
afterEach(() => {
  history.dispose();
  vi.useRealTimers();
});

describe("undo / redo each action type", () => {
  it("starts with nothing to undo or redo", () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("setTitle", () => {
    s().setTitle("New show");
    history.undo();
    expect(s().gallery.title).toBe(sample.title);
    history.redo();
    expect(s().gallery.title).toBe("New show");
  });

  it("setEntrance", () => {
    s().setEntrance("room-east");
    history.undo();
    expect(s().gallery.entranceRoomId).toBe("room-entrance");
  });

  it("addRoom / updateRoom / deleteRoom", () => {
    const id = s().addRoom({ x: 12, y: 0 });
    pause();
    s().updateRoom(id, { name: "Annex" });
    pause();
    s().deleteRoom("room-east");
    expect(s().gallery.rooms.map((r) => r.id)).not.toContain("room-east");

    history.undo(); // delete
    expect(s().gallery.rooms.map((r) => r.id)).toContain("room-east");
    expect(s().gallery.artworks.map((a) => a.id)).toContain("art-portrait"); // its art comes back too
    history.undo(); // rename
    expect(s().gallery.rooms.find((r) => r.id === id)?.name).not.toBe("Annex");
    history.undo(); // add
    expect(s().gallery.rooms).toHaveLength(3);
    expect(history.canUndo()).toBe(false);

    history.redo();
    history.redo();
    history.redo();
    expect(s().gallery.rooms.find((r) => r.id === id)?.name).toBe("Annex");
    expect(s().gallery.rooms.map((r) => r.id)).not.toContain("room-east");
  });

  it("addArtwork / updateArtwork / deleteArtwork", () => {
    const id = s().addArtwork(art("room-south"))!;
    pause();
    s().updateArtwork(id, { title: "Renamed" });
    pause();
    s().deleteArtwork("art-sunrise");

    history.undo();
    expect(s().gallery.artworks.map((a) => a.id)).toContain("art-sunrise");
    history.undo();
    expect(s().gallery.artworks.find((a) => a.id === id)?.title).toBe("New");
    history.undo();
    expect(s().gallery.artworks.map((a) => a.id)).not.toContain(id);
  });
});

describe("what counts as a step", () => {
  it("a drag (many rapid updates) is one step", () => {
    for (let x = 12; x <= 16; x += 0.5) {
      s().updateRoom("room-south", { x: 0, y: 6, w: 4 + (x - 12) });
      vi.advanceTimersByTime(16); // ~60 fps
    }
    expect(s().gallery.rooms[2].w).toBe(8);
    history.undo();
    expect(s().gallery.rooms[2].w).toBe(4);
    expect(history.canUndo()).toBe(false);
  });

  it("edits separated by a pause are separate steps", () => {
    s().setTitle("A");
    pause();
    s().setTitle("B");
    history.undo();
    expect(s().gallery.title).toBe("A");
  });

  it("selection and view changes are not history", () => {
    s().select({ kind: "room", id: "room-east" });
    s().setView("3d");
    expect(history.canUndo()).toBe(false);
  });

  it("caps history at ~100 steps", () => {
    const capped = createHistory(store, { limit: 100 });
    for (let i = 0; i < 120; i++) {
      s().setTitle(`t${i}`);
      pause();
    }
    let n = 0;
    while (capped.canUndo()) {
      capped.undo();
      n++;
    }
    expect(n).toBe(100);
    expect(s().gallery.title).toBe("t19"); // the 100th-from-last state
    capped.dispose();
  });

  it("a new edit clears the redo stack", () => {
    s().setTitle("A");
    pause();
    history.undo();
    expect(history.canRedo()).toBe(true);
    s().setTitle("B");
    expect(history.canRedo()).toBe(false);
  });

  it("loadGallery resets history", () => {
    s().setTitle("A");
    expect(history.canUndo()).toBe(true);
    s().loadGallery(newGallery("Other"));
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("undo clears a selection that no longer exists", () => {
    const id = s().addRoom({ x: 12, y: 0 });
    s().select({ kind: "room", id });
    history.undo();
    expect(s().selection).toEqual({ kind: "none" });
  });

  it("notifies subscribers when canUndo / canRedo change", () => {
    const seen: [boolean, boolean][] = [];
    history.subscribe(() => seen.push([history.canUndo(), history.canRedo()]));
    s().setTitle("A");
    history.undo();
    expect(seen).toContainEqual([true, false]);
    expect(seen).toContainEqual([false, true]);
  });
});

describe("autosave still works with history", () => {
  it("saves the undone document", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    const stop = startAutosave(store, undefined, { storage });
    s().setTitle("Changed");
    pause();
    history.undo();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    const saved = JSON.parse(data.get(autosaveKey("sample-3room"))!) as Gallery;
    expect(saved.title).toBe(sample.title);
    stop();
  });
});

describe("keyboard mapping", () => {
  const k = (
    key: string,
    mods: Partial<{
      ctrlKey: boolean;
      metaKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
    }> = {},
  ) =>
    undoRedoKey({
      key,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      ...mods,
    });

  it("Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z and Ctrl+Y redo", () => {
    expect(k("z", { ctrlKey: true })).toBe("undo");
    expect(k("z", { metaKey: true })).toBe("undo");
    expect(k("Z", { metaKey: true, shiftKey: true })).toBe("redo");
    expect(k("z", { ctrlKey: true, shiftKey: true })).toBe("redo");
    expect(k("y", { ctrlKey: true })).toBe("redo");
  });

  it("ignores plain keys, Alt combos and Cmd+Y", () => {
    expect(k("z")).toBeNull();
    expect(k("z", { ctrlKey: true, altKey: true })).toBeNull();
    expect(k("y", { metaKey: true })).toBeNull();
    expect(k("x", { ctrlKey: true })).toBeNull();
  });

  it("knows when the user is typing", () => {
    expect(isTypingTarget({ tagName: "INPUT" } as unknown as EventTarget)).toBe(
      true,
    );
    expect(
      isTypingTarget({ tagName: "TEXTAREA" } as unknown as EventTarget),
    ).toBe(true);
    expect(
      isTypingTarget({ tagName: "SELECT" } as unknown as EventTarget),
    ).toBe(true);
    expect(
      isTypingTarget({
        tagName: "DIV",
        isContentEditable: true,
      } as unknown as EventTarget),
    ).toBe(true);
    expect(
      isTypingTarget({ tagName: "CANVAS" } as unknown as EventTarget),
    ).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
