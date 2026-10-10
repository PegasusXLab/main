import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Canvas, useCanvasTransform, toMeters, toScreen } from "./Canvas";

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

  it("converts between screen pixels and meters consistently", () => {
    const panOffset = 200;
    const ppm = 40;
    const initialMeter = 6.5;

    const screenCoord = toScreen(initialMeter, panOffset, ppm);
    expect(screenCoord).toBe(6.5 * 40 + 200); // 460

    const roundTripMeter = toMeters(screenCoord, panOffset, ppm);
    expect(roundTripMeter).toBeCloseTo(initialMeter);
  });
});
