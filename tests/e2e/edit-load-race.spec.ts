import { expect, test } from "@playwright/test";
import sample from "../../src/fixtures/sample-3room.json";

// T-135 regression: an edit link must not let the user edit before the server copy has loaded,
// otherwise the late load overwrites the edit and "Save changes" saves the old title.
// Live latency made this flaky; delaying the initial GET makes it deterministic.
test("a slow initial load never overwrites the user's edit", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop editor only");
  const res = await request.post("/api/galleries", {
    data: { ...sample, title: "Original" },
  });
  expect(res.status()).toBe(201);
  const { editUrl } = await res.json();

  await page.route(/\/api\/galleries\/[^/?]+$/, async (route) => {
    if (route.request().method() === "GET")
      await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });

  await page.goto(editUrl);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  const title = page.getByLabel(/Gallery/).first();
  // Rooms are only shown once the server copy is in the store, so it already holds the real title.
  await expect(title).toHaveValue("Original");
  await title.fill("Edited title");
  await page.waitForTimeout(2000); // any late load would land here
  await expect(title).toHaveValue("Edited title");
});
