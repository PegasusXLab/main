import { expect, test, type Locator, type Page } from "@playwright/test";

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

test("3D object add flow: AddMenu -> library object -> 2D marker -> customize in panel -> see in Top-down 3D -> undo/redo", async ({
  page,
}) => {
  await page.goto("/edit/local");

  // Ensure canvas is ready
  const rooms = page.locator("[data-room-id]");
  await expect(rooms.first()).toBeVisible();

  // Click on the room to select it
  await rooms.first().click();

  // The "+ Add" button should be visible and enabled
  const addTrigger = page.getByTestId("add-menu-trigger");
  await expect(addTrigger).toBeVisible();
  await expect(addTrigger).toBeEnabled();

  // Open the AddMenu
  await addTrigger.click();
  const addMenuList = page.getByTestId("add-menu-list");
  await expect(addMenuList).toBeVisible();

  // Check Picture and Object menu items
  const pictureItem = page.getByTestId("add-menu-picture");
  const objectItem = page.getByTestId("add-menu-object");
  await expect(pictureItem).toBeVisible();
  await expect(objectItem).toBeVisible();

  // Click Object
  await objectItem.click();

  // The ObjectAddPanel should appear
  const addPanel = page.getByTestId("object-add-panel");
  await expect(addPanel).toBeVisible();
  await expect(page.getByTestId("object-add-choice-library")).toBeVisible();
  await expect(page.getByTestId("object-add-choice-file")).toBeVisible();
  await expect(page.getByTestId("object-add-choice-photo")).toBeVisible();

  // Category filter tabs
  await expect(page.getByTestId("library-category-all")).toBeVisible();
  await expect(page.getByTestId("library-category-plants")).toBeVisible();
  await page.getByTestId("library-category-plants").click();
  await expect(page.getByTestId("object-library-plant-succulent")).toBeVisible();

  // Switch back to all and pick the Marble Bust
  await page.getByTestId("library-category-all").click();
  const bustCard = page.getByTestId("object-library-bust-marble");
  await expect(bustCard).toBeVisible();
  await bustCard.click();

  // Marker should appear on canvas
  const floorMarker = page.locator('[data-testid^="floor-object-"]').first();
  await expect(floorMarker).toBeVisible();

  // FloorObjectPanel should be visible for the newly placed object
  const objectPanel = page.getByTestId("floor-object-panel");
  await expect(objectPanel).toBeVisible();
  await expect(page.getByTestId("floor-object-source")).toContainText("Marble bust");

  // Customize properties in FloorObjectPanel
  const titleInput = page.getByLabel("Title");
  await titleInput.fill("Ancient Greek Bust");
  await expect(titleInput).toHaveValue("Ancient Greek Bust");

  const artistInput = page.getByLabel("Artist");
  await artistInput.fill("Unknown Sculptor");
  await expect(artistInput).toHaveValue("Unknown Sculptor");

  // Plinth toggle
  const roundPlinthToggle = page.getByRole("button", { name: "Round", exact: true });
  await roundPlinthToggle.click();

  // Switch to Top-down 3D view and verify rendering
  await page.getByRole("button", { name: "Top-down", exact: true }).click();
  const canvas3d = page.locator("main canvas");
  await expect(canvas3d).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => distinctColors(page, canvas3d), { timeout: 20_000 })
    .toBeGreaterThan(8);

  // Switch back to 2D view
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(floorMarker).toBeVisible();

  // Delete the object
  await floorMarker.click();
  const deleteBtn = page.getByRole("button", { name: "Delete", exact: true }).first();
  await deleteBtn.click();
  await expect(floorMarker).toHaveCount(0);

  // Undo (Cmd+Z on Mac, Ctrl+Z elsewhere)
  const isMac = process.platform === "darwin";
  await page.keyboard.press(isMac ? "Meta+z" : "Control+z");
  await expect(floorMarker).toHaveCount(1);

  // Redo (Cmd+Shift+Z / Ctrl+Shift+Z)
  await page.keyboard.press(isMac ? "Meta+Shift+z" : "Control+Shift+z");
  await expect(floorMarker).toHaveCount(0);
});
