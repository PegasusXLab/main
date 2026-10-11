import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resetAttemptsForTests } from "@/lib/auth/http";
import { userKey } from "@/lib/auth/users";
import { POST as register } from "./register/route";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";
import { POST as verify } from "./verify/route";
import { GET as me } from "./me/route";
import { GET as getFile } from "../files/[...key]/route";

const BASE = "http://localhost:3000/api/auth";
const E2E_SECRET = "e2e-verify-secret-0123456789abcdef";

/** Register (T-147: 202 + emailed code), then verify with the code the test header reveals. */
async function registerVerified(body: Record<string, unknown>) {
  const reg = await register(
    post(`${BASE}/register`, body, { "x-e2e-verify-secret": E2E_SECRET }),
  );
  const { email, testCode } = await reg.json();
  return verify(post(`${BASE}/verify`, { email, code: testCode }));
}

function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function sessionFrom(res: Response): string {
  const header = res.headers.get("set-cookie") ?? "";
  const match = header.match(/gv_session=([^;]*)/);
  return match ? match[1] : "";
}

function meWith(token: string) {
  return me(
    new Request(`${BASE}/me`, { headers: { cookie: `gv_session=${token}` } }),
  );
}

describe("auth routes", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-auth-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
    vi.stubEnv("AUTH_SECRET", "test-secret-0123456789abcdef0123456789");
    vi.stubEnv("E2E_VERIFY_SECRET", E2E_SECRET);
    vi.spyOn(console, "info").mockImplementation(() => {});
    resetAttemptsForTests();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("registers (no session until the emailed code), verifies, sets the session cookie, and /me returns the user", async () => {
    const reg = await register(
      post(
        `${BASE}/register`,
        { email: "  Ada@Example.COM ", password: "longenough", name: " Ada " },
        { "x-e2e-verify-secret": E2E_SECRET },
      ),
    );
    expect(reg.status).toBe(202);
    const pending = await reg.json();
    expect(pending).toEqual({
      needsVerification: true,
      email: "ada@example.com",
      testCode: expect.stringMatching(/^\d{6}$/),
    });
    expect(reg.headers.get("set-cookie")).toBeNull();

    // Without the secret header the code is never in the response.
    const other = await register(
      post(`${BASE}/register`, {
        email: "bo@example.com",
        password: "longenough",
      }),
    );
    expect(await other.json()).toEqual({
      needsVerification: true,
      email: "bo@example.com",
    });

    const res = await verify(
      post(`${BASE}/verify`, {
        email: "ada@example.com",
        code: pending.testCode,
      }),
    );
    expect(res.status).toBe(200);
    const { isNew, ...user } = await res.json();
    expect(isNew).toBe(true);
    expect(user).toEqual({
      id: expect.any(String),
      email: "ada@example.com",
      name: "Ada",
    });
    expect(JSON.stringify(user)).not.toMatch(/hash|password|code/i);

    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/gv_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);

    const meRes = await meWith(sessionFrom(res));
    expect(meRes.status).toBe(200);
    expect(await meRes.json()).toEqual({ ...user, isNew: true });
  });

  it("stores the user privately and /api/files never serves it", async () => {
    await register(
      post(`${BASE}/register`, {
        email: "ada@example.com",
        password: "longenough",
      }),
    );
    const stored = await fs.readFile(
      path.join(dataDir, userKey("ada@example.com")),
      "utf8",
    );
    expect(stored).not.toContain("longenough");
    const meta = JSON.parse(
      await fs.readFile(
        path.join(dataDir, `${userKey("ada@example.com")}.meta.json`),
        "utf8",
      ),
    );
    expect(meta.public).toBe(false);

    const segments = userKey("ada@example.com").split("/");
    const fileRes = await getFile(
      new Request("http://localhost:3000/api/files/x"),
      {
        params: Promise.resolve({ key: segments }),
      },
    );
    expect(fileRes.status).toBe(404);
  });

  it("rejects bad input and duplicate emails", async () => {
    expect(
      (
        await register(
          post(`${BASE}/register`, { email: "nope", password: "longenough" }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await register(
          post(`${BASE}/register`, { email: "a@b.co", password: "short" }),
        )
      ).status,
    ).toBe(400);
    expect((await register(post(`${BASE}/register`, "not json"))).status).toBe(
      400,
    );

    await register(
      post(`${BASE}/register`, { email: "a@b.co", password: "longenough" }),
    );
    const dup = await register(
      post(`${BASE}/register`, { email: "A@B.CO", password: "different1" }),
    );
    expect(dup.status).toBe(409);
    expect(await dup.json()).toEqual({
      error: "An account with this email already exists",
    });
  });

  it("logs in, and gives the same 401 for a wrong password or unknown email", async () => {
    await registerVerified({
      email: "ada@example.com",
      password: "longenough",
    });

    const ok = await login(
      post(`${BASE}/login`, {
        email: "ADA@example.com",
        password: "longenough",
      }),
    );
    expect(ok.status).toBe(200);
    expect((await ok.json()).email).toBe("ada@example.com");
    expect(sessionFrom(ok)).not.toBe("");

    const wrongPassword = await login(
      post(`${BASE}/login`, {
        email: "ada@example.com",
        password: "wrongpass",
      }),
    );
    const unknownEmail = await login(
      post(`${BASE}/login`, {
        email: "who@example.com",
        password: "longenough",
      }),
    );
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    const a = await wrongPassword.json();
    expect(a).toEqual({ error: "Email or password is incorrect" });
    expect(await unknownEmail.json()).toEqual(a);
    expect(wrongPassword.headers.get("set-cookie")).toBeNull();
  });

  it("limits login attempts per email + IP with 429", async () => {
    const attempt = () =>
      login(
        post(
          `${BASE}/login`,
          { email: "x@y.co", password: "whatever1" },
          { "x-forwarded-for": "1.2.3.4" },
        ),
      );
    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
    const otherIp = await login(
      post(
        `${BASE}/login`,
        { email: "x@y.co", password: "whatever1" },
        { "x-forwarded-for": "5.6.7.8" },
      ),
    );
    expect(otherIp.status).toBe(401);
  });

  it("logout clears the cookie; /me is 401 without a valid session", async () => {
    const res = await logout();
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/gv_session=;.*Max-Age=0/i);

    expect((await me(new Request(`${BASE}/me`))).status).toBe(401);
    expect((await meWith("garbage.token")).status).toBe(401);
  });

  it("answers 503 in production without AUTH_SECRET", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    const res = await login(
      post(`${BASE}/login`, { email: "a@b.co", password: "longenough" }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Accounts not configured" });
    expect(
      (
        await register(
          post(`${BASE}/register`, { email: "a@b.co", password: "longenough" }),
        )
      ).status,
    ).toBe(503);
    expect((await me(new Request(`${BASE}/me`))).status).toBe(503);
  });
});
