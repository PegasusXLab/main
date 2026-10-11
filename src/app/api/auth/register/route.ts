import { NextResponse } from "next/server";
import {
  clientIp,
  jsonError,
  rateLimited,
  readJsonObject,
  requireSecret,
} from "@/lib/auth/http";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  verifyPassword,
} from "@/lib/auth/password";
import { issueAndSend } from "@/lib/auth/pending";
import { revealCodeForTests } from "@/lib/auth/verify";
import {
  cleanName,
  createUser,
  findUserByEmail,
  isValidEmail,
  isVerified,
  normalizeEmail,
} from "@/lib/auth/users";
import { mailerFromEnv } from "@/lib/email/send";

const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 10 * 60 * 1000;

// T-147: register creates an UNVERIFIED account, emails a 6-digit code and answers 202 with no
// session; POST /api/auth/verify finishes sign-up.
export async function POST(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Invalid request body");

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Honeypot: a hidden field people never fill. Bots get the normal answer, nothing is created.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json(
      { needsVerification: true, email },
      { status: 202 },
    );
  }

  if (!isValidEmail(email))
    return jsonError(400, "Enter a valid email address");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return jsonError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return jsonError(400, "Password is too long");
  }

  const mailer = mailerFromEnv();
  if (!mailer) return jsonError(503, "Email is not set up yet");

  // Only well-formed sign-ups count, so typos in the form never lock a person out.
  if (
    !revealCodeForTests(request) &&
    rateLimited(
      `register|${clientIp(request)}`,
      REGISTER_LIMIT,
      REGISTER_WINDOW_MS,
    )
  ) {
    return jsonError(429, "Too many sign-ups from here. Try again later.");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    // Signing up again before verifying (same password) just sends a fresh code.
    if (
      !isVerified(existing) &&
      (await verifyPassword(password, existing.passwordHash))
    ) {
      return issueAndSend(request, existing, config.secret, mailer);
    }
    return jsonError(409, "An account with this email already exists");
  }

  const user = await createUser({
    email,
    password,
    name: cleanName(body.name),
    emailVerified: false,
  });
  if (!user) return jsonError(409, "An account with this email already exists");
  return issueAndSend(request, user, config.secret, mailer);
}
