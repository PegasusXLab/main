import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { LocalStorage } from "@/lib/storage/local";
import {
  createUser,
  findUserById,
  recordLogin,
  toPublicUser,
  userKey,
} from "./users";
import { listUserGalleries } from "./ownership";
import { userWithStatus, withSession } from "./http";
import { POST as logout } from "@/app/api/auth/logout/route";
vi.mock("./ownership", () => ({ listUserGalleries: vi.fn() }));

describe("persistent account metadata", () => {
  let dir: string;
  let storage: LocalStorage;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "galleriverse-t146-"));
    storage = new LocalStorage(dir);
    vi.mocked(listUserGalleries).mockResolvedValue([]);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(dir, { recursive: true, force: true });
  });
  const input = {
    email: "retained@example.com",
    name: "Retained Creator",
    password: "long-password-1",
  };
  it("records registration and login times while keeping legacy identity, password and private ownership pointer", async () => {
    const user = (await createUser(input, storage))!;
    expect(user.lastLoginAt).toBeDefined();
    const legacy = { ...user, createdAt: "2020-01-01T00:00:00.000Z" };
    delete legacy.lastLoginAt;
    await storage.putObject(
      userKey(legacy.email),
      Buffer.from(JSON.stringify(legacy)),
      "application/json",
      { public: false },
    );
    expect(await findUserById(user.id, storage)).toEqual(legacy);
    const updated = await recordLogin(legacy, storage);
    expect(updated).toMatchObject(legacy);
    expect(updated.lastLoginAt).toBeDefined();
    expect(Date.parse(updated.lastLoginAt!)).toBeGreaterThan(
      Date.parse(legacy.createdAt),
    );
    expect(await findUserById(user.id, storage)).toEqual(updated);
    expect((await storage.getObject(userKey(user.email)))!.public).toBe(false);
    expect(toPublicUser(updated)).toEqual({
      id: user.id,
      email: input.email,
      name: input.name,
    });
  });
  it("new status requires a recent account and no galleries", async () => {
    const user = (await createUser(input, storage))!;
    expect((await userWithStatus(user)).isNew).toBe(true);
    expect(
      (
        await userWithStatus({
          ...user,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        })
      ).isNew,
    ).toBe(false);
    vi.mocked(listUserGalleries).mockResolvedValue([
      {
        id: "gallery-1",
        title: "Existing",
        createdAt: user.createdAt,
        editUrl: "/edit/gallery-1",
      },
    ]);
    expect((await userWithStatus(user)).isNew).toBe(false);
    expect(listUserGalleries).toHaveBeenCalledWith(user.id);
  });
  it("register/login and logout share persistent production cookie attributes", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const user = (await createUser(input, storage))!;
    const loginCookie = withSession(
      NextResponse.json({}),
      toPublicUser(user),
      "local-cookie-test-key",
    ).headers.get("set-cookie")!;
    const logoutCookie = (await logout()).headers.get("set-cookie")!;
    for (const cookie of [loginCookie, logoutCookie]) {
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/Secure/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).toMatch(/Path=\//i);
    }
    expect(loginCookie).toMatch(/Max-Age=604800/i);
    expect(logoutCookie).toMatch(/Max-Age=0/i);
  });
});
