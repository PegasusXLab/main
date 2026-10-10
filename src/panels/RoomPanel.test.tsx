import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { RoomPanel } from "./RoomPanel";
import type { Room } from "@/lib/schema/types";

const mockRoom: Room = {
  id: "room-entrance",
  name: "Main Gallery",
  description: "Grand central hall with high ceilings",
  x: 0,
  y: 0,
  w: 6,
  d: 6,
  wallHeight: 3,
  wallColor: "#f2efe9",
  floor: "wood",
  lighting: "gallery",
};

describe("RoomPanel", () => {
  it("renders empty state when no room is selected or provided", () => {
    const html = renderToString(<RoomPanel />);
    expect(html).toContain('data-testid="room-panel-empty"');
    expect(html).toContain("No room selected.");
  });

  it("renders all editable fields and controls when room is provided", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    expect(html).toContain('data-testid="room-panel"');
    expect(html).toContain('id="room-name-input"');
    expect(html).toContain("Main Gallery");
    expect(html).toContain('id="room-desc-input"');
    expect(html).toContain("Grand central hall with high ceilings");
    expect(html).toContain('id="room-width-input"');
    expect(html).toContain('value="6"');
    expect(html).toContain('id="room-depth-input"');
    expect(html).toContain('id="room-height-input"');
    expect(html).toContain('id="room-wall-color-input"');
    expect(html).toContain('id="room-floor-select"');
    expect(html).toContain('id="room-lighting-select"');
    expect(html).toContain("Objects in room");
    expect(html).toContain("Delete room");
  });

  it("displays read-only objects list for artworks in the room", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    // Sample gallery has artworks in room-entrance
    expect(html).toContain("Objects in room");
  });

  it("disables delete room button when only one room exists in store", () => {
    // With multiple rooms, button is enabled
    const html3 = renderToString(<RoomPanel room={mockRoom} />);
    expect(html3).not.toContain('disabled=""');

    // When only 1 room exists, button is disabled
    const html1 = renderToString(
      <RoomPanel room={mockRoom} rooms={[mockRoom]} />,
    );
    expect(html1).toContain('disabled=""');
  });

  it("renders + Add object button in room panel", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    expect(html).toContain("+ Add object");
  });

  it("renders atmosphere and music selects with presets and tracks", () => {
    const html = renderToString(<RoomPanel room={mockRoom} />);
    expect(html).toContain('id="room-atmosphere-select"');
    expect(html).toContain("Gallery White");
    expect(html).toContain("Neon Bunker");
    expect(html).toContain("Golden Hour");
    expect(html).toContain("Moonlit");
    expect(html).toContain("Custom");

    expect(html).toContain('id="room-music-select"');
    expect(html).toContain("Still Air");
    expect(html).toContain("Warm Hum");
    expect(html).toContain("Night Gallery");
    expect(html).toContain("Soft Drift");
  });

  it("renders custom atmosphere sliders when atmosphere preset is custom", () => {
    const customRoom: Room = {
      ...mockRoom,
      atmosphere: {
        preset: "custom",
        moodColor: "#ff0055",
        haze: 0.4,
        brightness: 0.7,
        lightDirection: 120,
        grain: 0.1,
      },
    };
    const html = renderToString(<RoomPanel room={customRoom} />);
    expect(html).toContain('data-testid="custom-atmosphere-controls"');
    expect(html).toContain('id="custom-mood-color"');
    expect(html).toContain('id="custom-haze"');
    expect(html).toContain('id="custom-brightness"');
    expect(html).toContain('id="custom-light-direction"');
    expect(html).toContain('id="custom-grain"');
  });

  it("renders custom audio controls when room has custom music URL", () => {
    const audioRoom: Room = {
      ...mockRoom,
      music: {
        url: "/api/files/audio/uploaded-song.mp3",
      },
    };
    const html = renderToString(<RoomPanel room={audioRoom} />);
    expect(html).toContain("Custom Song / MP3");
    expect(html).toContain("Replace MP3");
    expect(html).toContain('id="room-audio-url"');
    expect(html).toContain('value="/api/files/audio/uploaded-song.mp3"');
  });
});
