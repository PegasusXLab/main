import { describe, expect, it, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { MusicPlayer } from "./MusicPlayer";
import { musicStatus, readMusicPrefs } from "./RoomAudio";

const base = {
  title: "Night Gallery",
  muted: false,
  volume: 0.8,
  onTogglePlay: vi.fn(),
  onToggleMute: vi.fn(),
  onVolume: vi.fn(),
};

describe("MusicPlayer", () => {
  it("shows the track, a dancing equalizer and pause while playing", () => {
    const html = renderToString(<MusicPlayer {...base} status="playing" />);
    expect(html).toContain("Night Gallery");
    expect(html).toContain("Now playing");
    expect(html).toContain('data-active="true"');
    expect(html).toContain('aria-label="Pause music"');
    expect(html).toContain('data-testid="room-audio-mute"');
    expect(html).toContain('aria-label="Mute"');
    expect(html).toContain('data-testid="room-audio-volume"');
  });

  it("rests the equalizer when paused, muted, or blocked", () => {
    const paused = renderToString(<MusicPlayer {...base} status="paused" />);
    expect(paused).toContain("Paused");
    expect(paused).toContain('aria-label="Play music"');
    expect(paused).toContain('data-active="false"');
    const muted = renderToString(<MusicPlayer {...base} status="playing" muted />);
    expect(muted).toContain("Muted");
    expect(muted).toContain('aria-pressed="true"');
    expect(muted).toContain('aria-label="Unmute"');
    expect(muted).toContain('data-active="false"');
    const waiting = renderToString(<MusicPlayer {...base} status="waiting" />);
    expect(waiting).toContain("Tap to play");
    expect(waiting).toContain('aria-label="Play music"');
  });
});

describe("music state helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("derives the status", () => {
    expect(musicStatus(true, true)).toBe("paused");
    expect(musicStatus(false, true)).toBe("playing");
    expect(musicStatus(false, false)).toBe("waiting");
  });

  it("reads saved volume / mute defensively", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    });
    expect(readMusicPrefs()).toBeNull();
    store.set("gv:music", JSON.stringify({ volume: 3, muted: true }));
    expect(readMusicPrefs()).toEqual({ volume: 1, muted: true });
    store.set("gv:music", "{not json");
    expect(readMusicPrefs()).toBeNull();
  });
});
