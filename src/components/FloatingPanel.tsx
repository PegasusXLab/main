"use client";

// A floating window inside the editor / viewer stage: drag it by its header, resize it from its
// bottom corners, collapse it to a pill and expand it again. Every page load starts it at its home
// corner (anchor + inset), open or collapsed per `defaultCollapsed`. A panel the visitor hasn't
// moved stays pinned to that corner as the stage resizes; once moved or resized it stays where it
// was put (kept inside the stage) until the page is reloaded. Nothing is persisted.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Minus } from "lucide-react";

export interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type PanelAnchor = "top-right" | "bottom-right" | "top-left" | "bottom-left";

/** Keeps a panel fully on screen inside a container (and at least its minimum size). */
export function clampRect(
  r: PanelRect,
  box: { width: number; height: number },
  min: { w: number; h: number },
  margin = 8,
): PanelRect {
  const w = Math.max(min.w, Math.min(r.w, box.width - margin * 2));
  const h = Math.max(min.h, Math.min(r.h, box.height - margin * 2));
  return {
    w,
    h,
    x: Math.min(Math.max(margin, r.x), Math.max(margin, box.width - w - margin)),
    y: Math.min(Math.max(margin, r.y), Math.max(margin, box.height - h - margin)),
  };
}

/** Where a panel of `size` starts for an anchor, `inset` px from the container edges. */
export function anchoredRect(
  anchor: PanelAnchor,
  size: { w: number; h: number },
  box: { width: number; height: number },
  inset: { x: number; y: number },
): PanelRect {
  const right = anchor.endsWith("right");
  const bottom = anchor.startsWith("bottom");
  return {
    w: size.w,
    h: size.h,
    x: right ? box.width - size.w - inset.x : inset.x,
    y: bottom ? box.height - size.h - inset.y : inset.y,
  };
}

/** Older builds saved panel positions here; cleared so nobody is stuck with a stale spot. */
const LEGACY_KEY = (id: string) => `gv:panel:${id}`;

export interface FloatingPanelProps {
  id: string;
  title: ReactNode;
  /** Extra header actions (buttons), shown before the collapse button. */
  actions?: ReactNode;
  anchor?: PanelAnchor;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  inset?: { x: number; y: number };
  defaultCollapsed?: boolean;
  /** Label of the collapsed pill (defaults to the title). */
  collapsedLabel?: ReactNode;
  /** Small leading mark in the pill (e.g. a live dot). */
  pillIcon?: ReactNode;
  tone?: "light" | "dark";
  /** Accessible name of the panel region (e.g. "3D preview", "Map"). */
  label: string;
  testId?: string;
  collapsedTestId?: string;
  collapseTestId?: string;
  className?: string;
  children: ReactNode;
}

type Gesture =
  | { kind: "move"; sx: number; sy: number; start: PanelRect }
  | { kind: "resize"; corner: "left" | "right"; sx: number; sy: number; start: PanelRect };

export function FloatingPanel({
  id,
  title,
  label,
  actions,
  anchor = "top-right",
  defaultSize,
  minSize = { w: 200, h: 140 },
  inset = { x: 16, y: 16 },
  defaultCollapsed = false,
  collapsedLabel,
  pillIcon,
  tone = "light",
  testId,
  collapsedTestId,
  collapseTestId,
  className = "",
  children,
}: FloatingPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<PanelRect | null>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [moving, setMoving] = useState(false);
  const gesture = useRef<Gesture | null>(null);
  // Moved or resized by the visitor this page load (until then it's pinned to its corner).
  const userPlaced = useRef(false);

  const box = useCallback(() => {
    const parent = rootRef.current?.parentElement;
    return parent
      ? { width: parent.clientWidth, height: parent.clientHeight }
      : { width: 1024, height: 768 };
  }, []);

  // Start at the home corner; re-pin to it on stage resizes until the visitor moves it.
  useEffect(() => {
    try {
      globalThis.localStorage?.removeItem(LEGACY_KEY(id));
    } catch {
      // ignore
    }
    const place = () => {
      const b = box();
      if (b.width === 0 || b.height === 0) return; // not laid out yet; the observer retries
      setRect((r) =>
        userPlaced.current && r
          ? clampRect(r, b, minSize)
          : clampRect(anchoredRect(anchor, defaultSize, b, inset), b, minSize),
      );
    };
    const frame = requestAnimationFrame(place);
    const parent = rootRef.current?.parentElement;
    let ro: ResizeObserver | null = null;
    if (parent && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(place);
      ro.observe(parent);
    }
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
    };
    // Mount-only placement; sizes are configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startGesture = (e: React.PointerEvent, g: Gesture) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    gesture.current = g;
    userPlaced.current = true;
    setMoving(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    let next: PanelRect;
    if (g.kind === "move") next = { ...g.start, x: g.start.x + dx, y: g.start.y + dy };
    else if (g.corner === "right") next = { ...g.start, w: g.start.w + dx, h: g.start.h + dy };
    else {
      const w = Math.max(minSize.w, g.start.w - dx);
      next = { ...g.start, x: g.start.x + (g.start.w - w), w, h: g.start.h + dy };
    }
    setRect(clampRect(next, box(), minSize));
  };
  const endGesture = (e: React.PointerEvent) => {
    if (!gesture.current) return;
    gesture.current = null;
    setMoving(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const dark = tone === "dark";
  const surface = dark
    ? "border-white/15 bg-black/70 text-white"
    : "border-hairline bg-paper/95 text-graphite";

  // Before placement (SSR / first frame) render where the anchor puts it, without a size jump.
  const style: React.CSSProperties = rect
    ? collapsed
      ? { left: rect.x + (anchor.endsWith("right") ? rect.w : 0), top: rect.y, transform: anchor.endsWith("right") ? "translateX(-100%)" : undefined }
      : { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
    : {
        [anchor.endsWith("right") ? "right" : "left"]: inset.x,
        [anchor.startsWith("bottom") ? "bottom" : "top"]: inset.y,
        width: collapsed ? undefined : defaultSize.w,
        height: collapsed ? undefined : defaultSize.h,
      };

  if (collapsed) {
    return (
      <div ref={rootRef} data-fit-avoid="true" className={`absolute z-20 ${className}`} style={style}>
        <button
          type="button"
          data-testid={collapsedTestId}
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label={`Show ${label}`}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition-[background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-default)] hover:scale-[1.02] active:scale-[0.98] ${surface}`}
        >
          {pillIcon}
          <span>{collapsedLabel ?? title}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-testid={testId}
      data-fit-avoid="true"
      role="region"
      aria-label={label}
      className={`absolute z-20 flex flex-col overflow-hidden rounded-lg border shadow-xl backdrop-blur-md ${surface} ${
        moving ? "select-none" : "transition-shadow"
      } ${className}`}
      style={style}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
    >
      <div
        className={`flex shrink-0 cursor-grab items-center justify-between gap-2 border-b px-3 py-1.5 active:cursor-grabbing ${
          dark ? "border-white/10" : "border-hairline bg-plaster/50"
        }`}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button, a, input, select")) return;
          if (rect) startGesture(e, { kind: "move", sx: e.clientX, sy: e.clientY, start: rect });
        }}
        title="Drag to move"
      >
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold">{title}</div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <button
            type="button"
            data-testid={collapseTestId}
            onClick={() => setCollapsed(true)}
            aria-label="Collapse"
            title="Collapse"
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
              dark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-pencil hover:bg-paper hover:text-graphite"
            }`}
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {/* Resize grips (bottom corners) */}
      {(["left", "right"] as const).map((corner) => (
        <div
          key={corner}
          aria-hidden="true"
          data-testid={testId ? `${testId}-resize-${corner}` : undefined}
          onPointerDown={(e) => rect && startGesture(e, { kind: "resize", corner, sx: e.clientX, sy: e.clientY, start: rect })}
          className={`absolute bottom-0 z-10 flex h-6 w-6 items-end ${corner === "right" ? "right-0 justify-end cursor-nwse-resize" : "left-0 justify-start cursor-nesw-resize"}`}
        >
          <span
            className={`m-1 h-2.5 w-2.5 border-b-2 ${corner === "right" ? "border-r-2 rounded-br-sm" : "border-l-2 rounded-bl-sm"} ${
              dark ? "border-white/40" : "border-pencil/50"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
