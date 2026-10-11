import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CreatorFields, cleanCreator, normalizeLink } from "./CreatorFields";

describe("CreatorFields", () => {
  it("adds https to bare addresses and refuses anything else", () => {
    expect(normalizeLink("open.spotify.com/artist/x")).toBe("https://open.spotify.com/artist/x");
    expect(normalizeLink("https://vic.studio")).toBe("https://vic.studio/");
    expect(normalizeLink("http://vic.studio")).toBeNull();
    expect(normalizeLink("javascript:alert(1)")).toBeNull();
    expect(normalizeLink("  ")).toBeNull();
  });

  it("stores only valid links, and nothing when everything is empty", () => {
    expect(cleanCreator("", " ", [{ url: "" }])).toBeUndefined();
    expect(
      cleanCreator(" Vic ", "", [{ url: "instagram.com/vic" }, { url: "nope" }, { url: "https://x.com/v", label: " Me " }]),
    ).toEqual({ name: "Vic", links: [{ url: "https://instagram.com/vic" }, { url: "https://x.com/v", label: "Me" }] });
  });

  it("renders the profile section", () => {
    const html = renderToString(<CreatorFields />);
    expect(html).toContain("Artist profile");
    expect(html).toContain('id="creator-name"');
    expect(html).toContain('data-testid="creator-add-link"');
  });
});
