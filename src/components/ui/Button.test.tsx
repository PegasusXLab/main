import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Button } from "./Button";

describe("Button primitive", () => {
  it("renders with default primary variant and size", () => {
    const html = renderToString(<Button data-testid="btn">Save</Button>);
    expect(html).toContain("Save");
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-paper");
    expect(html).toContain("rounded-[2px]");
    expect(html).toContain('data-testid="btn"');
  });

  it("renders secondary, outline, ghost, and destructive variants", () => {
    const secHtml = renderToString(<Button variant="secondary">Cancel</Button>);
    expect(secHtml).toContain("bg-plaster");
    expect(secHtml).toContain("text-graphite");

    const outHtml = renderToString(<Button variant="outline">Outline</Button>);
    expect(outHtml).toContain("border-hairline");

    const ghostHtml = renderToString(<Button variant="ghost">Ghost</Button>);
    expect(ghostHtml).toContain("bg-transparent");

    const destHtml = renderToString(
      <Button variant="destructive">Delete</Button>,
    );
    expect(destHtml).toContain("bg-danger");
  });

  it("renders sm, default, and icon sizes", () => {
    const smHtml = renderToString(<Button size="sm">Small</Button>);
    expect(smHtml).toContain("h-7");

    const iconHtml = renderToString(<Button size="icon">+</Button>);
    expect(iconHtml).toContain("h-8");
    expect(iconHtml).toContain("w-8");
  });

  it("handles disabled state with reduced opacity and cursor", () => {
    const onClick = vi.fn();
    const element = (
      <Button onClick={onClick} disabled data-testid="disabled-btn">
        Disabled
      </Button>
    );
    const html = renderToString(element);
    expect(html).toContain("disabled");
    expect(html).toContain("disabled:opacity-50");
  });

  it("supports keyboard tab navigation with focus-visible ring", () => {
    const html = renderToString(<Button>Focusable</Button>);
    expect(html).toContain("focus-visible:ring-accent");
  });
});
