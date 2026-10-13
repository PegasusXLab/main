import { expect, test } from "@playwright/test";
import sample from "../../src/fixtures/sample-3room.json";

// Viewer wayfinding: the nav pill walks room to room (camera walks through the doorways).
test("tour nav walks to the next room and to any room by its dot", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop viewer only");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.goto(viewUrl);
  const nav = page.getByTestId("tour-nav");
  await expect(nav).toContainText("Entrance", { timeout: 30_000 });
  await expect(nav).toContainText("01 / 03");

  await page.getByRole("button", { name: "Next room" }).click();
  await expect(nav).toContainText("East Hall");
  await expect(nav).toContainText("02 / 03");

  await page.getByRole("button", { name: "Go to South Room" }).click();
  await expect(nav).toContainText("South Room");
  await expect(
    page.getByRole("button", { name: "Go to South Room" }),
  ).toHaveAttribute("aria-current", "location");
  expect(errors).toEqual([]);
});

// A drag-look must not swallow the next keyboard activation of the nav (the drag guard only
// ignores the click that ends a drag).
test("after dragging the view, Enter on Next room still walks", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop viewer only");
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.goto(viewUrl);
  const nav = page.getByTestId("tour-nav");
  await expect(nav).toContainText("01 / 03", { timeout: 30_000 });

  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, {
    steps: 6,
  });
  await page.mouse.up();

  await page.getByRole("button", { name: "Next room" }).focus();
  await page.keyboard.press("Enter");
  await expect(nav).toContainText("02 / 03");
});

// Phones: the gallery title chip would squeeze beside the creator and music chips, so it is
// visually hidden there (still the page heading for screen readers) and shown on wider screens.
test("gallery title chip is screen-reader only on phones, visible on desktop", async ({
  page,
  request,
}) => {
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(viewUrl);
  await expect(page.getByTestId("tour-nav")).toContainText("01 / 03", {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: sample.title }),
  ).toBeAttached();
  const phone = (await page.getByTestId("tour-title").boundingBox())!;
  expect(phone.width).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByTestId("tour-title")).toBeVisible();
  const desktop = (await page.getByTestId("tour-title").boundingBox())!;
  expect(desktop.height).toBeLessThan(48); // one line, not one word per line
});
