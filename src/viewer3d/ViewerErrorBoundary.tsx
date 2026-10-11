"use client";

// Crash guard for the 3D view (T-157). A failure in the post chain or in WebGL itself must degrade
// (no effects, or a Retry card) instead of leaving visitors in a blank room. Two pieces:
// - ViewerErrorBoundary: a plain React error boundary; it warns once and shows its fallback.
// - nextGLHealth: pure state for WebGL context loss. The first loss waits for the browser to
//   restore the context and then remounts the canvas once; a second loss, or no restore in time,
//   shows the fallback. Retry starts over.

import { Component, type ReactNode } from "react";

export interface ViewerErrorBoundaryProps {
  /** Short name for the warning, e.g. "post-processing" or "3d-canvas". */
  label: string;
  /** Rendered after an error. The function form receives a reset that re-renders the children. */
  fallback: ReactNode | ((reset: () => void) => ReactNode);
  children?: ReactNode;
}

interface ViewerErrorBoundaryState {
  failed: boolean;
}

export class ViewerErrorBoundary extends Component<
  ViewerErrorBoundaryProps,
  ViewerErrorBoundaryState
> {
  state: ViewerErrorBoundaryState = { failed: false };
  private warned = false;

  static getDerivedStateFromError(): ViewerErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (this.warned) return;
    this.warned = true;
    console.warn(
      `[viewer] ${this.props.label} failed; showing fallback`,
      error,
    );
  }

  reset = () => {
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === "function" ? fallback(this.reset) : fallback;
  }
}

/** How long to wait for `webglcontextrestored` before showing the fallback. */
export const CONTEXT_RESTORE_TIMEOUT_MS = 3000;
/** Canvas remounts allowed after a context loss before giving up. */
export const MAX_GL_REMOUNTS = 1;

export interface GLHealth {
  phase: "ok" | "lost" | "failed";
  /** Remounts used since the last Retry. */
  remounts: number;
  /** Canvas key: bumps on every remount and Retry so React builds a fresh canvas. */
  generation: number;
}

/**
 * Context events carry the generation of the canvas they came from: a replaced canvas is torn down
 * with forceContextLoss(), and its late "lost" must not count against the canvas that replaced it.
 */
export type GLEvent =
  | { type: "lost" | "restored" | "timeout"; generation: number }
  | { type: "retry" };

export const GL_OK: GLHealth = { phase: "ok", remounts: 0, generation: 0 };

export function nextGLHealth(s: GLHealth, e: GLEvent): GLHealth {
  if (e.type !== "retry" && e.generation !== s.generation) return s;
  switch (e.type) {
    case "lost":
      if (s.phase !== "ok") return s;
      return { ...s, phase: s.remounts >= MAX_GL_REMOUNTS ? "failed" : "lost" };
    case "restored":
      if (s.phase !== "lost") return s;
      return {
        phase: "ok",
        remounts: s.remounts + 1,
        generation: s.generation + 1,
      };
    case "timeout":
      return s.phase === "lost" ? { ...s, phase: "failed" } : s;
    case "retry":
      return { phase: "ok", remounts: 0, generation: s.generation + 1 };
  }
}

/** Shown in place of the canvas when the 3D view can't run. Keeps the canvas's own layout class. */
export function SceneFallback({
  className,
  onRetry,
}: {
  className?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className={`${className ?? "h-full w-full"} flex flex-col items-center justify-center gap-3 bg-graphite text-plaster`}
    >
      <p className="text-sm">The 3D view couldn&apos;t start.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-plaster/40 px-3 py-1.5 text-sm transition-colors hover:bg-graphite-hover"
      >
        Retry
      </button>
    </div>
  );
}
