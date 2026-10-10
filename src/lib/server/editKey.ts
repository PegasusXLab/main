import crypto from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Generates a cryptographically random secret edit key.
 */
export function generateEditKey(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Hashes an edit key using scrypt with a random salt.
 * Returns formatted salt:hash string.
 */
export async function hashEditKey(key: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(key, salt, KEY_LENGTH, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a candidate key against a stored scrypt hash in constant time.
 */
export async function verifyEditKey(
  key: string,
  storedHash: string,
): Promise<boolean> {
  if (!key || !storedHash) {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(expectedHex, "hex");
    const computedBuffer = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(key, salt, expectedBuffer.length, (err, derived) => {
        if (err) reject(err);
        else resolve(derived as Buffer);
      });
    });

    if (computedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
