"use client";

import React from "react";
import { useNarrationStore } from "@/audio/narrationStore";
import { Volume2, VolumeX, Headphones, Play, Pause } from "lucide-react";

export interface AudioGuideHUDProps {
  className?: string;
  isPlaying?: boolean;
  muted?: boolean;
  activeVoiceName?: string | null;
  activeTitle?: string | null;
}

export function AudioGuideHUD({
  className = "",
  isPlaying: propIsPlaying,
  muted: propMuted,
  activeVoiceName: propActiveVoiceName,
  activeTitle: propActiveTitle,
}: AudioGuideHUDProps) {
  const storeIsPlaying = useNarrationStore((s) => s.isPlaying);
  const storeMuted = useNarrationStore((s) => s.muted);
  const storeActiveVoiceName = useNarrationStore((s) => s.activeVoiceName);
  const storeActiveTitle = useNarrationStore((s) => s.activeTitle);

  const isPlaying = propIsPlaying ?? storeIsPlaying;
  const muted = propMuted ?? storeMuted;
  const activeVoiceName = propActiveVoiceName ?? storeActiveVoiceName;
  const activeTitle = propActiveTitle ?? storeActiveTitle;
  const toggleMuted = useNarrationStore((s) => s.toggleMuted);
  const pauseNarration = useNarrationStore((s) => s.pauseNarration);
  const playNarration = useNarrationStore((s) => s.playNarration);
  const activeUrl = useNarrationStore((s) => s.activeUrl);

  const handlePlayToggle = () => {
    if (isPlaying) {
      pauseNarration();
    } else if (activeUrl) {
      playNarration({ url: activeUrl, title: activeTitle ?? undefined, voiceName: activeVoiceName ?? undefined });
    }
  };

  return (
    <div
      data-testid="audio-guide-hud"
      className={`pointer-events-auto flex items-center gap-1.5 rounded-[2px] border border-white/10 bg-graphite/80 px-2.5 py-1 text-xs text-paper shadow-lg backdrop-blur-md transition-all ${className}`}
    >
      <button
        type="button"
        onClick={toggleMuted}
        title={muted ? "Unmute Audio Guide voiceovers" : "Mute Audio Guide voiceovers"}
        aria-label={muted ? "Unmute Audio Guide" : "Mute Audio Guide"}
        data-testid="audio-guide-toggle-mute"
        className="flex items-center gap-1 text-[11px] font-medium text-white/90 hover:text-white"
      >
        <Headphones className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span className="hidden sm:inline">Guide</span>
        {muted ? (
          <VolumeX className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
        ) : (
          <Volume2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        )}
      </button>

      {/* Animated equalizer bars when docent voice is playing */}
      {isPlaying && (
        <div className="flex items-center gap-2 border-l border-white/10 pl-2">
          <div className="flex h-3 items-end gap-0.5" aria-hidden="true">
            <span className="w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-accent" style={{ height: "60%" }} />
            <span className="w-0.5 animate-[pulse_0.5s_ease-in-out_infinite] bg-accent" style={{ height: "100%" }} />
            <span className="w-0.5 animate-[pulse_0.9s_ease-in-out_infinite] bg-accent" style={{ height: "40%" }} />
            <span className="w-0.5 animate-[pulse_0.6s_ease-in-out_infinite] bg-accent" style={{ height: "80%" }} />
          </div>

          <span className="max-w-[120px] truncate text-[11px] text-white/80" title={activeVoiceName || activeTitle || "Docent"}>
            {activeVoiceName || activeTitle || "Docent"}
          </span>

          <button
            type="button"
            onClick={handlePlayToggle}
            className="flex h-5 w-5 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
            title="Pause narration"
            aria-label="Pause narration"
          >
            <Pause className="h-3 w-3" />
          </button>
        </div>
      )}

      {!isPlaying && activeUrl && !muted && (
        <button
          type="button"
          onClick={handlePlayToggle}
          className="flex items-center gap-1 border-l border-white/10 pl-2 text-[11px] text-white/70 hover:text-white"
          title="Resume narration"
        >
          <Play className="h-3 w-3" />
          <span className="hidden sm:inline">Play</span>
        </button>
      )}
    </div>
  );
}

export default AudioGuideHUD;
