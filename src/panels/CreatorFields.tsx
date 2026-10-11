"use client";

// "Artist profile" (editor, Gallery Properties): who made this gallery. Visitors see "by <name>"
// in the tour, which opens the bio and links. Links are labeled automatically by platform; only
// valid https links are saved (a half-typed one stays in the field until it's complete).

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useGalleryStore } from "@/store/gallery";
import { Input, Label } from "@/components/ui";
import { platformOf } from "@/lib/promo";
import { safeLink } from "@/lib/inspect";
import type { CreatorLink, GalleryCreator } from "@/lib/schema/types";

const MAX_LINKS = 8;

/** "open.spotify.com/x" → "https://open.spotify.com/x"; https links pass; anything else → null. */
export function normalizeLink(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : /\./.test(t) ? `https://${t}` : t;
  return safeLink(withScheme);
}

/** What gets stored: trimmed name/bio, valid links only; nothing at all when everything is empty. */
export function cleanCreator(name: string, bio: string, links: CreatorLink[]): GalleryCreator | undefined {
  const kept = links.flatMap((l) => {
    const url = normalizeLink(l.url);
    return url ? [{ url, ...(l.label?.trim() ? { label: l.label.trim() } : {}) }] : [];
  });
  const n = name.trim();
  const b = bio.trim();
  if (!n && !b && !kept.length) return undefined;
  return { name: n, ...(b ? { bio: b } : {}), ...(kept.length ? { links: kept } : {}) };
}

export function CreatorFields() {
  const stored = useGalleryStore((s) => s.gallery.creator);
  const galleryId = useGalleryStore((s) => s.gallery.id);
  const setCreator = useGalleryStore((s) => s.setCreator);

  // Local drafts (per gallery) so half-typed links aren't lost or saved.
  const [draft, setDraft] = useState(() => ({
    id: galleryId,
    name: stored?.name ?? "",
    bio: stored?.bio ?? "",
    links: stored?.links?.length ? stored.links : [],
  }));
  const d =
    draft.id === galleryId
      ? draft
      : { id: galleryId, name: stored?.name ?? "", bio: stored?.bio ?? "", links: stored?.links ?? [] };

  const update = (patch: Partial<Omit<typeof d, "id">>) => {
    const next = { ...d, ...patch };
    setDraft(next);
    setCreator(cleanCreator(next.name, next.bio, next.links));
  };
  const setLink = (i: number, patch: Partial<CreatorLink>) =>
    update({ links: d.links.map((l, k) => (k === i ? { ...l, ...patch } : l)) });

  return (
    <div data-testid="creator-fields" className="flex flex-col gap-3 rounded-md border border-hairline bg-paper/60 p-3">
      <div>
        <h3 className="text-xs font-semibold text-graphite">Artist profile</h3>
        <p className="text-[10px] leading-snug text-pencil">
          Visitors see “by {d.name.trim() || "you"}” in the tour, with your bio and links.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="creator-name">Name</Label>
        <Input
          id="creator-name"
          value={d.name}
          maxLength={80}
          placeholder="Artist or studio name"
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="creator-bio">Bio</Label>
        <textarea
          id="creator-bio"
          rows={3}
          maxLength={600}
          value={d.bio}
          placeholder="A line or two about you, your sound, your work"
          onChange={(e) => update({ bio: e.target.value })}
          className="w-full rounded-[2px] border border-hairline bg-paper px-2.5 py-1.5 text-xs text-graphite placeholder:text-pencil transition-colors duration-fast focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Links</Label>
        {d.links.map((l, i) => {
          const url = normalizeLink(l.url);
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Input
                  aria-label={`Link ${i + 1}`}
                  value={l.url}
                  maxLength={500}
                  placeholder="open.spotify.com/artist/…"
                  onChange={(e) => setLink(i, { url: e.target.value })}
                  className="text-xs"
                />
                <button
                  type="button"
                  aria-label={`Remove link ${i + 1}`}
                  onClick={() => update({ links: d.links.filter((_, k) => k !== i) })}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-pencil hover:bg-plaster hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              {l.url.trim() ? (
                <span className={`text-[10px] ${url ? "text-pencil" : "text-danger"}`}>
                  {url ? `Shows as ${l.label?.trim() || platformOf(url).label}` : "Use an https:// link"}
                </span>
              ) : null}
            </div>
          );
        })}
        {d.links.length < MAX_LINKS ? (
          <button
            type="button"
            data-testid="creator-add-link"
            onClick={() => update({ links: [...d.links, { url: "" }] })}
            className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-hairline px-2.5 py-1 text-[11px] text-pencil transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3 w-3" aria-hidden="true" /> Add a link (Spotify, Instagram, shop…)
          </button>
        ) : null}
      </div>
    </div>
  );
}
