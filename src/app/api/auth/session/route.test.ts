import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resetAttemptsForTests } from "@/lib/auth/http";
import { POST as register } from "../register/route";
import { POST as verify } from "../verify/route";
import { GET as session } from "./route";

const BASE = "http://localhost:3000/api/auth";
const E2E_SECRET = "e2e-verify-secret-0123456789abcdef";

describe("GET /api/auth/session", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-session-"));
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

  it("answers 200 with { user: null } when logged out", async () => {
    const res = await session(new Request(`${BASE}/session`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: null });
  });

  it("answers 200 with the user when the session cookie is valid", async () => {
    const reg = await register(
      new Request(`${BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-e2e-verify-secret": E2E_SECRET,
        },
        body: JSON.stringify({
          email: "ada@example.com",
          password: "longenough",
          name: "Ada",
        }),
      }),
    );
    expect(reg.status).toBe(202);
    const { testCode } = await reg.json();
    const verified = await verify(
      new Request(`${BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ada@example.com", code: testCode }),
      }),
    );
    expect(verified.status).toBe(200);

    const token =
      verified.headers.get("set-cookie")?.match(/gv_session=([^;]*)/)?.[1] ??
      "";
    const res = await session(
      new Request(`${BASE}/session`, {
        headers: { cookie: `gv_session=${token}` },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: expect.any(String),
        email: "ada@example.com",
        name: "Ada",
        isNew: true,
      },
    });
  });

  it("answers 200 with { user: null } for a tampered cookie", async () => {
    const res = await session(
      new Request(`${BASE}/session`, {
        headers: { cookie: "gv_session=garbage.token" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: null });
  });
});
