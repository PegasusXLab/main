import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "node:fs/promises";
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

describe("GET /api/files/[...key] Route Handler", () => {
  const localDataDir = path.join(process.cwd(), ".data");

  beforeEach(async () => {
    await fs.mkdir(localDataDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(localDataDir, { recursive: true, force: true });
  });

  it("serves public file with 200 and Content-Type", async () => {
    const storage = new LocalStorage();
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
    const storage = new LocalStorage();
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
