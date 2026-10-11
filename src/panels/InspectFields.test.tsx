import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { InspectFields, cleanInspectDetails } from "./InspectFields";

const props = {
  idPrefix: "art",
  onInspectableChange: vi.fn(),
  onFactsChange: vi.fn(),
  onLinkChange: vi.fn(),
};

describe("InspectFields", () => {
  it("shows details, presets and link only when inspectable", () => {
    const on = renderToString(
      <InspectFields {...props} inspectable facts={[{ label: "Year", value: "2024" }]} link="">
        <p>story here</p>
      </InspectFields>,
    );
    expect(on).toContain('role="switch"');
    expect(on).toContain("story here");
    expect(on).toContain('value="2024"');
    expect(on).toContain('data-testid="art-fact-medium"');
    expect(on).not.toContain('data-testid="art-fact-year"'); // already used
    expect(on).toContain('id="art-link"');
    const off = renderToString(
      <InspectFields {...props} inspectable={false} facts={[]} link="">
        <p>story here</p>
      </InspectFields>,
    );
    expect(off).not.toContain("story here");
    expect(off).not.toContain('id="art-link"');
  });

  it("stores only complete rows and https links", () => {
    expect(cleanInspectDetails([{ label: " Year ", value: "2024" }, { label: "X", value: "" }], "http://x.com")).toEqual({
      facts: [{ label: "Year", value: "2024" }],
      link: undefined,
    });
  });
});
