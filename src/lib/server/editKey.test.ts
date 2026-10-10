import { describe, it, expect } from "vitest";
import { generateEditKey, hashEditKey, verifyEditKey } from "./editKey";

describe("editKey utilities", () => {
  it("generates unique random edit keys", () => {
    const key1 = generateEditKey();
    const key2 = generateEditKey();
    expect(key1).toBeTypeOf("string");
    expect(key1.length).toBeGreaterThan(16);
    expect(key1).not.toBe(key2);
  });

  it("correctly hashes and verifies a valid edit key", async () => {
    const key = generateEditKey();
    const hash = await hashEditKey(key);

    expect(hash).toContain(":");
    const [salt, hex] = hash.split(":");
    expect(salt).toBeDefined();
    expect(hex).toBeDefined();

    const isMatch = await verifyEditKey(key, hash);
    expect(isMatch).toBe(true);
  });

  it("rejects an invalid edit key in constant time", async () => {
    const key = generateEditKey();
    const hash = await hashEditKey(key);

    const isMatch = await verifyEditKey("wrong-key-value", hash);
    expect(isMatch).toBe(false);
  });

  it("handles empty or malformed keys and hashes safely", async () => {
    expect(await verifyEditKey("", "salt:hash")).toBe(false);
    expect(await verifyEditKey("key", "")).toBe(false);
    expect(await verifyEditKey("key", "malformed-no-colon")).toBe(false);
    expect(await verifyEditKey("key", "salt:")).toBe(false);
  });
});
