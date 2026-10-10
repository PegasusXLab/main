import { expect, test, type Locator, type Page } from "@playwright/test";

// Counts distinct colours in a screenshot of the element. A blank WebGL canvas
// renders as a single flat colour; a scene with floors, walls and lighting has many.
async function distinctColors(page: Page, target: Locator): Promise<number> {
  const png = (await target.screenshot()).toString("base64");
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    const seen = new Set<number>();
    for (let i = 0; i < data.length; i += 16) {
      seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    }
    return seen.size;
  }, png);
}

// Sprint 1 checkpoint: build 3 rooms in 2D -> toggle -> see them in 3D.
// fixme until T-025 (the /edit/[id] page) merges.
test.fixme("build 3 connected rooms, recolour a wall, see them in 3D", async ({
  page,
}) => {
  await page.goto("/edit/local");

  const canvas2d = page.locator("main svg").first();
  await expect(canvas2d).toBeVisible();
  const rooms = page.locator("[data-room-id]");

  // Clicking empty canvas adds a 6 x 6 m room and selects it.
  const box = (await canvas2d.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(rooms).toHaveCount(1);

  // Each "+" adds an adjacent room and selects it, so East twice gives a row of 3.
  await page.getByRole("button", { name: "Add room to the East" }).click();
  await expect(rooms).toHaveCount(2);
  await page.getByRole("button", { name: "Add room to the East" }).click();
  await expect(rooms).toHaveCount(3);

  const wallColor = page.getByLabel("Wall Color");
  await wallColor.fill("#AA3355");
  await expect(wallColor).toHaveValue(/#aa3355/i);

  await page.getByRole("button", { name: "3D", exact: true }).click();
  const canvas3d = page.locator("main canvas");
  await expect(canvas3d).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(() => distinctColors(page, canvas3d), { timeout: 20_000 })
    .toBeGreaterThan(8);
});
