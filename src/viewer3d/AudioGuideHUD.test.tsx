import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { AudioGuideHUD } from "./AudioGuideHUD";
import { useNarrationStore } from "@/audio/narrationStore";

describe("AudioGuideHUD", () => {
  it("renders guide mute button and status", () => {
    useNarrationStore.getState().setMuted(false);
    useNarrationStore.getState().stopNarration();

    const html = renderToString(<AudioGuideHUD />);
    expect(html).toContain('data-testid="audio-guide-hud"');
    expect(html).toContain('data-testid="audio-guide-toggle-mute"');
    expect(html).toContain("Guide");
  });

  it("renders docent voice name when narration is active", () => {
    const html = renderToString(
      <AudioGuideHUD
        isPlaying
        activeVoiceName="Rachel (The Contemporary Curator)"
        muted={false}
      />,
    );
    expect(html).toContain("Rachel (The Contemporary Curator)");
    expect(html).toContain("Pause narration");
  });
});
