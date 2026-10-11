import { describe, expect, it } from "vitest";
import {
  checkCode,
  checkFailureMessage,
  CODE_TTL_MS,
  hashCode,
  issueCode,
  MAX_CODE_TRIES,
  MAX_SENDS_PER_HOUR,
  newCode,
  RESEND_GAP_MS,
  revealCodeForTests,
} from "./verify";
import { isVerified, type StoredUser } from "./users";

const SECRET = "test-secret-0123456789abcdef0123456789";
const T0 = Date.parse("2026-10-11T04:00:00Z");

function user(overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    id: "u1",
    email: "ada@example.com",
    name: "Ada",
    passwordHash: "x",
    createdAt: "2026-10-11T03:59:00Z",
    emailVerified: false,
    ...overrides,
  };
}

describe("codes", () => {
  it("are 6 digits and stored only as an HMAC", () => {
    for (let i = 0; i < 50; i++) expect(newCode()).toMatch(/^\d{6}$/);
    const issued = issueCode(user(), SECRET, T0, "042917");
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;
    expect(JSON.stringify(issued.user)).not.toContain("042917");
    expect(issued.user.verification?.codeHash).toBe(
      hashCode("ada@example.com", "042917", SECRET),
    );
    expect(issued.user.verification?.expiresAt).toBe(
      new Date(T0 + CODE_TTL_MS).toISOString(),
    );
  });

  it("the right code verifies and clears the pending code", () => {
    const issued = issueCode(user(), SECRET, T0, "123456");
    if (!issued.ok) throw new Error("not issued");
    const result = checkCode(issued.user, " 123 456 ", SECRET, T0 + 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.emailVerified).toBe(true);
    expect(result.user.verification).toBeUndefined();
  });

  it("a code expires after 10 minutes", () => {
    const issued = issueCode(user(), SECRET, T0, "123456");
    if (!issued.ok) throw new Error("not issued");
    const result = checkCode(issued.user, "123456", SECRET, T0 + CODE_TTL_MS);
    expect(result).toMatchObject({ ok: false, reason: "expired" });
  });

  it(`wrong codes count down, and the ${MAX_CODE_TRIES}th locks the code (even the right one)`, () => {
    const issued = issueCode(user(), SECRET, T0, "123456");
    if (!issued.ok) throw new Error("not issued");
    let u = issued.user;
    for (let i = 1; i <= MAX_CODE_TRIES; i++) {
      const r = checkCode(u, "000000", SECRET, T0);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.triesLeft).toBe(MAX_CODE_TRIES - i);
      expect(r.reason).toBe(i === MAX_CODE_TRIES ? "locked" : "wrong");
      u = r.user;
    }
    expect(checkCode(u, "123456", SECRET, T0)).toMatchObject({
      ok: false,
      reason: "locked",
    });
  });

  it("rejects non-numeric input and accounts with no pending code", () => {
    const issued = issueCode(user(), SECRET, T0, "123456");
    if (!issued.ok) throw new Error("not issued");
    expect(checkCode(issued.user, "12345a", SECRET, T0)).toMatchObject({
      ok: false,
      reason: "wrong",
    });
    expect(checkCode(user(), "123456", SECRET, T0)).toMatchObject({
      ok: false,
      reason: "none",
    });
  });

  it("explains every failure", () => {
    expect(checkFailureMessage("wrong", 1)).toContain("1 try left");
    expect(checkFailureMessage("wrong", 3)).toContain("3 tries left");
    expect(checkFailureMessage("expired", 0)).toContain("expired");
    expect(checkFailureMessage("locked", 0)).toContain("new code");
    expect(checkFailureMessage("none", 0)).toContain("new code");
  });
});

describe("resend limits", () => {
  it("allow 1 per minute", () => {
    const first = issueCode(user(), SECRET, T0);
    if (!first.ok) throw new Error("not issued");
    const tooSoon = issueCode(first.user, SECRET, T0 + 30_000);
    expect(tooSoon).toEqual({ ok: false, retryAfterSeconds: 30 });
    expect(issueCode(first.user, SECRET, T0 + RESEND_GAP_MS).ok).toBe(true);
  });

  it(`allow ${MAX_SENDS_PER_HOUR} per hour, then wait for the oldest to age out`, () => {
    let u = user();
    for (let i = 0; i < MAX_SENDS_PER_HOUR; i++) {
      const r = issueCode(u, SECRET, T0 + i * 2 * RESEND_GAP_MS);
      if (!r.ok) throw new Error(`send ${i} refused`);
      u = r.user;
    }
    const sixth = issueCode(u, SECRET, T0 + 11 * RESEND_GAP_MS);
    expect(sixth.ok).toBe(false);
    expect(issueCode(u, SECRET, T0 + 60 * 60 * 1000 + 1).ok).toBe(true);
  });
});

describe("isVerified (grandfathering)", () => {
  it("accounts from before T-147 (no flag) count as verified", () => {
    const { emailVerified: _drop, ...legacy } = user();
    void _drop;
    expect(isVerified(legacy)).toBe(true);
    expect(isVerified(user({ emailVerified: true }))).toBe(true);
    expect(isVerified(user({ emailVerified: false }))).toBe(false);
  });
});

describe("revealCodeForTests", () => {
  const req = (header?: string) =>
    new Request("http://x/api/auth/register", {
      headers: header ? { "x-e2e-verify-secret": header } : {},
    });
  const secret = "e2e-verify-secret-0123456789abcdef";

  it("only with a matching header and a long enough env secret", () => {
    expect(revealCodeForTests(req(secret), { E2E_VERIFY_SECRET: secret })).toBe(
      true,
    );
    expect(revealCodeForTests(req("nope"), { E2E_VERIFY_SECRET: secret })).toBe(
      false,
    );
    expect(revealCodeForTests(req(), { E2E_VERIFY_SECRET: secret })).toBe(
      false,
    );
    expect(revealCodeForTests(req(secret), {})).toBe(false);
    expect(
      revealCodeForTests(req("short"), { E2E_VERIFY_SECRET: "short" }),
    ).toBe(false);
  });
});
