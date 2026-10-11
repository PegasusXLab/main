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

  it("renders audio guide controls when voiceOver has audioUrl", () => {
    const html = renderToString(
      <Plaque
        title="Cosmic Ray"
        artist="Jane Doe"
        story="Exploration of light."
        voiceOver={{
          text: "Exploration of light.",
          audioUrl: "/api/files/audio/test.mp3",
          voiceName: "Marcus",
          source: "elevenlabs",
        }}
        itemId="art-1"
        onClose={vi.fn()}
      />,
    );
    expect(html).toContain("Audio Guide");
    expect(html).toContain("· Marcus");
    expect(html).toContain('data-testid="plaque-audio-guide-toggle"');
  });
});
