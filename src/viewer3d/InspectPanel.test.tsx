import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { InspectPanel, type InspectItem } from "./InspectPanel";

const item: InspectItem = {
  id: "a1",
  kind: "artwork",
  title: "Hacklanta Schedule 2026",
  artist: "Progsu",
  story: "Here is the schedule.",
  facts: [
    { label: "Year", value: "2026" },
    { label: "Medium", value: " " },
  ],
  link: "https://hacklanta.io/schedule",
  voiceOver: { text: "Hi", audioUrl: "/api/files/audio/x.mp3", voiceName: "Jessica - Playful, Bright" },
};

describe("InspectPanel", () => {
  it("shows the item, its complete details, the guide, the link, close and stepping", () => {
    const html = renderToString(
      <InspectPanel item={item} index={2} count={5} onClose={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Hacklanta Schedule 2026"');
    expect(html).toContain("Progsu");
    expect(html).toContain("Inspecting · 02 / 05");
    expect(html).toContain(">Year<");
    expect(html).toContain(">2026<");
    expect(html).not.toContain(">Medium<"); // empty value rows are hidden
    expect(html).toContain("Here is the schedule.");
    expect(html).toContain("Audio guide · Jessica");
    expect(html).toContain("Learn more on hacklanta.io");
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain("Next piece");
  });

  it("renders nothing when closed and never links non-https", () => {
    expect(renderToString(<InspectPanel item={null} index={0} count={0} onClose={vi.fn()} />)).toBe("");
    const html = renderToString(
      <InspectPanel item={{ ...item, link: "javascript:alert(1)" }} index={1} count={1} onClose={vi.fn()} />,
    );
    expect(html).not.toContain("Learn more");
    expect(html).not.toContain("Next piece");
  });
});
