"use client";

// Room arrival title (viewer): the room's name and description float in, in the room's chosen
// typeface, once the visitor has walked in. They stay while you look around, float away when an
// artwork/object plaque opens, and float back when it closes. No card: type over a soft scrim.
// Motion: staggered rise + blur-in (ease-out, ~700 ms; a rare, arrival moment), quick fade-up
// exit (280 ms), slow idle drift. All of it collapses under prefers-reduced-motion.

import { useEffect, useState, type CSSProperties } from "react";
import type { Room } from "@/lib/schema/types";

export type TitlePosition = NonNullable<Room["titlePosition"]>;

export interface RoomTitleProps {
  name: string;
  description?: string;
  fontFamily: string;
  position?: TitlePosition;
  /** 1-based position in the tour, and the tour length (for the "Room 02 / 03" eyebrow). */
  index: number;
  count: number;
  visible: boolean;
  onDismiss?: () => void;
}

const PLACEMENT: Record<TitlePosition, { box: string; align: "start" | "end" | "center" }> = {
  "top-left": { box: "left-5 top-20 sm:left-8 sm:top-24", align: "start" },
  // Clear of the minimap on wider screens.
  "top-right": { box: "right-5 top-20 sm:right-56 sm:top-24", align: "end" },
  center: { box: "inset-x-0 top-20 mx-auto sm:top-24", align: "center" },
  "bottom-left": { box: "bottom-28 left-5 sm:left-8", align: "start" },
  "bottom-right": { box: "bottom-28 right-5 sm:right-8", align: "end" },
};

const ALIGN = {
  start: { items: "items-start", text: "text-left", origin: "left" },
  end: { items: "items-end", text: "text-right", origin: "right" },
  center: { items: "items-center", text: "text-center", origin: "center" },
} as const;

/** Per-line enter/exit styles; `delay` staggers the enter only (exits leave together). */
function line(entered: boolean, delayMs: number): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(14px)",
    filter: entered ? "blur(0)" : "blur(8px)",
    transitionProperty: "opacity, transform, filter",
    transitionDuration: entered ? "700ms, 900ms, 700ms" : "280ms",
    transitionTimingFunction: "var(--ease-out-default)",
    transitionDelay: entered ? `${delayMs}ms` : "0ms",
  };
}

export function RoomTitle({
  name,
  description,
  fontFamily,
  position = "top-left",
  index,
  count,
  visible,
  onDismiss,
}: RoomTitleProps) {
  // Flip one frame after `visible` turns on, so the enter transition actually runs on mount.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const place = PLACEMENT[position] ?? PLACEMENT["top-left"];
  const align = ALIGN[place.align];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <aside
      data-testid="room-title-hud"
      data-position={position}
      aria-hidden={!visible}
      className={`pointer-events-none absolute z-[15] flex w-[min(34rem,calc(100vw-2.5rem))] flex-col ${place.box} ${align.items} ${align.text}`}
    >
      <div className={`group relative flex flex-col gap-3 ${align.items} motion-safe:animate-[gv-title-drift_9s_ease-in-out_infinite]`}>
        {/* Soft scrim for legibility over bright walls (not a box). */}
        <div
          aria-hidden="true"
          className="absolute -inset-x-10 -inset-y-8 -z-10 bg-[radial-gradient(closest-side,rgba(12,12,14,0.32),rgba(12,12,14,0))] blur-lg transition-opacity duration-500"
          style={{ opacity: entered ? 1 : 0 }}
        />

        <div className="flex items-center gap-3" style={line(entered, 0)}>
          {count > 1 ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-paper/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              {`Room ${pad(index)} / ${pad(count)}`}
            </span>
          ) : null}
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Hide room title"
              className="pointer-events-auto rounded-full px-1.5 text-xs leading-none text-paper/0 transition-colors duration-[var(--duration-normal)] group-hover:text-paper/60 hover:!text-paper focus-visible:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
            >
              ✕
            </button>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="block h-px w-12 bg-paper/55"
          style={{
            transform: entered ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: align.origin,
            transition: "transform 800ms var(--ease-out-default)",
            transitionDelay: entered ? "90ms" : "0ms",
          }}
        />

        <h2
          className="text-balance text-[clamp(2.1rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-paper [text-shadow:0_2px_28px_rgba(0,0,0,0.45)]"
          style={{ fontFamily, ...line(entered, 150) }}
        >
          {name}
        </h2>

        {description ? (
          <p
            className="max-w-md whitespace-pre-line text-pretty font-sans text-sm leading-relaxed text-paper/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)] sm:text-[15px]"
            style={line(entered, 280)}
          >
            {description}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
