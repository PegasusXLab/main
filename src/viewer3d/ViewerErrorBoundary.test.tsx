import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  GL_OK,
  MAX_GL_REMOUNTS,
  nextGLHealth,
  SceneFallback,
  ViewerErrorBoundary,
  type GLEvent,
  type GLHealth,
} from "./ViewerErrorBoundary";

// Tests run in node (no DOM renderer), so the boundary is driven through React's own
// error-boundary contract: getDerivedStateFromError, componentDidCatch, render.
function boundary(
  fallback: React.ComponentProps<typeof ViewerErrorBoundary>["fallback"],
) {
  const b = new ViewerErrorBoundary({
    label: "post-processing",
    fallback,
    children: <p>scene</p>,
  });
  b.setState = ((patch: Partial<typeof b.state>) => {
    b.state = { ...b.state, ...patch };
  }) as typeof b.setState;
  return b;
}

function throwFrom(b: ViewerErrorBoundary, error: unknown) {
  b.state = ViewerErrorBoundary.getDerivedStateFromError();
  b.componentDidCatch(error);
}

describe("ViewerErrorBoundary", () => {
  it("renders its children until a child throws", () => {
    const b = boundary(null);
    expect(renderToString(<>{b.render()}</>)).toContain("scene");
  });

  it("shows the fallback after a child throws (null = effects simply dropped)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const b = boundary(null);
    throwFrom(b, new Error("EffectComposer: context lost"));
    expect(b.render()).toBeNull();
    warn.mockRestore();
  });

  it("warns once per boundary, however many times children throw", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const b = boundary(null);
    throwFrom(b, new Error("first"));
    throwFrom(b, new Error("second"));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("post-processing");
    warn.mockRestore();
  });

  it("passes a reset to a function fallback that brings the children back", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let reset: (() => void) | undefined;
    const b = boundary((r) => {
      reset = r;
      return <p>fallback</p>;
    });
    throwFrom(b, new Error("canvas"));
    expect(renderToString(<>{b.render()}</>)).toContain("fallback");
    reset!();
    expect(renderToString(<>{b.render()}</>)).toContain("scene");
    warn.mockRestore();
  });
});

describe("nextGLHealth", () => {
  type Kind = "lost" | "restored" | "timeout" | "retry";
  /** Events from the canvas currently on screen (tagged with the live generation). */
  const ev = (s: GLHealth, k: Kind): GLEvent =>
    k === "retry" ? { type: "retry" } : { type: k, generation: s.generation };
  const run = (kinds: Kind[], from: GLHealth = GL_OK) =>
    kinds.reduce((s, k) => nextGLHealth(s, ev(s, k)), from);

  it("a lost context that is restored remounts the canvas once", () => {
    expect(run(["lost", "restored"])).toEqual({
      phase: "ok",
      remounts: 1,
      generation: 1,
    });
  });

  it("waits while lost, and fails if the context never comes back", () => {
    expect(run(["lost"]).phase).toBe("lost");
    expect(run(["lost", "timeout"]).phase).toBe("failed");
  });

  it(`a second loss after ${MAX_GL_REMOUNTS} remount fails straight away`, () => {
    expect(run(["lost", "restored", "lost"]).phase).toBe("failed");
  });

  it("ignores the replaced canvas being torn down (forceContextLoss on generation 0)", () => {
    const remounted = run(["lost", "restored"]);
    const stale: GLEvent = { type: "lost", generation: 0 };
    expect(nextGLHealth(remounted, stale)).toBe(remounted);
  });

  it("ignores a timeout left over from an older canvas", () => {
    const remounted = run(["lost", "restored", "retry"]);
    expect(nextGLHealth(remounted, { type: "timeout", generation: 0 })).toBe(
      remounted,
    );
  });

  it("retry starts over with a fresh canvas", () => {
    const failed = run(["lost", "timeout"]);
    expect(nextGLHealth(failed, { type: "retry" })).toEqual({
      phase: "ok",
      remounts: 0,
      generation: failed.generation + 1,
    });
  });

  it("ignores events that don't apply to the current phase", () => {
    expect(run(["restored"])).toBe(GL_OK);
    expect(run(["timeout"])).toBe(GL_OK);
    const failed = run(["lost", "timeout"]);
    expect(run(["lost"], failed)).toBe(failed);
    expect(run(["restored"], failed)).toBe(failed);
  });
});

describe("SceneFallback", () => {
  it("renders a status message and a Retry button in the canvas's layout", () => {
    const html = renderToString(
      <SceneFallback className="absolute inset-0" onRetry={vi.fn()} />,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("couldn&#x27;t start");
    expect(html).toContain("Retry");
    expect(html).toContain("absolute inset-0");
  });

  it("fills its parent when the canvas had no class", () => {
    const html = renderToString(<SceneFallback onRetry={vi.fn()} />);
    expect(html).toContain("h-full w-full");
  });
});
