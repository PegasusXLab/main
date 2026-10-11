// Self-promotion helpers: piece actions ("Buy · $40", "Pre-save") and creator profile links with
// the platform recognized from the address (Spotify, Instagram, …). Links are https only.

import type { CreatorLink, GalleryCreator, PieceAction } from "./schema/types";
import { linkHost, safeLink } from "./inspect";

export const PIECE_ACTIONS: { id: PieceAction; label: string }[] = [
  { id: "learn", label: "Learn more" },
  { id: "buy", label: "Buy" },
  { id: "stream", label: "Listen" },
  { id: "presave", label: "Pre-save" },
  { id: "watch", label: "Watch" },
  { id: "book", label: "Book" },
  { id: "tip", label: "Tip the artist" },
];

/** Button text for a piece's link: "Buy · $40", "Pre-save", "Learn more". */
export function actionLabel(action?: PieceAction, price?: string): string {
  const label = PIECE_ACTIONS.find((a) => a.id === action)?.label ?? "Learn more";
  const p = price?.trim();
  return p ? `${label} · ${p}` : label;
}

export type Platform =
  | "spotify"
  | "apple-music"
  | "soundcloud"
  | "bandcamp"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "x"
  | "linktree"
  | "shop"
  | "website";

const PLATFORMS: { id: Platform; label: string; hosts: RegExp }[] = [
  { id: "spotify", label: "Spotify", hosts: /(^|\.)spotify\.com$|(^|\.)spotify\.link$/ },
  { id: "apple-music", label: "Apple Music", hosts: /^music\.apple\.com$/ },
  { id: "soundcloud", label: "SoundCloud", hosts: /(^|\.)soundcloud\.com$/ },
  { id: "bandcamp", label: "Bandcamp", hosts: /(^|\.)bandcamp\.com$/ },
  { id: "youtube", label: "YouTube", hosts: /(^|\.)youtube\.com$|^youtu\.be$/ },
  { id: "instagram", label: "Instagram", hosts: /(^|\.)instagram\.com$/ },
  { id: "tiktok", label: "TikTok", hosts: /(^|\.)tiktok\.com$/ },
  { id: "x", label: "X", hosts: /^(x|twitter)\.com$/ },
  { id: "linktree", label: "Linktree", hosts: /^linktr\.ee$/ },
  { id: "shop", label: "Shop", hosts: /(^|\.)(etsy\.com|myshopify\.com|gumroad\.com|ko-fi\.com|buymeacoffee\.com|patreon\.com)$/ },
];

export function platformOf(url: string): { id: Platform; label: string } {
  const host = linkHost(url).toLowerCase();
  const hit = PLATFORMS.find((p) => p.hosts.test(host));
  return hit ? { id: hit.id, label: hit.label } : { id: "website", label: host || "Website" };
}

export interface ResolvedLink {
  url: string;
  label: string;
  platform: Platform;
  host: string;
}

/** The creator's links that are safe to show, labeled. */
export function resolveCreatorLinks(links?: CreatorLink[]): ResolvedLink[] {
  return (links ?? []).flatMap((l) => {
    const url = safeLink(l.url?.trim());
    if (!url) return [];
    const p = platformOf(url);
    return [{ url, label: l.label?.trim() || p.label, platform: p.id, host: linkHost(url) }];
  });
}

/** True when there's a creator worth showing (a name). */
export function hasCreator(c?: GalleryCreator): c is GalleryCreator {
  return Boolean(c?.name?.trim());
}

/** "VG" from "Vic Googe". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
