import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? "http://localhost:3000";

// T-147: sign-up tests need the emailed code. The dev server started below inherits this
// local-only secret and returns the code to requests that carry it. Against a deployed URL,
// export the real E2E_VERIFY_SECRET instead (the same value as in Vercel).
if (!externalBaseUrl) {
  process.env.E2E_VERIFY_SECRET ??=
    "local-e2e-verify-secret-not-for-production";
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Sprint 1/2 checkpoint specs stay Chromium-only (local, fast).
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /matrix/,
    },
    // T-079 device matrix (tests/e2e/matrix.spec.ts). Runs against
    // E2E_BASE_URL (the live site); skipped without it.
    {
      name: "chromium-matrix",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /matrix/,
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      testMatch: /matrix/,
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: /matrix/,
    },
    { name: "iphone", use: { ...devices["iPhone 15"] }, testMatch: /matrix/ },
    {
      name: "ipad",
      use: { ...devices["iPad (gen 7)"] },
      testMatch: /matrix/,
    },
    { name: "android", use: { ...devices["Pixel 7"] }, testMatch: /matrix/ },
  ],
  // Against a deployed URL (E2E_BASE_URL) there is nothing to start locally.
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
