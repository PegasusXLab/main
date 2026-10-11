import { create } from "zustand";

export interface PlayNarrationOptions {
  url: string;
  title?: string;
  voiceName?: string;
  text?: string;
}

export interface NarrationStore {
  isPlaying: boolean;
  activeUrl: string | null;
  activeTitle: string | null;
  activeVoiceName: string | null;
  activeText: string | null;
  muted: boolean;
  visitedRoomIds: Set<string>;
  visitedItemIds: Set<string>;

  // Actions
  playNarration: (opts: PlayNarrationOptions) => void;
  pauseNarration: () => void;
  stopNarration: () => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  markRoomVisited: (roomId: string) => void;
  hasVisitedRoom: (roomId: string) => boolean;
  markItemVisited: (itemId: string) => void;
  hasVisitedItem: (itemId: string) => boolean;
  resetSessionVisits: () => void;
}

const MUTED_STORAGE_KEY = "gv:audioguide:muted";

function readSavedMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSavedMuted(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(MUTED_STORAGE_KEY, muted ? "true" : "false");
  } catch {
    // ignore
  }
}

// Global audio element reference for narration playback
let currentAudioElement: HTMLAudioElement | null = null;

export const useNarrationStore = create<NarrationStore>((set, get) => ({
  isPlaying: false,
  activeUrl: null,
  activeTitle: null,
  activeVoiceName: null,
  activeText: null,
  muted: readSavedMuted(),
  visitedRoomIds: new Set<string>(),
  visitedItemIds: new Set<string>(),

  playNarration: (opts) => {
    if (get().muted) return;

    if (typeof window !== "undefined") {
      try {
        if (currentAudioElement) {
          currentAudioElement.pause();
          currentAudioElement.currentTime = 0;
        }

        const audio = new Audio(opts.url);
        currentAudioElement = audio;

        audio.onended = () => {
          set({ isPlaying: false });
        };
        audio.onerror = () => {
          set({ isPlaying: false });
        };
        audio.onpause = () => {
          set({ isPlaying: false });
        };
        audio.onplay = () => {
          set({ isPlaying: true });
        };

        void audio.play().catch(() => {
          set({ isPlaying: false });
        });
      } catch {
        // audio element not available (e.g. node environment)
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
    set({ isPlaying: false });
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
      activeUrl: null,
      activeTitle: null,
      activeVoiceName: null,
      activeText: null,
    });
  },

  setPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setMuted: (muted: boolean) => {
    saveSavedMuted(muted);
    if (muted && get().isPlaying) {
      get().stopNarration();
    }
    set({ muted });
  },

  toggleMuted: () => {
    const next = !get().muted;
    get().setMuted(next);
  },

  markRoomVisited: (roomId: string) => {
    set((state) => {
      const next = new Set(state.visitedRoomIds);
      next.add(roomId);
      return { visitedRoomIds: next };
    });
  },

  hasVisitedRoom: (roomId: string) => {
    return get().visitedRoomIds.has(roomId);
  },

  markItemVisited: (itemId: string) => {
    set((state) => {
      const next = new Set(state.visitedItemIds);
      next.add(itemId);
      return { visitedItemIds: next };
    });
  },

  hasVisitedItem: (itemId: string) => {
    return get().visitedItemIds.has(itemId);
  },

  resetSessionVisits: () => {
    set({
      visitedRoomIds: new Set<string>(),
      visitedItemIds: new Set<string>(),
    });
  },
}));
