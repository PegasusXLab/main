"use client";

// Room arrival title (viewer): the room's name and description float in, in the room's chosen
// typeface and color, once the visitor has walked in. They stay while you look around, float away
// when an artwork/object plaque opens, and float back when it closes. No card: type over a soft
// scrim.
// "depth" style (default) makes it feel alive and 3D: an extruded edge in a deep shade of the
// color, letters that flip up one by one, a block that tilts toward the pointer (eyebrow, title
// and description at different depths, so they parallax) while the extrusion leans away from it
// like a moving light, and one light sheen across the letters once they land. The pointer work
// writes CSS variables on a ref (no React renders). Reduced motion and touch get the static look.

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Room } from "@/lib/schema/types";
import { extrusionShadow, titlePalette } from "@/lib/titleColor";
import { Headphones } from "lucide-react";

export type TitlePosition = NonNullable<Room["titlePosition"]>;

export interface RoomTitleProps {
  name: string;
  description?: string;
  fontFamily: string;
  position?: TitlePosition;
  /** Face color, "#rrggbb" (default white). */
  color?: string;
  /** "depth" (default) or "flat". */
  variant?: "depth" | "flat";
  /** 1-based position in the tour, and the tour length (for the "Room 02 / 03" eyebrow). */
  index: number;
  count: number;
  visible: boolean;
  onDismiss?: () => void;
  /** The room has an audio guide: show a chip that plays it again. */
  onListen?: () => void;
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

/** Max tilt toward the pointer (degrees) and how far the extruded edge leans (px per layer). */
export const TILT_X = 6;
export const TILT_Y = 9;
const EDGE_LEAN = 0.9;

/** Split into user-perceived characters (keeps emoji / accents whole). */
export function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (Seg)
    return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  return Array.from(text);
}

/**
 * Words as lists of characters with a running index (for staggering), so a title animates letter
 * by letter but only ever wraps between words.
 */
export function wordGlyphs(text: string): { word: string[]; start: number }[] {
  const out: { word: string[]; start: number }[] = [];
  let i = 0;
  for (const w of text.split(/(\s+)/)) {
    if (!w) continue;
    if (/^\s+$/.test(w)) {
      i += 1;
      continue;
    }
    const g = graphemes(w);
    out.push({ word: g, start: i });
    i += g.length;
  }
  return out;
}

/** Per-line enter/exit (opacity + rise + blur); `delay` staggers the enter only. */
function line(entered: boolean, delayMs: number, z = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: `translate3d(0, ${entered ? 0 : 14}px, ${z}px)`,
    filter: entered ? "blur(0)" : "blur(8px)",
    transitionProperty: "opacity, transform, filter",
    transitionDuration: entered ? "700ms, 900ms, 700ms" : "280ms",
    transitionTimingFunction: "var(--ease-out-default)",
    transitionDelay: entered ? `${delayMs}ms` : "0ms",
  };
}

function prefersCalm(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.matchMedia("(pointer: fine)").matches
  );
}

export function RoomTitle({
  name,
  description,
  fontFamily,
  position = "top-left",
  color,
  variant = "depth",
  index,
  count,
  visible,
  onDismiss,
  onListen,
}: RoomTitleProps) {
  // Flip one frame after `visible` turns on, so the enter transition actually runs on mount.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const depth = variant !== "flat";
  const palette = useMemo(() => titlePalette(color), [color]);
  const letters = useMemo(() => graphemes(name), [name]);
  const tiltRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);

  // Pointer tilt + leaning extrusion (depth only, fine pointers, motion allowed).
  useEffect(() => {
    const el = tiltRef.current;
    if (!depth || !el || prefersCalm()) return;
    let frame = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      frame = 0;
      el.style.setProperty("--gv-rx", `${(-ny * TILT_X).toFixed(2)}deg`);
      el.style.setProperty("--gv-ry", `${(nx * TILT_Y).toFixed(2)}deg`);
      el.style.setProperty("--gv-ex", `${(-nx * EDGE_LEAN).toFixed(2)}px`);
      el.style.setProperty("--gv-ey", `${(0.6 - ny * EDGE_LEAN * 0.6).toFixed(2)}px`);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      nx = (e.clientX / window.innerWidth) * 2 - 1;
      ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [depth]);

  // One light sheen across the letters after they land.
  useEffect(() => {
    const sheen = sheenRef.current;
    if (!entered || !depth || !sheen || prefersCalm() || typeof sheen.animate !== "function") return;
    const anim = sheen.animate(
      [{ backgroundPosition: "160% 0" }, { backgroundPosition: "-60% 0" }],
      {
        duration: 1600,
        delay: 300 + Math.min(letters.length * 28, 600) + 500,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      },
    );
    return () => anim.cancel();
  }, [entered, depth, letters.length]);

  const place = PLACEMENT[position] ?? PLACEMENT["top-left"];
  const align = ALIGN[place.align];
  const pad = (n: number) => String(n).padStart(2, "0");
  const supportShadow = palette.dark
    ? "0 1px 10px rgba(255,255,255,0.65)"
    : "0 1px 12px rgba(0,0,0,0.55)";
  const titleShadow = depth ? extrusionShadow(palette) : `0 2px 28px ${palette.cast}`;

  const words = useMemo(() => wordGlyphs(name), [name]);
  const glyphs = (key: "face" | "sheen") =>
    words.map(({ word, start }, w) => (
      <React.Fragment key={`${key}-w${w}`}>
        {w > 0 ? " " : null}
        <span className="inline-block whitespace-nowrap">
          {word.map((ch, k) => {
            const i = start + k;
            return (
              <span
                key={`${key}-${i}`}
                className="inline-block"
                style={
                  key === "face"
                    ? {
                        opacity: entered ? 1 : 0,
                        transform: entered ? "none" : "translateY(0.45em) rotateX(-80deg)",
                        transformOrigin: "50% 100%",
                        transition:
                          "transform 900ms var(--ease-out-default), opacity 450ms var(--ease-out-default)",
                        transitionDelay: entered ? `${150 + Math.min(i * 28, 600)}ms` : "0ms",
                      }
                    : undefined
                }
              >
                {ch}
              </span>
            );
          })}
        </span>
      </React.Fragment>
    ));

  return (
    <aside
      data-testid="room-title-hud"
      data-position={position}
      data-variant={depth ? "depth" : "flat"}
      aria-hidden={!visible}
      className={`pointer-events-none absolute z-[15] flex w-[min(34rem,calc(100vw-2.5rem))] flex-col ${place.box} ${align.items} ${align.text}`}
      style={{ perspective: "900px" }}
    >
      <div
        className={`group relative flex flex-col ${align.items} motion-safe:animate-[gv-title-drift_9s_ease-in-out_infinite]`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          ref={tiltRef}
          className={`relative flex flex-col gap-3 ${align.items}`}
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(var(--gv-rx, 0deg)) rotateY(var(--gv-ry, 0deg))",
            transition: "transform 700ms var(--ease-out-default)",
          }}
        >
          {/* Soft scrim for legibility (light behind dark type, dark behind light type). */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-10 -inset-y-8 -z-10 blur-lg transition-opacity duration-500"
            style={{
              opacity: entered ? 1 : 0,
              background: `radial-gradient(closest-side, ${palette.scrim}, transparent)`,
              transform: "translateZ(-40px)",
            }}
          />

          <div className="flex items-center gap-3" style={line(entered, 0, depth ? 18 : 0)}>
            {count > 1 ? (
              <span
                className="font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: palette.muted, opacity: 0.85, textShadow: supportShadow }}
              >
                {`Room ${pad(index)} / ${pad(count)}`}
              </span>
            ) : null}
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Hide room title"
                className="pointer-events-auto rounded-full px-1.5 text-xs leading-none opacity-0 transition-opacity duration-[var(--duration-normal)] group-hover:opacity-60 hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
                style={{ color: palette.face }}
              >
                ✕
              </button>
            ) : null}
          </div>

          <span
            aria-hidden="true"
            className="block h-px w-12"
            style={{
              background: palette.face,
              opacity: 0.55,
              transform: `translateZ(${depth ? 18 : 0}px) scaleX(${entered ? 1 : 0})`,
              transformOrigin: align.origin,
              transition: "transform 800ms var(--ease-out-default)",
              transitionDelay: entered ? "90ms" : "0ms",
            }}
          />

          <h2
            aria-label={name}
            className="relative text-balance text-[clamp(2.1rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-[-0.01em]"
            style={{
              fontFamily,
              color: palette.face,
              textShadow: titleShadow,
              perspective: "600px",
              transform: depth ? "translateZ(42px)" : undefined,
            }}
          >
            <span aria-hidden="true">{glyphs("face")}</span>
            {depth ? (
              // Sheen: same glyphs, transparent fill, a light band clipped to the letters.
              <span
                ref={sheenRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  color: "transparent",
                  textShadow: "none",
                  backgroundImage:
                    "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.75) 50%, transparent 62%)",
                  backgroundSize: "250% 100%",
                  backgroundPosition: "160% 0",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  mixBlendMode: "screen",
                }}
              >
                {glyphs("sheen")}
              </span>
            ) : null}
          </h2>

          {description ? (
            <p
              className="max-w-md whitespace-pre-line text-pretty font-sans text-sm leading-relaxed sm:text-[15px]"
              style={{
                color: palette.muted,
                textShadow: supportShadow,
                ...line(entered, 280 + Math.min(letters.length * 28, 600) / 2, depth ? 8 : 0),
              }}
            >
              {description}
            </p>
          ) : null}

          {onListen ? (
            <button
              type="button"
              data-testid="room-title-listen"
              onClick={onListen}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[11px] font-medium backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
              style={{ color: palette.muted, ...line(entered, 420 + Math.min(letters.length * 28, 600) / 2, depth ? 8 : 0) }}
            >
              <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
              Listen to the room guide
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
