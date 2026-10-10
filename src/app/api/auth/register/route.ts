import { NextResponse } from "next/server";
import {
  jsonError,
  readJsonObject,
  requireSecret,
  withSession,
} from "@/lib/auth/http";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import {
  cleanName,
  createUser,
  isValidEmail,
  normalizeEmail,
  toPublicUser,
} from "@/lib/auth/users";

export async function POST(request: Request) {
  const config = requireSecret();
  if ("response" in config) return config.response;

  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Invalid request body");

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
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

  const user = await createUser({
    email,
    password,
    name: cleanName(body.name),
  });
  if (!user) return jsonError(409, "An account with this email already exists");

  const publicUser = toPublicUser(user);
  return withSession(
    NextResponse.json(publicUser, { status: 201 }),
    publicUser,
    config.secret,
  );
}
