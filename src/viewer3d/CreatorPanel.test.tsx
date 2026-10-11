import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { CreatorChip, CreatorPanel } from "./CreatorPanel";

const creator = {
  name: "Vic Googe",
  bio: "Producer from Atlanta.",
  links: [{ url: "https://open.spotify.com/artist/x" }, { url: "javascript:alert(1)" }, { url: "https://vic.studio" }],
};

describe("CreatorPanel", () => {
  it("shows the chip as 'by <name>' with initials", () => {
    const html = renderToString(<CreatorChip creator={creator} onOpen={vi.fn()} />);
    expect(html).toContain("by Vic Googe");
    expect(html).toContain(">VG<");
  });

  it("shows name, bio and only safe, labeled links", () => {
    const html = renderToString(<CreatorPanel creator={creator} open onClose={vi.fn()} />);
    expect(html).toContain('aria-label="About Vic Googe"');
    expect(html).toContain("Producer from Atlanta.");
    expect(html).toContain(">Spotify<");
    expect(html).toContain('href="https://vic.studio/"');
    expect(html).not.toContain("javascript:");
    expect(html).toContain('aria-label="Close"');
  });

  it("renders nothing when closed", () => {
    expect(renderToString(<CreatorPanel creator={creator} open={false} onClose={vi.fn()} />)).toBe("");
  });
});
