import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

// T-144: a room's custom song plays while the visitor is in that room, stops when they leave,
// and resumes where it left off when they come back. Real-browser autoplay rules apply.
test.use({ launchOptions: { args: ["--autoplay-policy=user-gesture-required"] } });

function toneWav(freq: number, seconds: number): Buffer {
  const sr = 8000;
  const n = sr * seconds;
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(6000 * Math.sin((2 * Math.PI * freq * i) / sr)), 44 + i * 2);
  }
  return b;
}

async function upload(request: APIRequestContext, buf: Buffer, name: string): Promise<string> {
  const res = await request.post("/api/upload/audio", {
    multipart: { file: { name, mimeType: "audio/wav", buffer: buf } },
  });
  expect(res.status()).toBe(201);
  return ((await res.json()) as { url: string }).url;
}

async function publish(request: APIRequestContext, a: string, c: string): Promise<string> {
  const now = new Date().toISOString();
  const room = (id: string, name: string, x: number, music?: { url: string }) => ({
    id, name, description: "", x, y: 0, w: 6, d: 6, wallHeight: 3,
    wallColor: "#f2efe9", floor: "wood", lighting: "gallery", ...(music ? { music } : {}),
  });
  const res = await request.post("/api/galleries", {
    data: {
      id: "room-audio", version: 1, title: "Room Audio E2E", entranceRoomId: "r1",
      rooms: [room("r1", "Room A", 0, { url: a }), room("r2", "Room B", 6), room("r3", "Room C", 12, { url: c })],
      artworks: [], createdAt: now, updatedAt: now,
    },
  });
  expect(res.status()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

/** Playback state of the Howl for `src` (Howler is a browser global). */
async function soundState(page: Page, src: string) {
  return page.evaluate((s) => {
    const howls = ((window as unknown as { Howler?: { _howls?: Array<Record<string, unknown>> } }).Howler?._howls ?? []) as Array<{
      _src: string | string[];
      playing(): boolean;
      seek(): number;
    }>;
    const h = howls.find((x) => String(x._src).includes(s));
    return h ? { playing: h.playing(), pos: Number(h.seek()) } : null;
  }, src);
}

test("a room's custom song plays on enter, stops on leave and resumes on return", async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const a = await upload(request, toneWav(440, 30), "room-a.wav");
  const c = await upload(request, toneWav(660, 30), "room-c.wav");
  const id = await publish(request, a, c);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`/g/${id}`);
  await expect(page.getByTestId("room-audio-mute")).toBeVisible({ timeout: 30_000 });
  // The visitor's first interaction (browsers block sound before one).
  await page.mouse.click(10, 300);

  await expect.poll(async () => (await soundState(page, a))?.playing, { timeout: 15_000 }).toBe(true);
  await page.waitForTimeout(2500);
  const before = (await soundState(page, a))!.pos;
  expect(before).toBeGreaterThan(1);

  // Leave A → B (no music): A fades out and stops. Music switches on arrival (+1 s), and the walk
  // itself runs slower than real time under headless software GL (frames are clamped), so allow
  // the walk + delay rather than a tight 5 s (ADR-018 walks ease in/out and finish their turn).
  await page.getByRole("button", { name: /Next room/ }).click();
  await expect.poll(async () => (await soundState(page, a))?.playing, { timeout: 12_000 }).toBe(false);

  // Back to A: it resumes from where it was, not from 0.
  await page.getByRole("button", { name: /Previous room/ }).click();
  await expect.poll(async () => (await soundState(page, a))?.playing, { timeout: 10_000 }).toBe(true);
  const after = (await soundState(page, a))!.pos;
  expect(after).toBeGreaterThanOrEqual(before - 0.25);

  expect(errors).toEqual([]);
});
