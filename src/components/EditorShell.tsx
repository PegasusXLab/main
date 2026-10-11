"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface EditorShellProps {
  title: string;
  onTitleChange: (title: string) => void;
  view: "2d" | "pov" | "3d";
  onViewChange: (view: "2d" | "pov" | "3d") => void;
  onPublish: () => void;
  panel: React.ReactNode;
  main: React.ReactNode;
}

/** Side panel width bounds (px) and default; desktop only (phones stack the panel). */
export const PANEL_MIN = 260;
export const PANEL_MAX = 560;
export const PANEL_DEFAULT = 320;
const PANEL_KEY = "gv:side-panel";

export function clampPanelWidth(w: number): number {
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(w)));
}

/** The side panel's width + collapsed state, remembered per browser (read after mount). */
function useSidePanel() {
  const [width, setWidth] = useState(PANEL_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const raw = globalThis.localStorage?.getItem(PANEL_KEY);
        if (raw) {
          const v = JSON.parse(raw) as { width?: unknown; collapsed?: unknown };
          if (typeof v.width === "number") setWidth(clampPanelWidth(v.width));
          setCollapsed(v.collapsed === true);
        }
      } catch {
        // ignore
      }
      loaded.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      globalThis.localStorage?.setItem(PANEL_KEY, JSON.stringify({ width, collapsed }));
    } catch {
      // ignore
    }
  }, [width, collapsed]);
  return { width, setWidth, collapsed, setCollapsed };
}

export function EditorShell({
  title,
  onTitleChange,
  view,
  onViewChange,
  onPublish,
  panel,
  main,
}: EditorShellProps) {
  const { width, setWidth, collapsed, setCollapsed } = useSidePanel();
  const [resizing, setResizing] = useState(false);
  const drag = useRef<{ sx: number; sw: number } | null>(null);

  const onHandleDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sw: width };
    setResizing(true);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setWidth(clampPanelWidth(drag.current.sw + e.clientX - drag.current.sx));
  };
  const onHandleUp = (e: React.PointerEvent) => {
    drag.current = null;
    setResizing(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-zinc-900">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-plaster px-4">
        {/* Gallery Title Input */}
        <div className="flex items-center gap-2">
          <Label htmlFor="gallery-title-input">Gallery:</Label>
          <Input
            id="gallery-title-input"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My First Show"
            className="w-48"
          />
        </div>

        {/* View switcher (T-124): 2D plan · 3D POV (visitor tour) · Top-down (orbit) */}
        <div
          role="group"
          aria-label="Editor view"
          className="flex items-center gap-1 rounded-[2px] border border-hairline bg-plaster p-0.5"
        >
          <Toggle
            pressed={view === "2d"}
            onPressedChange={() => onViewChange("2d")}
            size="sm"
          >
            2D
          </Toggle>
          <Toggle
            pressed={view === "pov"}
            onPressedChange={() => onViewChange("pov")}
            size="sm"
          >
            3D POV
          </Toggle>
          <Toggle
            pressed={view === "3d"}
            onPressedChange={() => onViewChange("3d")}
            size="sm"
          >
            Top-down
          </Toggle>
        </div>

        {/* Publish Action */}
        <div>
          <Button variant="primary" size="sm" onClick={onPublish}>
            Publish
          </Button>
        </div>
      </header>

      {/* Editor Body: side-by-side on desktop, panel under canvas on phones */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Properties Panel: drag its edge to resize, collapse it with the tab (desktop). */}
        <aside
          data-testid="editor-side-panel"
          data-collapsed={collapsed}
          aria-hidden={collapsed || undefined}
          className={`relative order-2 w-full shrink-0 border-t border-zinc-200 bg-white max-h-[45vh] md:order-1 md:max-h-none md:w-[var(--panel-w)] md:border-b-0 md:border-t-0 ${
            collapsed ? "md:hidden" : "md:border-r"
          } ${resizing ? "" : "md:transition-[width] md:duration-200 md:ease-[var(--ease-out-default)]"}`}
          style={{ "--panel-w": `${width}px` } as React.CSSProperties}
        >
          <div className="h-full overflow-y-auto p-4">{panel}</div>
          {/* Resize handle (right edge) */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panel"
            aria-valuemin={PANEL_MIN}
            aria-valuemax={PANEL_MAX}
            aria-valuenow={width}
            tabIndex={0}
            data-testid="editor-side-panel-resize"
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onDoubleClick={() => setWidth(PANEL_DEFAULT)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setWidth((w) => clampPanelWidth(w - 16));
              if (e.key === "ArrowRight") setWidth((w) => clampPanelWidth(w + 16));
            }}
            className="group absolute inset-y-0 -right-1.5 z-20 hidden w-3 cursor-col-resize md:block focus-visible:outline-none"
          >
            <span
              className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors duration-[var(--duration-fast)] group-hover:bg-accent group-focus-visible:bg-accent ${
                resizing ? "bg-accent" : "bg-transparent"
              }`}
            />
          </div>
          {/* Collapse tab */}
          <button
            type="button"
            data-testid="editor-side-panel-collapse"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse panel"
            title="Collapse panel"
            className="absolute -right-3 top-3 z-30 hidden h-6 w-6 items-center justify-center rounded-full border border-hairline bg-paper text-pencil shadow-sm transition-colors hover:text-graphite md:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </aside>

        {/* Main 2D Canvas / 3D Preview Workspace */}
        <main className="relative order-1 min-h-0 flex-1 overflow-hidden bg-zinc-100 md:order-2">
          {main}
          {collapsed ? (
            <button
              type="button"
              data-testid="editor-side-panel-expand"
              onClick={() => setCollapsed(false)}
              aria-label="Show panel"
              title="Show panel"
              className="absolute left-0 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-r-md border border-l-0 border-hairline bg-paper px-1 py-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-pencil shadow-sm transition-colors hover:text-graphite md:flex [writing-mode:vertical-rl]"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              Panel
            </button>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default EditorShell;
