import { describe, expect, it } from "vitest";
import sample from "@/fixtures/sample-3room.json";
import { newRoom } from "@/lib/schema/defaults";
import type { Artwork, Gallery, Room, Wall } from "@/lib/schema/types";
import { doorways } from "./doorways";
import { findSharedEdges } from "./edges";
import { FRAME_INSET, frames } from "./frames";

const R: Room = {
  ...newRoom({ x: 2, y: 1, w: 6, d: 4 }),
  id: "R",
  name: "Test Room",
};

const art = (
  id: string,
  wall: Wall,
  offset: number,
  width = 1.2,
  height = 1.6,
  roomId = "R",
): Artwork => ({
  id,
  roomId,
  type: "image",
  placement: { wall, offset, height },
  width,
  aspect: 0.75,
  image: { small: "/s.webp", medium: "/m.webp" },
  title: id,
  artist: "",
  story: "",
});

const fixture = () => structuredClone(sample) as Gallery;
const cutsFor = (rooms: Room[]) => doorways(findSharedEdges(rooms), rooms);

describe("frames: placement per plan.md §5.3", () => {
  // Room R: x 2..8, y 1..5 (6 × 4 m)
  it("passes animated media and the TV style through; the image stays the poster (T-145b)", () => {
    const anim: Artwork = {
      ...art("v", "n", 3),
      media: { kind: "video", url: "/api/files/media/v.mp4", posterUrl: "/p.webp", aspect: 0.5625 },
      frameStyle: "tv",
    };
    const { frames: [f] } = frames([anim], [R]);
    expect(f.media).toEqual({ kind: "video", url: "/api/files/media/v.mp4", aspect: 0.5625 });
    expect(f.frameStyle).toBe("tv");
    expect(f.imageUrl).toBe("/m.webp");
    const { frames: [plain] } = frames([{ ...art("p", "n", 3), frameStyle: "frame" }], [R]);
    expect(plain).not.toHaveProperty("media");
    expect(plain).not.toHaveProperty("frameStyle");
  });

  it("north wall: offset from the west end, faces +z", () => {
    const {
      frames: [f],
      issues,
    } = frames([art("a", "n", 3)], [R]);
    expect(f.position[0]).toBeCloseTo(5);
    expect(f.position[1]).toBeCloseTo(1.6);
    expect(f.position[2]).toBeCloseTo(1 + FRAME_INSET);
    expect(f.rotationY).toBe(0);
    expect(f).toMatchObject({
      artworkId: "a",
      roomId: "R",
      width: 1.2,
      imageUrl: "/m.webp",
    });
    expect(f.height).toBeCloseTo(0.9); // width × aspect
    expect(issues).toEqual([]);
  });

  it("south wall: offset from the east end (left as seen from inside), faces −z", () => {
    const {
      frames: [f],
    } = frames([art("a", "s", 1)], [R]);
    expect(f.position[0]).toBeCloseTo(7);
    expect(f.position[2]).toBeCloseTo(5 - FRAME_INSET);
    expect(f.rotationY).toBeCloseTo(Math.PI);
  });

  it("west wall: offset from the south end, faces +x", () => {
    const {
      frames: [f],
    } = frames([art("a", "w", 1)], [R]);
    expect(f.position[0]).toBeCloseTo(2 + FRAME_INSET);
    expect(f.position[2]).toBeCloseTo(4);
    expect(f.rotationY).toBeCloseTo(Math.PI / 2);
  });

  it("east wall: offset from the north end, faces −x", () => {
    const {
      frames: [f],
    } = frames([art("a", "e", 1)], [R]);
    expect(f.position[0]).toBeCloseTo(8 - FRAME_INSET);
    expect(f.position[2]).toBeCloseTo(2);
    expect(f.rotationY).toBeCloseTo(-Math.PI / 2);
  });

  it("frames sit 0.08 m from the room edge", () => {
    expect(FRAME_INSET).toBe(0.08);
  });
});

describe("frames: issues, not exceptions", () => {
  it("artwork hanging past a wall's end is reported but still placed", () => {
    const { frames: placed, issues } = frames(
      [art("left", "n", 0.4), art("right", "e", 3.6, 1)],
      [R],
    );
    expect(placed).toHaveLength(2);
    expect(issues.map((i) => [i.code, i.artworkId])).toEqual([
      ["artwork-past-wall-end", "left"],
      ["artwork-past-wall-end", "right"],
    ]);
  });

  it("artwork exactly touching the wall's ends is fine", () => {
    expect(
      frames([art("a", "n", 0.6), art("b", "n", 5.4)], [R]).issues,
    ).toEqual([]);
  });

  it("artwork over a doorway is reported (this room's side)", () => {
    const g = fixture();
    // Entrance S wall: door x 1.4..2.6. Seen from inside, offset runs from the east end: along = 6 − offset.
    const a = art("over", "s", 3.6, 1, 1.5, "room-entrance");
    const { issues } = frames([a], g.rooms, cutsFor(g.rooms));
    expect(issues.map((i) => [i.code, i.artworkId])).toEqual([
      ["artwork-over-doorway", "over"],
    ]);
  });

  it("artwork over a doorway is reported (the neighbor's side of the same opening)", () => {
    const g = fixture();
    // East Hall W wall: door y 2.4..3.6; along = 6 − offset.
    const a = art("over", "w", 3, 1, 1.5, "room-east");
    expect(
      frames([a], g.rooms, cutsFor(g.rooms)).issues.map((i) => i.code),
    ).toEqual(["artwork-over-doorway"]);
  });

  it("artwork beside a doorway, or entirely above it, is fine", () => {
    const g = fixture();
    const beside = art("beside", "s", 2.4, 1, 1.5, "room-entrance"); // along 3.6: 3.1..4.1
    const above = {
      ...art("above", "s", 4, 1, 2.6, "room-entrance"),
      aspect: 0.3,
    }; // bottom 2.45 > 2.2
    expect(frames([beside, above], g.rooms, cutsFor(g.rooms)).issues).toEqual(
      [],
    );
  });

  it("artwork in an unknown room is reported and not placed", () => {
    const { frames: placed, issues } = frames(
      [art("lost", "n", 3, 1.2, 1.6, "nope")],
      [R],
    );
    expect(placed).toEqual([]);
    expect(issues.map((i) => i.code)).toEqual(["artwork-unknown-room"]);
  });

  it("the sample fixture's artworks place cleanly", () => {
    const g = fixture();
    const { frames: placed, issues } = frames(
      g.artworks,
      g.rooms,
      cutsFor(g.rooms),
    );
    expect(issues).toEqual([]);
    expect(placed.map((f) => f.artworkId)).toEqual([
      "art-sunrise",
      "art-portrait",
    ]);
    expect(placed[0].position[0]).toBeCloseTo(3);
    expect(placed[0].position[2]).toBeCloseTo(0.08);
    expect(placed[1].position[0]).toBeCloseTo(11.92);
    expect(placed[1].position[2]).toBeCloseTo(3);
  });

  it("emits largeImageUrl when art.image.large is present (ADR-007 amendment 2)", () => {
    const artWithLarge: Artwork = {
      ...art("with-large", "n", 3),
      image: { small: "/s.webp", medium: "/m.webp", large: "/l-2048.webp" },
    };
    const {
      frames: [f],
      issues,
    } = frames([artWithLarge], [R]);
    expect(issues).toEqual([]);
    expect(f.imageUrl).toBe("/m.webp");
    expect(f.largeImageUrl).toBe("/l-2048.webp");
  });

  it("omits largeImageUrl when art.image.large is not present", () => {
    const {
      frames: [f],
      issues,
    } = frames([art("no-large", "n", 3)], [R]);
    expect(issues).toEqual([]);
    expect(f.imageUrl).toBe("/m.webp");
    expect(f.largeImageUrl).toBeUndefined();
  });
});
