import { NextResponse } from "next/server";
import {
  clientIp,
  jsonError,
  readJsonObject,
  requireSecret,
  tooManyAttempts,
  withSession,
} from "@/lib/auth/http";
import {
  MAX_PASSWORD_LENGTH,
  timingDummyHash,
  verifyPassword,
} from "@/lib/auth/password";
import {
  findUserByEmail,
  normalizeEmail,
  toPublicUser,
} from "@/lib/auth/users";

const INCORRECT = "Email or password is incorrect";

export async function POST(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Invalid request body");

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (tooManyAttempts(`${email}|${clientIp(request)}`)) {
    return jsonError(429, "Too many attempts. Try again in a minute.");
  }
  if (!email || !password || password.length > MAX_PASSWORD_LENGTH) {
    return jsonError(401, INCORRECT);
  }

  const user = await findUserByEmail(email);
  // Always run scrypt, so a missing account takes as long as a wrong password.
  const ok = await verifyPassword(
    password,
    user?.passwordHash ?? (await timingDummyHash()),
  );
  if (!user || !ok) return jsonError(401, INCORRECT);

  const publicUser = toPublicUser(user);
  return withSession(NextResponse.json(publicUser), publicUser, config.secret);
}
