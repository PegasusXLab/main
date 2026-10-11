import { NextResponse } from "next/server";
import { requireSecret, userWithStatus } from "@/lib/auth/http";
import { readSessionCookie, verifySession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";

// T-119: console-noise-free login-state read for the client.
// `/api/auth/me` keeps its 401 contract (tests rely on it); this route answers
// 200 with `{ user | null }` so a logged-out visit logs zero console errors.
export async function GET(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const userId = verifySession(readSessionCookie(request), config.secret);
  const user = userId ? await findUserById(userId) : null;

  return NextResponse.json(
    { user: user ? await userWithStatus(user) : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
