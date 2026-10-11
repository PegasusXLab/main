import { expect, type APIRequestContext, type Page } from "@playwright/test";

// T-147: sign-up now needs the emailed 6-digit code. Tests send the E2E secret header, and the
// server hands the code back (only when the header matches its E2E_VERIFY_SECRET). Locally the
// Playwright config sets a default secret for the dev server it starts; against a deployed URL,
// export the same E2E_VERIFY_SECRET that Vercel has.

export function e2eSecret(): string {
  const secret = process.env.E2E_VERIFY_SECRET ?? "";
  if (secret.length < 24) {
    throw new Error(
      "Set E2E_VERIFY_SECRET (24+ chars, the same value as the server) to run sign-up tests.",
    );
  }
  return secret;
}

export function e2eHeaders(): Record<string, string> {
  return { "x-e2e-verify-secret": e2eSecret() };
}

/** Registers and verifies through the API; returns the verify response (it carries the session). */
export async function registerVerified(
  api: APIRequestContext,
  data: { email: string; password: string; name?: string },
) {
  const reg = await api.post("/api/auth/register", {
    data,
    headers: e2eHeaders(),
  });
  expect(reg.status()).toBe(202);
  const { email, testCode } = await reg.json();
  expect(
    testCode,
    "no code came back: does E2E_VERIFY_SECRET match the server's?",
  ).toMatch(/^\d{6}$/);
  const verified = await api.post("/api/auth/verify", {
    data: { email, code: testCode },
  });
  expect(verified.status()).toBe(200);
  return verified;
}

const CODE_URL = /\/api\/auth\/(register|verify\/resend)$/;

/** For UI sign-ups: the page's register/resend calls carry the secret header, so they return the code. */
export async function allowCodes(page: Page): Promise<void> {
  await page.route(CODE_URL, (route) =>
    route.continue({
      headers: { ...route.request().headers(), ...e2eHeaders() },
    }),
  );
}

/** The code from the next register/resend response. Start waiting BEFORE the click that sends it. */
export function nextCode(page: Page): Promise<string> {
  return page
    .waitForResponse((r) => CODE_URL.test(r.url()))
    .then(async (res) => {
      const body = await res.json();
      expect(body.testCode).toMatch(/^\d{6}$/);
      return body.testCode as string;
    });
}
