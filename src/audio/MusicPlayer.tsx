"use client";

// Room audio pill (viewer, top right): one place for the room music AND the audio guide voice.
// Play/pause, a live equalizer, what's playing ("Now playing · track" or "Guide · voice"), a
// mute-all button, and a drawer (hover / focus / tap) with two levels: voice and music. The voice
// defaults louder than the music, and the music ducks under it while it speaks (RoomAudio).
// Motion: bars dance only while sound is audible; the drawer opens with a 300 ms ease-out.

import { useState } from "react";
import { Headphones, Music2, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { shortVoiceName } from "@/lib/elevenlabs/voices";

export type MusicStatus = "playing" | "paused" | "waiting";

export interface VoiceChannel {
  /** The gallery has any voiceovers (otherwise the voice controls are hidden). */
  available: boolean;
  /** A voiceover is loaded (speaking, paused, or waiting for the browser). */
  active: boolean;
  speaking: boolean;
  /** Waiting for the visitor's first click before the browser allows sound. */
  blocked: boolean;
  voiceName: string | null;
  title: string | null;
  /** Guide off. */
  muted: boolean;
  volume: number;
  onToggleMuted: () => void;
  onVolume: (v: number) => void;
  onPauseResume: () => void;
}

export interface MusicPlayerProps {
  /** Track title, or null when the room has no music. */
  title: string | null;
  status: MusicStatus;
  muted: boolean;
  volume: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
  voice?: VoiceChannel;
}

const BARS = [
  { dur: "900ms", delay: "-200ms" },
  { dur: "1150ms", delay: "-600ms" },
  { dur: "800ms", delay: "-350ms" },
  { dur: "1300ms", delay: "-900ms" },
];

/** Four bars that dance while sound is audible and rest low otherwise. */
export function Equalizer({ active, tone = "paper" }: { active: boolean; tone?: "paper" | "accent" }) {
  return (
    <span
      aria-hidden="true"
      data-testid="room-audio-eq"
      data-active={active}
      className="flex h-3.5 w-[19px] shrink-0 items-end justify-between"
    >
      {BARS.map((b, i) => (
        <span
          key={i}
          className={`block h-full w-[3px] origin-bottom rounded-full transition-transform duration-300 ease-[var(--ease-out-default)] ${
            tone === "accent" ? "bg-[#8fb0ff]" : "bg-paper"
          }`}
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

function Level({
  icon,
  label,
  muted,
  value,
  onToggle,
  onChange,
  testId,
  toggleTestId,
}: {
  icon: React.ReactNode;
  label: string;
  muted: boolean;
  value: number;
  onToggle: () => void;
  onChange: (v: number) => void;
  testId: string;
  toggleTestId: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        data-testid={toggleTestId}
        aria-pressed={!muted}
        aria-label={muted ? `Turn ${label.toLowerCase()} on` : `Turn ${label.toLowerCase()} off`}
        title={muted ? `${label} off` : label}
        onClick={onToggle}
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          muted ? "text-paper/35 hover:text-paper/70" : "text-paper/85 hover:text-paper"
        }`}
      >
        {icon}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : value}
        aria-label={`${label} volume`}
        data-testid={testId}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-16 cursor-pointer accent-[var(--color-paper)]"
      />
    </span>
  );
}

export function MusicPlayer({
  title,
  status,
  muted,
  volume,
  onTogglePlay,
  onToggleMute,
  onVolume,
  voice,
}: MusicPlayerProps) {
  // Touch has no hover: tapping the label opens the levels drawer.
  const [open, setOpen] = useState(false);
  const hasMusic = title !== null;
  const voiceOn = Boolean(voice?.available);
  const guideActive = Boolean(voice?.active && !voice.muted);

  const musicSilent = muted || volume === 0;
  const allMuted = musicSilent && (!voiceOn || Boolean(voice?.muted));
  const audible = guideActive ? Boolean(voice?.speaking) : status === "playing" && !musicSilent && hasMusic;

  let label: string;
  let line: string;
  if (guideActive && voice) {
    label = voice.blocked ? "Tap to hear the guide" : voice.speaking ? `Guide · ${shortVoiceName(voice.voiceName) || "Docent"}` : "Guide paused";
    line = voice.title ?? title ?? "Audio guide";
  } else if (hasMusic) {
    label =
      status === "waiting" ? "Tap to play" : status === "paused" ? "Paused" : musicSilent ? "Muted" : "Now playing";
    line = title!;
  } else {
    label = "Audio guide";
    line = voice?.muted ? "Off" : "On";
  }

  const controlsVoice = guideActive && voice;
  const playing = controlsVoice ? Boolean(voice.speaking) : status === "playing";
  const VolumeIcon = allMuted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      data-testid="room-audio"
      data-status={status}
      data-guide={guideActive ? (voice?.speaking ? "speaking" : "paused") : "idle"}
      className="group flex min-w-0 items-center gap-1 rounded-full border border-white/12 bg-graphite/60 p-1 text-paper shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl"
    >
      {hasMusic || controlsVoice ? (
        <button
          type="button"
          data-testid="room-audio-play"
          aria-label={
            controlsVoice
              ? playing
                ? "Pause the guide"
                : "Play the guide"
              : playing
                ? "Pause music"
                : "Play music"
          }
          onClick={controlsVoice ? voice.onPauseResume : onTogglePlay}
          className={`${ICON_BUTTON} relative`}
        >
          {(controlsVoice ? voice.blocked : status === "waiting") ? (
            <span aria-hidden="true" className="absolute inset-0 rounded-full ring-1 ring-paper/50 motion-safe:animate-ping" />
          ) : null}
          {playing ? (
            <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden="true" />
          )}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${label}: ${line}. Sound levels`}
        className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pl-1.5 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70"
      >
        {guideActive ? (
          <Headphones className="h-3.5 w-3.5 shrink-0 text-[#8fb0ff]" aria-hidden="true" />
        ) : null}
        <Equalizer active={audible} tone={guideActive ? "accent" : "paper"} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.22em] text-paper/55">{label}</span>
          <span className="max-w-[9rem] truncate text-xs font-medium">{line}</span>
        </span>
      </button>

      {/* Levels drawer: voice + music; slides open on hover, focus or tap. */}
      <div
        className={`grid transition-[grid-template-columns,opacity] duration-[var(--duration-slow)] ease-[var(--ease-out-default)] group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-within:grid-cols-[1fr] group-focus-within:opacity-100 ${
          open ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden px-2">
          {voiceOn && voice ? (
            <Level
              icon={<Headphones className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Voice"
              muted={voice.muted}
              value={voice.volume}
              onToggle={voice.onToggleMuted}
              onChange={voice.onVolume}
              testId="room-audio-voice-volume"
              toggleTestId="room-audio-voice-toggle"
            />
          ) : null}
          {hasMusic ? (
            <Level
              icon={<Music2 className="h-3.5 w-3.5" aria-hidden="true" />}
              label="Music"
              muted={muted}
              value={volume}
              onToggle={onToggleMute}
              onChange={onVolume}
              testId="room-audio-volume"
              toggleTestId="room-audio-music-toggle"
            />
          ) : null}
        </div>
      </div>

      <button
        type="button"
        data-testid="room-audio-mute"
        aria-pressed={allMuted}
        aria-label={allMuted ? "Unmute" : "Mute"}
        onClick={() => {
          // Mute all (music + guide), or bring both back.
          if (allMuted) {
            if (hasMusic && muted) onToggleMute();
            if (voiceOn && voice?.muted) voice.onToggleMuted();
          } else {
            if (hasMusic && !muted) onToggleMute();
            if (voiceOn && voice && !voice.muted) voice.onToggleMuted();
          }
        }}
        className={ICON_BUTTON}
      >
        <VolumeIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
