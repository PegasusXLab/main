import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { getStorage, type Storage } from "@/lib/storage";
import { hashPassword } from "./password";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  /** T-147: false until the emailed code is entered. Missing = an account from before T-147 (verified). */
  emailVerified?: boolean;
  /** T-147: the pending code (HMAC only), its expiry, wrong tries and recent send times. */
  verification?: PendingVerification;
}

export interface PendingVerification {
  codeHash: string;
  expiresAt: string;
  tries: number;
  sentAt: string[];
}

/** Accounts made before T-147 have no flag and count as verified. */
export function isVerified(user: StoredUser): boolean {
  return user.emailVerified !== false;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_RE.test(email);
}

export function cleanName(name: unknown): string {
  return typeof name === "string" ? name.trim().slice(0, MAX_NAME_LENGTH) : "";
}

/** `users/<sha256(email)>.json`; always written private (never served by /api/files). */
export function userKey(normalizedEmail: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(normalizedEmail)
    .digest("hex");
  return `users/${hash}.json`;
}

// Private pointer so a session's user id can find the email-keyed record.
function idKey(id: string): string {
  return `users/by-id/${id}.json`;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

async function readJson<T>(storage: Storage, key: string): Promise<T | null> {
  const obj = await storage.getObject(key);
  if (!obj) return null;
  return JSON.parse(Buffer.from(obj.bytes).toString("utf8")) as T;
}

async function writePrivateJson(
  storage: Storage,
  key: string,
  value: unknown,
): Promise<void> {
  await storage.putObject(
    key,
    Buffer.from(JSON.stringify(value)),
    "application/json",
    { public: false },
  );
}

export async function findUserByEmail(
  normalizedEmail: string,
  storage: Storage = getStorage(),
): Promise<StoredUser | null> {
  return readJson<StoredUser>(storage, userKey(normalizedEmail));
}

export async function findUserById(
  id: string,
  storage: Storage = getStorage(),
): Promise<StoredUser | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  const pointer = await readJson<{ emailKey: string }>(storage, idKey(id));
  if (!pointer) return null;
  const user = await readJson<StoredUser>(storage, pointer.emailKey);
  return user && user.id === id ? user : null;
}

/** Creates the user, or returns null when the email is already registered. */
export async function createUser(
  input: {
    email: string;
    password: string;
    name: string;
    emailVerified?: boolean;
  },
  storage: Storage = getStorage(),
): Promise<StoredUser | null> {
  const key = userKey(input.email);
  if (await storage.getObject(key)) return null;
  const user: StoredUser = {
    id: nanoid(),
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ...(input.emailVerified === false ? { emailVerified: false } : {}),
  };
  await writePrivateJson(storage, key, user);
  await writePrivateJson(storage, idKey(user.id), { emailKey: key });
  return user;
}

/** Writes the whole record back (same key, still private). Identity and email never change here. */
export async function saveUser(
  user: StoredUser,
  storage: Storage = getStorage(),
): Promise<StoredUser> {
  await writePrivateJson(storage, userKey(user.email), user);
  return user;
}

/** Updates the login timestamp without changing identity, password or owner pointers. */
export async function recordLogin(
  user: StoredUser,
  storage: Storage = getStorage(),
): Promise<StoredUser> {
  const updated = { ...user, lastLoginAt: new Date().toISOString() };
  await writePrivateJson(storage, userKey(user.email), updated);
  return updated;
}
