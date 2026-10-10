import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sampleGallery from "@/fixtures/sample-3room.json";
import { signSession } from "@/lib/auth/session";
import { userGalleriesKey } from "@/lib/auth/ownership";
import { getStorage } from "@/lib/storage";
import { POST } from "../route";
import { PUT } from "./route";

// T-130: PUT is authorized by a valid edit key OR the owner's session; the owner index
// never holds a plain edit key.
const SECRET = "test-secret-0123456789abcdef0123456789";

function jsonRequest(url: string, method: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function publishAs(userId: string | null) {
  const headers: Record<string, string> = {};
  if (userId) headers.cookie = `gv_session=${signSession(userId, SECRET)}`;
  const res = await POST(jsonRequest("http://localhost:3000/api/galleries", "POST", sampleGallery, headers));
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; editKey: string };
}

function putTitle(id: string, title: string, headers: Record<string, string> = {}) {
  return PUT(
    jsonRequest(`http://localhost:3000/api/galleries/${id}`, "PUT", { ...sampleGallery, title }, headers),
    { params: Promise.resolve({ id }) },
  );
}

describe("PUT /api/galleries/[id] authorization (T-130)", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-put-auth-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
    vi.stubEnv("AUTH_SECRET", SECRET);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("lets the owner save with their session and no edit key", async () => {
    const { id } = await publishAs("owner-1");
    const res = await putTitle(id, "Owner Edit", {
      cookie: `gv_session=${signSession("owner-1", SECRET)}`,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Owner Edit");
  });

  it("refuses another logged-in user without a key", async () => {
    const { id } = await publishAs("owner-1");
    const res = await putTitle(id, "Hijack", {
      cookie: `gv_session=${signSession("someone-else", SECRET)}`,
    });
    expect(res.status).toBe(403);
  });

  it("refuses anonymous saves without a key, and with a wrong key", async () => {
    const { id } = await publishAs("owner-1");
    expect((await putTitle(id, "Anon")).status).toBe(403);
    expect((await putTitle(id, "Wrong", { "x-edit-key": "not-the-key" })).status).toBe(403);
  });

  it("keeps the edit-key path working for anyone (unchanged)", async () => {
    const { id, editKey } = await publishAs(null);
    const res = await putTitle(id, "Key Edit", { "x-edit-key": editKey });
    expect(res.status).toBe(200);
  });

  it("never stores the plain edit key in the owner index", async () => {
    const { editKey } = await publishAs("owner-1");
    const obj = await getStorage().getObject(userGalleriesKey("owner-1"));
    const raw = Buffer.from(obj!.bytes).toString("utf8");
    expect(raw).not.toContain(editKey);
    expect(raw).not.toContain("editUrl");
    expect(raw).toContain("editKeyEnc");
  });
});
