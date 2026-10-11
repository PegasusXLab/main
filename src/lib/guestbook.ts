// Guestbook (listening/guest room device): visitors sign a gallery's book. Pure rules shared by
// the API route and the panel: sizes, cleaning, and the stored shape.

export const GUESTBOOK_NAME_MAX = 40;
export const GUESTBOOK_MESSAGE_MAX = 280;
/** Kept per gallery; the oldest drop off. */
export const GUESTBOOK_KEEP = 200;

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  at: string; // ISO time
}

/** Trim, collapse whitespace runs (keeping single newlines in messages), drop control characters. */
export function cleanText(raw: unknown, max: number, multiline = false): string {
  if (typeof raw !== "string") return "";
  // Drop control characters but keep tab / newline (whitespace is normalized below).
  let s = raw.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
  s = multiline ? s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim().slice(0, max);
}

export function parseSignature(body: unknown): { name: string; message: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = cleanText(b.name, GUESTBOOK_NAME_MAX);
  const message = cleanText(b.message, GUESTBOOK_MESSAGE_MAX, true);
  return name && message ? { name, message } : null;
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", else the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)} d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
