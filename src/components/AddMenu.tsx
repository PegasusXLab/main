"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Tooltip } from "@/components/ui";
import { useGalleryStore, type Selection } from "@/store/gallery";
import type { Room } from "@/lib/schema/types";

export interface AddMenuProps {
  onAddArtwork?: (roomId: string) => void;
  onAddObject?: (roomId: string) => void;
  /** Injected in tests. */
  rooms?: Room[];
  selection?: Selection;
}

/** The room a new picture/object lands in: the selected room, else the room of the selection. */
export function targetRoomId(
  rooms: readonly Room[],
  selection: Selection,
  artworks: readonly { id: string; roomId: string }[],
  objects: readonly { id: string; roomId: string }[],
): string | null {
  const ids = new Set(rooms.map((r) => r.id));
  if (selection.kind === "room" && ids.has(selection.id)) return selection.id;
  if (selection.kind === "artwork") {
    const roomId = artworks.find((a) => a.id === selection.id)?.roomId;
    if (roomId && ids.has(roomId)) return roomId;
  }
  if (selection.kind === "object") {
    const roomId = objects.find((o) => o.id === selection.id)?.roomId;
    if (roomId && ids.has(roomId)) return roomId;
  }
  return null;
}

interface MenuEntry {
  key: "picture" | "object" | "sound" | "text";
  label: string;
  shortcut?: string;
  hint?: string;
  disabled?: boolean;
}

const ENTRIES: MenuEntry[] = [
  { key: "picture", label: "Picture", shortcut: "P" },
  { key: "object", label: "Object", shortcut: "O" },
  { key: "sound", label: "Sound", hint: "soon", disabled: true },
  { key: "text", label: "Text", hint: "soon", disabled: true },
];

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/**
 * One "+ Add" button for the 2D plan (T-132): Picture runs today's artwork add
 * unchanged; Object opens the free-standing object flow. P/O are shortcuts when
 * no input has focus. Sits absolute top-right of the canvas, 16 px inset.
 */
export function AddMenu({
  onAddArtwork,
  onAddObject,
  rooms: propRooms,
  selection: propSelection,
}: AddMenuProps) {
  const storeRooms = useGalleryStore((s) => s.gallery.rooms);
  const storeArtworks = useGalleryStore((s) => s.gallery.artworks);
  const storeObjects = useGalleryStore((s) => s.gallery.objects);
  const storeSelection = useGalleryStore((s) => s.selection);

  const rooms = propRooms ?? storeRooms;
  const selection = propSelection ?? storeSelection;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const roomId = useMemo(
    () => targetRoomId(rooms, selection, storeArtworks, storeObjects ?? []),
    [rooms, selection, storeArtworks, storeObjects],
  );

  const activate = useCallback(
    (entry: MenuEntry) => {
      if (entry.disabled || !roomId) return;
      setOpen(false);
      triggerRef.current?.focus();
      if (entry.key === "picture") onAddArtwork?.(roomId);
      else if (entry.key === "object") onAddObject?.(roomId);
    },
    [roomId, onAddArtwork, onAddObject],
  );

  // P/O shortcuts when no input has focus (and the menu is closed).
  useEffect(() => {
    if (open) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTextInput(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== "p" && k !== "o") return;
      if (!roomId) return;
      e.preventDefault();
      if (k === "p") onAddArtwork?.(roomId);
      else onAddObject?.(roomId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, roomId, onAddArtwork, onAddObject]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the active item when the menu opens / moves.
  useEffect(() => {
    if (open) itemRefs.current[active]?.focus();
  }, [open, active]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      // Skip disabled entries.
      let next = active;
      for (let i = 0; i < ENTRIES.length; i++) {
        next = (next + dir + ENTRIES.length) % ENTRIES.length;
        if (!ENTRIES[next].disabled) break;
      }
      setActive(next);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(ENTRIES[active]);
    }
  };

  const trigger = (
    <Button
      ref={triggerRef}
      type="button"
      variant="primary"
      size="sm"
      disabled={!roomId}
      aria-haspopup="menu"
      aria-expanded={open}
      data-testid="add-menu-trigger"
      onClick={() => {
        if (!roomId) return;
        setActive(0);
        setOpen((o) => !o);
      }}
    >
      + Add
    </Button>
  );

  return (
    <div
      ref={containerRef}
      className="absolute top-4 right-4 z-10"
      data-testid="add-menu"
      title={!roomId ? "Select a room first" : undefined}
    >
      {!roomId ? (
        <Tooltip content="Select a room first" side="bottom">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      {open && roomId ? (
        <div
          role="menu"
          aria-label="Add to room"
          data-testid="add-menu-list"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 mt-1 w-44 rounded-[2px] border border-hairline bg-paper py-1 shadow-md"
        >
          {ENTRIES.map((entry, i) => (
            <button
              key={entry.key}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitem"
              disabled={entry.disabled}
              data-testid={`add-menu-${entry.key}`}
              onClick={() => activate(entry)}
              onMouseEnter={() => {
                if (!entry.disabled) setActive(i);
              }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-graphite transition-colors duration-fast hover:bg-plaster focus-visible:outline-none focus-visible:bg-plaster disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {entry.label}
                {entry.hint ? (
                  <span className="ml-1.5 text-[11px] text-pencil">
                    {entry.hint}
                  </span>
                ) : null}
              </span>
              {entry.shortcut ? (
                <kbd className="rounded border border-hairline bg-plaster px-1 font-mono text-[11px] text-pencil">
                  {entry.shortcut}
                </kbd>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
