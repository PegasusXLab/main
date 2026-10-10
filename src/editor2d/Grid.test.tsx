import { describe, it, expect } from "vitest";
import { Grid } from "./Grid";

describe("Grid", () => {
  it("renders an SVG defs pattern with pan offset", () => {
    const element = Grid({ pixelsPerMeter: 40, pan: { x: 120, y: 80 } });
    expect(element).toBeDefined();
    expect(element.type).toBe("defs");
    expect(element.props.children).toBeDefined();
    expect(element.props.children.props.id).toBe("editor-grid-pattern");
    expect(element.props.children.props.width).toBe(40);
    expect(element.props.children.props.height).toBe(40);
    expect(element.props.children.props.x).toBe(120);
    expect(element.props.children.props.y).toBe(80);
  });
});
