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
