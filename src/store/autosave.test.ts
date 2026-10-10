import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import type { Gallery } from "@/lib/schema/types";
import {
  AUTOSAVE_DELAY_MS,
  autosaveKey,
  clearAutosave,
  loadAutosave,
  saveAutosave,
  startAutosave,
} from "./autosave";
import { createGalleryStore } from "./gallery";

/** In-memory stand-in for localStorage. */
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  };
}

const fixture = () => structuredClone(sample) as Gallery;
let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  vi.useFakeTimers();
  storage = fakeStorage();
});
afterEach(() => vi.useRealTimers());

describe("startAutosave", () => {
  it("saves under pegasus:gallery:<id>, debounced", () => {
    const store = createGalleryStore();
    const stop = startAutosave(store, undefined, { storage });
    store.getState().setTitle("A");
    store.getState().setTitle("AB");
    store.getState().setTitle("ABC");
    expect(storage.setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(storage.data.get(autosaveKey("sample-3room"))!).title,
    ).toBe("ABC");
    stop();
  });

  it("uses an explicit key when given", () => {
    const store = createGalleryStore();
    const stop = startAutosave(store, "local", { storage });
    store.getState().setTitle("x");
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    expect([...storage.data.keys()]).toEqual(["pegasus:gallery:local"]);
    stop();
  });

  it("ignores selection and view changes", () => {
    const store = createGalleryStore();
    const stop = startAutosave(store, undefined, { storage });
    store.getState().select({ kind: "room", id: "room-east" });
    store.getState().setView("3d");
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    expect(storage.setItem).not.toHaveBeenCalled();
    stop();
  });

  it("stop() flushes a pending save and unsubscribes", () => {
    const store = createGalleryStore();
    const stop = startAutosave(store, undefined, { storage });
    store.getState().setTitle("pending");
    stop();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    store.getState().setTitle("after stop");
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("survives storage errors (quota exceeded, private mode)", () => {
    storage.setItem.mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const store = createGalleryStore();
    const stop = startAutosave(store, undefined, { storage });
    store.getState().setTitle("x");
    expect(() => vi.advanceTimersByTime(AUTOSAVE_DELAY_MS)).not.toThrow();
    expect(() => stop()).not.toThrow();
  });
});

describe("saveAutosave", () => {
  it("never saves image data, only URLs (ADR-009)", () => {
    const g = fixture();
    g.artworks[1].image.medium = "data:image/webp;base64,AAAA";
    expect(saveAutosave(g, g.id, { storage })).toBe(true);
    const saved = storage.data.get(autosaveKey(g.id))!;
    expect(saved).not.toContain("data:");
    expect(JSON.parse(saved).artworks.map((a: { id: string }) => a.id)).toEqual(
      ["art-sunrise"],
    );
  });

  it("refuses an oversized document", () => {
    const g = fixture();
    g.rooms[0].description = "x".repeat(1_100_000);
    expect(saveAutosave(g, g.id, { storage })).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("returns false with no storage available", () => {
    expect(saveAutosave(fixture(), "x", { storage: undefined })).toBe(false);
  });
});

describe("loadAutosave", () => {
  it("returns the saved, validated gallery", () => {
    const g = fixture();
    saveAutosave(g, g.id, { storage });
    expect(loadAutosave(g.id, { storage })).toEqual(g);
  });

  it("returns null when nothing is saved", () => {
    expect(loadAutosave("nope", { storage })).toBeNull();
  });

  it("ignores corrupt JSON", () => {
    storage.data.set(autosaveKey("bad"), "{not json");
    expect(loadAutosave("bad", { storage })).toBeNull();
  });

  it("ignores documents that fail validation", () => {
    storage.data.set(
      autosaveKey("bad"),
      JSON.stringify({ ...fixture(), rooms: [] }),
    );
    expect(loadAutosave("bad", { storage })).toBeNull();
  });

  it("returns null when storage access throws", () => {
    storage.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadAutosave("x", { storage })).toBeNull();
  });
});

describe("clearAutosave", () => {
  it("removes the saved copy and never throws", () => {
    saveAutosave(fixture(), "sample-3room", { storage });
    clearAutosave("sample-3room", { storage });
    expect(storage.data.size).toBe(0);
    storage.removeItem.mockImplementation(() => {
      throw new Error("nope");
    });
    expect(() => clearAutosave("x", { storage })).not.toThrow();
  });
});
