"use client";

// Item inspection (viewer). When a visitor opens an artwork or object, the camera frames it and
// this panel arrives from the right edge (a bottom sheet on phones): a dark glass column with a
// hairline that draws down its edge, the title rising letter by letter in the room's typeface,
// the details table wiping in row by row, the story, the audio guide (progress ring), a "learn
// more" link, and previous / next through the room's other pieces. Close with ✕ or Esc.
// Motion is transform / opacity / clip-path only; prefers-reduced-motion keeps it instant.

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import type { InspectFact, ObjectDevice, PieceAction, Track, VoiceOverData } from "@/lib/schema/types";
import { useNarrationStore, getNarrationElement } from "@/audio/narrationStore";
import { shortVoiceName } from "@/lib/elevenlabs/voices";
import { linkHost, safeLink, visibleFacts } from "@/lib/inspect";
import { actionLabel } from "@/lib/promo";
import { playableTracks } from "@/lib/devices";
import { GuestbookSection, ShareButton, Tracklist, TvControls } from "./DevicePanels";
import { wordGlyphs } from "./RoomTitle";

/** Beat between opening an item and its voiceover (the camera is still gliding in). */
export const ITEM_AUDIO_DELAY_MS = 700;
/** How long the panel takes to leave before it unmounts. */
const EXIT_MS = 260;

export interface InspectItem {
  id: string;
  kind: "artwork" | "object";
  title: string;
  artist: string;
  story: string;
  facts?: InspectFact[];
  link?: string;
  action?: PieceAction;
  price?: string;
  voiceOver?: VoiceOverData;
  /** What visitors can use on this piece (TV, listening station, guestbook). */
  device?: ObjectDevice;
  /** Album wall: the song this cover plays. */
  track?: Track;
}

export interface InspectPanelProps {
  /** The item being inspected, or null when closed (the panel animates out). */
  item: InspectItem | null;
  fontFamily?: string;
  /** For the guestbook (signatures are per gallery). */
  galleryId?: string;
  /** 1-based position among the room's inspectable items, and how many there are. */
  index: number;
  count: number;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Live progress of the voice element while this item's guide is loaded. */
function useVoiceProgress(active: boolean): { t: number; d: number } {
  const [p, setP] = useState({ t: 0, d: 0 });
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      const el = getNarrationElement();
      if (el) setP({ t: el.currentTime, d: Number.isFinite(el.duration) ? el.duration : 0 });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return p;
}

function GuidePlayer({ item }: { item: InspectItem }) {
  const vo = item.voiceOver!;
  const url = vo.audioUrl!;
  const isPlaying = useNarrationStore((s) => s.isPlaying);
  const activeUrl = useNarrationStore((s) => s.activeUrl);
  const muted = useNarrationStore((s) => s.muted);
  const playNarration = useNarrationStore((s) => s.playNarration);
  const pauseNarration = useNarrationStore((s) => s.pauseNarration);
  const resumeNarration = useNarrationStore((s) => s.resumeNarration);
  const setMuted = useNarrationStore((s) => s.setMuted);
  const mine = activeUrl === url;
  const speaking = mine && isPlaying;
  const { t, d } = useVoiceProgress(mine);
  const progress = mine && d > 0 ? Math.min(1, t / d) : 0;
  const R = 15;
  const C = 2 * Math.PI * R;

  const toggle = () => {
    if (muted) setMuted(false);
    if (speaking) pauseNarration();
    else if (mine) resumeNarration();
    else
      playNarration({
        url,
        title: item.title || "Artwork",
        voiceName: vo.voiceName || "Docent",
        text: vo.text,
      });
  };

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4">
      <button
        type="button"
        data-testid="plaque-audio-guide-toggle"
        onClick={toggle}
        aria-label={speaking ? "Pause the audio guide" : "Play the audio guide"}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper transition-transform duration-[var(--duration-fast)] hover:scale-[1.04] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70"
      >
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
          <circle
            cx="18"
            cy="18"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            style={{ transition: "stroke-dashoffset 120ms linear" }}
          />
        </svg>
        {speaking ? (
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden="true" />
        )}
      </button>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-paper/50">
          {vo.voiceName ? `Audio guide · ${shortVoiceName(vo.voiceName)}` : "Audio guide"}
        </span>
        <span className="font-mono text-xs tabular-nums text-paper/80">
          {mine && d > 0 ? `${fmt(t)} / ${fmt(d)}` : speaking ? "Playing" : "Listen"}
        </span>
      </span>
    </div>
  );
}

/** Content of one item; keyed by id so every item replays the entrance choreography. */
function InspectContent({
  item,
  fontFamily,
  entered,
  galleryId,
}: {
  item: InspectItem;
  fontFamily?: string;
  entered: boolean;
  galleryId?: string;
}) {
  const words = useMemo(() => wordGlyphs(item.title || "Untitled"), [item.title]);
  const letterCount = words.reduce((n, w) => n + w.word.length, 0);
  const facts = visibleFacts(item.facts);
  const link = safeLink(item.link);
  const titleEnd = 120 + Math.min(letterCount * 18, 420);
  const rise = (delay: number): CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(10px)",
    transition: "opacity 520ms var(--ease-out-default), transform 620ms var(--ease-out-default)",
    transitionDelay: entered ? `${delay}ms` : "0ms",
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2
          aria-label={item.title || "Untitled"}
          className="text-balance text-[clamp(1.9rem,3.2vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.01em] text-paper"
          style={{ fontFamily, perspective: "600px" }}
        >
          <span aria-hidden="true">
            {words.map(({ word, start }, w) => (
              <Fragment key={w}>
                {w > 0 ? " " : null}
                <span className="inline-block whitespace-nowrap">
                  {word.map((ch, k) => (
                    <span
                      key={k}
                      className="inline-block"
                      style={{
                        opacity: entered ? 1 : 0,
                        transform: entered ? "none" : "translateY(0.5em) rotateX(-70deg)",
                        transformOrigin: "50% 100%",
                        transition:
                          "transform 820ms var(--ease-out-default), opacity 420ms var(--ease-out-default)",
                        transitionDelay: entered ? `${120 + Math.min((start + k) * 18, 420)}ms` : "0ms",
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        </h2>
        {item.artist ? (
          <p
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-paper/60"
            style={rise(titleEnd - 160)}
          >
            {item.artist}
          </p>
        ) : null}
      </div>

      {facts.length ? (
        <dl data-testid="inspect-facts" className="flex flex-col border-t border-white/10">
          {facts.map((f, i) => (
            <div
              key={`${f.label}-${i}`}
              className="grid grid-cols-[minmax(6rem,40%)_1fr] gap-4 border-b border-white/10 py-2 text-[13px]"
              style={{
                clipPath: entered ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: "clip-path 560ms var(--ease-out-default)",
                transitionDelay: entered ? `${titleEnd + i * 70}ms` : "0ms",
              }}
            >
              <dt className="text-paper/45">{f.label}</dt>
              <dd className="text-paper/90">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {item.story ? (
        <p
          className="whitespace-pre-line text-pretty text-sm leading-relaxed text-paper/80"
          style={rise(titleEnd + facts.length * 70 + 80)}
        >
          {item.story}
        </p>
      ) : null}

      {item.device?.kind === "tv" ? (
        <div style={rise(titleEnd + facts.length * 70 + 100)}>
          <TvControls objectId={item.id} />
        </div>
      ) : null}
      {playableTracks(item.device, item.track).length ? (
        <div style={rise(titleEnd + facts.length * 70 + 100)}>
          <Tracklist
            sourceId={item.id}
            tracks={playableTracks(item.device, item.track)}
            label={item.device?.kind === "turntable" ? "On the turntable" : "The song"}
          />
        </div>
      ) : null}
      {item.device?.kind === "guestbook" && galleryId ? (
        <div style={rise(titleEnd + facts.length * 70 + 100)}>
          <GuestbookSection galleryId={galleryId} prompt={item.device.prompt} />
        </div>
      ) : null}

      {link && item.action && item.action !== "learn" ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="inspect-action"
          style={rise(titleEnd + facts.length * 70 + 120)}
          className="group inline-flex w-fit items-center gap-3 rounded-full bg-paper py-2 pl-5 pr-2 text-sm font-semibold text-graphite shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-[var(--duration-normal)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/70"
        >
          {actionLabel(item.action, item.price)}
          <span className="font-mono text-[10px] font-normal uppercase tracking-[0.18em] text-graphite/50">
            {linkHost(link)}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-graphite text-paper transition-transform duration-[var(--duration-normal)] group-hover:rotate-45">
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </a>
      ) : null}

      {item.voiceOver?.audioUrl || (link && (!item.action || item.action === "learn")) ? (
        <div
          className="flex flex-wrap items-center gap-3"
          style={rise(titleEnd + facts.length * 70 + 160)}
        >
          {item.voiceOver?.audioUrl ? <GuidePlayer item={item} /> : null}
          {link && (!item.action || item.action === "learn") ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 text-xs text-paper/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-paper hover:decoration-white/60"
            >
              {item.price?.trim() ? `${actionLabel("learn", item.price)} on ${linkHost(link)}` : `Learn more on ${linkHost(link)}`}
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-[var(--duration-normal)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function InspectPanel({
  item,
  fontFamily,
  galleryId,
  index,
  count,
  onPrev,
  onNext,
  onClose,
}: InspectPanelProps) {
  // Keep showing the last item while the panel animates out.
  const [shown, setShown] = useState<InspectItem | null>(item);
  const [entered, setEntered] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (item) {
      const id = requestAnimationFrame(() => {
        setShown(item);
        setEntered(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setEntered(false));
    const t = setTimeout(() => setShown(null), EXIT_MS);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [item]);

  // Esc closes; focus goes to Close so keyboard users land in the panel.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);
  useEffect(() => {
    if (item) closeRef.current?.focus({ preventScroll: true });
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={shown.title || "Artwork"}
      data-testid="inspect-panel"
      className="pointer-events-auto absolute z-30 flex flex-col text-paper max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[62%] max-md:rounded-t-2xl md:inset-y-0 md:right-0 md:w-[min(30rem,42vw)]"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translate3d(var(--gv-inspect-dx, 24px), var(--gv-inspect-dy, 0px), 0)",
        transition: entered
          ? "opacity 420ms var(--ease-out-default), transform 560ms var(--ease-out-default)"
          : `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
      }}
    >
      {/* Glass: a soft edge on the left (desktop) or top (phone) into a dark column. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 backdrop-blur-md max-md:rounded-t-2xl max-md:bg-[rgba(14,14,16,0.9)] md:bg-[linear-gradient(to_right,rgba(14,14,16,0.55),rgba(14,14,16,0.9)_22%,rgba(14,14,16,0.94))]"
      />
      {/* Hairline that draws down the panel's edge. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 hidden h-full w-px origin-top bg-white/25 md:block"
        style={{
          transform: entered ? "scaleY(1)" : "scaleY(0)",
          transition: "transform 900ms var(--ease-out-default)",
        }}
      />

      <header className="flex items-center justify-between gap-3 px-6 pb-2 pt-5 md:px-8 md:pt-24">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper/50">
          {count > 1 ? `Inspecting · ${pad(index)} / ${pad(count)}` : "Inspecting"}
        </span>
        <div className="flex items-center gap-1">
          <ShareButton pieceId={shown.id} title={shown.title || "Artwork"} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            data-testid="inspect-close"
            aria-label="Close"
            className="group inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-xs text-paper/70 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
          >
            <span>Close</span>
            <kbd className="rounded border border-white/15 px-1 font-mono text-[10px] text-paper/50">Esc</kbd>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] transition-colors group-hover:bg-white/15">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 md:px-8">
        <InspectContent key={shown.id} item={shown} fontFamily={fontFamily} entered={entered} galleryId={galleryId} />
      </div>

      {count > 1 ? (
        <footer className="flex items-center justify-between gap-2 border-t border-white/10 px-6 py-3 md:px-8">
          <button
            type="button"
            onClick={onPrev}
            data-testid="inspect-prev"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-paper/60 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous piece
          </button>
          <button
            type="button"
            onClick={onNext}
            data-testid="inspect-next"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-paper/60 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
          >
            Next piece <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </footer>
      ) : null}
    </aside>
  );
}
