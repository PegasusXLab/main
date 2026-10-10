import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Select } from "./Select";

describe("Select primitive", () => {
  it("renders with chevron and token border styling", () => {
    const html = renderToString(
      <Select defaultValue="wood" data-testid="select">
        <option value="wood">Wood</option>
        <option value="concrete">Concrete</option>
      </Select>,
    );
    expect(html).toContain('data-testid="select"');
    expect(html).toContain("Wood");
    expect(html).toContain("Concrete");
    expect(html).toContain("bg-paper");
    expect(html).toContain("border-hairline");
    expect(html).toContain("rounded-[2px]");
    expect(html).toContain("svg"); // Chevron indicator
  });

  it("handles disabled state", () => {
    const html = renderToString(
      <Select disabled>
        <option value="1">1</option>
      </Select>,
    );
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });
});
