import { describe, expect, it, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { MusicPlayer } from "./MusicPlayer";
import { galleryHasVoiceovers, musicStatus, readMusicPrefs } from "./RoomAudio";
import type { VoiceChannel } from "./MusicPlayer";

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

const voice = (o: Partial<VoiceChannel> = {}): VoiceChannel => ({
  available: true,
  active: false,
  speaking: false,
  blocked: false,
  voiceName: "Bella",
  title: "Entrance Gallery",
  muted: false,
  volume: 1,
  onToggleMuted: vi.fn(),
  onVolume: vi.fn(),
  onPauseResume: vi.fn(),
  ...o,
});

describe("MusicPlayer with the audio guide", () => {
  it("shows the guide while it speaks, with voice and music levels", () => {
    const html = renderToString(
      <MusicPlayer {...base} status="playing" voice={voice({ active: true, speaking: true })} />,
    );
    expect(html).toContain("Guide · Bella");
    expect(html).toContain("Entrance Gallery");
    expect(html).toContain('data-guide="speaking"');
    expect(html).toContain('aria-label="Pause the guide"');
    expect(html).toContain('data-testid="room-audio-voice-volume"');
    expect(html).toContain('data-testid="room-audio-volume"');
  });

  it("asks for a tap when the browser blocked the voice", () => {
    const html = renderToString(
      <MusicPlayer {...base} status="playing" voice={voice({ active: true, blocked: true })} />,
    );
    expect(html).toContain("Tap to hear the guide");
  });

  it("works for a voice-only room (no music) and hides voice controls when there are none", () => {
    const voiceOnly = renderToString(<MusicPlayer {...base} title={null} status="paused" voice={voice()} />);
    expect(voiceOnly).toContain("Audio guide");
    expect(voiceOnly).not.toContain('data-testid="room-audio-volume"');
    const musicOnly = renderToString(
      <MusicPlayer {...base} status="playing" voice={voice({ available: false })} />,
    );
    expect(musicOnly).not.toContain('data-testid="room-audio-voice-volume"');
  });

  it("mute-all reflects both channels", () => {
    const html = renderToString(
      <MusicPlayer {...base} muted status="playing" voice={voice({ muted: true })} />,
    );
    expect(html).toContain('aria-label="Unmute"');
  });
});

describe("galleryHasVoiceovers", () => {
  it("finds narration on rooms, artworks or objects", () => {
    const g = { rooms: [{}], artworks: [], objects: [] } as unknown as Parameters<typeof galleryHasVoiceovers>[0];
    expect(galleryHasVoiceovers(g)).toBe(false);
    expect(
      galleryHasVoiceovers({ ...g, artworks: [{ voiceOver: { text: "x", audioUrl: "/a.mp3" } }] } as never),
    ).toBe(true);
  });
});

describe("voice names", () => {
  it("shows just the name in the pill", () => {
    const html = renderToString(
      <MusicPlayer
        {...base}
        status="playing"
        voice={voice({ active: true, speaking: true, voiceName: "Jessica - Playful, Bright, Warm" })}
      />,
    );
    expect(html).toContain("Guide · Jessica");
    expect(html).not.toContain("Playful");
  });
});
