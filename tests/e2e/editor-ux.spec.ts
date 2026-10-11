import { expect, test } from "@playwright/test";

// Guards the editor UX controls (rooms list, back button, Escape, live 3D
// preview, split view) and the React #185 render loop that took /edit down
// in production after #100. Any page error fails the test.
test("editor mounts and the overview, preview and split view work without render loops", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Maximum update depth|#185/.test(msg.text())) {
      errors.push(msg.text());
    }
  });

  await page.goto("/edit/local");
  const panel = page.getByTestId("gallery-panel");
  await expect(panel).toBeVisible();
  await expect(page.locator("[data-room-id]").first()).toBeVisible();

  // Live 3D preview shows in 2D mode and can be minimised and reopened.
  await expect(page.getByTestId("live-3d-preview")).toBeVisible();
  await page.getByTestId("live-3d-preview-minimize").click();
  await page.getByTestId("live-3d-preview-open").click();
  await expect(page.getByTestId("live-3d-preview")).toBeVisible();

  // Rooms list: clicking a room opens its panel; back and Escape return.
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

  // Sidebar "+ Add Room" adds a room and selects it.
  await panel.getByRole("button", { name: "+ Add Room" }).click();
  await expect(page.locator("[data-room-id]")).toHaveCount(roomCount + 1);
  await expect(page.getByTestId("room-panel")).toBeVisible();

  // Split view opens and closes.
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Split" }).click();
  await expect(page.getByText("3D Split View")).toBeVisible();
  await page.getByTitle("Close split view").click();
  await expect(page.getByTestId("live-3d-preview")).toBeVisible();

  // Give any runaway update loop time to surface.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});
