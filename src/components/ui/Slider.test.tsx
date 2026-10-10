import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Slider } from "./Slider";

describe("Slider primitive", () => {
  it("renders range input with accent track styling", () => {
    const html = renderToString(
      <Slider min={2} max={20} step={1} value={6} data-testid="slider" />,
    );
    expect(html).toContain('data-testid="slider"');
    expect(html).toContain('type="range"');
    expect(html).toContain('min="2"');
    expect(html).toContain('max="20"');
    expect(html).toContain('value="6"');
    expect(html).toContain("accent-accent");
    expect(html).toContain("bg-hairline");
  });

  it("handles disabled state", () => {
    const html = renderToString(<Slider disabled value={5} />);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });
});
