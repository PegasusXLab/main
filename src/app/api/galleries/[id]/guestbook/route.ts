import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import type { Gallery } from "@/lib/schema/types";
import { GUESTBOOK_KEEP, parseSignature, type GuestbookEntry } from "@/lib/guestbook";

// A gallery's guestbook: GET the latest signatures, POST to sign. Only galleries that placed a
// guestbook accept signatures. Small bodies, per-visitor cooldown, oldest entries drop off.

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_BODY = 2048;
const COOLDOWN_MS = 15_000;
const SHOWN = 50;
const recent = new Map<string, number>();

const key = (id: string) => `guestbooks/${id}.json`;

async function readEntries(id: string): Promise<GuestbookEntry[]> {
  const obj = await getStorage().getObject(key(id));
  if (!obj) return [];
  try {
    const data = JSON.parse(Buffer.from(obj.bytes).toString("utf8")) as { entries?: GuestbookEntry[] };
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

async function hasGuestbook(id: string): Promise<boolean | null> {
  const obj = await getStorage().getObject(`galleries/${id}.json`);
  if (!obj) return null;
  try {
    const g = JSON.parse(Buffer.from(obj.bytes).toString("utf8")) as Gallery;
    return (g.objects ?? []).some((o) => o.device?.kind === "guestbook");
  } catch {
    return false;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id?: string }> }) {
  const { id } = await context.params;
  if (!id || !ID.test(id)) return new NextResponse("Not Found", { status: 404 });
  let entries: GuestbookEntry[];
  try {
    entries = await readEntries(id);
  } catch (err) {
    console.error("[guestbook] read failed:", err);
    return NextResponse.json({ error: "Couldn't load the guestbook" }, { status: 503 });
  }
  return NextResponse.json(
    { entries: entries.slice(-SHOWN).reverse() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, context: { params: Promise<{ id?: string }> }) {
  const { id } = await context.params;
  if (!id || !ID.test(id)) return new NextResponse("Not Found", { status: 404 });

  const text = await request.text();
  if (text.length > MAX_BODY) return NextResponse.json({ error: "Too long" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sig = parseSignature(body);
  if (!sig) return NextResponse.json({ error: "Add your name and a message" }, { status: 400 });

  let open: boolean | null;
  try {
    open = await hasGuestbook(id);
  } catch (err) {
    console.error("[guestbook] gallery lookup failed:", err);
    return NextResponse.json({ error: "Couldn't reach the guestbook, try again" }, { status: 503 });
  }
  if (open === null) return new NextResponse("Not Found", { status: 404 });
  if (!open) return NextResponse.json({ error: "This gallery has no guestbook" }, { status: 403 });

  const who = `${id}:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"}`;
  const now = Date.now();
  const last = recent.get(who);
  if (last && now - last < COOLDOWN_MS) {
    return NextResponse.json({ error: "Give it a few seconds before signing again" }, { status: 429 });
  }
  recent.set(who, now);
  if (recent.size > 5000) recent.clear();

  const entry: GuestbookEntry = { id: nanoid(10), ...sig, at: new Date(now).toISOString() };
  try {
    const entries = [...(await readEntries(id)), entry].slice(-GUESTBOOK_KEEP);
    await getStorage().putObject(key(id), Buffer.from(JSON.stringify({ entries })), "application/json");
  } catch (err) {
    recent.delete(who);
    console.error("[guestbook] write failed:", err);
    return NextResponse.json({ error: "Couldn't save your signature, try again" }, { status: 503 });
  }
  return NextResponse.json({ entry }, { status: 201 });
}
