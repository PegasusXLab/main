import { describe, expect, it } from "vitest";
import {
  getAuthSecret,
  readSessionCookie,
  sessionCookieOptions,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
} from "./session";
import { hashPassword, verifyPassword } from "./password";

const SECRET = "test-secret-0123456789abcdef0123456789";
const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);

describe("session token", () => {
  it("round-trips a signed user id", () => {
    const token = signSession("user-1", SECRET, NOW);
    expect(verifySession(token, SECRET, NOW)).toBe("user-1");
  });

  it("rejects a tampered payload or signature", () => {
    const token = signSession("user-1", SECRET, NOW);
    const [data, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ userId: "admin", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, SECRET, NOW)).toBeNull();
    expect(
      verifySession(`${data}.${sig.slice(0, -2)}xx`, SECRET, NOW),
    ).toBeNull();
    expect(verifySession(`${data}`, SECRET, NOW)).toBeNull();
    expect(verifySession("", SECRET, NOW)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = signSession("user-1", "another-secret", NOW);
    expect(verifySession(token, SECRET, NOW)).toBeNull();
  });

  it("expires after 7 days", () => {
    const token = signSession("user-1", SECRET, NOW);
    const justBefore = NOW + (SESSION_TTL_SECONDS - 1) * 1000;
    const atExpiry = NOW + SESSION_TTL_SECONDS * 1000;
    expect(verifySession(token, SECRET, justBefore)).toBe("user-1");
    expect(verifySession(token, SECRET, atExpiry)).toBeNull();
  });
});

describe("auth secret and cookie flags", () => {
  it("uses AUTH_SECRET, a dev fallback in development, and null in production", () => {
    expect(
      getAuthSecret({ AUTH_SECRET: " s3cret ", NODE_ENV: "production" }),
    ).toBe("s3cret");
    expect(getAuthSecret({ NODE_ENV: "development" })).toMatch(/dev-only/);
    expect(getAuthSecret({ NODE_ENV: "production" })).toBeNull();
    expect(
      getAuthSecret({ AUTH_SECRET: "  ", NODE_ENV: "production" }),
    ).toBeNull();
  });

  it("is HttpOnly, SameSite=Lax, 7 days, and Secure only in production", () => {
    expect(sessionCookieOptions({ NODE_ENV: "production" })).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    expect(sessionCookieOptions({ NODE_ENV: "development" }).secure).toBe(
      false,
    );
  });

  it("reads gv_session from the Cookie header", () => {
    const req = new Request("http://x", {
      headers: { cookie: "a=1; gv_session=abc.def; b=2" },
    });
    expect(readSessionCookie(req)).toBe("abc.def");
    expect(readSessionCookie(new Request("http://x"))).toBeUndefined();
  });
});

describe("password hashing", () => {
  it("salts, verifies, and rejects a wrong password", async () => {
    const a = await hashPassword("correct horse");
    const b = await hashPassword("correct horse");
    expect(a).not.toBe(b);
    expect(a).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", a)).toBe(true);
    expect(await verifyPassword("wrong horse", a)).toBe(false);
  });
});
