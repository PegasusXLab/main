import { describe, it, expect } from "vitest";
import { Grid } from "./Grid";

describe("Grid", () => {
  it("renders an SVG defs pattern for 0.5m and 1.0m grid intervals", () => {
    const element = Grid({ pixelsPerMeter: 40 });
    expect(element).toBeDefined();
    expect(element.type).toBe("defs");
    expect(element.props.children).toBeDefined();
    expect(element.props.children.props.id).toBe("editor-grid-pattern");
    expect(element.props.children.props.width).toBe(40);
    expect(element.props.children.props.height).toBe(40);
  });
});
