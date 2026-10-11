import { expect, test, type Page } from "@playwright/test";

// T-148: the landing conveyor's paintings open in a lightbox with their wall label and a fact.

/** Script errors, console errors and failed landing images. Network errors from the auth
 * API are left out: a local server without AUTH_SECRET answers /api/auth/* with 503 by design. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
      errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.url().includes("/landing/") && r.status() >= 400)
      errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

test("a painting on the moving belt opens when clicked, and the belt holds still", async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto("/");
  const wrapper = page.locator("[data-conveyor-wrapper]");
  await expect(wrapper).toBeVisible();
  // Click wherever the belt is: walk along the wall line until a painting is under the pointer.
  const box = (await wrapper.boundingBox())!;
  const track = page.locator("[data-conveyor-wrapper] > div");
  let opened = false;
  for (
    let x = box.x + box.width / 2;
    x < box.x + box.width - 40 && !opened;
    x += 60
  ) {
    await page.mouse.click(x, box.y + box.height / 2);
    opened = (await page.getByRole("dialog").count()) > 0;
  }
  expect(opened).toBe(true);
  await expect(
    page.getByRole("dialog").getByText("Did you know?"),
  ).toBeVisible();

  // Paused while open: the track doesn't move.
  const before = await track.getAttribute("style");
  await page.waitForTimeout(600);
  expect(await track.getAttribute("style")).toBe(before);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe("with reduced motion (static strip)", () => {
  test.use({ reducedMotion: "reduce" });

  test("opens, pages through, and closes back to its frame", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const frame = page.getByRole("button", {
      name: "View Study of a Young Woman by Johannes Vermeer",
    });
    await frame.click();

    const dialog = page.getByRole("dialog", {
      name: "Study of a Young Woman, Johannes Vermeer",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Did you know?")).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /View at The Met/ }),
    ).toHaveAttribute(
      "href",
      "https://www.metmuseum.org/art/collection/search/437879",
    );
    await expect(dialog.getByText("1 / 6")).toBeVisible();

    // Next button, then the arrow keys (wrapping back past the first work).
    await dialog.getByRole("button", { name: "Next artwork" }).click();
    await expect(
      page.getByRole("dialog", { name: "Water Lilies, Helena de Kay" }),
    ).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("dialog", { name: "Sunflowers, Vincent van Gogh" }),
    ).toBeVisible();

    // Esc closes and focus returns to the painting that opened it.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(frame).toBeFocused();

    // Enter on the focused painting opens it again; the close button closes it.
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});
