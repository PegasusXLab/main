import { expect, test } from "@playwright/test";
import sample from "../../src/fixtures/sample-3room.json";
import { registerVerified } from "./verifiedAccount";

test("persistent session retains identity and owner galleries; returning login opens Your galleries", async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  const email = `session-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = "session-regression-1";
  // T-147: register + emailed code; the verify response carries the session.
  const registered = await registerVerified(page.request, {
    email,
    password,
    name: "Returning Creator",
  });
  const user = await registered.json();
  const cookieHeader = registered.headers()["set-cookie"];
  expect(cookieHeader).toMatch(/Max-Age=604800/i);
  expect(cookieHeader).toMatch(/HttpOnly/i);
  expect(cookieHeader).toMatch(/SameSite=Lax/i);
  expect(cookieHeader).toMatch(/Path=\//i);
  const cookie = (await context.cookies()).find((c) => c.name === "gv_session");
  expect(cookie).toBeDefined();
  expect(cookie!.expires).toBeGreaterThan(Date.now() / 1000 + 6 * 24 * 3600);

  await page.goto("/");
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Account" })).toContainText(
    "Returning Creator",
  );
  const tab = await context.newPage();
  await tab.goto("/");
  await expect(tab.getByRole("navigation", { name: "Account" })).toContainText(
    "Returning Creator",
  );
  expect(await (await tab.request.get("/api/auth/me")).json()).toMatchObject(
    user,
  );
  await tab.close();

  const created = await page.request.post("/api/galleries", {
    data: { ...sample, title: "Retained owner gallery" },
  });
  expect(created.status()).toBe(201);
  const gallery = await created.json();
  const owned = await (await page.request.get("/api/me/galleries")).json();
  expect(owned.galleries).toContainEqual(
    expect.objectContaining({ id: gallery.id }),
  );
  const logout = await page.request.post("/api/auth/logout");
  expect(logout.headers()["set-cookie"]).toMatch(/Max-Age=0/i);
  expect((await page.request.get("/api/auth/me")).status()).toBe(401);

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^Log in/ }).click();
  expect((await loginResponse).status()).toBe(200);
  const returning = await (await page.request.get("/api/auth/me")).json();
  expect(returning).toMatchObject({
    id: user.id,
    email: user.email,
    name: user.name,
  });
  const after = await (await page.request.get("/api/me/galleries")).json();
  expect(after.galleries).toEqual(owned.galleries);
  // Regression: both current auth success handlers reset the local gallery and navigate to /edit/local.
  await expect(page).toHaveURL(/\/(?:#your-galleries-heading)?$/);
  await expect(
    page.getByRole("heading", { name: "Your galleries" }),
  ).toBeVisible();
  await page
    .getByRole("listitem")
    .filter({ hasText: "Retained owner gallery" })
    .getByRole("link", { name: "Edit", exact: true })
    .click();
  await expect(page.getByLabel(/Gallery/).first()).toHaveValue(
    "Retained owner gallery",
  );
  await page.reload();
  expect(await (await page.request.get("/api/auth/me")).json()).toMatchObject({
    id: user.id,
    name: "Returning Creator",
  });
});

test("the seven-day session survives a browser restart", async ({
  playwright,
  baseURL,
}, testInfo) => {
  const profile = testInfo.outputPath("persistent-profile");
  const launch = () =>
    playwright.chromium.launchPersistentContext(profile, { baseURL });
  let browserContext = await launch();
  try {
    const email = `restart-${Date.now()}@example.com`;
    const response = await registerVerified(browserContext.request, {
      email,
      password: "restart-password-1",
      name: "Restart Creator",
    });
    const user = await response.json();
    const page = await browserContext.newPage();
    await page.goto("/");
    await page.reload();
    await expect(
      page.getByRole("navigation", { name: "Account" }),
    ).toContainText("Restart Creator");
    await browserContext.close();
    browserContext = await launch();
    const restored = await browserContext.request.get("/api/auth/me");
    expect(restored.status()).toBe(200);
    expect(await restored.json()).toMatchObject(user);
    const reopened = await browserContext.newPage();
    await reopened.goto("/");
    await expect(
      reopened.getByRole("navigation", { name: "Account" }),
    ).toContainText("Restart Creator");
  } finally {
    await browserContext.close();
  }
});

test("returning login on the landing page keeps the existing local draft", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const email = `landing-session-${Date.now()}@example.com`;
  const password = "landing-session-password-1";
  await registerVerified(page.request, {
    email,
    password,
    name: "Landing Returner",
  });
  const published = await page.request.post("/api/galleries", {
    data: { ...sample, title: "Landing retained gallery" },
  });
  expect(published.status()).toBe(201);
  await page.request.post("/api/auth/logout");
  await page.goto("/");
  const draft = JSON.stringify({ ...sample, title: "Keep my local draft" });
  await page.evaluate(
    (value) => localStorage.setItem("pegasus:gallery:local", value),
    draft,
  );
  await page.getByRole("tab", { name: "Returning" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your galleries" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/(?:#your-galleries-heading)?$/);
  await expect(
    page.getByRole("heading", { name: "Landing retained gallery" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("pegasus:gallery:local")),
  ).toBe(draft);
});
