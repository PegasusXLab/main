import { describe, expect, it, vi } from "vitest";
import {
  chooseActive,
  createMediaRegistry,
  createMediaSource,
  frameMedia,
  MAX_PLAYING,
  type MediaSource,
} from "./MediaTexture";

describe("animated artwork media (T-145b)", () => {
  it("shows the image unless the frame has animated media", () => {
    expect(frameMedia({})).toBe("image");
    expect(frameMedia({ media: { kind: "video", url: "/v.mp4", aspect: 0.5 } })).toBe("video");
    expect(frameMedia({ media: { kind: "gif", url: "/a.gif", aspect: 1 } })).toBe("gif");
    expect(frameMedia({ media: { kind: "gif", url: "", aspect: 1 } })).toBe("image");
  });

  it("plays only the current room's media, nearest first, at most 3", () => {
    const c = [
      { id: "far", roomId: "A", distance: 9 },
      { id: "near", roomId: "A", distance: 1 },
      { id: "mid", roomId: "A", distance: 4 },
      { id: "next", roomId: "A", distance: 6 },
      { id: "other", roomId: "B", distance: 0.5 },
    ];
    expect(MAX_PLAYING).toBe(3);
    expect([...chooseActive(c, "A")]).toEqual(["near", "mid", "next"]);
    expect(chooseActive(c, "B")).toEqual(new Set(["other"]));
    expect(chooseActive(c, "C").size).toBe(0);
    // No current room (editor top-down): the nearest anywhere.
    expect([...chooseActive(c, undefined)]).toEqual(["other", "near", "mid"]);
  });

  it("needs a DOM to load media (server render shows the poster)", () => {
    expect(createMediaSource("video", "/v.mp4", vi.fn(), vi.fn())).toBeNull();
    expect(createMediaSource("gif", "/a.gif", vi.fn(), vi.fn())).toBeNull();
  });

  it("plays the chosen sources and pauses the rest", () => {
    const registry = createMediaRegistry();
    const source = () => ({
      play: vi.fn<() => void>(),
      pause: vi.fn<() => void>(),
      dispose: vi.fn<() => void>(),
    }) satisfies MediaSource;
    const a = source();
    const b = source();
    registry.register("a", { source: a, roomId: "A", position: [0, 1, 0] });
    registry.register("b", { source: b, roomId: "A", position: [5, 1, 0] });
    registry.apply(new Set(["a"]));
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(b.pause).toHaveBeenCalledTimes(1);
    registry.unregister("a");
    expect([...registry.entries.keys()]).toEqual(["b"]);
    const redraw = vi.fn();
    registry.setInvalidate(redraw);
    registry.invalidate();
    expect(redraw).toHaveBeenCalledTimes(1);
  });
});
