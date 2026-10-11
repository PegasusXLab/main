import { create } from "zustand";

// Audio guide (voiceover) playback for the viewer: one voice at a time, its own volume (by default
// louder than the room music, which ducks under it), and a guide on/off switch. Browsers block
// sound before the visitor's first interaction; a blocked voiceover waits and starts on the next
// click / tap / key instead of failing silently.

export interface PlayNarrationOptions {
  url: string;
  title?: string;
  voiceName?: string;
  text?: string;
}

export interface NarrationStore {
  isPlaying: boolean;
  /** A voiceover is queued but the browser hasn't allowed sound yet. */
  blocked: boolean;
  activeUrl: string | null;
  activeTitle: string | null;
  activeVoiceName: string | null;
  activeText: string | null;
  /** Audio guide off (no voiceovers). */
  muted: boolean;
  /** Voice level 0..1 (default 1: the voice sits above the music). */
  volume: number;
  visitedRoomIds: Set<string>;
  visitedItemIds: Set<string>;

  // Actions
  playNarration: (opts: PlayNarrationOptions) => void;
  pauseNarration: () => void;
  /** Continue the current voiceover (or start it again if it finished). */
  resumeNarration: () => void;
  stopNarration: () => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  setVolume: (volume: number) => void;
  markRoomVisited: (roomId: string) => void;
  hasVisitedRoom: (roomId: string) => boolean;
  markItemVisited: (itemId: string) => void;
  hasVisitedItem: (itemId: string) => boolean;
  resetSessionVisits: () => void;
}

export const DEFAULT_VOICE_VOLUME = 1;
const MUTED_STORAGE_KEY = "gv:audioguide:muted";
const VOLUME_STORAGE_KEY = "gv:audioguide:volume";

function readSavedMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function readSavedVolume(): number {
  try {
    const raw = globalThis.localStorage?.getItem(VOLUME_STORAGE_KEY);
    const v = raw === null || raw === undefined ? NaN : Number(raw);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_VOICE_VOLUME;
  } catch {
    return DEFAULT_VOICE_VOLUME;
  }
}

function save(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore
  }
}

// The one voice element; the gesture listener retries it when the browser blocked autoplay.
let currentAudioElement: HTMLAudioElement | null = null;
let gestureListening = false;

/** The voice element (progress rings read its currentTime / duration). */
export function getNarrationElement(): HTMLAudioElement | null {
  return currentAudioElement;
}

export const useNarrationStore = create<NarrationStore>((set, get) => {
  const tryPlay = (audio: HTMLAudioElement) => {
    void audio.play().then(
      () => set({ blocked: false }),
      (err: unknown) => {
        // NotAllowedError = autoplay blocked until a gesture; anything else = broken audio.
        const blocked = err instanceof Error && err.name === "NotAllowedError";
        set({ isPlaying: false, blocked });
      },
    );
  };

  const listenForGesture = () => {
    if (gestureListening || typeof window === "undefined") return;
    gestureListening = true;
    const unlock = () => {
      const audio = currentAudioElement;
      if (audio && get().blocked && !get().muted) tryPlay(audio);
    };
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchend", unlock, opts);
  };

  return {
    isPlaying: false,
    blocked: false,
    activeUrl: null,
    activeTitle: null,
    activeVoiceName: null,
    activeText: null,
    muted: readSavedMuted(),
    volume: readSavedVolume(),
    visitedRoomIds: new Set<string>(),
    visitedItemIds: new Set<string>(),

    playNarration: (opts) => {
      if (get().muted) return;

      if (typeof window !== "undefined" && typeof Audio !== "undefined") {
        try {
          listenForGesture();
          if (currentAudioElement) {
            currentAudioElement.pause();
            currentAudioElement.currentTime = 0;
          }
          const audio = new Audio(opts.url);
          audio.volume = get().volume;
          currentAudioElement = audio;
          audio.onended = () => set({ isPlaying: false });
          audio.onerror = () => set({ isPlaying: false, blocked: false });
          audio.onpause = () => set({ isPlaying: false });
          audio.onplay = () => set({ isPlaying: true, blocked: false });
          tryPlay(audio);
        } catch {
          // audio element not available
        }
      }

      set({
        isPlaying: true,
        activeUrl: opts.url,
        activeTitle: opts.title ?? null,
        activeVoiceName: opts.voiceName ?? null,
        activeText: opts.text ?? null,
      });
    },

    pauseNarration: () => {
      try {
        currentAudioElement?.pause();
      } catch {
        // ignore
      }
      set({ isPlaying: false, blocked: false });
    },

    resumeNarration: () => {
      const audio = currentAudioElement;
      if (!audio || get().muted) return;
      if (audio.ended) audio.currentTime = 0;
      tryPlay(audio);
      set({ isPlaying: true });
    },

    stopNarration: () => {
      try {
        if (currentAudioElement) {
          currentAudioElement.pause();
          currentAudioElement.currentTime = 0;
        }
      } catch {
        // ignore
      }
      set({
        isPlaying: false,
        blocked: false,
        activeUrl: null,
        activeTitle: null,
        activeVoiceName: null,
        activeText: null,
      });
    },

    setPlaying: (playing: boolean) => set({ isPlaying: playing }),

    setMuted: (muted: boolean) => {
      save(MUTED_STORAGE_KEY, muted ? "true" : "false");
      if (muted && (get().isPlaying || get().blocked)) {
        get().stopNarration();
      }
      set({ muted });
    },

    toggleMuted: () => {
      get().setMuted(!get().muted);
    },

    setVolume: (volume: number) => {
      const v = Math.min(1, Math.max(0, volume));
      save(VOLUME_STORAGE_KEY, String(v));
      if (currentAudioElement) currentAudioElement.volume = v;
      set({ volume: v });
    },

    markRoomVisited: (roomId: string) => {
      set((state) => {
        const next = new Set(state.visitedRoomIds);
        next.add(roomId);
        return { visitedRoomIds: next };
      });
    },

    hasVisitedRoom: (roomId: string) => get().visitedRoomIds.has(roomId),

    markItemVisited: (itemId: string) => {
      set((state) => {
        const next = new Set(state.visitedItemIds);
        next.add(itemId);
        return { visitedItemIds: next };
      });
    },

    hasVisitedItem: (itemId: string) => get().visitedItemIds.has(itemId),

    resetSessionVisits: () => {
      set({
        visitedRoomIds: new Set<string>(),
        visitedItemIds: new Set<string>(),
      });
    },
  };
});
