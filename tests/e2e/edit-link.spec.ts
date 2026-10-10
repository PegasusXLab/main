import { expect, test, type APIRequestContext } from "@playwright/test";

// T-117 regression for T-135: an edit made right after opening an edit link must survive Save
// and a reload. The editor used to show an early render that a late gallery load then replaced,
// dropping the typed title or the open Publish panel. Intermittent by nature, so run it with
// --repeat-each (the T-135 gate is 20/20).

async function publishGallery(request: APIRequestContext): Promise<{
  id: string;
  editUrl: string;
}> {
  const now = new Date().toISOString();
  const res = await request.post("/api/galleries", {
    data: {
      id: "edit-race",
      version: 1,
      title: "Original Title",
      entranceRoomId: "r1",
      rooms: [
        {
          id: "r1",
          name: "Only Room",
          description: "",
          x: 0,
          y: 0,
          w: 6,
          d: 6,
          wallHeight: 3,
          wallColor: "#f2efe9",
          floor: "wood",
          lighting: "gallery",
        },
      ],
      artworks: [],
      createdAt: now,
      updatedAt: now,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: string; editUrl: string };
}

test("an edit made right after opening an edit link survives Save and reload", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const { id, editUrl } = await publishGallery(request);

  // Act as soon as the editor looks ready, like a quick creator (and publish-view step 5).
  await page.goto(editUrl);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  const title = page.getByLabel(/Gallery/).first();
  await title.fill("Edited Right Away");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.locator('section[aria-label="Publish"]')).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText(/Saved\./);
  await expect(title).toHaveValue("Edited Right Away");

  const saved = await request.get(`/api/galleries/${id}`);
  expect((await saved.json()).title).toBe("Edited Right Away");

  await page.reload();
  await expect(page.getByLabel(/Gallery/).first()).toHaveValue(
    "Edited Right Away",
    { timeout: 30_000 },
  );
});
