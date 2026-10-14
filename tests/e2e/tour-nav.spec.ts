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
  await expect(page.getByRole("button", { name: "Go to South Room" })).toHaveAttribute(
    "aria-current",
    "location",
  );
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

// Free movement (ADR-018): from the Entrance (standing at x 3, z 5, facing north), back up into
// the south wall (0.6 m behind you), then strafe left too: you slide west along the wall and
// through the doorway (x ~2, z 6) into the South Room. Even with no progress in the first phase,
// the diagonal meets the wall east of the opening, so this is tolerant of how fast frames come
// (headless software GL renders a few frames a second and the rig clamps long frames, R6).
/** Hold keys like a real keyboard does: repeated keydowns while held (OS auto-repeat). */
async function hold(page: import("@playwright/test").Page, keys: string[], ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    for (const k of keys) await page.keyboard.down(k);
    await page.waitForTimeout(150);
  }
}
async function release(page: import("@playwright/test").Page) {
  await page.keyboard.up("a");
  await page.keyboard.up("s");
}
/** Back into the south wall, then back + strafe left until `done` (or `ms` passes). */
async function walkToSouthRoom(page: import("@playwright/test").Page, ms = 30_000) {
  await hold(page, ["s"], 4000);
  await hold(page, ["s", "a"], ms);
  await release(page);
}

test("W/A/S/D walk through a doorway and the HUD follows the room", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop viewer only");
  test.setTimeout(90_000);
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.goto(viewUrl);
  const nav = page.getByTestId("tour-nav");
  await expect(nav).toContainText("01 / 03", { timeout: 30_000 });

  await walkToSouthRoom(page, 20_000);
  await expect(nav).toContainText("South Room");

  // Tour nav still drives guided walks afterwards.
  await page.getByRole("button", { name: "Go to East Hall" }).click();
  await expect(nav).toContainText("East Hall");
});

test("keys typed into a field don't walk the editor's 3D POV", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop editor only");
  test.setTimeout(150_000);
  await page.goto("/edit/local");
  await page.getByRole("button", { name: "3D POV" }).click();
  const nav = page.getByTestId("tour-nav");
  await expect(nav).toContainText("Entrance", { timeout: 30_000 });

  // Typing: the same keys that walk into the South Room below go to the field instead.
  const title = page.getByRole("textbox").first();
  await title.focus();
  await walkToSouthRoom(page, 15_000);
  await expect(nav).toContainText("Entrance");

  await title.blur();
  await walkToSouthRoom(page, 20_000);
  await expect(nav).toContainText("South Room");
});

// Click-to-walk (ADR-018): clicking open floor walks there. The room title HUD hides while the
// camera moves and comes back when it stops, which makes the walk observable. In the 1280x720
// viewport, (300, 700) is floor ~4 m ahead-left of the Entrance's start, clear of the nav pill.
test("clicking the floor walks there; a drag that ends on the floor doesn't", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop viewer only");
  test.setTimeout(90_000);
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.goto(viewUrl);
  const hud = page.getByTestId("room-title-hud");
  await expect(hud).toHaveAttribute("aria-hidden", "false", { timeout: 30_000 });

  // A drag-look that ends over the floor is not a click: no walk.
  await page.mouse.move(250, 700);
  await page.mouse.down();
  await page.mouse.move(350, 700, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await expect(hud).toHaveAttribute("aria-hidden", "false");

  // A click walks: the HUD hides while moving, then returns on arrival; no plaque opens.
  await page.mouse.click(300, 700);
  await expect(hud).toHaveAttribute("aria-hidden", "true", { timeout: 5_000 });
  await expect(hud).toHaveAttribute("aria-hidden", "false", { timeout: 30_000 });
  await expect(page.getByTestId("tour-nav")).toContainText("Entrance");
});

// Regression: clicking Next room while the camera is still easing to a stop after W/A/S/D used to
// be undone (the drift reported the old room). Release W, click Next at once: the walk sticks.
test("Next room right after releasing W still walks to the next room", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop viewer only");
  test.setTimeout(90_000);
  const res = await request.post("/api/galleries", { data: sample });
  expect(res.status()).toBe(201);
  const { viewUrl } = await res.json();

  await page.goto(viewUrl);
  const nav = page.getByTestId("tour-nav");
  await expect(nav).toContainText("01 / 03", { timeout: 30_000 });

  await hold(page, ["w"], 1500);
  await page.keyboard.up("w");
  // Click in the same instant (no actionability wait), while the camera is still easing to a stop.
  await page.getByRole("button", { name: "Next room" }).dispatchEvent("click");
  await expect(nav).toContainText("02 / 03");
  await page.waitForTimeout(2000);
  await expect(nav).toContainText("02 / 03"); // not snapped back to the Entrance
});
