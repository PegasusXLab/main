import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

// T-079: cross-browser / device matrix. Runs ONLY against E2E_BASE_URL
// (the live site); skipped without it so `npm run test:e2e` stays local.
// Phones are VIEW-ONLY (Quang): editor + publish flows run on desktop
// projects; touch projects exercise the viewer.

const DESKTOP = new Set(["chromium-matrix", "firefox", "webkit"]);

function isDesktop(projectName: string): boolean {
  return DESKTOP.has(projectName);
}

test.skip(
  !process.env.E2E_BASE_URL,
  "matrix runs against E2E_BASE_URL (live site) only",
);

const ART = {
  file: join(__dirname, "fixtures", "art-1.jpg"),
  title: "Matrix Ember",
  artist: "Matrix Painter",
  story: "A headline piece hung for the cross-browser matrix run.",
};

// ---------------------------------------------------------------------------
// Pixel helpers
// ---------------------------------------------------------------------------

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

/** Fraction of sampled pixels that differ between two screenshots. */
async function screenshotDiff(
  page: Page,
  a: Buffer,
  b: Buffer,
): Promise<number> {
  return page.evaluate(
    async ([a64, b64]) => {
      async function pixels(s: string): Promise<Uint8ClampedArray> {
        const img = new Image();
        img.src = `data:image/png;base64,${s}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      }
      const [pa, pb] = await Promise.all([pixels(a64), pixels(b64)]);
      let diff = 0;
      let total = 0;
      for (let i = 0; i < pa.length; i += 40) {
        total++;
        if (
          Math.abs(pa[i] - pb[i]) > 12 ||
          Math.abs(pa[i + 1] - pb[i + 1]) > 12 ||
          Math.abs(pa[i + 2] - pb[i + 2]) > 12
        ) {
          diff++;
        }
      }
      return total === 0 ? 0 : diff / total;
    },
    [a.toString("base64"), b.toString("base64")],
  );
}

/**
 * Sweeps taps/clicks across the canvas until the plaque for `title` opens.
 * Other artworks' plaques (e.g. the sample "Sunrise") are closed and skipped.
 */
async function openPlaque(
  page: Page,
  canvas: Locator,
  title: string,
  touch: boolean,
): Promise<boolean> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("viewer canvas has no bounding box");
  const dialog = page.getByRole("dialog");
  const points: Array<[number, number]> = [];
  // Portrait phones show the frame small and centred, so try the middle row first.
  for (const fy of [0.5, 0.45, 0.55, 0.6, 0.35]) {
    for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9])
      points.push([fx, fy]);
  }
  for (const [fx, fy] of points) {
    const x = box.x + box.width * fx;
    const y = box.y + box.height * fy;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    try {
      await expect(dialog).toBeVisible({ timeout: 1500 });
    } catch {
      continue;
    }
    if (((await dialog.textContent()) ?? "").includes(title)) return true;
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  }
  return false;
}

// ---------------------------------------------------------------------------
// Live-site setup over the API (fast, no UI): upload + publish a tour gallery
// ---------------------------------------------------------------------------

async function uploadFixture(request: APIRequestContext): Promise<{
  small: string;
  medium: string;
}> {
  const bytes = readFileSync(ART.file);
  const res = await request.post("/api/upload", {
    multipart: {
      small: { name: "small.jpg", mimeType: "image/jpeg", buffer: bytes },
      medium: { name: "medium.jpg", mimeType: "image/jpeg", buffer: bytes },
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { small: string; medium: string };
}

async function publishTourGallery(request: APIRequestContext): Promise<{
  id: string;
  viewUrl: string;
}> {
  const image = await uploadFixture(request);
  const now = new Date().toISOString();
  const doc = {
    id: "matrix-tour",
    version: 1,
    title: "Matrix Tour",
    entranceRoomId: "matrix-room-a",
    rooms: [
      {
        id: "matrix-room-a",
        name: "Matrix Hall A",
        description: "First matrix room.",
        x: 0,
        y: 0,
        w: 6,
        d: 6,
        wallHeight: 3,
        wallColor: "#f2efe9",
        floor: "wood",
        lighting: "gallery",
      },
      {
        id: "matrix-room-b",
        name: "Matrix Hall B",
        description: "Second matrix room.",
        x: 6,
        y: 0,
        w: 6,
        d: 6,
        wallHeight: 3,
        wallColor: "#d9e2ec",
        floor: "concrete",
        lighting: "warm",
      },
    ],
    artworks: [
      {
        id: "matrix-art-1",
        roomId: "matrix-room-a",
        type: "image",
        placement: { wall: "n", offset: 3, height: 1.6 },
        width: 1.2,
        aspect: 0.75,
        image,
        title: ART.title,
        artist: ART.artist,
        story: ART.story,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  const res = await request.post("/api/galleries", { data: doc });
  expect(res.status()).toBe(201);
  const body = (await res.json()) as { id: string; viewUrl: string };
  return { id: body.id, viewUrl: body.viewUrl };
}

// ---------------------------------------------------------------------------
// Editor flow (desktop browsers only): condensed T-050
// ---------------------------------------------------------------------------

test("editor builds rooms and renders 3D", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "phones are view-only");
  test.setTimeout(180_000);
  await page.goto("/edit/local");
  const rooms = page.locator("[data-room-id]");
  await expect(rooms.first()).toBeVisible();
  while ((await rooms.count()) > 1) {
    const before = await rooms.count();
    await rooms.last().click();
    await page.getByRole("button", { name: "Delete room" }).click();
    await expect(rooms).toHaveCount(before - 1);
  }
  await rooms.first().click();
  const addEast = page.getByRole("button", { name: "Add room to the East" });
  await addEast.click();
  await expect(rooms).toHaveCount(2);
  await page.getByLabel("Wall Color").fill("#3355AA");
  await page.getByRole("button", { name: "Top-down", exact: true }).click();
  const canvas3d = page.locator("main canvas");
  await expect(canvas3d).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => distinctColors(page, canvas3d), { timeout: 20_000 })
    .toBeGreaterThan(8);
});

// ---------------------------------------------------------------------------
// Publish / view / edit-key flow (desktop browsers only): condensed T-051
// ---------------------------------------------------------------------------

test("publish, tour in a new context, edit with key", async ({
  page,
  browser,
  request,
}, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "phones are view-only");
  test.setTimeout(240_000);
  void request;
  await page.goto("/edit/local");
  const rooms = page.locator("[data-room-id]");
  await expect(rooms.first()).toBeVisible();
  while ((await rooms.count()) > 1) {
    const before = await rooms.count();
    await rooms.last().click();
    await page.getByRole("button", { name: "Delete room" }).click();
    await expect(rooms).toHaveCount(before - 1);
  }
  await rooms.first().click();
  const addEast = page.getByRole("button", { name: "Add room to the East" });
  await addEast.click();
  await expect(rooms).toHaveCount(2);

  await rooms.first().click();
  await page.getByRole("button", { name: "Add object" }).click();
  const panel = page.getByTestId("object-panel");
  await expect(panel).toBeVisible();
  await panel.locator('input[type="file"]').setInputFiles(ART.file);
  await expect(
    panel.getByRole("img", { name: "Uploaded preview" }),
  ).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Title").fill(ART.title);
  await page.getByLabel("Artist").fill(ART.artist);
  await page.getByLabel(/Story/).fill(ART.story);
  await page.getByRole("button", { name: "Add artwork" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Artwork" }),
  ).toBeVisible();

  await page.getByLabel(/Gallery/).fill("Matrix Show");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const publishSection = page.locator('section[aria-label="Publish"]');
  await expect(publishSection).toBeVisible();
  await publishSection.getByRole("button", { name: "Publish" }).click();
  const viewInput = page.getByLabel("View link");
  const editInput = page.getByLabel("Edit link");
  await expect(viewInput).toHaveValue(/\/g\//);
  const viewPath = await viewInput.inputValue();
  const editPath = await editInput.inputValue();
  const origin = new URL(page.url()).origin;

  const viewContext = await browser.newContext();
  const viewer = await viewContext.newPage();
  await viewer.goto(origin + viewPath);
  await expect(
    viewer.getByRole("heading", { name: "Matrix Show" }),
  ).toBeVisible({ timeout: 30_000 });
  const dialog = viewer.getByRole("dialog");
  const canvas = viewer.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await viewer.waitForTimeout(2000);
  expect(await openPlaque(viewer, canvas, ART.title, false)).toBe(true);
  await expect(dialog).toContainText(ART.story);
  await viewer.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await viewContext.close();

  await page.goto(origin + editPath);
  await expect(page.locator("[data-room-id]").first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByLabel(/Gallery/).fill("Matrix Show (edited)");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(publishSection).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText(/Saved\./);
});

// ---------------------------------------------------------------------------
// Viewer tour (every browser + device): look-around, travel, plaque, minimap
// ---------------------------------------------------------------------------

test("viewer tour: look-around, travel, plaque, minimap", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(240_000);
  const touch = !isDesktop(testInfo.project.name);
  const { viewUrl } = await publishTourGallery(request);
  await page.goto(viewUrl);
  await expect(page.getByRole("heading", { name: "Matrix Tour" })).toBeVisible({
    timeout: 30_000,
  });
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(2000);

  // Artwork plaque in the entrance room (tap on touch, click on desktop).
  const dialog = page.getByRole("dialog");
  expect(await openPlaque(page, canvas, ART.title, touch)).toBe(true);
  await expect(dialog).toContainText(ART.story);
  if (touch) {
    await dialog.getByRole("button", { name: "Close" }).tap();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(dialog).toBeHidden();

  // One-finger drag look-around (T-074): pointer events unify mouse/touch, so
  // a drag exercises the same pipeline on touch projects; taps below prove
  // genuine touch input end to end.
  const box = await canvas.boundingBox();
  if (!box) throw new Error("viewer canvas has no bounding box");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const before = await canvas.screenshot();
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 220, cy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const after = await canvas.screenshot();
  expect(await screenshotDiff(page, before, after)).toBeGreaterThan(0.02);

  // Travel between rooms.
  const roomLabel = page.locator("nav span[aria-live]");
  const firstRoom = await roomLabel.textContent();
  if (touch) {
    await page.getByRole("button", { name: /Next room/ }).tap();
  } else {
    await page.getByRole("button", { name: /Next room/ }).click();
  }
  await expect(roomLabel).not.toHaveText(firstRoom ?? "", { timeout: 15_000 });

  // Minimap tap (T-075) travels to the other room. The viewer hides it below
  // 640 px (`hidden sm:block`), so phones only record that it's hidden.
  const minimap = page.getByTestId("viewer-minimap");
  if ((page.viewportSize()?.width ?? 1280) < 640) {
    await expect(minimap).toBeHidden();
    testInfo.annotations.push({
      type: "finding",
      description: "minimap hidden below 640 px (asked the senior)",
    });
    return;
  }
  await expect(minimap).toBeVisible();
  const beforeTap = await roomLabel.textContent();
  const target = (beforeTap ?? "").includes("Matrix Hall A")
    ? page.getByTestId("minimap-room-matrix-room-b")
    : page.getByTestId("minimap-room-matrix-room-a");
  if (touch) {
    await target.tap();
  } else {
    await target.click();
  }
  await expect(roomLabel).not.toHaveText(beforeTap ?? "", { timeout: 15_000 });
});

// ---------------------------------------------------------------------------
// Slow 3G still shows a loading state (every browser + device)
// ---------------------------------------------------------------------------

test("slow network shows the viewer loading state", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const { viewUrl } = await publishTourGallery(request);
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/api/galleries/*", async (route) => {
    await gate;
    await route.continue();
  });
  const nav = page.goto(viewUrl);
  await expect(page.getByText("Loading gallery…")).toBeVisible({
    timeout: 15_000,
  });
  release();
  await nav;
  await expect(page.getByRole("heading", { name: "Matrix Tour" })).toBeVisible({
    timeout: 30_000,
  });
  await page.unroute("**/api/galleries/*");
});

// ---------------------------------------------------------------------------
// Missing gallery link (every browser + device)
// ---------------------------------------------------------------------------

test("a 404 gallery link explains itself", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto(`/g/matrix-missing-${Date.now()}`);
  await expect(page.getByText(/doesn.+t exist/)).toBeVisible({
    timeout: 30_000,
  });
});

// ---------------------------------------------------------------------------
// Oversize upload shows a friendly error (desktop browsers only)
// ---------------------------------------------------------------------------

test("uploading a huge image shows a friendly error", async ({
  page,
}, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "phones are view-only");
  test.setTimeout(180_000);
  // 2048x2048 white noise resizes to a >2 MB WebP/JPEG part, which the
  // server refuses with 413; the button surfaces the friendly message.
  const dataUrl = await page.evaluate(() => {
    const S = 2048;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const x = c.getContext("2d")!;
    const img = x.createImageData(S, S);
    let seed = 987654321;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      img.data[i] = seed % 256;
      img.data[i + 1] = (seed >> 8) % 256;
      img.data[i + 2] = (seed >> 16) % 256;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c.toDataURL("image/jpeg", 1.0);
  });
  await page.goto("/edit/local");
  const rooms = page.locator("[data-room-id]");
  await expect(rooms.first()).toBeVisible({ timeout: 30_000 });
  await rooms.first().click();
  await page.getByRole("button", { name: "Add object" }).click();
  const panel = page.getByTestId("object-panel");
  await expect(panel).toBeVisible();
  await panel.locator('input[type="file"]').setInputFiles({
    name: "noise.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  await expect(panel.getByRole("alert")).toContainText(/too large/i, {
    timeout: 60_000,
  });
});
