"use client";

// HTML plaque for a focused artwork (plan.md §3.5, F8): title, artist, story. Esc or Close closes it.

import { useEffect } from "react";
import { Button } from "@/components/ui";
import type { VoiceOverData } from "@/lib/schema/types";
import { useNarrationStore } from "@/audio/narrationStore";
import { Headphones, Pause, Play } from "lucide-react";

export interface PlaqueProps {
  title: string;
  artist: string;
  story: string;
  onClose: () => void;
  fontFamily?: string;
  voiceOver?: VoiceOverData;
  itemId?: string;
}

export function Plaque({
  title,
  artist,
  story,
  onClose,
  fontFamily,
  voiceOver,
  itemId,
}: PlaqueProps) {
  const isPlaying = useNarrationStore((s) => s.isPlaying);
  const activeUrl = useNarrationStore((s) => s.activeUrl);
  const muted = useNarrationStore((s) => s.muted);
  const hasVisitedItem = useNarrationStore((s) => s.hasVisitedItem);
  const markItemVisited = useNarrationStore((s) => s.markItemVisited);
  const playNarration = useNarrationStore((s) => s.playNarration);
  const pauseNarration = useNarrationStore((s) => s.pauseNarration);

  const isCurrentAudioPlaying = isPlaying && activeUrl === voiceOver?.audioUrl;

  // Auto-play ONLY THE FIRST TIME the user inspects this item (if not muted)
  useEffect(() => {
    if (!voiceOver?.audioUrl || !itemId || muted) return;
    if (!hasVisitedItem(itemId)) {
      markItemVisited(itemId);
      playNarration({
        url: voiceOver.audioUrl,
        title: title || "Artwork",
        voiceName: voiceOver.voiceName || "Docent",
        text: voiceOver.text,
      });
    }
  }, [voiceOver, itemId, muted, hasVisitedItem, markItemVisited, playNarration, title]);

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

      {voiceOver?.audioUrl && (
        <div className="mt-3 flex items-center justify-between rounded border border-hairline/70 bg-plaster/50 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <Headphones className="h-3.5 w-3.5 text-accent" />
            <span className="font-medium text-graphite">
              Audio Guide {voiceOver.voiceName ? `· ${voiceOver.voiceName}` : ""}
            </span>
          </div>
          <button
            type="button"
            data-testid="plaque-audio-guide-toggle"
            onClick={() => {
              if (isCurrentAudioPlaying) {
                pauseNarration();
              } else {
                playNarration({
                  url: voiceOver.audioUrl!,
                  title: title || "Artwork",
                  voiceName: voiceOver.voiceName || "Docent",
                  text: voiceOver.text,
                });
              }
            }}
            className="flex items-center gap-1 rounded bg-graphite/10 px-2 py-0.5 text-[11px] font-medium text-graphite hover:bg-graphite/20"
          >
            {isCurrentAudioPlaying ? (
              <>
                <Pause className="h-3 w-3" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> Listen
              </>
            )}
          </button>
        </div>
      )}

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
