import { NextResponse } from "next/server";
import { jsonError, requireSecret } from "@/lib/auth/http";
import { readSessionCookie, verifySession } from "@/lib/auth/session";
import { findUserById, toPublicUser } from "@/lib/auth/users";

export async function GET(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const userId = verifySession(readSessionCookie(request), config.secret);
  const user = userId ? await findUserById(userId) : null;
  if (!user) return jsonError(401, "Not logged in");

  return NextResponse.json(toPublicUser(user), {
    headers: { "Cache-Control": "no-store" },
  });
}
