import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("howler", () => ({ Howl: class {}, Howler: {} }));

const { RoomPlayer, LEAVE_FADE_MS, shouldUseHtml5 } = await import("./RoomAudio");
const { clearResumePositions, getResumePosition, resumeKey } = await import("./tracks");

type Handler = () => void;

/** A fake Howl: a clock-driven position, load/playerror/unlock events, and play blocking. */
class FakeSound {
  src: string;
  pos = 0;
  isPlaying = false;
  vol = 0;
  loadedState = "loading";
  blocked = false;
  calls: string[] = [];
  private handlers = new Map<string, Handler[]>();
  private onceHandlers = new Map<string, Handler[]>();
  constructor(src: string) {
    this.src = src;
  }
  on(ev: string, cb: Handler) {
    this.handlers.set(ev, [...(this.handlers.get(ev) ?? []), cb]);
  }
  once(ev: string, cb: Handler) {
    this.onceHandlers.set(ev, [...(this.onceHandlers.get(ev) ?? []), cb]);
  }
  emit(ev: string) {
    for (const cb of this.handlers.get(ev) ?? []) cb();
    const once = this.onceHandlers.get(ev) ?? [];
    this.onceHandlers.delete(ev);
    for (const cb of once) cb();
  }
  load() {
    this.loadedState = "loaded";
    this.emit("load");
  }
  play() {
    this.calls.push("play");
    if (this.blocked) {
      this.emit("playerror");
      return 1;
    }
    this.isPlaying = true;
    return 1;
  }
  pause() {
    this.calls.push("pause");
    this.isPlaying = false;
  }
  stop() {
    this.isPlaying = false;
  }
  unload() {
    this.calls.push("unload");
  }
  fade(from: number, to: number) {
    this.vol = to;
    this.calls.push(`fade(${from},${to})`);
  }
  volume(v?: number) {
    if (typeof v === "number") this.vol = v;
    return this.vol;
  }
  playing() {
    return this.isPlaying;
  }
  seek(p?: number) {
    if (typeof p === "number") this.pos = p;
    return this.pos;
  }
  duration() {
    return 120;
  }
  state() {
    return this.loadedState;
  }
  /** Simulate playback time passing. */
  advance(sec: number) {
    if (this.isPlaying) this.pos += sec;
  }
}

let sounds: FakeSound[] = [];
const factory = (src: string) => {
  const s = new FakeSound(src);
  sounds.push(s);
  return s;
};

beforeEach(() => {
  vi.useFakeTimers();
  sounds = [];
  clearResumePositions();
});
afterEach(() => vi.useRealTimers());

describe("RoomPlayer (T-144: play on enter, stop on leave, resume on return)", () => {
  it("plays a room's custom song once it loads", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/api/files/audio/a.wav", null, false);
    expect(sounds).toHaveLength(1);
    expect(sounds[0].playing()).toBe(false);
    sounds[0].load();
    expect(sounds[0].playing()).toBe(true);
    expect(sounds[0].calls).toContain("fade(0,1)");
  });

  it("fades out and pauses on leave, then resumes from that position on return (same sound)", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/api/files/audio/a.wav", null, false);
    sounds[0].load();
    sounds[0].advance(7.5);
    p.setTarget(undefined, null, false); // room without music
    expect(sounds[0].calls).toContain("fade(1,0)");
    vi.advanceTimersByTime(LEAVE_FADE_MS + 50);
    expect(sounds[0].playing()).toBe(false);
    expect(getResumePosition(resumeKey("/api/files/audio/a.wav", null))).toBe(7.5);
    p.setTarget("/api/files/audio/a.wav", null, false); // back to room A
    expect(sounds).toHaveLength(1); // no reload
    expect(sounds[0].playing()).toBe(true);
    expect(sounds[0].pos).toBe(7.5);
  });

  it("crosses to another room's song and keeps independent positions", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/a.mp3", null, false);
    sounds[0].load();
    sounds[0].advance(3);
    p.setTarget("/c.mp3", null, false);
    sounds[1].load();
    expect(sounds[1].playing()).toBe(true);
    vi.advanceTimersByTime(LEAVE_FADE_MS + 50);
    expect(sounds[0].playing()).toBe(false);
    sounds[1].advance(10);
    p.setTarget("/a.mp3", null, false);
    expect(sounds[0].pos).toBe(3);
    expect(getResumePosition(resumeKey("/c.mp3", null))).toBe(10);
  });

  it("clamps the resume position into the clip", () => {
    const p = new RoomPlayer(factory);
    const seg = { start: 30, length: 30 };
    p.setTarget("/a.mp3", seg, false);
    sounds[0].load();
    expect(sounds[0].pos).toBe(30);
  });

  it("retries after a blocked play on Howler's unlock (playerror → once unlock)", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/api/files/audio/a.wav", null, false);
    sounds[0].blocked = true;
    sounds[0].load();
    expect(sounds[0].playing()).toBe(false);
    sounds[0].blocked = false;
    sounds[0].emit("unlock");
    expect(sounds[0].playing()).toBe(true);
  });

  it("unlock() on every gesture starts a blocked sound for later rooms too", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/a.mp3", null, false);
    sounds[0].load();
    p.setTarget("/c.mp3", null, false);
    sounds[1].blocked = true;
    sounds[1].load();
    expect(sounds[1].playing()).toBe(false);
    sounds[1].blocked = false;
    p.unlock(); // a later click (not the first one)
    expect(sounds[1].playing()).toBe(true);
  });

  it("respects mute: nothing plays, and unmuting resumes", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/a.mp3", null, true);
    expect(sounds).toHaveLength(0);
    p.setTarget("/a.mp3", null, false);
    sounds[0].load();
    sounds[0].advance(4);
    p.setTarget("/a.mp3", null, true);
    vi.advanceTimersByTime(LEAVE_FADE_MS + 50);
    expect(sounds[0].playing()).toBe(false);
    p.unlock();
    expect(sounds[0].playing()).toBe(false);
    p.setTarget("/a.mp3", null, false);
    expect(sounds[0].playing()).toBe(true);
    expect(sounds[0].pos).toBe(4);
  });

  it("a fade-out pause from an old leave never pauses the sound after a quick return", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/a.mp3", null, false);
    sounds[0].load();
    p.setTarget(undefined, null, false);
    p.setTarget("/a.mp3", null, false); // back before the fade finished
    vi.advanceTimersByTime(LEAVE_FADE_MS + 50);
    expect(sounds[0].playing()).toBe(true);
  });

  it("dispose() unloads every cached sound", () => {
    const p = new RoomPlayer(factory);
    p.setTarget("/a.mp3", null, false);
    p.setTarget("/c.mp3", null, false);
    p.dispose();
    expect(sounds.every((s) => s.calls.includes("unload"))).toBe(true);
  });
});

describe("shouldUseHtml5", () => {
  it("uses Web Audio for same-origin and relative files, HTML5 for cross-origin URLs", () => {
    expect(shouldUseHtml5("/api/files/audio/a.wav", "https://g.app")).toBe(false);
    expect(shouldUseHtml5("/audio/still-air.wav", "https://g.app")).toBe(false);
    expect(shouldUseHtml5("https://g.app/api/files/audio/a.wav", "https://g.app")).toBe(false);
    expect(shouldUseHtml5("https://cdn.example.com/song.mp3", "https://g.app")).toBe(true);
  });
});
