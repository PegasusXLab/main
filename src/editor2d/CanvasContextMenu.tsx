"use client";

// Right-click / two-finger-click menu on the 2D plan: add a room (here or next to this one), add
// artwork or an object to the room under the pointer, delete it, or fit the plan. Keyboard:
// arrows move, Enter picks, Escape closes; each item shows its shortcut.

import { useEffect, useRef } from "react";
import type { Room } from "@/lib/schema/types";
import { hasOverlap } from "./overlap";
import { snap } from "./snapping";

export interface CanvasMenuTarget {
  /** Pointer position inside the canvas (px). */
  x: number;
  y: number;
  /** Pointer position on the plan (m). */
  at: { x: number; y: number };
  roomId?: string;
  objectId?: string;
}

interface Item {
  id: string;
  label: string;
  hint?: string;
  danger?: boolean;
  run: () => void;
}

export function CanvasContextMenu({
  target,
  rooms,
  canDelete,
  onClose,
  onAddRoomHere,
  onAddRoomNext,
  onAddArtwork,
  onAddObject,
  onDelete,
  onFit,
}: {
  target: CanvasMenuTarget;
  rooms: readonly Room[];
  canDelete: boolean;
  onClose: () => void;
  onAddRoomHere: (rect: { x: number; y: number; w: number; d: number }) => void;
  onAddRoomNext: (roomId?: string) => void;
  onAddArtwork?: (roomId: string) => void;
  onAddObject?: (roomId: string) => void;
  onDelete: () => void;
  onFit: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const room = rooms.find((r) => r.id === target.roomId);
  const here = { x: snap(target.at.x - 3), y: snap(target.at.y - 3), w: 6, d: 6 };
  const hereFree = !target.roomId && !hasOverlap(here, rooms);

  const items: (Item | "sep")[] = [];
  if (hereFree) items.push({ id: "room-here", label: "Add room here", hint: "Click", run: () => onAddRoomHere(here) });
  items.push({
    id: "room-next",
    label: room ? `Add room next to ${room.name || "this room"}` : "Add room",
    hint: "A",
    run: () => onAddRoomNext(room?.id),
  });
  if (room && onAddArtwork) items.push({ id: "art", label: "Add artwork…", run: () => onAddArtwork(room.id) });
  if (room && onAddObject) items.push({ id: "object", label: "Add object…", run: () => onAddObject(room.id) });
  if (canDelete) {
    items.push("sep");
    items.push({
      id: "delete",
      label: target.objectId ? "Delete object" : `Delete ${room?.name || "room"}`,
      hint: "⌫",
      danger: true,
      run: onDelete,
    });
  }
  items.push("sep");
  items.push({ id: "fit", label: "Fit plan to view", hint: "F", run: onFit });

  // Focus the first item; close on outside click, Escape, scroll or resize.
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const close = (e: Event) => {
      if (e instanceof PointerEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("wheel", close, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("wheel", close);
    };
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const buttons = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
    // Shortcut keys (A, F, ⌫) shouldn't also fire on the canvas while the menu is open.
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Canvas actions"
      data-testid="canvas-context-menu"
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute z-30 min-w-52 origin-top-left animate-none rounded-md border border-hairline bg-paper/95 p-1 text-xs text-graphite shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur"
      style={{ left: target.x, top: target.y }}
    >
      {items.map((it, k) =>
        it === "sep" ? (
          <div key={`sep-${k}`} role="separator" className="my-1 h-px bg-hairline" />
        ) : (
          <button
            key={it.id}
            type="button"
            role="menuitem"
            onClick={() => {
              it.run();
              onClose();
            }}
            className={`flex w-full items-center justify-between gap-6 rounded-[3px] px-2.5 py-1.5 text-left transition-colors duration-[var(--duration-fast)] focus-visible:outline-none ${
              it.danger
                ? "text-danger hover:bg-danger/10 focus-visible:bg-danger/10"
                : "hover:bg-plaster focus-visible:bg-plaster"
            }`}
          >
            <span>{it.label}</span>
            {it.hint ? <kbd className="font-mono text-[10px] text-pencil">{it.hint}</kbd> : null}
          </button>
        ),
      )}
    </div>
  );
}
