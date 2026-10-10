import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { parseEditLink } from "@/components/parseEditLink";
import Home from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("start screen", () => {
  it("shows the blank-gallery button, disabled templates and the link input", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("New blank gallery");
    expect(html.match(/coming soon/g)).toHaveLength(2);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain("Open edit link");
  });
});

describe("parseEditLink", () => {
  it.each([
    ["https://galliverse.vercel.app/edit/abc_1?key=k-9", "/edit/abc_1?key=k-9"],
    ["http://localhost:3000/edit/abc?key=k", "/edit/abc?key=k"],
    ["  /edit/abc?key=k  ", "/edit/abc?key=k"],
    ["/edit/abc?x=1&key=k", "/edit/abc?key=k"],
  ])("accepts %s", (input, path) => expect(parseEditLink(input)).toBe(path));

  it.each([
    "",
    "hello",
    "/edit/abc",
    "/edit/abc?key=",
    "/g/abc?key=k",
    "https://evil.com/?next=/edit/abc?key=k",
  ])("rejects %j", (input) => expect(parseEditLink(input)).toBeNull());
});
