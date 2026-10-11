import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Live3DPreview } from "./Live3DPreview";
import { sampleGallery } from "@/store/gallery";
import { compile } from "@/lib/compile/compile";

describe("Live3DPreview", () => {
  const sample = sampleGallery();
  const compiled = compile(sample);

  it("renders live 3d preview container and header markup", () => {
    const html = renderToString(
      <Live3DPreview
        scene={compiled.scene}
        selectedRoomId={sample.rooms[0].id}
        entranceRoomId={sample.entranceRoomId}
        rooms={sample.rooms}
        onSelectRoom={() => {}}
        defaultCollapsed={false}
      />,
    );

    expect(html).toContain('data-testid="live-3d-preview"');
    expect(html).toContain("3D Preview");
    expect(html).toContain(sample.rooms[0].name);
    expect(html).toContain('data-testid="live-3d-preview-minimize"');
  });

  it("renders split and full 3D action buttons when callbacks provided", () => {
    const html = renderToString(
      <Live3DPreview
        scene={compiled.scene}
        selectedRoomId={sample.rooms[0].id}
        entranceRoomId={sample.entranceRoomId}
        rooms={sample.rooms}
        onSelectRoom={() => {}}
        onExpandSplit={() => {}}
        onOpenFull3D={() => {}}
        defaultCollapsed={false}
      />,
    );

    expect(html).toContain("Split");
    expect(html).toContain("Full");
  });

  it("starts collapsed to the open button by default", () => {
    const html = renderToString(
      <Live3DPreview
        scene={compiled.scene}
        entranceRoomId={sample.entranceRoomId}
        rooms={sample.rooms}
        onSelectRoom={() => {}}
      />,
    );
    expect(html).toContain('data-testid="live-3d-preview-open"');
    expect(html).not.toContain('data-testid="live-3d-preview"');
  });
});
