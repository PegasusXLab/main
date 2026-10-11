"use client";

// HTML plaque for a focused artwork (plan.md §3.5, F8): title, artist, story. Esc or Close closes it.

import { useEffect } from "react";
import { Button } from "@/components/ui";

export interface PlaqueProps {
  title: string;
  artist: string;
  story: string;
  onClose: () => void;
  fontFamily?: string;
}

export function Plaque({
  title,
  artist,
  story,
  onClose,
  fontFamily,
}: PlaqueProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label={title || "Artwork"}
      className="pointer-events-auto w-full max-w-md rounded-[2px] border border-hairline bg-paper/95 p-5 text-graphite shadow-2xl backdrop-blur-md transition-all duration-fast"
    >
      <div className="border-b border-hairline/60 pb-2.5">
        <h2
          className="text-base font-semibold tracking-tight text-graphite"
          style={fontFamily ? { fontFamily } : undefined}
        >
          {title || "Untitled"}
        </h2>
        {artist ? (
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-pencil">
            {artist}
          </p>
        ) : null}
      </div>
      {story ? (
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-graphite/90">
          {story}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default Plaque;
