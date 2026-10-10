import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Input } from "./Input";

describe("Input primitive", () => {
  it("renders with default text styles and token classes", () => {
    const html = renderToString(
      <Input
        data-testid="input"
        placeholder="Room name"
        defaultValue="Gallery"
      />,
    );
    expect(html).toContain('data-testid="input"');
    expect(html).toContain('placeholder="Room name"');
    expect(html).toContain('value="Gallery"');
    expect(html).toContain("bg-paper");
    expect(html).toContain("text-graphite");
    expect(html).toContain("border-hairline");
    expect(html).toContain("rounded-[2px]");
  });

  it("applies tabular figures and mono font when numeric or tabular prop set", () => {
    const numHtml = renderToString(<Input type="number" defaultValue={6} />);
    expect(numHtml).toContain("tabular-nums");
    expect(numHtml).toContain("font-mono");

    const tabHtml = renderToString(<Input tabular defaultValue="12.5" />);
    expect(tabHtml).toContain("tabular-nums");
    expect(tabHtml).toContain("font-mono");
  });

  it("supports disabled state", () => {
    const html = renderToString(<Input disabled defaultValue="Locked" />);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });

  it("exposes focus-visible ring on keyboard focus", () => {
    const html = renderToString(<Input />);
    expect(html).toContain("focus-visible:ring-accent");
  });
});
