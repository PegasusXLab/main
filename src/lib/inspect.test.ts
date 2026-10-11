import { describe, expect, it } from "vitest";
import { isInspectable, linkHost, safeLink, visibleFacts } from "./inspect";

const base = { title: "", story: "", facts: undefined, voiceOver: undefined, inspectable: undefined };

describe("inspect helpers", () => {
  it("keeps old artworks clickable and opens objects only when they have details", () => {
    expect(isInspectable(base, "artwork")).toBe(true);
    expect(isInspectable(base, "object")).toBe(false);
    expect(isInspectable({ ...base, title: "Bust" }, "object")).toBe(true);
  });
  it("lets the creator's switch win", () => {
    expect(isInspectable({ ...base, inspectable: false }, "artwork")).toBe(false);
    expect(isInspectable({ ...base, inspectable: true }, "object")).toBe(true);
  });
  it("shows only complete detail rows", () => {
    expect(visibleFacts([{ label: "Year", value: "2024" }, { label: "Medium", value: " " }])).toEqual([
      { label: "Year", value: "2024" },
    ]);
  });
  it("only renders https links", () => {
    expect(safeLink("https://example.com/a")).toBe("https://example.com/a");
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("http://example.com")).toBeNull();
    expect(linkHost("https://www.moma.org/x")).toBe("moma.org");
  });
});
