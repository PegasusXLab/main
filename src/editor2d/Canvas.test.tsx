import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  Canvas,
  useCanvasTransform,
  toMeters,
  toScreen,
  zoomAt,
} from "./Canvas";

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

  it("anchors the cursor position in meters across zoomAt without drift", () => {
    // Test case from Reviewer Round 2 report:
    // Initial pan: (237, 150), zoom: 1.0, cursor point: (420, 330), factor: 1.2
    const initialView = { pan: { x: 237, y: 150 }, zoom: 1.0 };
    const cursor = { x: 420, y: 330 };
    const ppmBefore = 40 * initialView.zoom;
    const meterBeforeX = toMeters(cursor.x, initialView.pan.x, ppmBefore);
    const meterBeforeY = toMeters(cursor.y, initialView.pan.y, ppmBefore);

    const nextView = zoomAt(initialView, cursor, 1.2);
    const ppmAfter = 40 * nextView.zoom;
    const meterAfterX = toMeters(cursor.x, nextView.pan.x, ppmAfter);
    const meterAfterY = toMeters(cursor.y, nextView.pan.y, ppmAfter);

    // Anchor point in meters must be identical before and after zoom
    expect(meterAfterX).toBeCloseTo(meterBeforeX, 6);
    expect(meterAfterY).toBeCloseTo(meterBeforeY, 6);
    // Pan must equal single application (200.4), not double (156.48)
    expect(nextView.pan.x).toBeCloseTo(200.4, 4);

    // Calling zoomAt again on the same initialView produces the exact same result (pure function)
    const idempotentView = zoomAt(initialView, cursor, 1.2);
    expect(idempotentView.pan.x).toBe(nextView.pan.x);
    expect(idempotentView.zoom).toBe(nextView.zoom);
  });

  it("renders room shapes from the gallery store", () => {
    const html = renderToString(<Canvas />);
    // Sample gallery contains 3 rooms
    expect(html).toContain('data-testid="room-');
    expect(html).toContain("Entrance");
  });

  it("renders plan key legend overlay on canvas", () => {
    const html = renderToString(<Canvas />);
    expect(html).toContain('data-testid="canvas-plan-legend"');
    expect(html).toContain("Plan Key");
  });
});
