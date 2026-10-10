import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Label } from "./Label";

describe("Label primitive", () => {
  it("renders with uppercase tracking and pencil color", () => {
    const html = renderToString(
      <Label htmlFor="room-name">Room Dimensions</Label>,
    );
    expect(html).toContain("Room Dimensions");
    expect(html).toContain('for="room-name"');
    expect(html).toContain("text-pencil");
    expect(html).toContain("uppercase");
    expect(html).toContain("tracking-wider");
  });
});
