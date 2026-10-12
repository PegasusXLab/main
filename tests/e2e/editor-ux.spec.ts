import { expect, test } from "@playwright/test";

// Editor overview flow: the gallery panel's rooms list opens a room's panel, "Gallery overview"
// and Escape return to the list, and "+ Add Room" adds and selects a room. Mounting /edit and
// driving the panels must not trip a render loop (React #185 took /edit down after #100).
// Preview + split view live in editor-preview.spec.ts; the 3D POV camera in edit-mount.spec.ts.
test("rooms overview: open a room, go back, Escape, add a room", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop editor only");
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Maximum update depth|#185/.test(msg.text())) {
      errors.push(msg.text());
    }
  });

  await page.goto("/edit/local");
  await expect(page.locator("[data-room-id]").first()).toBeVisible({ timeout: 30_000 });
  const panel = page.getByTestId("gallery-panel");
  await expect(panel).toBeVisible();

  const roomCount = await page.locator("[data-room-id]").count();
  await expect(panel.getByText(`Rooms (${roomCount})`)).toBeVisible();

  await panel.locator('button[title^="Edit "]').first().click();
  await expect(page.getByTestId("room-panel")).toBeVisible();
  await page.getByTestId("room-panel-back").click();
  await expect(panel).toBeVisible();

  await panel.locator('button[title^="Edit "]').first().click();
  await expect(page.getByTestId("room-panel")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: "+ Add Room" }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(roomCount + 1);
  await expect(page.getByTestId("room-panel")).toBeVisible();

  // Give any runaway update loop time to surface.
  await page.waitForTimeout(1_500);
  expect(errors).toEqual([]);
});
