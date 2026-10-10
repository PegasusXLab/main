import { hashEditKey, verifyEditKey } from "@/lib/server/editKey";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 1024;

/** scrypt with a random 16-byte salt, stored as `salt:hash` (same scheme as edit keys). */
export const hashPassword = hashEditKey;
export const verifyPassword = verifyEditKey;

// Verified against when the email is unknown, so a miss costs the same scrypt time as a hit.
let dummyHash: Promise<string> | undefined;
export function timingDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("timing-dummy-password");
  return dummyHash;
}
