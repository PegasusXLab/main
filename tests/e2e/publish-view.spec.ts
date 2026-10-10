import { expect, test, type Page } from "@playwright/test";

// Sprint 2 checkpoint (T-051): publish, view, edit with key.
// All gating features (T-035 viewer, T-044 publish panel, T-046 editor
// wiring) are merged, so every step runs — no test.fixme remains.

const ART_1 = {
  file: "tests/e2e/fixtures/art-1.jpg",
  title: "Ember Field",
  artist: "A. Painter",
  story: "A field of ember light at dusk, painted from memory.",
};

const ART_2 = {
  file: "tests/e2e/fixtures/art-2.jpg",
  title: "Quiet Tide",
  artist: "B. Painter",
  story: "A tide that never hurries, under a patient moon.",
};

async function trimToOneRoom(page: Page) {
  const rooms = page.locator("[data-room-id]");
  await expect(rooms.first()).toBeVisible();
  while ((await rooms.count()) > 1) {
    const before = await rooms.count();
    await rooms.last().click();
    await page.getByRole("button", { name: "Delete room" }).click();
    await expect(rooms).toHaveCount(before - 1);
  }
}

// The sample gallery ships with placeholder artworks; remove them so the
// published gallery holds exactly the artworks this test hangs.
async function clearArtworks(page: Page) {
  const markers = page.locator('[data-testid^="art-marker-"]');
  for (let i = 0; i < 10 && (await markers.count()) > 0; i++) {
    const before = await markers.count();
    // Force: the tick sits on the wall line and can fail hit-target checks.
    await markers.first().click({ force: true });
    await expect(
      page.getByRole("heading", { name: "Edit Artwork" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(markers).toHaveCount(before - 1);
  }
  await expect(markers).toHaveCount(0);
}

async function addArtwork(
  page: Page,
  roomIndex: number,
  art: typeof ART_1,
  wall: "North" | "South",
) {
  const rooms = page.locator("[data-room-id]");
  await rooms.nth(roomIndex).click();
  await page.getByRole("button", { name: "Add object" }).click();
  const panel = page.getByTestId("object-panel");
  await expect(panel).toBeVisible();
  if (wall !== "North") {
    await page.getByLabel("Wall", { exact: true }).selectOption({ value: "s" });
  }
  await panel.locator('input[type="file"]').setInputFiles(art.file);
  await expect(
    panel.getByRole("img", { name: "Uploaded preview" }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Title").fill(art.title);
  await page.getByLabel("Artist").fill(art.artist);
  await page.getByLabel(/Story/).fill(art.story);
  await page.getByRole("button", { name: "Add artwork" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Artwork" }),
  ).toBeVisible();
}

test("publish, tour in a new context, edit with key, refuse a wrong key", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);

  // 1. Build 3 rooms in 2D.
  await page.goto("/edit/local");
  await trimToOneRoom(page);
  await clearArtworks(page);
  const rooms = page.locator("[data-room-id]");
  await rooms.first().click();
  const addEast = page.getByRole("button", { name: "Add room to the East" });
  await addEast.click();
  await expect(rooms).toHaveCount(2);
  await addEast.click();
  await expect(rooms).toHaveCount(3);

  // 2. Hang 2 artworks with fixture images.
  await addArtwork(page, 0, ART_1, "North");
  await addArtwork(page, 1, ART_2, "South");

  // 3. Publish and capture the links.
  await page.getByLabel(/Gallery/).fill("E2E Show");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const publishSection = page.locator('section[aria-label="Publish"]');
  await expect(publishSection).toBeVisible();
  await publishSection.getByRole("button", { name: "Publish" }).click();
  const viewInput = page.getByLabel("View link");
  const editInput = page.getByLabel("Edit link");
  await expect(viewInput).toHaveValue(/\/g\//);
  await expect(editInput).toHaveValue(/\/edit\/.*key=/);
  const viewPath = await viewInput.inputValue();
  const editPath = await editInput.inputValue();
  const origin = new URL(page.url()).origin;

  // 4. Tour in a NEW browser context (no shared storage with the editor).
  const viewContext = await browser.newContext();
  const viewer = await viewContext.newPage();
  await viewer.goto(origin + viewPath);
  await expect(viewer.getByRole("heading", { name: "E2E Show" })).toBeVisible({
    timeout: 30_000,
  });
  const canvas = viewer.locator("canvas").first();
  await expect(canvas).toBeVisible();
  // Settle the travel-camera transition before interacting.
  await viewer.waitForTimeout(2000);

  // Previous / Next walk the room order.
  const roomLabel = viewer.locator("nav span[aria-live]");
  const firstRoom = await roomLabel.textContent();
  await viewer.getByRole("button", { name: /Next room/ }).click();
  await expect(roomLabel).not.toHaveText(firstRoom ?? "", { timeout: 15_000 });
  await viewer.getByRole("button", { name: /Previous room/ }).click();
  await expect(roomLabel).toHaveText(firstRoom ?? "", { timeout: 15_000 });

  // Click an artwork frame: sweep the canvas until the plaque opens.
  const box = await canvas.boundingBox();
  if (!box) throw new Error("viewer canvas has no bounding box");
  const spots: Array<[number, number]> = [
    [0.5, 0.45],
    [0.35, 0.45],
    [0.65, 0.45],
    [0.5, 0.6],
    [0.35, 0.6],
    [0.65, 0.6],
    [0.5, 0.3],
    [0.25, 0.5],
    [0.75, 0.5],
    [0.5, 0.7],
  ];
  const dialog = viewer.getByRole("dialog");
  let opened = false;
  for (const [fx, fy] of spots) {
    await viewer.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    try {
      await expect(dialog).toBeVisible({ timeout: 1500 });
      opened = true;
      break;
    } catch {
      // Missed the frame; keep sweeping.
    }
  }
  expect(opened).toBe(true);

  // The plaque shows the artwork's title and story.
  const plaqueText = (await dialog.textContent()) ?? "";
  const hit = [ART_1, ART_2].find((a) => plaqueText.includes(a.title));
  expect(hit, "plaque shows a known artwork title").toBeDefined();
  await expect(dialog).toContainText(hit!.story);
  await viewer.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await viewContext.close();

  // 5. Editing via the edit link saves.
  await page.goto(origin + editPath);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel(/Gallery/).fill("E2E Show (edited)");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(publishSection).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText(/Saved\./);
  const galleryId = viewPath.split("/g/")[1];
  const saved = await page.request.get(`/api/galleries/${galleryId}`);
  expect(saved.ok()).toBe(true);
  expect((await saved.json()).title).toBe("E2E Show (edited)");

  // 6. A wrong edit key is refused with the 403 message.
  const wrongPath = editPath.replace(/key=[^&]+/, "key=wrong-key");
  await page.goto(origin + wrongPath);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel(/Gallery/).fill("E2E Show (hacked)");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(publishSection).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(publishSection.getByRole("alert")).toHaveText(
    "Wrong or missing edit key",
  );
});
