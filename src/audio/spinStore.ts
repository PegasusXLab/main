import { create } from "zustand";
import type { Track } from "@/lib/schema/types";

// "Now spinning": a track a visitor chose (from a listening station or an album cover) takes over
// the room's music player until it's stopped or they walk to another room. `hold` pauses the
// music while something else needs the sound (a TV with its sound on). `audible` is reported back
// by the player so the turntable only spins while the song is really playing.

export interface SpinState {
  track: Track | null;
  /** The piece that started it (turntable object id or artwork id). */
  sourceId: string | null;
  hold: boolean;
  audible: boolean;
  play: (track: Track, sourceId: string) => void;
  stop: () => void;
  setHold: (hold: boolean) => void;
  setAudible: (audible: boolean) => void;
}

export const useSpinStore = create<SpinState>((set, get) => ({
  track: null,
  sourceId: null,
  hold: false,
  audible: false,
  play: (track, sourceId) => set({ track, sourceId, hold: false }),
  stop: () => {
    if (get().track) set({ track: null, sourceId: null, audible: false });
  },
  setHold: (hold) => {
    if (get().hold !== hold) set({ hold });
  },
  setAudible: (audible) => {
    if (get().audible !== audible) set({ audible });
  },
}));

/** Display name for the player: "Title - Artist". */
export function trackDisplay(t: Track): string {
  return t.artist?.trim() ? `${t.title} - ${t.artist.trim()}` : t.title;
}
