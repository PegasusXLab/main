import { expect, test, type APIRequestContext } from "@playwright/test";

// T-115: accounts (T-100) end to end. API level runs now; the UI level waits
// for the landing page (T-101). Point E2E_BASE_URL at a dedicated server (or
// the live site) so a stale dev server on :3000 is never reused.

const INCORRECT = { error: "Email or password is incorrect" };

function uniqueEmail(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${Date.now()}-${rand}@example.com`;
}

test.describe("accounts API", () => {
  test("register, me, logout, login, and error cases", async ({
    playwright,
    baseURL,
  }) => {
    // A fresh context per run: its own cookie jar, nothing shared.
    const api = await playwright.request.newContext({ baseURL });
    const email = uniqueEmail();
    const password = "e2e-password-1";

    const reg = await api.post("/api/auth/register", {
      data: { email: `  ${email.toUpperCase()} `, password, name: "E2E User" },
    });
    expect(reg.status()).toBe(201);
    const user = await reg.json();
    expect(user).toEqual({ id: expect.any(String), email, name: "E2E User" });
    expect(reg.headers()["set-cookie"]).toMatch(/gv_session=.+HttpOnly/i);

    const me = await api.get("/api/auth/me");
    expect(me.status()).toBe(200);
    expect(await me.json()).toEqual(user);

    expect((await api.post("/api/auth/logout")).status()).toBe(200);
    expect((await api.get("/api/auth/me")).status()).toBe(401);

    const login = await api.post("/api/auth/login", {
      data: { email, password },
    });
    expect(login.status()).toBe(200);
    expect(await login.json()).toEqual(user);
    expect((await api.get("/api/auth/me")).status()).toBe(200);

    const wrongPassword = await api.post("/api/auth/login", {
      data: { email, password: "not-the-password" },
    });
    const unknownEmail = await api.post("/api/auth/login", {
      data: { email: uniqueEmail(), password },
    });
    expect(wrongPassword.status()).toBe(401);
    expect(unknownEmail.status()).toBe(401);
    expect(await wrongPassword.json()).toEqual(INCORRECT);
    expect(await unknownEmail.json()).toEqual(INCORRECT);

    const duplicate = await api.post("/api/auth/register", {
      data: { email, password: "another-pass-1" },
    });
    expect(duplicate.status()).toBe(409);

    const short = await api.post("/api/auth/register", {
      data: { email: uniqueEmail(), password: "short" },
    });
    expect(short.status()).toBe(400);

    await api.dispose();
  });
});

// ---------------------------------------------------------------------------
// UI level: needs the landing page with register/login (T-101).
// ---------------------------------------------------------------------------

test.describe("accounts UI", () => {
  test.fixme(true, "waits for the landing page with register/login (T-101)");

  test("register from /, see the user in the editor, log out", async ({
    page,
  }) => {
    const email = uniqueEmail();
    await page.goto("/");
    await page.getByRole("tab", { name: /register|sign up/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password/i).fill("e2e-password-1");
    await page
      .getByRole("button", { name: /register|sign up|create/i })
      .click();
    await expect(page).toHaveURL(/\/edit\//);
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: /log ?out|sign ?out/i }).click();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("/login deep link shows the login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Start-screen regression: the landing page must keep these working.
// ---------------------------------------------------------------------------

async function publishSmallGallery(
  request: APIRequestContext,
): Promise<string> {
  const now = new Date().toISOString();
  const res = await request.post("/api/galleries", {
    data: {
      id: "auth-e2e",
      version: 1,
      title: "Auth E2E Gallery",
      entranceRoomId: "r1",
      rooms: [
        {
          id: "r1",
          name: "Only Room",
          description: "",
          x: 0,
          y: 0,
          w: 6,
          d: 6,
          wallHeight: 3,
          wallColor: "#f2efe9",
          floor: "wood",
          lighting: "gallery",
        },
      ],
      artworks: [],
      createdAt: now,
      updatedAt: now,
    },
  });
  expect(res.status()).toBe(201);
  return ((await res.json()) as { editUrl: string }).editUrl;
}

test.describe("start screen", () => {
  test("New blank gallery opens the editor", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /new blank gallery/i }).click();
    await expect(page).toHaveURL(/\/edit\/local/);
    await expect(page.locator("[data-room-id]").first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Open edit link loads that gallery; a bad link explains itself", async ({
    page,
    request,
  }) => {
    const editUrl = await publishSmallGallery(request);
    await page.goto("/");
    const input = page.getByLabel(/open edit link/i);

    await input.fill("not a link");
    await page.getByRole("button", { name: "Open", exact: true }).click();
    // Next's route announcer is also role=alert, so match ours by text.
    await expect(
      page.getByRole("alert").filter({ hasText: /edit link/i }),
    ).toBeVisible();

    await input.fill(new URL(editUrl, page.url()).toString());
    await page.getByRole("button", { name: "Open", exact: true }).click();
    await expect(page).toHaveURL(/\/edit\/[^/]+\?key=/);
    await expect(page.getByLabel(/Gallery/).first()).toHaveValue(
      "Auth E2E Gallery",
      { timeout: 30_000 },
    );
  });
});
