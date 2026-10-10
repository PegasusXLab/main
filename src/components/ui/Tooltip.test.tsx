import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Tooltip } from "./Tooltip";

describe("Tooltip primitive", () => {
  it("renders trigger element without crashing", () => {
    const html = renderToString(
      <Tooltip content="Undo change">
        <button data-testid="trigger">Undo</button>
      </Tooltip>,
    );
    expect(html).toContain('data-testid="trigger"');
    expect(html).toContain("Undo");
  });
});
