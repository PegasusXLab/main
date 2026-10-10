import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { GalleryPanel } from "./GalleryPanel";
import { useGalleryStore } from "@/store/gallery";

describe("GalleryPanel", () => {
  it("renders gallery title and entrance room selector markup", () => {
    const html = renderToString(<GalleryPanel />);
    expect(html).toContain('data-testid="gallery-panel"');
    expect(html).toContain('id="gallery-panel-title"');
    expect(html).toContain('id="gallery-panel-entrance"');
    expect(html).toContain("Entrance Room");
    expect(html).toContain("Total rooms:");
  });

  it("updates store title and entrance room on change", () => {
    const { setTitle, setEntrance } = useGalleryStore.getState();
    setTitle("Modern Expressions");
    expect(useGalleryStore.getState().gallery.title).toBe("Modern Expressions");

    const secondRoom = useGalleryStore.getState().gallery.rooms[1];
    if (secondRoom) {
      setEntrance(secondRoom.id);
      expect(useGalleryStore.getState().gallery.entranceRoomId).toBe(
        secondRoom.id,
      );
    }
  });
});
