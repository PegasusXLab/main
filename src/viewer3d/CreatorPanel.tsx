"use client";

// Creator profile (viewer): opened from the "by <name>" chip in the tour header. Same glass side
// panel as the inspection view (bottom sheet on phones): monogram, name, bio, and their links,
// each labeled by platform (Spotify, Instagram, …). Close with ✕ or Esc.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  AtSign,
  Camera,
  Globe,
  Link2,
  Music,
  PlayCircle,
  ShoppingBag,
  X,
  type LucideIcon,
} from "lucide-react";
import type { GalleryCreator } from "@/lib/schema/types";
import { initials, resolveCreatorLinks, type Platform } from "@/lib/promo";

const EXIT_MS = 260;

const ICONS: Record<Platform, LucideIcon> = {
  spotify: Music,
  "apple-music": Music,
  soundcloud: Music,
  bandcamp: Music,
  youtube: PlayCircle,
  instagram: Camera,
  tiktok: AtSign,
  x: AtSign,
  linktree: Link2,
  shop: ShoppingBag,
  website: Globe,
};

export function CreatorChip({ creator, onOpen }: { creator: GalleryCreator; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="creator-chip"
      className="group flex items-center gap-2 rounded-full border border-white/10 bg-graphite/70 py-1 pl-1 pr-3 text-xs text-paper/80 shadow-lg backdrop-blur-md transition-colors hover:border-white/25 hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#8fb0ff] to-[#f2c6a0] font-mono text-[10px] font-semibold text-graphite">
        {initials(creator.name)}
      </span>
      <span className="max-w-[10rem] truncate">{`by ${creator.name.trim()}`}</span>
    </button>
  );
}

export function CreatorPanel({
  creator,
  open,
  fontFamily,
  onClose,
}: {
  creator: GalleryCreator;
  open: boolean;
  fontFamily?: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const links = useMemo(() => resolveCreatorLinks(creator.links), [creator.links]);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setEntered(false));
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted && !open) return null;

  const rise = (delay: number): CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(10px)",
    transition: "opacity 520ms var(--ease-out-default), transform 620ms var(--ease-out-default)",
    transitionDelay: entered ? `${delay}ms` : "0ms",
  });

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`About ${creator.name}`}
      data-testid="creator-panel"
      className="pointer-events-auto absolute z-30 flex flex-col text-paper max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[70%] max-md:rounded-t-2xl md:inset-y-0 md:right-0 md:w-[min(28rem,40vw)]"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translate3d(var(--gv-inspect-dx, 24px), var(--gv-inspect-dy, 0px), 0)",
        transition: entered
          ? "opacity 420ms var(--ease-out-default), transform 560ms var(--ease-out-default)"
          : `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 backdrop-blur-md max-md:rounded-t-2xl max-md:bg-[rgba(14,14,16,0.92)] md:bg-[linear-gradient(to_right,rgba(14,14,16,0.55),rgba(14,14,16,0.9)_22%,rgba(14,14,16,0.95))]"
      />
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 hidden h-full w-px origin-top bg-white/25 md:block"
        style={{ transform: entered ? "scaleY(1)" : "scaleY(0)", transition: "transform 900ms var(--ease-out-default)" }}
      />

      <header className="flex items-center justify-between gap-3 px-6 pb-2 pt-5 md:px-8 md:pt-24">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper/50">The artist</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          data-testid="creator-close"
          aria-label="Close"
          className="group inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-xs text-paper/70 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
        >
          <span>Close</span>
          <kbd className="rounded border border-white/15 px-1 font-mono text-[10px] text-paper/50">Esc</kbd>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] transition-colors group-hover:bg-white/15">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4 md:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4" style={rise(60)}>
            <span
              aria-hidden="true"
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8fb0ff] via-[#c9b8ff] to-[#f2c6a0] font-mono text-lg font-semibold text-graphite"
              style={{
                transform: entered ? "scale(1)" : "scale(0.6)",
                transition: "transform 700ms var(--ease-out-default)",
              }}
            >
              {initials(creator.name)}
              <span className="absolute -inset-1 rounded-full border border-white/15 motion-safe:animate-[spin_12s_linear_infinite] [border-top-color:rgba(255,255,255,0.6)]" />
            </span>
            <h2
              className="text-balance text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.01em]"
              style={{ fontFamily }}
            >
              {creator.name}
            </h2>
          </div>

          {creator.bio?.trim() ? (
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-paper/80" style={rise(180)}>
              {creator.bio}
            </p>
          ) : null}

          {links.length ? (
            <ul data-testid="creator-links" className="flex flex-col border-t border-white/10">
              {links.map((l, i) => {
                const Icon = ICONS[l.platform];
                return (
                  <li
                    key={l.url}
                    className="border-b border-white/10"
                    style={{
                      clipPath: entered ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                      transition: "clip-path 560ms var(--ease-out-default)",
                      transitionDelay: entered ? `${260 + i * 70}ms` : "0ms",
                    }}
                  >
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 py-3 text-sm text-paper/90 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] transition-colors group-hover:bg-white/15">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1 font-medium">{l.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/40">{l.host}</span>
                      <ArrowUpRight
                        className="h-4 w-4 text-paper/50 transition-transform duration-[var(--duration-normal)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-paper"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
