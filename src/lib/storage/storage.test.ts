import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getStorage, LocalStorage, VultrStorage } from "./index";
import { GET } from "@/app/api/files/[...key]/route";

describe("Storage Selection (getStorage)", () => {
  it("returns VultrStorage when all four VULTR_S3_* env vars are present", () => {
    const env: Record<string, string | undefined> = {
      VULTR_S3_ENDPOINT: "https://ewr1.vultrobjects.com",
      VULTR_S3_BUCKET: "bucket",
      VULTR_S3_ACCESS_KEY: "key",
      VULTR_S3_SECRET_KEY: "secret",
    };
    const storage = getStorage(env);
    expect(storage).toBeInstanceOf(VultrStorage);
  });

  it("returns LocalStorage when any VULTR_S3_* env var is missing", () => {
    expect(
      getStorage({
        VULTR_S3_ENDPOINT: "https://ewr1.vultrobjects.com",
        VULTR_S3_BUCKET: "bucket",
        VULTR_S3_ACCESS_KEY: "key",
        // VULTR_S3_SECRET_KEY missing
      }),
    ).toBeInstanceOf(LocalStorage);

    expect(
      getStorage({
        VULTR_S3_ENDPOINT: "",
        VULTR_S3_BUCKET: "bucket",
        VULTR_S3_ACCESS_KEY: "key",
        VULTR_S3_SECRET_KEY: "secret",
      }),
    ).toBeInstanceOf(LocalStorage);

    expect(getStorage({})).toBeInstanceOf(LocalStorage);
  });
});

describe("getStorage env handling (T-037)", () => {
  const full = {
    VULTR_S3_ENDPOINT: "https://atl2.vultrobjects.com",
    VULTR_S3_BUCKET: "pegasus",
    VULTR_S3_ACCESS_KEY: "AKIA_EXAMPLE_ACCESS",
    VULTR_S3_SECRET_KEY: "example-secret-value",
  };

  it("trims whitespace-padded values", () => {
    const storage = getStorage({
      VULTR_S3_ENDPOINT: "  https://atl2.vultrobjects.com\n",
      VULTR_S3_BUCKET: " pegasus ",
      VULTR_S3_ACCESS_KEY: "\tAKIA_EXAMPLE_ACCESS ",
      VULTR_S3_SECRET_KEY: " example-secret-value\n",
    });
    expect(storage).toBeInstanceOf(VultrStorage);
    expect(storage.publicUrl("a.webp")).toBe(
      "https://atl2.vultrobjects.com/pegasus/a.webp",
    );
  });

  it("whitespace-only values count as unset (local fallback)", () => {
    expect(getStorage({ ...full, VULTR_S3_SECRET_KEY: "   " })).toBeInstanceOf(
      LocalStorage,
    );
  });

  it("an endpoint without https:// fails fast, naming the variable but not its value", () => {
    for (const endpoint of [
      "atl2.vultrobjects.com",
      "http://atl2.vultrobjects.com",
    ]) {
      let message = "";
      try {
        getStorage({ ...full, VULTR_S3_ENDPOINT: endpoint });
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toMatch(
        /VULTR_S3_ENDPOINT must be a full https:\/\/ URL/,
      );
      expect(message).not.toContain("atl2.vultrobjects.com");
      expect(message).not.toContain(full.VULTR_S3_SECRET_KEY);
    }
  });

  it("uses PEGASUS_DATA_DIR for local storage when set", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-test-"));
    try {
      const storage = getStorage({ PEGASUS_DATA_DIR: dir });
      await storage.putObject(
        "x.txt",
        new TextEncoder().encode("hi"),
        "text/plain",
      );
      expect((await fs.readdir(dir)).length).toBeGreaterThan(0);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

describe("GET /api/files/[...key] Route Handler", () => {
  // Each test gets its own data dir, so parallel test files never share .data/ (T-037).
  let localDataDir: string;

  beforeEach(async () => {
    localDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-test-"));
    process.env.PEGASUS_DATA_DIR = localDataDir;
  });

  afterEach(async () => {
    delete process.env.PEGASUS_DATA_DIR;
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("serves public file with 200 and Content-Type", async () => {
    const storage = new LocalStorage(localDataDir);
    const content = new TextEncoder().encode("webp image bytes");
    await storage.putObject("test-img.webp", content, "image/webp", {
      public: true,
    });

    const response = await GET(
      new Request("http://localhost:3000/api/files/test-img.webp"),
      {
        params: Promise.resolve({ key: ["test-img.webp"] }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    const body = await response.text();
    expect(body).toBe("webp image bytes");
  });

  it("refuses private file with 404", async () => {
    const storage = new LocalStorage(localDataDir);
    const content = new TextEncoder().encode('{"private":"gallery"}');
    await storage.putObject("private.json", content, "application/json", {
      public: false,
    });

    const response = await GET(
      new Request("http://localhost:3000/api/files/private.json"),
      {
        params: Promise.resolve({ key: ["private.json"] }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for missing file", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/files/nonexistent.webp"),
      {
        params: Promise.resolve({ key: ["nonexistent.webp"] }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for .meta.json file", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/files/test.meta.json"),
      {
        params: Promise.resolve({ key: ["test.meta.json"] }),
      },
    );

    expect(response.status).toBe(404);
  });

  it("refuses path traversal with 400", async () => {
    const response1 = await GET(
      new Request("http://localhost:3000/api/files/../secret"),
      {
        params: Promise.resolve({ key: ["..", "secret"] }),
      },
    );
    expect(response1.status).toBe(400);

    const response2 = await GET(
      new Request("http://localhost:3000/api/files/.."),
      {
        params: Promise.resolve({ key: [".."] }),
      },
    );
    expect(response2.status).toBe(400);

    const response3 = await GET(
      new Request("http://localhost:3000/api/files/%2e%2e"),
      {
        params: Promise.resolve({ key: ["%2e%2e"] }),
      },
    );
    expect(response3.status).toBe(400);
  });
});
