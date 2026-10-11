import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { EditorShell, PANEL_MAX, PANEL_MIN, clampPanelWidth } from "./EditorShell";

describe("EditorShell", () => {
  it("renders title, toggle, publish, panel, and main slots, with a resizable, collapsible panel", () => {
    const html = renderToString(
      <EditorShell
        title="Art Showcase"
        onTitleChange={vi.fn()}
        view="2d"
        onViewChange={vi.fn()}
        onPublish={vi.fn()}
        panel={<div id="test-panel">Panel Content</div>}
        main={<div id="test-main">Main Canvas</div>}
      />,
    );
    expect(html).toContain('value="Art Showcase"');
    expect(html).toContain("Publish");
    expect(html).toContain("Panel Content");
    expect(html).toContain("Main Canvas");
    expect(html).toContain('data-testid="editor-side-panel-resize"');
    expect(html).toContain('data-testid="editor-side-panel-collapse"');
    expect(html).toContain("--panel-w:320px");
  });

  it("keeps the panel width within bounds", () => {
    expect(clampPanelWidth(10)).toBe(PANEL_MIN);
    expect(clampPanelWidth(9999)).toBe(PANEL_MAX);
    expect(clampPanelWidth(400.4)).toBe(400);
  });
});
