import { expect, test } from "@playwright/test";

// Guard for the #100 -> #101 revert: /edit crashed with React #185 (maximum
// update depth exceeded). Mount the editor, drive every view mode and drag the
// 3D POV camera (inertia + spring damping), and fail on any page error.
test("editor mounts and the 3D POV camera drags without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/edit/local");
  await expect(page.locator("[data-room-id]").first()).toBeVisible();

  await page.getByRole("button", { name: "3D POV", exact: true }).click();
  const canvas3d = page.locator("main canvas");
  await expect(canvas3d).toBeVisible({ timeout: 30_000 });

  const box = await canvas3d.boundingBox();
  if (!box) throw new Error("3D canvas has no bounding box");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let s = 1; s <= 8; s++) {
      await page.mouse.move(cx + s * 25, cy + s * 4);
    }
    await page.mouse.up();
  }
  // Let the released drag coast and settle.
  await page.waitForTimeout(1_000);

  await page.getByRole("button", { name: /Next room/ }).click();
  await page.getByRole("button", { name: "Top-down", exact: true }).click();
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator("[data-room-id]").first()).toBeVisible();
  await page.getByRole("button", { name: "3D POV", exact: true }).click();
  await expect(canvas3d).toBeVisible();
  await page.waitForTimeout(1_000);

  expect(errors).toEqual([]);
});
