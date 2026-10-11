import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { Room } from "@/lib/schema/types";
import { RoomTypography } from "./RoomTypography";

const room = {
  id: "r1",
  name: "Salon",
  x: 0,
  y: 0,
  w: 6,
  d: 6,
  wallHeight: 3,
  wallColor: "#ffffff",
  floor: "wood",
  lighting: "gallery",
} as unknown as Room;

describe("RoomTypography", () => {
  it("previews the room name in the chosen face and offers five positions", () => {
    const html = renderToString(
      <RoomTypography room={{ ...room, titleFont: "cinzel", titlePosition: "bottom-right" }} onChange={vi.fn()} />,
    );
    expect(html).toContain('data-testid="room-font-preview"');
    expect(html).toContain("Salon");
    expect(html).toContain("--font-title-cinzel");
    for (const label of ["Top Left", "Center", "Top Right", "Bottom Left", "Bottom Right"])
      expect(html).toContain(label);
    // one checked each: color swatch, depth/flat, position
    expect(html.match(/aria-checked="true"/g)).toHaveLength(3);
    expect(html).not.toContain('id="room-custom-font-input"');
  });

  it("shows the upload control for an uploaded font", () => {
    const html = renderToString(
      <RoomTypography
        room={{ ...room, titleFont: "custom", customFontUrl: "/api/files/fonts/a.woff2" }}
        onChange={vi.fn()}
      />,
    );
    expect(html).toContain('id="room-custom-font-input"');
    expect(html).toContain("Replace font…");
    expect(html).toContain("gv-custom-");
  });

  it("offers title color swatches, any color, and depth vs flat", () => {
    const html = renderToString(
      <RoomTypography room={{ ...room, titleColor: "#d8b35a" }} onChange={vi.fn()} />,
    );
    expect(html).toContain('aria-label="Gilded"');
    expect(html).toContain('id="room-title-color"');
    expect(html).toContain("#D8B35A");
    expect(html).toContain("3D depth");
    expect(html).toContain("Flat");
    // Preview uses the chosen color with an extruded edge.
    expect(html).toMatch(/color:#d8b35a/i);
    expect(html).toContain("calc(");
  });
});
