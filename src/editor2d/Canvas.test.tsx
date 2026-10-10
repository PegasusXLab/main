import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Canvas, useCanvasTransform } from "./Canvas";

describe("Canvas", () => {
  it("renders SVG canvas element with zoom controls and grid", () => {
    const html = renderToString(<Canvas />);
    expect(html).toBeDefined();
    expect(html).toContain("editor-grid-pattern");
    expect(html).toContain("svg");
    expect(html).toContain("100%");
  });

  it("exports useCanvasTransform hook", () => {
    expect(typeof useCanvasTransform).toBe("function");
  });
});
