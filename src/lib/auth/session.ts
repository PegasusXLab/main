import crypto from "node:crypto";

export const SESSION_COOKIE = "gv_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const DEV_FALLBACK_SECRET =
  "dev-only-insecure-auth-secret-never-use-in-production";

type Env = Record<string, string | undefined>;

/**
 * The HMAC secret: AUTH_SECRET, or a dev-only fallback outside production.
 * Returns null in production without AUTH_SECRET, so the auth routes answer 503.
 */
export function getAuthSecret(env: Env = process.env): string | null {
  const secret = env.AUTH_SECRET?.trim();
  if (secret) return secret;
  return env.NODE_ENV === "production" ? null : DEV_FALLBACK_SECRET;
}

interface SessionPayload {
  userId: string;
  exp: number;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function signSession(
  userId: string,
  secret: string,
  nowMs: number = Date.now(),
): string {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, secret)}`;
}

/** Returns the user id for a valid, unexpired token signed with `secret`, else null. */
export function verifySession(
  token: string | undefined,
  secret: string,
  nowMs: number = Date.now(),
): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expected = Buffer.from(sign(data, secret));
  const actual = Buffer.from(signature);
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp <= Math.floor(nowMs / 1000)) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(env: Env = process.env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function readSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return undefined;
}
