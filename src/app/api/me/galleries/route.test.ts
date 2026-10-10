import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { signSession } from "@/lib/auth/session";
import { createUser } from "@/lib/auth/users";
import { recordGalleryOwner } from "@/lib/auth/ownership";
import { getStorage } from "@/lib/storage";
import { GET as getMyGalleries } from "./route";

const SECRET = "test-secret-0123456789abcdef0123456789";

function requestWithCookie(cookie?: string): Request {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = `gv_session=${cookie}`;
  return new Request("http://localhost:3000/api/me/galleries", { headers });
}

describe("GET /api/me/galleries", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-me-galleries-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
    vi.stubEnv("AUTH_SECRET", SECRET);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("returns 401 when not logged in", async () => {
    const res = await getMyGalleries(requestWithCookie());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Not logged in");
  });

  it("returns 401 with an invalid session token", async () => {
    const res = await getMyGalleries(requestWithCookie("invalid.token"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty galleries list for new user", async () => {
    const user = await createUser({
      email: "artist@example.com",
      password: "password123",
      name: "Artist",
    });
    expect(user).not.toBeNull();

    const token = signSession(user!.id, SECRET);
    const res = await getMyGalleries(requestWithCookie(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ galleries: [] });
  });

  it("returns own galleries newest first", async () => {
    const storage = getStorage();
    const user1 = await createUser({
      email: "user1@example.com",
      password: "password123",
      name: "User One",
    });
    const user2 = await createUser({
      email: "user2@example.com",
      password: "password123",
      name: "User Two",
    });

    // Record user1 galleries
    await recordGalleryOwner(
      {
        userId: user1!.id,
        id: "gal-1",
        title: "User1 First Show",
        createdAt: "2026-10-09T12:00:00Z",
        editUrl: "/edit/gal-1?key=k1",
        viewUrl: "/g/gal-1",
      },
      storage,
    );
    await recordGalleryOwner(
      {
        userId: user1!.id,
        id: "gal-2",
        title: "User1 Second Show",
        createdAt: "2026-10-10T12:00:00Z",
        editUrl: "/edit/gal-2?key=k2",
        viewUrl: "/g/gal-2",
      },
      storage,
    );

    // Record user2 gallery
    await recordGalleryOwner(
      {
        userId: user2!.id,
        id: "gal-other",
        title: "User2 Secret Show",
        createdAt: "2026-10-10T15:00:00Z",
        editUrl: "/edit/gal-other?key=k-secret",
        viewUrl: "/g/gal-other",
      },
      storage,
    );

    // Query as user1
    const token1 = signSession(user1!.id, SECRET);
    const res1 = await getMyGalleries(requestWithCookie(token1));
    expect(res1.status).toBe(200);
    const body1 = await res1.json();

    expect(body1.galleries).toHaveLength(2);
    // Newest first
    expect(body1.galleries[0].id).toBe("gal-2");
    expect(body1.galleries[0].title).toBe("User1 Second Show");
    expect(body1.galleries[1].id).toBe("gal-1");
    expect(body1.galleries[1].title).toBe("User1 First Show");

    // Make sure user2's gallery is NOT in user1's response
    const ids = body1.galleries.map((g: { id: string }) => g.id);
    expect(ids).not.toContain("gal-other");
  });
});
