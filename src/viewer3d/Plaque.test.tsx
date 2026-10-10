import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Plaque } from "./Plaque";

describe("Plaque", () => {
  it("renders artwork title, artist, story and accessible dialog role", () => {
    const html = renderToString(
      <Plaque
        title="Moonlight Over Pines"
        artist="H. Tanaka"
        story="Painted en plein air in autumn 1928."
        onClose={vi.fn()}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Moonlight Over Pines"');
    expect(html).toContain("Moonlight Over Pines");
    expect(html).toContain("H. Tanaka");
    expect(html).toContain("Painted en plein air in autumn 1928.");
    expect(html).toContain("Close");
  });

  it("renders untitled fallback when title is missing", () => {
    const html = renderToString(
      <Plaque title="" artist="" story="" onClose={vi.fn()} />,
    );
    expect(html).toContain('aria-label="Artwork"');
    expect(html).toContain("Untitled");
  });
});
