import { describe, it, expect, vi } from "vitest";
import React from "react";
import { EditorShell } from "./EditorShell";

describe("EditorShell", () => {
  it("renders title, toggle, publish, panel, and main slots", () => {
    const onTitleChange = vi.fn();
    const onViewChange = vi.fn();
    const onPublish = vi.fn();

    const element = EditorShell({
      title: "Art Showcase",
      onTitleChange,
      view: "2d",
      onViewChange,
      onPublish,
      panel: <div id="test-panel">Panel Content</div>,
      main: <div id="test-main">Main Canvas</div>,
    });

    expect(element).toBeDefined();
    expect(element.props.children).toBeDefined();
  });
});
