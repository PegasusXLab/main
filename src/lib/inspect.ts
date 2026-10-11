// Item inspection (viewer): which artworks / objects visitors can click into, and the details
// they show. Pure helpers shared by the editor and the viewer.

import type { Artwork, GalleryObject, InspectFact } from "@/lib/schema/types";

type Item = Pick<Artwork | GalleryObject, "inspectable" | "title" | "story" | "voiceOver" | "facts">;

/**
 * Can visitors open this item? An explicit choice wins. Older galleries had no switch: artworks
 * were always clickable (keep that), and free-standing objects only make sense to open when the
 * creator wrote something about them.
 */
export function isInspectable(item: Item, kind: "artwork" | "object"): boolean {
  if (typeof item.inspectable === "boolean") return item.inspectable;
  if (kind === "artwork") return true;
  return Boolean(item.title?.trim() || item.story?.trim() || item.voiceOver?.audioUrl || item.facts?.length);
}

/** Detail rows offered as one-click starters in the editor. */
export const FACT_PRESETS = ["Year", "Medium", "Dimensions", "Location", "Edition", "Credit"] as const;

/** Rows worth showing (both sides filled). */
export function visibleFacts(facts?: InspectFact[]): InspectFact[] {
  return (facts ?? []).filter((f) => f.label.trim() && f.value.trim());
}

/** Only https links are rendered (no javascript:, data:, or plain http). */
export function safeLink(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** "example.com" for a link label. */
export function linkHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
