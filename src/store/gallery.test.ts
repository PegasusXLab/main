import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newGallery } from "@/lib/schema/defaults";
import type { Artwork, ObjectSource } from "@/lib/schema/types";
import { validate } from "@/lib/schema/validate";
import { createGalleryStore, useGalleryStore } from "./gallery";

const T0 = "2026-10-10T00:00:00.000Z"; // the fixture's updatedAt
const T1 = new Date("2026-10-10T12:00:00.000Z");

let store: ReturnType<typeof createGalleryStore>;
const s = () => store.getState();

/** Counts how many times subscribers are notified. */
function countNotifications() {
  const counter = { n: 0 };
  store.subscribe(() => counter.n++);
  return counter;
}

const newArt = (roomId: string): Omit<Artwork, "id"> => ({
  roomId,
  type: "image",
  placement: { wall: "s", offset: 2, height: 1.6 },
  width: 1,
  aspect: 0.75,
  image: {
    small: "/fixtures/placeholder.webp",
    medium: "/fixtures/placeholder.webp",
  },
  title: "New",
  artist: "Tester",
  story: "",
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T1);
  store = createGalleryStore();
});

afterEach(() => {
  vi.useRealTimers();
  expect(validate(s().gallery).issues).toEqual([]); // every test leaves a valid document
});

describe("initial state", () => {
  it("loads the sample fixture when no document is given", () => {
    expect(s().gallery).toEqual(sample);
    expect(s().selection).toEqual({ kind: "none" });
    expect(s().view).toBe("2d");
  });

  it("does not share the fixture object between stores", () => {
    const other = createGalleryStore();
    s().setTitle("changed");
    expect(other.getState().gallery.title).toBe(sample.title);
    expect(sample.title).not.toBe("changed");
  });

  it("uses the given document", () => {
    const g = newGallery("Mine");
    expect(createGalleryStore(g).getState().gallery).toBe(g);
  });

  it("the app hook starts from the sample too", () => {
    expect(useGalleryStore.getState().gallery.id).toBe(sample.id);
  });
});

describe("loadGallery", () => {
  it("replaces the document and clears the selection, without touching updatedAt", () => {
    s().select({ kind: "room", id: "room-east" });
    const g = newGallery("Loaded");
    s().loadGallery(g);
    expect(s().gallery).toBe(g);
    expect(s().selection).toEqual({ kind: "none" });
  });
});

describe("setTitle", () => {
  it("changes the title and bumps updatedAt", () => {
    s().setTitle("New show");
    expect(s().gallery.title).toBe("New show");
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("does nothing for the same title", () => {
    const c = countNotifications();
    s().setTitle(sample.title);
    expect(c.n).toBe(0);
    expect(s().gallery.updatedAt).toBe(T0);
  });
});

describe("setEntrance", () => {
  it("moves the entrance and bumps updatedAt", () => {
    s().setEntrance("room-south");
    expect(s().gallery.entranceRoomId).toBe("room-south");
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("ignores unknown rooms and the current entrance", () => {
    const c = countNotifications();
    s().setEntrance("nope");
    s().setEntrance("room-entrance");
    expect(c.n).toBe(0);
    expect(s().gallery.entranceRoomId).toBe("room-entrance");
  });
});

describe("addRoom", () => {
  it("adds a default 6 × 6 room and returns its id", () => {
    const id = s().addRoom({ x: 12, y: 0 });
    const room = s().gallery.rooms.find((r) => r.id === id);
    expect(room).toMatchObject({ x: 12, y: 0, w: 6, d: 6, name: "Room 4" });
    expect(s().gallery.rooms).toHaveLength(4);
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("snaps the rect to 0.5 m", () => {
    const id = s().addRoom({ x: 12.2, y: -3.3, w: 3.1, d: 2.74 });
    expect(s().gallery.rooms.find((r) => r.id === id)).toMatchObject({
      x: 12,
      y: -3.5,
      w: 3,
      d: 2.5,
    });
  });

  it("clamps w and d to the 2 m minimum", () => {
    const id = s().addRoom({ x: 12, y: 0, w: 0.2, d: 1.4 });
    expect(s().gallery.rooms.find((r) => r.id === id)).toMatchObject({
      w: 2,
      d: 2,
    });
  });

  it("returns a different id each time", () => {
    expect(s().addRoom({ x: 12, y: 0 })).not.toBe(s().addRoom({ x: 18, y: 0 }));
  });
});

describe("updateRoom", () => {
  it("patches fields, snaps rect fields and bumps updatedAt", () => {
    s().updateRoom("room-south", {
      name: "Vault",
      w: 3.8,
      y: 6.1,
      wallColor: "#000000",
    });
    expect(s().gallery.rooms[2]).toMatchObject({
      name: "Vault",
      w: 4,
      y: 6,
      wallColor: "#000000",
    });
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("clamps w and d to the 2 m minimum", () => {
    s().updateRoom("room-south", { w: 0.2, d: -3 });
    expect(s().gallery.rooms[2]).toMatchObject({ w: 2, d: 2 });
  });

  it("leaves an existing valid size unchanged", () => {
    s().updateRoom("room-south", { w: 2.5, d: 3 });
    expect(s().gallery.rooms[2]).toMatchObject({ w: 2.5, d: 3 });
  });

  it("leaves other rooms as the same objects", () => {
    const [a, b] = s().gallery.rooms;
    s().updateRoom("room-south", { name: "Vault" });
    expect(s().gallery.rooms[0]).toBe(a);
    expect(s().gallery.rooms[1]).toBe(b);
  });

  it("does nothing for an unknown id or an unchanged value (after snapping)", () => {
    const c = countNotifications();
    s().updateRoom("nope", { name: "x" });
    s().updateRoom("room-south", { w: 4.1, name: "South Room" }); // snaps to the current 4
    expect(c.n).toBe(0);
    expect(s().gallery.updatedAt).toBe(T0);
  });
});

describe("deleteRoom", () => {
  it("removes the room and its artwork", () => {
    expect(s().deleteRoom("room-east")).toBe(true);
    expect(s().gallery.rooms.map((r) => r.id)).toEqual([
      "room-entrance",
      "room-south",
    ]);
    expect(s().gallery.artworks.map((a) => a.id)).toEqual(["art-sunrise"]);
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("moves the entrance to the first remaining room when the entrance is deleted", () => {
    s().deleteRoom("room-entrance");
    expect(s().gallery.entranceRoomId).toBe("room-east");
    expect(s().gallery.artworks.map((a) => a.id)).toEqual(["art-portrait"]);
  });

  it("keeps the entrance when another room is deleted", () => {
    s().setEntrance("room-south");
    s().deleteRoom("room-east");
    expect(s().gallery.entranceRoomId).toBe("room-south");
  });

  it("refuses to delete the last room", () => {
    s().deleteRoom("room-east");
    s().deleteRoom("room-south");
    const c = countNotifications();
    expect(s().deleteRoom("room-entrance")).toBe(false);
    expect(s().gallery.rooms).toHaveLength(1);
    expect(c.n).toBe(0);
  });

  it("returns false for an unknown id", () => {
    expect(s().deleteRoom("nope")).toBe(false);
    expect(s().gallery.rooms).toHaveLength(3);
  });

  it("clears the selection when the selected room or one of its artworks goes", () => {
    s().select({ kind: "room", id: "room-east" });
    s().deleteRoom("room-east");
    expect(s().selection).toEqual({ kind: "none" });

    store = createGalleryStore();
    s().select({ kind: "artwork", id: "art-portrait" });
    s().deleteRoom("room-east");
    expect(s().selection).toEqual({ kind: "none" });
  });

  it("keeps an unrelated selection", () => {
    s().select({ kind: "room", id: "room-south" });
    s().deleteRoom("room-east");
    expect(s().selection).toEqual({ kind: "room", id: "room-south" });
  });
});

describe("addArtwork", () => {
  it("adds artwork to a room and returns its id", () => {
    const id = s().addArtwork(newArt("room-south"));
    expect(id).toBeTruthy();
    expect(s().gallery.artworks.find((a) => a.id === id)).toMatchObject({
      roomId: "room-south",
      title: "New",
    });
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("refuses an unknown room (returns null, no change)", () => {
    const c = countNotifications();
    expect(s().addArtwork(newArt("nope"))).toBeNull();
    expect(s().gallery.artworks).toHaveLength(2);
    expect(c.n).toBe(0);
  });
});

describe("updateArtwork", () => {
  it("patches fields and bumps updatedAt", () => {
    s().updateArtwork("art-sunrise", {
      title: "Dawn",
      placement: { wall: "w", offset: 1, height: 1.5 },
    });
    expect(s().gallery.artworks[0]).toMatchObject({
      title: "Dawn",
      placement: { wall: "w", offset: 1, height: 1.5 },
    });
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("can move artwork to another existing room", () => {
    s().updateArtwork("art-sunrise", { roomId: "room-south" });
    expect(s().gallery.artworks[0].roomId).toBe("room-south");
  });

  it("ignores unknown ids, unknown target rooms and unchanged values", () => {
    const c = countNotifications();
    s().updateArtwork("nope", { title: "x" });
    s().updateArtwork("art-sunrise", { roomId: "nope" });
    s().updateArtwork("art-sunrise", { title: "Sunrise" });
    expect(c.n).toBe(0);
    expect(s().gallery.artworks[0].roomId).toBe("room-entrance");
  });
});

describe("deleteArtwork", () => {
  it("removes the artwork and bumps updatedAt", () => {
    s().deleteArtwork("art-sunrise");
    expect(s().gallery.artworks.map((a) => a.id)).toEqual(["art-portrait"]);
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("clears the selection if that artwork was selected", () => {
    s().select({ kind: "artwork", id: "art-sunrise" });
    s().deleteArtwork("art-sunrise");
    expect(s().selection).toEqual({ kind: "none" });
  });

  it("does nothing for an unknown id", () => {
    const c = countNotifications();
    s().deleteArtwork("nope");
    expect(c.n).toBe(0);
  });
});

describe("select", () => {
  it("sets the selection without touching the document", () => {
    const g = s().gallery;
    s().select({ kind: "artwork", id: "art-portrait" });
    expect(s().selection).toEqual({ kind: "artwork", id: "art-portrait" });
    expect(s().gallery).toBe(g);
  });

  it("does not notify when the selection is unchanged (R11)", () => {
    s().select({ kind: "room", id: "room-east" });
    const c = countNotifications();
    s().select({ kind: "room", id: "room-east" });
    expect(c.n).toBe(0);
    s().select({ kind: "none" });
    s().select({ kind: "none" });
    expect(c.n).toBe(1);
  });
});

describe("setView", () => {
  it("switches between 2d and 3d without touching the document", () => {
    const g = s().gallery;
    s().setView("3d");
    expect(s().view).toBe("3d");
    expect(s().gallery).toBe(g);
  });

  it("does not notify when the view is unchanged (R11)", () => {
    const c = countNotifications();
    s().setView("2d");
    expect(c.n).toBe(0);
  });
});

const cutoutSource = (): ObjectSource => ({
  kind: "cutout",
  image: { small: "/o.webp", medium: "/o.webp" },
  aspect: 1,
  depth: 0.05,
});

describe("object actions (ADR-015 v2)", () => {
  it("addObject places the object at the room centre and selects it", () => {
    const room = s().gallery.rooms.find((r) => r.id === "room-entrance")!;
    const id = s().addObject(cutoutSource(), "room-entrance");
    expect(typeof id).toBe("string");
    const o = s().gallery.objects!.find((x) => x.id === id)!;
    expect(o.position).toEqual({ x: room.w / 2, y: room.d / 2 });
    expect(s().selection).toEqual({ kind: "object", id });
    expect(s().gallery.updatedAt).toBe(T1.toISOString());
  });

  it("addObject returns null for an unknown room and notifies nobody", () => {
    const c = countNotifications();
    expect(s().addObject(cutoutSource(), "nope")).toBeNull();
    expect(c.n).toBe(0);
    expect(s().gallery.objects ?? []).toEqual([]);
  });

  it("updateObject patches the object; bad roomId and noop patches do nothing", () => {
    const id = s().addObject(cutoutSource(), "room-entrance")!;
    s().updateObject(id, { title: "David" });
    expect(
      s().gallery.objects!.find((o) => o.id === id)?.title,
    ).toBe("David");
    const c = countNotifications();
    s().updateObject(id, { roomId: "nope" });
    s().updateObject(id, { title: "David" });
    s().updateObject("nope", { title: "x" });
    expect(c.n).toBe(0);
    expect(s().gallery.objects!.find((o) => o.id === id)?.roomId).toBe(
      "room-entrance",
    );
  });

  it("removeObject removes it and clears an object selection", () => {
    const id = s().addObject(cutoutSource(), "room-entrance")!;
    expect(s().selection).toEqual({ kind: "object", id });
    s().removeObject(id);
    expect(s().gallery.objects ?? []).toEqual([]);
    expect(s().selection).toEqual({ kind: "none" });
  });

  it("removeObject does nothing for an unknown id", () => {
    const c = countNotifications();
    s().removeObject("nope");
    expect(c.n).toBe(0);
  });

  it("deleteRoom drops the room's objects but keeps the others", () => {
    const other = s().gallery.rooms.find((r) => r.id !== "room-entrance")!;
    const a = s().addObject(cutoutSource(), "room-entrance")!;
    const b = s().addObject(cutoutSource(), other.id)!;
    s().select({ kind: "object", id: a });
    expect(s().deleteRoom(other.id)).toBe(true);
    expect((s().gallery.objects ?? []).map((o) => o.id)).toEqual([a]);
    expect((s().gallery.objects ?? []).map((o) => o.id)).not.toContain(b);
    expect(s().selection).toEqual({ kind: "object", id: a });
  });

  it("deleteRoom clears the selection when the selected object is inside", () => {
    const other = s().gallery.rooms.find((r) => r.id !== "room-entrance")!;
    const b = s().addObject(cutoutSource(), other.id)!;
    expect(s().selection).toEqual({ kind: "object", id: b });
    s().deleteRoom(other.id);
    expect(s().selection).toEqual({ kind: "none" });
  });

  it("deleteRoom on a document without objects leaves it keyless", () => {
    const east = s().gallery.rooms.find((r) => r.id === "room-east")!;
    s().deleteRoom(east.id);
    expect("objects" in s().gallery).toBe(false);
  });
});
