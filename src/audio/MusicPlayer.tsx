"use client";

// Room music player (viewer, top right): play/pause, a live equalizer, the track, mute, and a
// volume slider that slides out on hover / tap. Presentational; RoomAudio owns the sound.
// Motion: bars dance only while sound is audible and settle when paused / muted / blocked;
// the volume drawer opens with a 300 ms ease-out width change. Reduced motion freezes the bars.

import { useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";

export type MusicStatus = "playing" | "paused" | "waiting";

export interface MusicPlayerProps {
  title: string;
  status: MusicStatus;
  muted: boolean;
  volume: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
}

const BARS = [
  { dur: "900ms", delay: "-200ms" },
  { dur: "1150ms", delay: "-600ms" },
  { dur: "800ms", delay: "-350ms" },
  { dur: "1300ms", delay: "-900ms" },
];

/** Four bars that dance while sound is audible and rest low otherwise. */
export function Equalizer({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-testid="room-audio-eq"
      data-active={active}
      className="flex h-3.5 w-[19px] items-end justify-between"
    >
      {BARS.map((b, i) => (
        <span
          key={i}
          className="block h-full w-[3px] origin-bottom rounded-full bg-paper transition-transform duration-300 ease-[var(--ease-out-default)]"
          style={
            active
              ? { animation: `gv-eq ${b.dur} ease-in-out ${b.delay} infinite` }
              : { transform: "scaleY(0.22)" }
          }
        />
      ))}
    </span>
  );
}

const ICON_BUTTON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-paper/85 transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-default)] hover:bg-white/10 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70 active:scale-[0.94]";

export function MusicPlayer({
  title,
  status,
  muted,
  volume,
  onTogglePlay,
  onToggleMute,
  onVolume,
}: MusicPlayerProps) {
  // Touch has no hover: tapping the track opens the volume drawer.
  const [open, setOpen] = useState(false);
  const silent = muted || volume === 0;
  const audible = status === "playing" && !silent;
  const label =
    status === "waiting" ? "Tap to play" : status === "paused" ? "Paused" : silent ? "Muted" : "Now playing";
  const VolumeIcon = silent ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      data-testid="room-audio"
      data-status={status}
      className="group flex items-center gap-1 rounded-full border border-white/12 bg-graphite/60 p-1 text-paper shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      <button
        type="button"
        data-testid="room-audio-play"
        aria-label={status === "playing" ? "Pause music" : "Play music"}
        onClick={onTogglePlay}
        className={`${ICON_BUTTON} relative`}
      >
        {status === "waiting" ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full ring-1 ring-paper/50 motion-safe:animate-ping"
          />
        ) : null}
        {status !== "playing" ? (
          <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden="true" />
        ) : (
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${label}: ${title}. Volume controls`}
        className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70"
      >
        <Equalizer active={audible} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/55">
            {label}
          </span>
          <span className="max-w-[9rem] truncate text-xs font-medium">{title}</span>
        </span>
      </button>

      {/* Volume drawer: slides open on hover, focus or tap. */}
      <div
        className={`grid transition-[grid-template-columns,opacity] duration-[var(--duration-slow)] ease-[var(--ease-out-default)] group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-within:grid-cols-[1fr] group-focus-within:opacity-100 ${
          open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-center overflow-hidden">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            data-testid="room-audio-volume"
            onChange={(e) => onVolume(Number(e.target.value))}
            className="mx-2 h-1 w-20 cursor-pointer accent-[var(--color-paper)]"
          />
        </div>
      </div>

      <button
        type="button"
        data-testid="room-audio-mute"
        aria-pressed={muted}
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={onToggleMute}
        className={ICON_BUTTON}
      >
        <VolumeIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
