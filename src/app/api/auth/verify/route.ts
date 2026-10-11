import { NextResponse } from "next/server";
import {
  clientIp,
  jsonError,
  readJsonObject,
  requireSecret,
  tooManyAttempts,
  userWithStatus,
  withSession,
} from "@/lib/auth/http";
import { checkCode, checkFailureMessage } from "@/lib/auth/verify";
import {
  findUserByEmail,
  isVerified,
  normalizeEmail,
  recordLogin,
  saveUser,
} from "@/lib/auth/users";

// T-147: the emailed code finishes sign-up: the account is marked verified and signed in.
export async function POST(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Invalid request body");
  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const code = typeof body.code === "string" ? body.code : "";

  if (tooManyAttempts(`verify|${email}|${clientIp(request)}`)) {
    return jsonError(429, "Too many attempts. Try again in a minute.");
  }

  const user = email ? await findUserByEmail(email) : null;
  if (!user) {
    return jsonError(400, checkFailureMessage("none", 0));
  }
  if (isVerified(user)) {
    return jsonError(400, "This email is already verified. Log in instead.");
  }

  const result = checkCode(user, code, config.secret);
  if (!result.ok) {
    if (result.user !== user) await saveUser(result.user);
    return NextResponse.json(
      {
        error: checkFailureMessage(result.reason, result.triesLeft),
        reason: result.reason,
        triesLeft: result.triesLeft,
      },
      { status: 400 },
    );
  }

  const verified = await recordLogin(await saveUser(result.user));
  const publicUser = await userWithStatus(verified);
  return withSession(NextResponse.json(publicUser), publicUser, config.secret);
}
