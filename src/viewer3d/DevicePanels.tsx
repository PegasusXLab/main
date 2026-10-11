"use client";

// Device sections of the inspection panel: what a visitor can DO with a piece. A TV's play/sound
// controls, a listening station's (or album cover's) tracklist, the guestbook's sign form and
// signatures, and a share button that links straight to the piece.

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Check, Link2, Pause, Play, Share2, Square, Volume2, VolumeX } from "lucide-react";
import type { Track } from "@/lib/schema/types";
import { useSpinStore } from "@/audio/spinStore";
import { GUESTBOOK_MESSAGE_MAX, GUESTBOOK_NAME_MAX, timeAgo } from "@/lib/guestbook";
import { getTvVideo, subscribeTvVideos } from "./Devices";
import { useGuestbookStore } from "./guestbookStore";

const chip =
  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs text-paper/85 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60";

// ---------------------------------------------------------------------------------------------
// TV

function useVideoState(objectId: string) {
  const video = useSyncExternalStore(
    subscribeTvVideos,
    () => getTvVideo(objectId) ?? null,
    () => null,
  );
  const [, force] = useState(0);
  useEffect(() => {
    if (!video) return;
    const bump = () => force((n) => n + 1);
    const events = ["play", "pause", "volumechange", "playing"] as const;
    events.forEach((e) => video.addEventListener(e, bump));
    return () => events.forEach((e) => video.removeEventListener(e, bump));
  }, [video]);
  return video;
}

export function TvControls({ objectId }: { objectId: string }) {
  const video = useVideoState(objectId);
  const setHold = useSpinStore((s) => s.setHold);
  const playing = Boolean(video && !video.paused);
  const soundOn = Boolean(video && !video.muted);

  // Leaving the panel: the TV goes quiet again and the room's music comes back.
  useEffect(
    () => () => {
      const v = getTvVideo(objectId);
      if (v) v.muted = true;
      useSpinStore.getState().setHold(false);
    },
    [objectId],
  );

  if (!video) return null;
  return (
    <div data-testid="tv-controls" className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={chip}
        onClick={() => {
          const v = getTvVideo(objectId);
          if (!v) return;
          if (v.paused) void v.play().catch(() => {});
          else v.pause();
        }}
      >
        {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
        {playing ? "Pause video" : "Play video"}
      </button>
      <button
        type="button"
        data-testid="tv-sound"
        className={chip}
        onClick={() => {
          // The element lives outside React (owned by the 3D TV); read it fresh.
          const v = getTvVideo(objectId);
          if (!v) return;
          v.muted = !v.muted;
          if (!v.muted && v.paused) void v.play().catch(() => {});
          setHold(!v.muted);
        }}
      >
        {soundOn ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
        {soundOn ? "Sound on" : "Turn sound on"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Tracklist (listening station / album cover)

function Bars({ on }: { on: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-full w-[3px] origin-bottom rounded-sm bg-paper ${on ? "motion-safe:animate-[gv-eq_900ms_ease-in-out_infinite]" : "scale-y-[0.3]"}`}
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export function Tracklist({ sourceId, tracks, label }: { sourceId: string; tracks: Track[]; label: string }) {
  const current = useSpinStore((s) => (s.sourceId === sourceId ? s.track : null));
  const audible = useSpinStore((s) => s.sourceId === sourceId && s.audible);
  const play = useSpinStore((s) => s.play);
  const stop = useSpinStore((s) => s.stop);
  if (!tracks.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/50">{label}</span>
        {current ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1 text-[11px] text-paper/60 transition-colors hover:text-paper"
          >
            <Square className="h-3 w-3" aria-hidden="true" /> Stop, back to the room&apos;s music
          </button>
        ) : null}
      </div>
      <ol data-testid="tracklist" className="flex flex-col border-t border-white/10">
        {tracks.map((t, i) => {
          const on = current?.url === t.url;
          return (
            <li key={`${t.url}-${i}`} className="border-b border-white/10">
              <button
                type="button"
                data-testid="track-play"
                aria-pressed={on}
                onClick={() => (on ? stop() : play(t, sourceId))}
                className={`group flex w-full items-center gap-3 py-2.5 text-left transition-colors ${on ? "text-paper" : "text-paper/80 hover:text-paper"}`}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[3px] bg-white/10">
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-mono text-[11px] text-paper/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-aria-pressed:opacity-100">
                    {on ? <Bars on={audible} /> : <Play className="h-4 w-4 fill-current" aria-hidden="true" />}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{t.title}</span>
                  {t.artist ? <span className="truncate text-[11px] text-paper/50">{t.artist}</span> : null}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">
                  {on ? (audible ? "Playing" : "Starting…") : "Play"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Guestbook

const SIGNED_KEY = "gv:guestbook:signed:";

export function GuestbookSection({ galleryId, prompt }: { galleryId: string; prompt?: string }) {
  const entries = useGuestbookStore((s) => s.entries);
  const loaded = useGuestbookStore((s) => s.loaded);
  const load = useGuestbookStore((s) => s.load);
  const sign = useGuestbookStore((s) => s.sign);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" } | { kind: "error"; error: string }>({
    kind: "idle",
  });

  useEffect(() => {
    void load(galleryId);
  }, [galleryId, load]);
  useEffect(() => {
    let signed = false;
    try {
      signed = globalThis.localStorage?.getItem(SIGNED_KEY + galleryId) === "1";
    } catch {
      signed = false;
    }
    if (!signed) return;
    const id = requestAnimationFrame(() => setState({ kind: "done" }));
    return () => cancelAnimationFrame(id);
  }, [galleryId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || state.kind === "sending") return;
    setState({ kind: "sending" });
    const r = await sign(name, message);
    if (r.ok) {
      try {
        globalThis.localStorage?.setItem(SIGNED_KEY + galleryId, "1");
      } catch {
        // ignore
      }
      setState({ kind: "done" });
    } else setState({ kind: "error", error: r.error });
  };

  const field =
    "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-paper placeholder:text-paper/35 focus-visible:border-white/30 focus-visible:outline-none";
  return (
    <div data-testid="guestbook" className="flex flex-col gap-4">
      {state.kind === "done" ? (
        <p className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-paper/85">
          <Check className="h-4 w-4 text-[#9be3b0]" aria-hidden="true" /> Thanks for signing. Your note is in the book.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <span className="text-sm text-paper/80">{prompt?.trim() || "Leave a note for the artist."}</span>
          <input
            aria-label="Your name"
            className={field}
            value={name}
            maxLength={GUESTBOOK_NAME_MAX}
            placeholder="Your name"
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            aria-label="Your message"
            className={`${field} resize-none`}
            rows={3}
            value={message}
            maxLength={GUESTBOOK_MESSAGE_MAX}
            placeholder="What did you think?"
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-paper/40">{`${message.length} / ${GUESTBOOK_MESSAGE_MAX}`}</span>
            <button
              type="submit"
              data-testid="guestbook-sign"
              disabled={!name.trim() || !message.trim() || state.kind === "sending"}
              className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-graphite transition-[transform,opacity] hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
            >
              {state.kind === "sending" ? "Signing…" : "Sign the book"}
            </button>
          </div>
          {state.kind === "error" ? <p className="text-xs text-[#ffb4a8]">{state.error}</p> : null}
        </form>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/50">
          {entries.length ? `Signatures · ${entries.length}` : loaded ? "No signatures yet" : "Loading…"}
        </span>
        <ul data-testid="guestbook-entries" className="flex flex-col">
          {entries.slice(0, 20).map((e) => (
            <li key={e.id} className="border-b border-white/10 py-2.5">
              <p className="whitespace-pre-line text-sm italic leading-relaxed text-paper/85">{`“${e.message}”`}</p>
              <p className="mt-1 text-[11px] text-paper/50">{`${e.name} · ${timeAgo(e.at)}`}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Share

/** This page's address opening straight onto a piece. */
export function pieceLink(pieceId: string, href = globalThis.location?.href ?? ""): string {
  try {
    const u = new URL(href);
    u.searchParams.set("piece", pieceId);
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

export function ShareButton({ pieceId, title }: { pieceId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      data-testid="inspect-share"
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-paper/60 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
      onClick={async () => {
        const url = pieceLink(pieceId);
        if (!url) return;
        const nav = globalThis.navigator as Navigator | undefined;
        if (nav?.share && window.matchMedia?.("(pointer: coarse)").matches) {
          await nav.share({ title, url }).catch(() => {});
          return;
        }
        try {
          await nav?.clipboard?.writeText(url);
          setCopied(true);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
    >
      {copied ? <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Share2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
