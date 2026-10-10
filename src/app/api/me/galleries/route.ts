import { NextResponse } from "next/server";
import { jsonError, requireSecret } from "@/lib/auth/http";
import { readSessionCookie, verifySession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import { listUserGalleries } from "@/lib/auth/ownership";

export async function GET(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const token = readSessionCookie(request);
  const userId = verifySession(token, config.secret);
  if (!userId) {
    return jsonError(401, "Not logged in");
  }

  const user = await findUserById(userId);
  if (!user) {
    return jsonError(401, "Not logged in");
  }

  const galleries = await listUserGalleries(userId);
  return NextResponse.json(
    { galleries },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
