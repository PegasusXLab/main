import { expect, test } from "@playwright/test";
import sample from "../../src/fixtures/sample-3room.json";

// PR #101 regression: the editor crashed with React #185 (maximum update depth) when a gallery
// had no `objects` field. The editor must load, show the live 3D preview and open split view.
test("editor loads a gallery without objects, with live preview and split view", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop editor only");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { editUrl } = await res.json();

  await page.goto(editUrl);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByTestId("gallery-panel")).toBeVisible();
  await page.getByTestId("live-3d-preview-open").click();
  const preview = page.getByTestId("live-3d-preview");
  await expect(preview).toBeVisible();
  await expect(preview.locator("canvas")).toBeVisible({ timeout: 30_000 });

  await preview.getByRole("button", { name: "Split" }).click();
  await expect(page.getByText("3D Split View")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1, { timeout: 30_000 });

  expect(errors).toEqual([]);
});
