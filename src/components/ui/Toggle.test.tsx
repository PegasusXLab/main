import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Toggle } from "./Toggle";

describe("Toggle primitive", () => {
  it("renders with aria-pressed false by default", () => {
    const html = renderToString(<Toggle data-testid="toggle">2D / 3D</Toggle>);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("2D / 3D");
    expect(html).toContain("bg-plaster");
    expect(html).toContain("text-graphite");
  });

  it("renders with aria-pressed true and accent background when pressed", () => {
    const html = renderToString(
      <Toggle pressed={true} data-testid="toggle">
        Active
      </Toggle>,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-paper");
  });

  it("handles disabled state", () => {
    const html = renderToString(<Toggle disabled>Disabled</Toggle>);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });
});
