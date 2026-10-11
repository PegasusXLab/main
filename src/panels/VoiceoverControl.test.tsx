import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { VoiceoverControl } from "./VoiceoverControl";

describe("VoiceoverControl", () => {
  it("renders tab options and ElevenLabs voice selector when empty", () => {
    const html = renderToString(
      <VoiceoverControl
        label="Room Narration"
        defaultText="Welcome to the room."
        onChange={vi.fn()}
      />,
    );
    expect(html).toContain("Room Narration");
    expect(html).toContain("ElevenLabs AI");
    expect(html).toContain("Record Mic");
    expect(html).toContain("Upload File");
    expect(html).toContain("Generate AI Audio Guide");
  });

  it("renders active audio player when value has audioUrl", () => {
    const html = renderToString(
      <VoiceoverControl
        label="Room Narration"
        value={{
          text: "Description of the room",
          audioUrl: "/api/files/audio/sample.mp3",
          voiceName: "Rachel",
          source: "elevenlabs",
        }}
        onChange={vi.fn()}
      />,
    );
    expect(html).toContain("Active");
    expect(html).toContain("Rachel");
    expect(html).toContain("/api/files/audio/sample.mp3");
    expect(html).toContain("Remove");
  });
});
