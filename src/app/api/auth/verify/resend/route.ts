import { NextResponse } from "next/server";
import {
  clientIp,
  jsonError,
  readJsonObject,
  requireSecret,
  tooManyAttempts,
} from "@/lib/auth/http";
import { issueAndSend } from "@/lib/auth/pending";
import { findUserByEmail, isVerified, normalizeEmail } from "@/lib/auth/users";
import { mailerFromEnv } from "@/lib/email/send";

// T-147: send a new code (1 per minute, 5 per hour per account). Unknown or already verified
// emails get the same 202 and nothing is sent, so the answer doesn't reveal who has an account.
export async function POST(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Invalid request body");
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";

  if (tooManyAttempts(`resend|${clientIp(request)}`)) {
    return jsonError(429, "Too many attempts. Try again in a minute.");
  }

  const mailer = mailerFromEnv();
  if (!mailer) return jsonError(503, "Email is not set up yet");

  const user = email ? await findUserByEmail(email) : null;
  if (!user || isVerified(user)) {
    return NextResponse.json(
      { needsVerification: true, email },
      { status: 202 },
    );
  }
  return issueAndSend(request, user, config.secret, mailer);
}
