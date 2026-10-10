"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  useSyncExternalStore,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

function subscribeToMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True when the OS asks for reduced motion (false during SSR to match the first paint). */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    readMotionPreference,
    () => false,
  );
}

// Hanging-wall artwork showcase, rebuilt on design tokens from Quang's start-screen reference
// (the reference used shadcn + placeholder SVGs; this one stays on our primitives and tokens).

interface Piece {
  label: string;
  className: string;
}

const PIECES: Piece[] = [
  { label: "Canvas I", className: "h-40 w-28 bg-kraft" },
  { label: "Canvas II", className: "h-28 w-44 bg-plaster" },
  { label: "Canvas III", className: "h-36 w-36 bg-graphite" },
  { label: "Canvas IV", className: "h-32 w-52 bg-accent-subtle" },
  { label: "Canvas V", className: "h-40 w-28 bg-paper" },
  { label: "Canvas VI", className: "h-28 w-48 bg-kraft" },
];

const STEP_PX = 168;
const AUTO_MS = 4200;

export function Showcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(true);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setAnimating(true);
      setIndex((value) => value + 1);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  function move(direction: number) {
    setAnimating(true);
    setIndex((value) => value + direction);
  }

  function onTransitionEnd() {
    if (index < 0 || index >= PIECES.length) {
      const wrapped = ((index % PIECES.length) + PIECES.length) % PIECES.length;
      setAnimating(false);
      setIndex(wrapped);
      window.requestAnimationFrame(() => setAnimating(true));
    }
  }

  const trackStyle: CSSProperties = {
    transform: `translateX(-${index * STEP_PX}px)`,
    transition:
      animating && !reduceMotion
        ? "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none",
  };

  return (
    <section
      aria-label="Hanging wall artwork showcase"
      className="overflow-hidden border-b border-hairline bg-paper py-12 md:py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative mx-auto min-w-[640px] max-w-6xl px-10">
        <span className="absolute left-3 top-1/2 z-20 -translate-y-1/2 text-xs text-pencil">
          145 cm
        </span>
        <div className="absolute inset-x-0 top-1/2 border-t border-pencil" />
        <div className="overflow-hidden py-1 pl-16">
          <div
            className="flex items-center gap-7"
            style={trackStyle}
            onTransitionEnd={onTransitionEnd}
            aria-live="polite"
            aria-label="Artwork showcase. Use the left and right arrow keys to browse."
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") move(-1);
              if (event.key === "ArrowRight") move(1);
            }}
          >
            {[...PIECES, ...PIECES, ...PIECES].map((piece, pieceIndex) => (
              <div
                key={`${piece.label}-${pieceIndex}`}
                aria-hidden="true"
                className={`relative z-10 shrink-0 border border-graphite shadow-sm ${piece.className}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-10 bottom-2 z-20 flex items-center justify-between">
          <button
            type="button"
            aria-label="Show previous artworks"
            onClick={() => move(-1)}
            className="inline-flex size-8 items-center justify-center border border-graphite bg-paper/90 text-graphite transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="bg-paper/90 px-2 py-1 text-xs tracking-[0.12em] text-pencil">
            MOVE THROUGH THE WALL
          </span>
          <button
            type="button"
            aria-label="Show next artworks"
            onClick={() => move(1)}
            className="inline-flex size-8 items-center justify-center border border-graphite bg-paper/90 text-graphite transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
