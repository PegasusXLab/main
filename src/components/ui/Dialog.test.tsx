import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Dialog } from "./Dialog";

describe("Dialog primitive", () => {
  it("renders nothing when open is false", () => {
    const html = renderToString(
      <Dialog open={false} onOpenChange={vi.fn()}>
        <div>Modal Content</div>
      </Dialog>,
    );
    expect(html).toBe("");
  });

  it("renders backdrop, content card, title, and description when open is true", () => {
    const html = renderToString(
      <Dialog
        open={true}
        onOpenChange={vi.fn()}
        title="Publish Gallery"
        description="Your space will be shared publicly."
      >
        <button>Confirm</button>
      </Dialog>,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Publish Gallery");
    expect(html).toContain("Your space will be shared publicly.");
    expect(html).toContain("Confirm");
    expect(html).toContain("bg-graphite/40");
    expect(html).toContain("bg-paper");
    expect(html).toContain("rounded-[4px]");
  });
});
