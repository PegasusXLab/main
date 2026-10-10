import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import sample from "@/fixtures/sample-3room.json";
import { compile } from "@/lib/compile/compile";
import type { Gallery } from "@/lib/schema/types";
import { topDownStartPosition } from "./CameraRig";
import { TourView } from "./TourView";

const gallery = sample as Gallery;

describe("TourView (T-124)", () => {
  it("renders the tour HUD for a gallery: title, Prev/Next, current room", () => {
    const html = renderToString(<TourView gallery={gallery} />);
    expect(html).toContain(gallery.title);
    expect(html).toContain("Previous room");
    expect(html).toContain("Next room");
    expect(html).toContain("Entrance");
    expect(html).toContain("h-screen w-screen"); // viewer default: full screen, as before
  });

  it("fills its parent in the editor", () => {
    const html = renderToString(<TourView gallery={gallery} fill="parent" />);
    expect(html).toContain("h-full w-full");
    expect(html).not.toContain("h-screen w-screen");
  });

  it('shows "Add a room in 2D" for an empty gallery', () => {
    const html = renderToString(
      <TourView
        gallery={{ ...gallery, rooms: [], artworks: [] }}
        fill="parent"
      />,
    );
    expect(html).toContain("Add a room in 2D");
    expect(html).toContain('data-testid="tour-empty"');
  });
});

describe("Top-down start (T-124)", () => {
  it("starts above the plan center, tilted slightly south", () => {
    const { scene } = compile(gallery);
    const [x, y, z] = topDownStartPosition(scene.floors, [6, 0, 5.5]);
    expect(x).toBe(6);
    expect(y).toBeGreaterThan(10); // well above the 12 m-wide plan
    expect(z).toBeGreaterThan(5.5);
    expect(y).toBeGreaterThan(z - 5.5); // more above than behind: looks mostly down
  });

  it("uses a minimum span for tiny or empty plans", () => {
    const [, y] = topDownStartPosition([], [0, 0, 0]);
    expect(y).toBeCloseTo(6 * 1.1);
  });
});
