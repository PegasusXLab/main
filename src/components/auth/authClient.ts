// Client-side helpers for the T-100 auth API (POST /api/auth/{register,login,logout}, GET /api/auth/me).
// The session cookie (`gv_session`) is HttpOnly and is sent automatically on same-origin requests,
// so login state is read via GET /api/auth/me (inbox, builder-3).

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  isNew?: boolean;
}

export interface AuthResult {
  user?: AuthUser;
  status?: number;
  error?: string;
  /** T-147: the account exists but needs the emailed code (register 202, login 403, …). */
  needsVerification?: { email: string };
  /** Seconds until another code can be sent (429 on resend). */
  retryAfter?: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
  /** Honeypot (T-147): hidden from people, so only bots fill it. */
  website?: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Human messages for statuses the server doesn't always explain in the body (T-100 contract). */
const SERVER_MESSAGES: Record<number, string> = {
  400: "Check your details and try again.",
  401: "Email or password is incorrect.",
  403: "Verify your email first.",
  409: "An account with this email already exists.",
  429: "Too many attempts. Wait a minute and try again.",
  502: "We couldn't send the code. Try again in a minute.",
  503: "Accounts are not configured yet. Try again shortly.",
};

function messageFrom(status: number | undefined, fallback: string): string {
  if (status !== undefined && SERVER_MESSAGES[status]) {
    return SERVER_MESSAGES[status];
  }
  return fallback;
}

async function postAuth(
  path: string,
  body: Record<string, unknown>,
): Promise<AuthResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as {
      id?: string;
      email?: string;
      name?: string | null;
      isNew?: boolean;
      error?: string;
      needsVerification?: boolean;
      retryAfter?: number;
    } | null;
    if (res.ok && data && typeof data.id === "string") {
      return {
        user: {
          id: data.id,
          email: data.email ?? "",
          name: data.name ?? null,
          ...(typeof data.isNew === "boolean" ? { isNew: data.isNew } : {}),
        },
      };
    }
    if (data?.needsVerification && typeof data.email === "string") {
      return {
        status: res.status,
        needsVerification: { email: data.email },
        ...(typeof data.retryAfter === "number"
          ? { retryAfter: data.retryAfter }
          : {}),
        ...(res.ok ? {} : { error: data.error ?? messageFrom(res.status, "") }),
      };
    }
    return {
      status: res.status,
      error:
        (data && typeof data.error === "string" && data.error) ||
        messageFrom(res.status, "Something went wrong. Please try again."),
    };
  } catch {
    return {
      error: "Could not reach the server. Check your connection and try again.",
    };
  }
}

export function registerUser(c: AuthCredentials): Promise<AuthResult> {
  const body: AuthCredentials = { email: c.email, password: c.password };
  if (c.name !== undefined && c.name.trim() !== "") body.name = c.name.trim();
  if (c.website) body.website = c.website;
  return postAuth("/api/auth/register", { ...body });
}

/** T-147: finish sign-up with the emailed code; signs in on success. */
export function verifyEmail(email: string, code: string): Promise<AuthResult> {
  return postAuth("/api/auth/verify", { email, code });
}

/** T-147: email a new code (the server allows 1 per minute, 5 per hour). */
export function resendCode(email: string): Promise<AuthResult> {
  return postAuth("/api/auth/verify/resend", { email });
}

export function loginUser(c: AuthCredentials): Promise<AuthResult> {
  return postAuth("/api/auth/login", {
    email: c.email,
    password: c.password,
  });
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // A failed logout isn't fatal; the UI simply stays signed in.
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as {
      user?: AuthUser | null;
    } | null;
    const user = data && data.user;
    return user && typeof user.id === "string" ? user : null;
  } catch {
    return null;
  }
}

export interface UserGallery {
  id: string;
  title: string;
  createdAt: string;
  editUrl: string;
  viewUrl?: string;
}

export type MyGalleriesResult =
  { galleries: UserGallery[] } | { error: string };

/** The caller's own published galleries (T-102), newest first. 401 when logged out. */
export async function listMyGalleries(): Promise<MyGalleriesResult> {
  try {
    const res = await fetch("/api/me/galleries", { cache: "no-store" });
    if (!res.ok) return { error: "Could not load your galleries." };
    const data = (await res.json().catch(() => null)) as {
      galleries?: UserGallery[];
    } | null;
    const galleries =
      data && Array.isArray(data.galleries) ? data.galleries : [];
    return { galleries };
  } catch {
    return { error: "Could not load your galleries." };
  }
}

/** Returning creators keep their workspace; only new creators start a blank gallery. */
export function authDestination(
  user: AuthUser,
): "/edit/local" | "/#your-galleries-heading" {
  return user.isNew === false ? "/#your-galleries-heading" : "/edit/local";
}
