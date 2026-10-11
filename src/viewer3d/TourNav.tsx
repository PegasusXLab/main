"use client";

// Tour wayfinding (viewer): one quiet glass pill at the bottom. Previous / next walk to the
// neighbouring room in tour order; the dots jump to any room (the camera still walks there
// through the doorways). Replaces the T-035 "◀ Previous room / ▶ Next room" buttons.

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TourNavProps {
  order: readonly string[];
  currentRoomId: string;
  roomNames: Record<string, string>;
  onGo: (roomId: string) => void;
}

const ICON_BUTTON =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper/80 transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-default)] hover:bg-white/10 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70 active:scale-[0.94]";

export function TourNav({ order, currentRoomId, roomNames, onGo }: TourNavProps) {
  const index = Math.max(0, order.indexOf(currentRoomId));
  const count = order.length;
  const name = roomNames[currentRoomId] || "Untitled room";
  const prev = order[(index - 1 + count) % count];
  const next = order[(index + 1) % count];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <nav
      aria-label="Rooms"
      data-testid="tour-nav"
      className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/12 bg-graphite/55 p-1 text-paper shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      {count > 1 ? (
        <button
          type="button"
          aria-label="Previous room"
          title={`Previous: ${roomNames[prev] || "Untitled room"}`}
          onClick={() => onGo(prev)}
          className={ICON_BUTTON}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      <div className="flex min-w-36 flex-col items-center gap-1.5 px-3 py-1">
        <div className="flex items-baseline gap-2">
          <span
            className="max-w-[40vw] truncate font-display text-sm font-medium tracking-wide"
            aria-live="polite"
          >
            {name}
          </span>
          {count > 1 ? (
            <span className="font-mono text-[10px] tabular-nums text-paper/50">
              {`${pad(index + 1)} / ${pad(count)}`}
            </span>
          ) : null}
        </div>
        {count > 1 ? (
          <div className="flex items-center gap-1.5">
            {order.map((id, i) => {
              const active = i === index;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`Go to ${roomNames[id] || "Untitled room"}`}
                  aria-current={active ? "location" : undefined}
                  onClick={() => onGo(id)}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-[var(--duration-slow)] ease-[var(--ease-out-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70 ${
                    active ? "w-5 bg-paper" : "w-1.5 bg-paper/35 hover:bg-paper/70"
                  }`}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <button
          type="button"
          aria-label="Next room"
          title={`Next: ${roomNames[next] || "Untitled room"}`}
          onClick={() => onGo(next)}
          className={ICON_BUTTON}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </nav>
  );
}
