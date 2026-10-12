import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sampleGallery from "@/fixtures/sample-3room.json";
import { getStorage } from "@/lib/storage";
import { POST as publish } from "../../route";
import { GET, POST } from "./route";

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  return { ...actual, getStorage: vi.fn(actual.getStorage) };
});

const withBook = {
  ...sampleGallery,
  objects: [
    {
      id: "book",
      roomId: sampleGallery.entranceRoomId,
      position: { x: 1, y: 1 },
      rotation: 0,
      height: 0.78,
      plinth: { shape: "none", height: 0 },
      source: { kind: "library", libraryId: "table-side" },
      title: "Guestbook",
      artist: "",
      story: "",
      device: { kind: "guestbook" },
    },
  ],
};

async function create(gallery: unknown): Promise<string> {
  const res = await publish(
    new Request("http://localhost/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gallery),
    }),
  );
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

const sign = (id: string, body: unknown, ip = "1.2.3.4") =>
  POST(
    new Request(`http://localhost/api/galleries/${id}/guestbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
const read = (id: string) => GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });

describe("guestbook API", () => {
  let dataDir: string;
  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-guestbook-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("signs, lists newest first, and cleans the text", async () => {
    const id = await create(withBook);
    expect((await sign(id, { name: "  Ada  ", message: "Loved\u0007 it" })).status).toBe(201);
    expect((await sign(id, { name: "Bo", message: "Second" }, "5.6.7.8")).status).toBe(201);
    const { entries } = (await (await read(id)).json()) as { entries: { name: string; message: string }[] };
    expect(entries.map((e) => e.name)).toEqual(["Bo", "Ada"]);
    expect(entries[1].message).toBe("Loved it");
  });

  it("refuses empty signatures, repeat signing too fast, and galleries without a book", async () => {
    const id = await create(withBook);
    expect((await sign(id, { name: "", message: "hi" })).status).toBe(400);
    expect((await sign(id, { name: "A", message: "one" }, "9.9.9.9")).status).toBe(201);
    expect((await sign(id, { name: "A", message: "two" }, "9.9.9.9")).status).toBe(429);
    const plain = await create(sampleGallery);
    expect((await sign(plain, { name: "A", message: "hi" }, "8.8.8.8")).status).toBe(403);
    expect((await sign("nope", { name: "A", message: "hi" }, "7.7.7.7")).status).toBe(404);
  });

  it("answers with JSON 503 when storage fails, and lets the visitor retry", async () => {
    const id = await create(withBook);
    const broken = { getObject: () => Promise.reject(new Error("down")), putObject: () => Promise.reject(new Error("down")) };
    vi.mocked(getStorage).mockReturnValueOnce(broken as unknown as ReturnType<typeof getStorage>);
    const res = await sign(id, { name: "A", message: "hi" }, "6.6.6.6");
    expect(res.status).toBe(503);
    expect(await res.json()).toHaveProperty("error");
    vi.mocked(getStorage).mockReturnValueOnce(broken as unknown as ReturnType<typeof getStorage>);
    expect((await read(id)).status).toBe(503);
    expect((await sign(id, { name: "A", message: "hi" }, "6.6.6.6")).status).toBe(201);
  });

  it("keeps both signatures when another write lands in between", async () => {
    const id = await create(withBook);
    const real = getStorage();
    let raced = false;
    const racing = {
      ...real,
      getObject: real.getObject.bind(real),
      publicUrl: real.publicUrl.bind(real),
      putObject: async (...args: Parameters<typeof real.putObject>) => {
        await real.putObject(...args);
        if (raced) return;
        raced = true;
        // A concurrent signer read the book before our write and saves after it.
        const other = { id: "other", name: "Bo", message: "Me too", at: new Date().toISOString() };
        await real.putObject(args[0], Buffer.from(JSON.stringify({ entries: [other] })), "application/json");
      },
    };
    vi.mocked(getStorage).mockReturnValue(racing as unknown as ReturnType<typeof getStorage>);
    try {
      expect((await sign(id, { name: "Ada", message: "First" }, "4.4.4.4")).status).toBe(201);
    } finally {
      vi.mocked(getStorage).mockReset(); // back to the real getStorage
    }
    const { entries } = (await (await read(id)).json()) as { entries: { name: string }[] };
    expect(entries.map((e) => e.name).sort()).toEqual(["Ada", "Bo"]);
  });

  it("refuses a repeated signature and a burst, durably (from the stored book)", async () => {
    const id = await create(withBook);
    expect((await sign(id, { name: "Ada", message: "Hi" }, "3.3.3.1")).status).toBe(201);
    expect((await sign(id, { name: "ada", message: "Hi" }, "3.3.3.2")).status).toBe(409);
    const at = new Date().toISOString();
    const busy = Array.from({ length: 20 }, (_, i) => ({ id: `b${i}`, name: `n${i}`, message: "m", at }));
    await getStorage().putObject(`guestbooks/${id}.json`, Buffer.from(JSON.stringify({ entries: busy })), "application/json");
    expect((await sign(id, { name: "Cy", message: "Late" }, "3.3.3.3")).status).toBe(429);
  });
});
