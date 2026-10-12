// Animated artwork textures (T-145b): an MP4 through a hidden <video>, a GIF decoded frame by
// frame with ImageDecoder into a canvas. Sources start paused; the Frames scheduler plays the few
// nearest ones in the visitor's room and pauses the rest. Rendering is on demand, so every new
// frame calls invalidate(). Anything that can't load or decode leaves the poster image showing.

import * as THREE from "three";
import type { SceneFrame } from "@/lib/compile/types";

/** At most this many animated artworks play at once (phones). */
export const MAX_PLAYING = 3;
/** GIFs advance at most 15 times a second. */
export const GIF_MIN_FRAME_MS = 1000 / 15;
const GIF_DEFAULT_FRAME_MS = 100;
const VIDEO_FALLBACK_FPS = 30;
const RELEASE_DELAY_MS = 1000;

export type FrameMediaKind = "image" | "gif" | "video";

/** What the art plane shows: the image, or the artwork's animated media. */
export function frameMedia(frame: Pick<SceneFrame, "media">): FrameMediaKind {
  return frame.media?.url ? frame.media.kind : "image";
}

export interface MediaCandidate {
  id: string;
  roomId: string;
  distance: number; // camera → frame, meters
}

/**
 * Which animated artworks play: those in the current room (anywhere when there is none, e.g. the
 * editor's top-down view), nearest first, at most `max`.
 */
export function chooseActive(
  candidates: readonly MediaCandidate[],
  currentRoomId: string | undefined,
  max = MAX_PLAYING,
): Set<string> {
  const pool = currentRoomId ? candidates.filter((c) => c.roomId === currentRoomId) : [...candidates];
  pool.sort((a, b) => a.distance - b.distance);
  return new Set(pool.slice(0, max).map((c) => c.id));
}

export interface MediaSource {
  play(): void;
  pause(): void;
  dispose(): void;
}

/**
 * Starts loading `url`. `onReady` gets the texture once its first frame can be drawn (until then
 * the poster shows). Returns null where the media can't play here (no DOM, no ImageDecoder).
 */
export function createMediaSource(
  kind: "gif" | "video",
  url: string,
  onReady: (texture: THREE.Texture) => void,
  invalidate: () => void,
): MediaSource | null {
  if (typeof document === "undefined") return null;
  return kind === "video" ? createVideoSource(url, onReady, invalidate) : createGifSource(url, onReady, invalidate);
}

function createVideoSource(url: string, onReady: (t: THREE.Texture) => void, invalidate: () => void): MediaSource {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous";
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  v.preload = "metadata";
  v.src = url;
  const texture = new THREE.VideoTexture(v);
  texture.colorSpace = THREE.SRGBColorSpace;
  const rvfc = "requestVideoFrameCallback" in v;
  let alive = true;
  let wanted = false;
  let handle = 0;
  let timer = 0;
  let waitingForGesture = false;

  // Redraw on every decoded frame; on-demand rendering would otherwise freeze the picture.
  const onFrame = () => {
    if (!alive) return;
    invalidate();
    handle = v.requestVideoFrameCallback(onFrame);
  };
  if (rvfc) handle = v.requestVideoFrameCallback(onFrame);
  const ready = () => {
    if (alive) onReady(texture);
  };
  v.addEventListener("playing", ready, { once: true });

  const start = () => {
    void v.play().catch(() => {
      // Autoplay refused (rare for muted video): try again on the visitor's next gesture.
      if (waitingForGesture) return;
      waitingForGesture = true;
      window.addEventListener(
        "pointerdown",
        () => {
          waitingForGesture = false;
          if (alive && wanted) void v.play().catch(() => {});
        },
        { once: true, capture: true },
      );
    });
  };

  return {
    play() {
      wanted = true;
      if (v.paused) start();
      if (!rvfc && !timer) timer = window.setInterval(invalidate, 1000 / VIDEO_FALLBACK_FPS);
    },
    pause() {
      wanted = false;
      if (!v.paused) v.pause();
      if (timer) window.clearInterval(timer);
      timer = 0;
    },
    dispose() {
      alive = false;
      wanted = false;
      v.removeEventListener("playing", ready);
      if (timer) window.clearInterval(timer);
      if (handle && "cancelVideoFrameCallback" in v) v.cancelVideoFrameCallback(handle);
      v.pause();
      // Release the video after the frame has swapped back to its poster: emptying it while a
      // material still samples it makes WebGL upload "no video".
      window.setTimeout(() => {
        texture.dispose();
        v.removeAttribute("src");
        v.load();
      }, RELEASE_DELAY_MS);
    },
  };
}

function createGifSource(url: string, onReady: (t: THREE.Texture) => void, invalidate: () => void): MediaSource | null {
  // Safari has no ImageDecoder: the poster (the GIF's first frame) stays.
  if (typeof ImageDecoder === "undefined") return null;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const abort = new AbortController();
  let decoder: ImageDecoder | null = null;
  let texture: THREE.CanvasTexture | null = null;
  let frameCount = 1;
  let index = 0;
  let alive = true;
  let playing = false;
  let timer = 0;
  let busy = false;

  /** Draws frame `i`; returns how long it should stay up, in ms. */
  const draw = async (i: number): Promise<number> => {
    if (!decoder) return GIF_DEFAULT_FRAME_MS;
    const { image } = await decoder.decode({ frameIndex: i });
    try {
      if (!alive) return GIF_DEFAULT_FRAME_MS;
      if (!texture) {
        canvas.width = image.displayWidth;
        canvas.height = image.displayHeight;
        texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      invalidate();
      return image.duration ? image.duration / 1000 : GIF_DEFAULT_FRAME_MS;
    } finally {
      image.close();
    }
  };

  const schedule = (ms: number) => {
    if (alive && playing && frameCount > 1 && !timer) timer = window.setTimeout(tick, Math.max(GIF_MIN_FRAME_MS, ms));
  };
  const tick = async () => {
    timer = 0;
    if (!alive || !playing || busy) return;
    busy = true;
    try {
      index = (index + 1) % frameCount;
      schedule(await draw(index));
    } catch {
      // A bad frame: stop advancing, the last good frame stays.
    } finally {
      busy = false;
    }
  };

  void (async () => {
    try {
      const res = await fetch(url, { signal: abort.signal });
      if (!res.ok || !res.body) return;
      decoder = new ImageDecoder({ data: res.body, type: "image/gif" });
      await decoder.tracks.ready;
      const ms = await draw(0);
      if (alive && texture) onReady(texture);
      await decoder.completed;
      frameCount = decoder.tracks.selectedTrack?.frameCount ?? 1;
      schedule(ms);
    } catch {
      // Network, CORS or decode failure: the poster stays.
    }
  })();

  return {
    play() {
      playing = true;
      schedule(GIF_MIN_FRAME_MS);
    },
    pause() {
      playing = false;
      if (timer) window.clearTimeout(timer);
      timer = 0;
    },
    dispose() {
      alive = false;
      playing = false;
      if (timer) window.clearTimeout(timer);
      abort.abort();
      decoder?.close();
      const t = texture;
      if (t) window.setTimeout(() => t.dispose(), RELEASE_DELAY_MS);
    },
  };
}

export interface MediaEntry {
  source: MediaSource;
  roomId: string;
  position: readonly [number, number, number];
}

/** Shared between the frames (register their source) and the scheduler (plays / pauses them). */
export interface MediaRegistry {
  entries: Map<string, MediaEntry>;
  register(id: string, entry: MediaEntry): void;
  unregister(id: string): void;
  /** Requests a redraw (wired to the canvas by the scheduler). */
  invalidate(): void;
  setInvalidate(fn: () => void): void;
  /** Plays the chosen ids and pauses everything else. */
  apply(active: ReadonlySet<string>): void;
}

export function createMediaRegistry(): MediaRegistry {
  const entries = new Map<string, MediaEntry>();
  let redraw = () => {};
  return {
    entries,
    register: (id, entry) => void entries.set(id, entry),
    unregister: (id) => void entries.delete(id),
    invalidate: () => redraw(),
    setInvalidate: (fn) => {
      redraw = fn;
    },
    apply(active) {
      for (const [id, e] of entries) {
        if (active.has(id)) e.source.play();
        else e.source.pause();
      }
    },
  };
}
