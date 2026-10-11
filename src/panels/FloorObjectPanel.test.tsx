import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { FloorObjectPanel, objectSourceLabel } from "./FloorObjectPanel";
import type { GalleryObject } from "@/lib/schema/types";
import { useGalleryStore } from "@/store/gallery";

const libraryObject: GalleryObject = {
  id: "o1",
  roomId: "r1",
  position: { x: 3, y: 3 },
  rotation: 45,
  height: 0.515,
  plinth: { shape: "box", height: 1.0 },
  source: { kind: "library", libraryId: "bust-marble" },
  title: "Bust",
  artist: "Poly Haven",
  story: "A probe.",
};

const modelObject: GalleryObject = {
  ...libraryObject,
  id: "o2",
  source: { kind: "model", modelUrl: "/api/files/models/x.glb", origin: "upload" },
};

describe("objectSourceLabel", () => {
  it("names library, upload and cutout sources in plain words", () => {
    expect(
      objectSourceLabel({ kind: "library", libraryId: "bust-marble" }),
    ).toBe("Library: Marble bust");
    expect(
      objectSourceLabel({
        kind: "model",
        modelUrl: "/m.glb",
        origin: "upload",
      }),
    ).toBe("3D file");
    expect(
      objectSourceLabel({
        kind: "model",
        modelUrl: "",
        origin: "generated",
        job: {
          id: "j",
          status: "queued",
          fallback: { image: { small: "", medium: "" }, aspect: 1 },
        },
      }),
    ).toBe("3D from photo");
  });
});

describe("FloorObjectPanel", () => {
  it("edits height, rotation, plinth and plaque fields with source line", () => {
    const html = renderToString(
      <FloorObjectPanel objectId="o1" object={libraryObject} />,
    );
    expect(html).toContain("Edit object");
    expect(html).toContain("Library: Marble bust");
    expect(html).toContain('id="floor-object-height"');
    expect(html).toContain('id="floor-object-rotation"');
    expect(html).toContain('id="floor-object-pos-x"');
    expect(html).toContain('id="floor-object-pos-y"');
    expect(html).toContain('data-testid="floor-object-center-btn"');
    expect(html).toContain('id="floor-object-plinth-height"');
    expect(html).toContain('id="floor-object-title"');
    expect(html).toContain('value="Bust"');
    expect(html).toContain("Replace…");
    expect(html).toContain("Delete");
  });

  it("hides the plinth height slider when there is no plinth", () => {
    const html = renderToString(
      <FloorObjectPanel
        objectId="o2"
        object={{
          ...modelObject,
          plinth: { shape: "none", height: 0 },
        }}
        onReplace={vi.fn()}
      />,
    );
    expect(html).toContain("3D file");
    expect(html).not.toContain('id="floor-object-plinth-height"');
  });

  it("shows the cut-out depth slider for cutout objects", () => {
    const html = renderToString(
      <FloorObjectPanel
        objectId="o3"
        object={{
          ...libraryObject,
          id: "o3",
          source: {
            kind: "cutout",
            image: { small: "/s.jpg", medium: "/m.jpg" },
            aspect: 1,
            depth: 0.05,
          },
        }}
      />,
    );
    expect(html).toContain("Cut-out");
    expect(html).toContain('id="floor-object-cutout-depth"');
    expect(html).toContain("0.05 m");
  });

  it("reports a missing object", () => {
    const html = renderToString(<FloorObjectPanel objectId="missing" />);
    expect(html).toContain("Object not found");
  });

  it("bounds the position sliders like dragging on the plan (margin + half the footprint)", () => {
    const room = useGalleryStore.getState().gallery.rooms[0];
    const obj: GalleryObject = { ...libraryObject, roomId: room.id, height: 1 };
    const html = renderToString(<FloorObjectPanel objectId="o1" object={obj} />);
    const slider = (id: string) => html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? "";
    // 1 m footprint: 0.3 m margin + 0.5 m half side on each end.
    expect(slider("floor-object-pos-x")).toContain('min="0.8"');
    expect(slider("floor-object-pos-x")).toContain(`max="${room.w - 0.8}"`);
    expect(slider("floor-object-pos-y")).toContain(`max="${room.d - 0.8}"`);
  });
});
