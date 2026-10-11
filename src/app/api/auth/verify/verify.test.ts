import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resetAttemptsForTests } from "@/lib/auth/http";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { POST as register } from "../register/route";
import { POST as login } from "../login/route";
import { POST as verify } from "./route";
import { POST as resend } from "./resend/route";

// T-147 routes: register → 202 + code, verify, resend limits, login of unverified accounts,
// grandfathered accounts, honeypot, sign-up rate limit and production without mail.

const BASE = "http://localhost:3000/api/auth";
const E2E_SECRET = "e2e-verify-secret-0123456789abcdef";
const T = { "x-e2e-verify-secret": E2E_SECRET };

function post(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const ADA = { email: "ada@example.com", password: "longenough" };

describe("email verification routes", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "pegasus-verify-"));
    vi.stubEnv("PEGASUS_DATA_DIR", dataDir);
    vi.stubEnv("AUTH_SECRET", "test-secret-0123456789abcdef0123456789");
    vi.stubEnv("E2E_VERIFY_SECRET", E2E_SECRET);
    vi.spyOn(console, "info").mockImplementation(() => {});
    resetAttemptsForTests();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.useRealTimers();
    await fs.rm(dataDir, { recursive: true, force: true });
  });

  it("register stores an unverified account and only a hash of the code", async () => {
    const res = await register(post(`${BASE}/register`, ADA, T));
    expect(res.status).toBe(202);
    const { testCode } = await res.json();
    const stored = await findUserByEmail("ada@example.com");
    expect(stored?.emailVerified).toBe(false);
    expect(JSON.stringify(stored)).not.toContain(testCode);
  });

  it("a wrong code says how many tries are left; the right one signs in", async () => {
    const { testCode } = await (
      await register(post(`${BASE}/register`, ADA, T))
    ).json();
    const wrong = await verify(
      post(`${BASE}/verify`, {
        email: ADA.email,
        code: "000000" === testCode ? "111111" : "000000",
      }),
    );
    expect(wrong.status).toBe(400);
    expect(await wrong.json()).toMatchObject({ reason: "wrong", triesLeft: 4 });

    const ok = await verify(
      post(`${BASE}/verify`, { email: ADA.email, code: testCode }),
    );
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toMatch(/gv_session=/);
    expect((await findUserByEmail(ADA.email))?.emailVerified).toBe(true);

    const again = await verify(
      post(`${BASE}/verify`, { email: ADA.email, code: testCode }),
    );
    expect(again.status).toBe(400);
    expect((await again.json()).error).toContain("already verified");
  });

  it("login of an unverified account answers 403 needsVerification, with no session", async () => {
    await register(post(`${BASE}/register`, ADA));
    const res = await login(post(`${BASE}/login`, ADA));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Verify your email first.",
      needsVerification: true,
      email: ADA.email,
    });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("accounts made before T-147 (no flag) still log in", async () => {
    await createUser({ ...ADA, name: "Ada" });
    const res = await login(post(`${BASE}/login`, ADA));
    expect(res.status).toBe(200);
  });

  it("resend: 1 per minute, unknown emails look the same, a new code replaces the old", async () => {
    vi.useFakeTimers({
      now: Date.parse("2026-10-11T04:00:00Z"),
      toFake: ["Date"],
    });
    const first = await (
      await register(post(`${BASE}/register`, ADA, T))
    ).json();

    const tooSoon = await resend(
      post(`${BASE}/verify/resend`, { email: ADA.email }, T),
    );
    expect(tooSoon.status).toBe(429);
    expect(await tooSoon.json()).toMatchObject({ retryAfter: 60 });

    vi.setSystemTime(Date.parse("2026-10-11T04:01:01Z"));
    const fresh = await resend(
      post(`${BASE}/verify/resend`, { email: ADA.email }, T),
    );
    expect(fresh.status).toBe(202);
    const { testCode } = await fresh.json();

    const unknown = await resend(
      post(`${BASE}/verify/resend`, { email: "who@example.com" }),
    );
    expect(unknown.status).toBe(202);
    expect(await unknown.json()).toEqual({
      needsVerification: true,
      email: "who@example.com",
    });

    if (testCode !== first.testCode) {
      const old = await verify(
        post(`${BASE}/verify`, { email: ADA.email, code: first.testCode }),
      );
      expect(old.status).toBe(400);
    }
    const ok = await verify(
      post(`${BASE}/verify`, { email: ADA.email, code: testCode }),
    );
    expect(ok.status).toBe(200);
  });

  it("signing up again before verifying (same password) sends a new code; a different password is a 409", async () => {
    vi.useFakeTimers({
      now: Date.parse("2026-10-11T04:00:00Z"),
      toFake: ["Date"],
    });
    await register(post(`${BASE}/register`, ADA));
    vi.setSystemTime(Date.parse("2026-10-11T04:02:00Z"));
    expect((await register(post(`${BASE}/register`, ADA))).status).toBe(202);
    expect(
      (
        await register(
          post(`${BASE}/register`, { ...ADA, password: "different1" }),
        )
      ).status,
    ).toBe(409);
  });

  it("the honeypot answers like success but creates nothing", async () => {
    const res = await register(
      post(`${BASE}/register`, { ...ADA, website: "http://spam.example" }),
    );
    expect(res.status).toBe(202);
    expect(await findUserByEmail(ADA.email)).toBeNull();
  });

  it("limits sign-ups to 5 per IP per 10 minutes (the test header is exempt)", async () => {
    const ip = { "x-forwarded-for": "9.9.9.9" };
    for (let i = 0; i < 5; i++) {
      const r = await register(
        post(
          `${BASE}/register`,
          { email: `u${i}@example.com`, password: "longenough" },
          ip,
        ),
      );
      expect(r.status).toBe(202);
    }
    const sixth = await register(
      post(
        `${BASE}/register`,
        { email: "u6@example.com", password: "longenough" },
        ip,
      ),
    );
    expect(sixth.status).toBe(429);
    const tested = await register(
      post(
        `${BASE}/register`,
        { email: "u7@example.com", password: "longenough" },
        { ...ip, ...T },
      ),
    );
    expect(tested.status).toBe(202);
  });

  it("production without Gmail answers 503 and creates nothing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GMAIL_USER", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    const res = await register(post(`${BASE}/register`, ADA));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Email is not set up yet" });
    expect(await findUserByEmail(ADA.email)).toBeNull();
  });
});
