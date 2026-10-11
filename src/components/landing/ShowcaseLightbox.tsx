"use client";

// Landing showcase lightbox (T-148): a conveyor painting, big and uncropped on a dark wall, with
// its wall label, a short "Did you know?" and a link to the Met. Built on the Dialog primitive
// (Esc, backdrop click, focus trap); this adds previous/next and the left/right keys.

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { SHOWCASE_ART } from "./showcaseArt";

/** Index arithmetic that wraps both ways (-1 → last, length → 0). */
export function wrapIndex(i: number, length: number): number {
  return ((i % length) + length) % length;
}

export interface ShowcaseLightboxProps {
  /** The open work's index in SHOWCASE_ART, or null when closed. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const navButton =
  "inline-flex items-center gap-1.5 border border-graphite px-3 py-1.5 text-sm text-graphite transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function ShowcaseLightbox({
  index,
  onIndexChange,
  onClose,
}: ShowcaseLightboxProps) {
  const total = SHOWCASE_ART.length;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange(wrapIndex(index - 1, total));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange(wrapIndex(index + 1, total));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, onIndexChange, total]);

  if (index === null) return null;
  const art = SHOWCASE_ART[index];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`${art.title}, ${art.artist}`}
      className="max-w-5xl! overflow-hidden p-0! [&>h2]:sr-only motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:starting:scale-95 motion-safe:starting:opacity-0"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center border border-graphite bg-paper/90 text-graphite transition-colors hover:bg-graphite hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex items-center justify-center bg-graphite p-4 md:p-8">
          {/* Static CC0 file from /public: the small conveyor image (background) shows at once,
              scaled up, until the large one has loaded on top of it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={art.large}
            src={art.large}
            alt={art.alt}
            decoding="async"
            style={{ backgroundImage: `url(${art.small})` }}
            className="max-h-[55vh] w-full bg-contain bg-center bg-no-repeat object-contain md:max-h-[80vh]"
          />
        </div>
        <div className="flex flex-col gap-4 p-6">
          <p className="text-xs tracking-[0.12em] text-pencil">
            {index + 1} / {total}
          </p>
          <div className="flex flex-col gap-0.5 pr-8">
            <p className="text-sm font-semibold text-graphite">{art.artist}</p>
            <p className="text-lg italic leading-snug text-graphite">
              {art.title}
            </p>
            <p className="text-sm text-pencil">{art.date}</p>
            <p className="text-sm text-pencil">{art.medium}</p>
          </div>
          <div className="border-t border-hairline pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-graphite">
              Did you know?
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite">
              {art.fact}
            </p>
          </div>
          <a
            href={art.metUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            View at The Met →
          </a>
          <div className="mt-auto flex items-center justify-between pt-2">
            <button
              type="button"
              aria-label="Previous artwork"
              onClick={() => onIndexChange(wrapIndex(index - 1, total))}
              className={navButton}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              aria-label="Next artwork"
              onClick={() => onIndexChange(wrapIndex(index + 1, total))}
              className={navButton}
            >
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
