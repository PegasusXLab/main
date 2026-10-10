"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
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

// Hanging-wall artwork showcase (T-129): a seamless left-to-right conveyor belt.
// The track holds two identical copies of the artwork list; only the track moves
// (translate3d), everything else stays fixed on the wall line.

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

/** Constant drift speed (~35 px/s), with no easing. */
const PX_PER_SECOND = 35;
/** Hover slows the drift to about a third of the speed, no stopping. */
const HOVER_SPEED = PX_PER_SECOND * 0.3;
/** Exponential approach toward the target speed (about 400 ms to settle). */
const SPEED_EASE_S = 0.4;
/** Arrow-nudge glide duration. */
const NUDGE_S = 0.5;
/** Clamp the frame delta so tab switches / background tabs never teleport the strip. */
const MAX_DELTA_S = 0.05;

interface Measures {
  /** Distance between the first frame of copy 1 and the first frame of copy 2 (= one loop). */
  period: number;
  /** Distance between two adjacent frames in the strip. */
  stride: number;
}

interface EngineState {
  /** Accumulated drift in px; the loop wraps it to `[period, 0)`. */
  scroll: number;
  /** Current (eased) px/s. */
  speed: number;
  /** Where `speed` eases toward (hover slows it). */
  target: number;
  visible: boolean;
  nudge: { from: number; to: number; start: number } | null;
  last: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function Showcase() {
  const reduceMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const measuresRef = useRef<Measures>({ period: 0, stride: 0 });
  const engineRef = useRef<EngineState | null>(null);

  // Layout is measured once (and on resize). The animation loop never reads layout.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const frames = track.querySelectorAll<HTMLElement>("[data-frame]");
      if (frames.length < PIECES.length + 1) return;
      const origin = frames[0].offsetLeft;
      measuresRef.current.period = frames[PIECES.length].offsetLeft - origin;
      measuresRef.current.stride = frames[1].offsetLeft - origin;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // The conveyor engine. Under prefers-reduced-motion there is no drift: the
  // strip stays static and the wrapper becomes horizontally scrollable instead.
  useEffect(() => {
    if (reduceMotion) return;
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    const engine: EngineState = {
      scroll: 0,
      speed: PX_PER_SECOND,
      target: PX_PER_SECOND,
      visible: true,
      nudge: null,
      last: performance.now(),
    };
    engineRef.current = engine;
    const measures = measuresRef.current;

    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(MAX_DELTA_S, (now - engine.last) / 1000);
      engine.last = now;

      // Ease the current speed toward its target (hover slow), ~400 ms.
      if (engine.speed !== engine.target) {
        const alpha = 1 - Math.exp(-dt / SPEED_EASE_S);
        engine.speed += (engine.target - engine.speed) * alpha;
      }

      if (engine.visible) {
        if (engine.nudge) {
          // Arrow nudge: one frame-width glide, then the constant drift resumes.
          const t = Math.min(1, (now - engine.nudge.start) / (NUDGE_S * 1000));
          engine.scroll =
            engine.nudge.from +
            (engine.nudge.to - engine.nudge.from) * easeInOutCubic(t);
          if (t >= 1) engine.nudge = null;
        } else if (measures.period > 0) {
          engine.scroll += engine.speed * dt;
        }
      }

      // translate3d from -period (copy 2 aligned as strip start) up to 0, then wrap.
      // Phase is normalised to [0, period) so a right-arrow nudge that dips scroll
      // negative never leaves a blank gap (JS % keeps the dividend's sign).
      if (engine.visible && measures.period > 0) {
        const phase =
          ((engine.scroll % measures.period) + measures.period) %
          measures.period;
        const x = phase - measures.period;
        track.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Pause when the strip is off-screen.
    const observer = new IntersectionObserver(
      (entries) => {
        engine.visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    observer.observe(wrapper);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      engineRef.current = null;
    };
  }, [reduceMotion]);

  function setHover(hovering: boolean) {
    if (reduceMotion) return;
    const engine = engineRef.current;
    if (engine) engine.target = hovering ? HOVER_SPEED : PX_PER_SECOND;
  }

  /**
   * Nudge the strip one frame-width. "Previous" (left) shows earlier work, "Next"
   * (right) shows later work. In drift mode the phase jumps and the constant
   * drift resumes from there; under reduced motion the wrapper scrolls instead.
   */
  function nudge(direction: 1 | -1) {
    const measures = measuresRef.current;
    if (reduceMotion) {
      // scrollBy sign is opposite to content movement: previous = scroll left.
      wrapperRef.current?.scrollBy({
        left: direction * -(measures.stride || 200),
      });
      return;
    }
    if (measures.stride <= 0) return;
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.nudge) return; // let the in-flight glide finish
    engine.nudge = {
      from: engine.scroll,
      to: engine.scroll + direction * measures.stride,
      start: performance.now(),
    };
  }

  return (
    <section
      aria-label="Hanging wall artwork showcase"
      className="overflow-hidden border-b border-hairline bg-paper py-12 md:py-16"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHover(false);
        }
      }}
    >
      <div className="relative mx-auto min-w-[640px] max-w-6xl px-10">
        <span className="absolute left-3 top-1/2 z-20 -translate-y-1/2 text-xs text-pencil">
          145 cm
        </span>
        <div className="absolute inset-x-0 top-1/2 border-t border-pencil" />
        <div
          ref={wrapperRef}
          data-conveyor-wrapper
          className={`pl-16 py-1 ${reduceMotion ? "overflow-x-auto" : "overflow-hidden"}`}
        >
          <div
            ref={trackRef}
            className={`flex items-center gap-7 ${reduceMotion ? "w-max" : "will-change-transform"}`}
            aria-label="Artwork showcase. Use the left and right arrow keys to browse."
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") nudge(1);
              if (event.key === "ArrowRight") nudge(-1);
            }}
          >
            {[...PIECES, ...PIECES].map((piece, pieceIndex) => (
              <div
                key={`${piece.label}-${pieceIndex}`}
                data-frame
                aria-hidden={pieceIndex >= PIECES.length ? true : undefined}
                className={`relative z-10 shrink-0 border border-graphite shadow-sm ${piece.className}`}
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-10 bottom-2 z-20 flex items-center justify-between">
          <button
            type="button"
            aria-label="Show previous artworks"
            onClick={() => nudge(1)}
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
            onClick={() => nudge(-1)}
            className="inline-flex size-8 items-center justify-center border border-graphite bg-paper/90 text-graphite transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
