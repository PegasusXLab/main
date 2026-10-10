import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Showcase } from "./Showcase";

describe("Showcase", () => {
  it("keeps the section label, wall dimension and controls", () => {
    const html = renderToString(<Showcase />);
    expect(html).toContain('aria-label="Hanging wall artwork showcase"');
    expect(html).toContain("145 cm");
    expect(html).toContain("MOVE THROUGH THE WALL");
    expect(html).toContain("Show previous artworks");
    expect(html).toContain("Show next artworks");
  });

  it("renders two identical copies with the second copy aria-hidden", () => {
    const html = renderToString(<Showcase />);
    const frameTags = html
      .split("<div ")
      .filter((part) => part.includes("data-frame"));
    expect(frameTags).toHaveLength(12); // 2 copies × 6 pieces
    // only the second copy is hidden from assistive tech
    const hiddenFrames = frameTags.filter((part) =>
      part.includes('aria-hidden="true"'),
    );
    expect(hiddenFrames).toHaveLength(6);
  });

  it("keeps the track keyboard accessible and label unchanged", () => {
    const html = renderToString(<Showcase />);
    expect(html).toContain("Use the left and right arrow keys to browse.");
    expect(html).toContain('tabindex="0"');
  });

  it("animates the track only (will-change on the track, no inline transform)", () => {
    const html = renderToString(<Showcase />);
    expect(html).toContain("will-change-transform");
    expect(html).not.toContain("style=");
  });
});
