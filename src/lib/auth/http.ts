import { NextResponse } from "next/server";
import { toPublicUser, type PublicUser, type StoredUser } from "./users";
import { listUserGalleries } from "./ownership";
import {
  getAuthSecret,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "./session";

const MAX_BODY_BYTES = 10 * 1024;

export function jsonError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

/** The secret, or a ready 503 response when accounts aren't configured. */
export function requireSecret():
  { secret: string } | { response: NextResponse } {
  const secret = getAuthSecret();
  if (!secret) return { response: jsonError(503, "Accounts not configured") };
  return { secret };
}

/** Parses a small JSON object body; returns null for anything else. */
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const body: unknown = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function withSession(
  response: NextResponse,
  user: PublicUser,
  secret: string,
): NextResponse {
  response.cookies.set(
    SESSION_COOKIE,
    signSession(user.id, secret),
    sessionCookieOptions(),
  );
  return response;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

// Basic per-instance login limit: 10 attempts per minute per email + IP.
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, number[]>();

export function tooManyAttempts(
  key: string,
  nowMs: number = Date.now(),
): boolean {
  const recent = (attempts.get(key) ?? []).filter((t) => nowMs - t < WINDOW_MS);
  recent.push(nowMs);
  attempts.set(key, recent);
  if (attempts.size > 10_000) {
    for (const [k, times] of attempts) {
      if (times.every((t) => nowMs - t >= WINDOW_MS)) attempts.delete(k);
    }
  }
  return recent.length > MAX_ATTEMPTS;
}

export function resetAttemptsForTests(): void {
  attempts.clear();
}

/** New means a recently created account with no published gallery, including legacy records. */
export async function userWithStatus(user: StoredUser) {
  const age = Date.now() - Date.parse(user.createdAt);
  const galleries = await listUserGalleries(user.id);
  return {
    ...toPublicUser(user),
    isNew: age >= 0 && age < 24 * 60 * 60 * 1000 && galleries.length === 0,
  };
}
