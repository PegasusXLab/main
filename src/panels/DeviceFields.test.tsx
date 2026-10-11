import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DeviceFields, TrackField, trackFromFileName } from "./DeviceFields";
import type { GalleryObject } from "@/lib/schema/types";

const base: GalleryObject = {
  id: "o",
  roomId: "r",
  position: { x: 1, y: 1 },
  rotation: 0,
  height: 0.9,
  plinth: { shape: "none", height: 0 },
  source: { kind: "library", libraryId: "console-classic" },
  title: "",
  artist: "",
  story: "",
};

describe("DeviceFields", () => {
  it("splits song file names into title and artist", () => {
    expect(trackFromFileName("Nights - Frank Ocean.mp3")).toEqual({ title: "Nights", artist: "Frank Ocean" });
    expect(trackFromFileName("demo_take_3.wav").title.length).toBeGreaterThan(0);
  });

  it("offers the device kinds and each one's settings", () => {
    const none = renderToString(<DeviceFields object={base} onChange={vi.fn()} />);
    expect(none).toContain("Listening station");
    expect(none).toContain("Video screen");
    const tt = renderToString(
      <DeviceFields
        object={{ ...base, device: { kind: "turntable", tracks: [{ title: "A", artist: "B", url: "/a.wav" }] } }}
        onChange={vi.fn()}
      />,
    );
    expect(tt).toContain("Records · 1");
    expect(tt).toContain('data-testid="turntable-add-song"');
    const tv = renderToString(
      <DeviceFields object={{ ...base, device: { kind: "tv", screen: 1.3, video: { url: "", aspect: 0.5625 } } }} onChange={vi.fn()} />,
    );
    expect(tv).toContain("Upload a video");
    const gb = renderToString(<DeviceFields object={{ ...base, device: { kind: "guestbook" } }} onChange={vi.fn()} />);
    expect(gb).toContain('id="guestbook-prompt"');
  });

  it("lets a cover carry a song", () => {
    expect(renderToString(<TrackField onChange={vi.fn()} />)).toContain("Attach a song");
    expect(renderToString(<TrackField track={{ title: "Song", url: "/s.wav" }} onChange={vi.fn()} />)).toContain('value="Song"');
  });
});
