// Email verification codes (T-147). Pure functions over the stored user: a 6-digit code from
// crypto.randomInt, kept only as an HMAC (AUTH_SECRET), valid 10 minutes, 5 wrong tries, and
// resends limited to 1 per minute and 5 per hour per account. The routes persist the result.

import crypto from "node:crypto";
import type { PendingVerification, StoredUser } from "./users";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_TRIES = 5;
export const RESEND_GAP_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export function newCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(email: string, code: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`verify:${email}:${code}`)
    .digest("base64url");
}

export type IssueResult =
  | { ok: true; user: StoredUser; code: string }
  | { ok: false; retryAfterSeconds: number };

/** A fresh code for `user`, unless it was sent too recently or too often this hour. */
export function issueCode(
  user: StoredUser,
  secret: string,
  nowMs: number = Date.now(),
  code: string = newCode(),
): IssueResult {
  const recent = (user.verification?.sentAt ?? []).filter(
    (t) => nowMs - Date.parse(t) < HOUR_MS,
  );
  const last = recent.length
    ? Math.max(...recent.map((t) => Date.parse(t)))
    : 0;
  if (last && nowMs - last < RESEND_GAP_MS) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((RESEND_GAP_MS - (nowMs - last)) / 1000),
    };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    const oldest = Math.min(...recent.map((t) => Date.parse(t)));
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((HOUR_MS - (nowMs - oldest)) / 1000),
    };
  }
  const verification: PendingVerification = {
    codeHash: hashCode(user.email, code, secret),
    expiresAt: new Date(nowMs + CODE_TTL_MS).toISOString(),
    tries: 0,
    sentAt: [...recent, new Date(nowMs).toISOString()],
  };
  return { ok: true, user: { ...user, verification }, code };
}

export type CheckResult =
  | { ok: true; user: StoredUser }
  | {
      ok: false;
      reason: "none" | "expired" | "locked" | "wrong";
      user: StoredUser;
      triesLeft: number;
    };

/** Checks a typed code. A wrong code costs a try; the 5th wrong try locks the code. */
export function checkCode(
  user: StoredUser,
  typed: string,
  secret: string,
  nowMs: number = Date.now(),
): CheckResult {
  const v = user.verification;
  if (!v) return { ok: false, reason: "none", user, triesLeft: 0 };
  if (v.tries >= MAX_CODE_TRIES) {
    return { ok: false, reason: "locked", user, triesLeft: 0 };
  }
  if (nowMs >= Date.parse(v.expiresAt)) {
    return { ok: false, reason: "expired", user, triesLeft: 0 };
  }
  const code = typed.replace(/\s+/g, "");
  const expected = Buffer.from(v.codeHash);
  const actual = Buffer.from(hashCode(user.email, code, secret));
  const match =
    /^\d{6}$/.test(code) &&
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected);
  if (match) {
    const { verification: _done, ...rest } = user;
    void _done;
    return { ok: true, user: { ...rest, emailVerified: true } };
  }
  const tries = v.tries + 1;
  const updated = { ...user, verification: { ...v, tries } };
  const triesLeft = Math.max(0, MAX_CODE_TRIES - tries);
  return {
    ok: false,
    reason: triesLeft === 0 ? "locked" : "wrong",
    user: updated,
    triesLeft,
  };
}

export function checkFailureMessage(
  reason: "none" | "expired" | "locked" | "wrong",
  triesLeft: number,
): string {
  switch (reason) {
    case "wrong":
      return `That code isn't right. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.`;
    case "expired":
      return "That code has expired. Send a new code.";
    case "locked":
      return "Too many wrong codes. Send a new code.";
    case "none":
      return "No code is waiting for this email. Send a new code.";
  }
}

/**
 * Test hook (Quang, T-147): a request whose `x-e2e-verify-secret` header matches the
 * E2E_VERIFY_SECRET env var (24+ chars) gets the code back, so live tests with @example.com
 * addresses can finish signing up. Without the env var nothing is ever revealed.
 */
export function revealCodeForTests(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const secret = env.E2E_VERIFY_SECRET?.trim();
  if (!secret || secret.length < 24) return false;
  const header = request.headers.get("x-e2e-verify-secret") ?? "";
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
