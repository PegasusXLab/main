import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { LocalStorage } from "./local";

describe("LocalStorage", () => {
  let tempDir: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-storage-test-"));
    storage = new LocalStorage(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("performs round trip putObject and getObject", async () => {
    const data = new TextEncoder().encode("hello world");
    await storage.putObject("test.txt", data, "text/plain");

    const result = await storage.getObject("test.txt");
    expect(result).not.toBeNull();
    expect(result?.contentType).toBe("text/plain");
    expect(result?.public).toBe(false);
    expect(new TextDecoder().decode(result?.bytes)).toBe("hello world");
  });

  it("returns null when key is missing", async () => {
    const result = await storage.getObject("nonexistent.txt");
    expect(result).toBeNull();
  });

  it("stores and retrieves public flag properly", async () => {
    const publicData = new TextEncoder().encode("public image");
    await storage.putObject("images/pic.webp", publicData, "image/webp", {
      public: true,
    });

    const publicResult = await storage.getObject("images/pic.webp");
    expect(publicResult?.public).toBe(true);
    expect(publicResult?.contentType).toBe("image/webp");

    const privateData = new TextEncoder().encode("private doc");
    await storage.putObject(
      "docs/secret.json",
      privateData,
      "application/json",
      {
        public: false,
      },
    );

    const privateResult = await storage.getObject("docs/secret.json");
    expect(privateResult?.public).toBe(false);
  });

  it("formats publicUrl correctly", () => {
    expect(storage.publicUrl("images/test.webp")).toBe(
      "/api/files/images/test.webp",
    );
    expect(storage.publicUrl("/images/test.webp")).toBe(
      "/api/files/images/test.webp",
    );
  });

  it("refuses path traversal in putObject", async () => {
    const data = new TextEncoder().encode("bad");
    await expect(
      storage.putObject("../escape.txt", data, "text/plain"),
    ).rejects.toThrow(/path traversal refused/);
    await expect(
      storage.putObject("sub/../../escape.txt", data, "text/plain"),
    ).rejects.toThrow(/path traversal refused/);
    await expect(
      storage.putObject("%2e%2e/escape.txt", data, "text/plain"),
    ).rejects.toThrow(/path traversal refused/);
    await expect(
      storage.putObject("test\0escape.txt", data, "text/plain"),
    ).rejects.toThrow(/path traversal refused/);
  });

  it("refuses path traversal in getObject", async () => {
    await expect(storage.getObject("../escape.txt")).rejects.toThrow(
      /path traversal refused/,
    );
    await expect(storage.getObject("sub/../../escape.txt")).rejects.toThrow(
      /path traversal refused/,
    );
    await expect(storage.getObject("%2e%2e/escape.txt")).rejects.toThrow(
      /path traversal refused/,
    );
    await expect(storage.getObject("test\0escape.txt")).rejects.toThrow(
      /path traversal refused/,
    );
  });
});
