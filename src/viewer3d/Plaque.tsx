"use client";

// HTML plaque for a focused artwork (plan.md §3.5, F8): title, artist, story. Esc or Close closes it.

import { useEffect } from "react";

export interface PlaqueProps {
  title: string;
  artist: string;
  story: string;
  onClose: () => void;
}

export function Plaque({ title, artist, story, onClose }: PlaqueProps) {
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
      className="pointer-events-auto max-w-md rounded bg-white/95 p-4 text-zinc-900 shadow-lg"
    >
      <h2 className="text-lg font-semibold">
        {title || "Untitled"}
        {artist ? <span className="font-normal"> — {artist}</span> : null}
      </h2>
      {story ? (
        <p className="mt-2 whitespace-pre-line text-sm">{story}</p>
      ) : null}
      <div className="mt-3 text-right">
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-3 py-1 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
