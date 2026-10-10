# Cross-browser and device matrix (T-079)

Run against the live site on 2026-10-10 (16:55 UTC):

```sh
E2E_BASE_URL=https://galleriverse.vercel.app npx playwright test \
  --project=chromium-matrix --project=firefox --project=webkit \
  --project=iphone --project=ipad --project=android
```

Result: **27 passed, 9 skipped, 0 failed** (2.6 min). Skips are the creator flows on
touch devices: phones and tablets are view-only (Quang).

| Flow                                                                | Chromium | Firefox | WebKit (Safari) | iPhone 15       | iPad (gen 7) | Pixel 7 (Android) |
| ------------------------------------------------------------------- | -------- | ------- | --------------- | --------------- | ------------ | ----------------- |
| Editor: build rooms, recolour, 3D renders                           | pass     | pass    | pass            | n/a (view-only) | n/a          | n/a               |
| Publish, view in a new browser context, plaque, edit with key, save | pass     | pass    | pass            | n/a             | n/a          | n/a               |
| Viewer: tap/click artwork → plaque → close                          | pass     | pass    | pass            | pass (tap)      | pass (tap)   | pass (tap)        |
| Viewer: one-finger drag / mouse drag look-around                    | pass     | pass    | pass            | pass            | pass         | pass              |
| Viewer: Next room travel                                            | pass     | pass    | pass            | pass (tap)      | pass (tap)   | pass (tap)        |
| Viewer: minimap tap travels                                         | pass     | pass    | pass            | hidden ¹        | pass (tap)   | hidden ¹          |
| Slow network: "Loading gallery…" state, then loads                  | pass     | pass    | pass            | pass            | pass         | pass              |
| 404 gallery link explains itself                                    | pass     | pass    | pass            | pass            | pass         | pass              |
| Upload of a >2 MB image shows a friendly error                      | pass     | pass    | pass            | n/a             | n/a          | n/a               |
| Accounts API + start screen (`auth.spec.ts`, T-115) ²               | pass     | –       | –               | –               | –            | –                 |

² Run on the live site 2026-10-10 ~17:55 UTC (Chromium). The UI part (register/login on the
landing page) waits for T-101. Running it on WebKit and iPhone needs `auth.spec.ts` added to
those projects' `testMatch` in `playwright.config.ts` (devops).

## Findings

1. **Minimap hidden on phones.** The viewer wraps it in `hidden sm:block`
   (`src/app/g/[id]/page.tsx`), so below 640 px wide there's no map and no way to open it.
   Sent to the senior as a question (intended or a builder-2 fix?). The test records it as
   hidden on narrow screens instead of failing.

## Known test-engine limitations (not bugs)

- **Playwright WebKit on Windows draws artwork textures gray** (the iPhone and iPad
  projects use WebKit). Real Safari renders them; Quang confirmed on a device. Plaques
  still open on tap because the frame meshes are there.
- **Slow network** is simulated by holding the gallery API response (`page.route`), not by
  a bandwidth profile; it proves the loading state shows while data is in flight.
- Touch look-around uses Playwright's mouse drag (pointer events cover both mouse and
  touch); taps use the real touchscreen API.

## Notes

- Each viewer, slow-network and publish run creates a small test gallery on the live
  storage ("Matrix Tour" / "Matrix Show").
- The matrix skips itself when `E2E_BASE_URL` isn't set, so a plain `npm run test:e2e`
  stays local and Chromium-only.

## Live regression runs (T-117)

Each row is one run against https://galleriverse.vercel.app. The matrix covers 6 projects
(Chromium, Firefox, WebKit, iPhone, iPad, Pixel); `auth.spec.ts` runs on Chromium.

| Time (EDT) | main    | Trigger            | Matrix                  | auth.spec           | Notes                                                                  |
| ---------- | ------- | ------------------ | ----------------------- | ------------------- | ---------------------------------------------------------------------- |
| 14:25      | 10b2b8a | after T-101 merged | 27 pass, 9 skip, 0 fail | 6 pass (UI enabled) | Relative edit links are blocked by the new `type=url` input (reported) |
