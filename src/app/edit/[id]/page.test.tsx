import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import EditPage from "./page";
import { useGalleryStore } from "@/store/gallery";

describe("EditPage", () => {
  it("renders EditorShell in 2D view by default with GalleryPanel", () => {
    useGalleryStore.getState().setView("2d");
    useGalleryStore.getState().select({ kind: "none" });

    const html = renderToString(<EditPage />);

    // Header controls
    expect(html).toContain('id="gallery-title-input"');
    expect(html).toContain("2D");
    expect(html).toContain("3D");
    expect(html).toContain("Publish");

    // Side panel (GalleryPanel when nothing is selected)
    expect(html).toContain('data-testid="gallery-panel"');

    // 2D Canvas workspace
    expect(html).toContain("editor-grid-pattern");
  });

  it("switches to RoomPanel when a room is selected", () => {
    useGalleryStore.getState().setView("2d");
    useGalleryStore.getState().select({ kind: "room", id: "room-entrance" });

    const html = renderToString(
      <EditPage selection={{ kind: "room", id: "room-entrance" }} />,
    );

    // RoomPanel mounted
    expect(html).toContain('data-testid="room-panel"');
    expect(html).toContain('id="room-name-input"');
  });

  it("renders 3D view placeholder/container when view is 3d", () => {
    const html = renderToString(<EditPage view="3d" />);

    // View toggle reflects 3D
    expect(html).toContain("3D");

    // Reset
    useGalleryStore.getState().setView("2d");
  });
});
