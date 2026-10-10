// `npm run predemo`: runs the publish/view/edit-key e2e against the live site
// (or E2E_BASE_URL) and prints a PASS/FAIL banner. Playwright's CLI is started
// with this Node binary, so there is no npx.cmd or shell to trip over on Windows.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const baseUrl = process.env.E2E_BASE_URL || "https://galleriverse.vercel.app";

let cli;
try {
  cli = require.resolve("@playwright/test/cli");
} catch (err) {
  console.error(`Could not find Playwright (run npm ci first): ${err.message}`);
  console.log("\n>>> PREDEMO CHECK: FAIL (Playwright not installed) <<<");
  process.exit(1);
}

console.log(`Pre-demo check against ${baseUrl}\n`);
const res = spawnSync(
  process.execPath,
  [cli, "test", "tests/e2e/publish-view.spec.ts", "--project=chromium"],
  { stdio: "inherit", env: { ...process.env, E2E_BASE_URL: baseUrl } },
);

if (res.error) {
  console.error(`\nCould not start Playwright: ${res.error.message}`);
  console.log("\n>>> PREDEMO CHECK: FAIL (the test did not run) <<<");
  process.exit(1);
}
if (res.status === 0) {
  console.log("\n>>> PREDEMO CHECK: PASS <<<");
} else {
  console.log("\n>>> PREDEMO CHECK: FAIL <<<");
  process.exit(res.status ?? 1);
}
