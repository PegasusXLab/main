# Sprint 3: The feel

Status: **approved** (Quang, 2026-10-10). T-061 started early (builder-3 was free); the rest follow their dependencies. Window: **11:00–15:30 EDT, Oct 10** (plan/overview.md timeline). Code freeze is 17:09 EDT.

## Goal
Rooms look and sound distinct (MVP acceptance item 5). Creators can start from a template.
**Checkpoint (~15:30 EDT):** on https://galleriverse.vercel.app/, a visitor walks 3 rooms and sees and hears a different mood in each; mute works; both templates open in the editor.

## Lanes
| builder-1 | builder-2 | builder-3 |
|---|---|---|
| T-060 atmosphere (after T-035) → T-064 viewer mount | T-062 templates (after T-046) → T-063 panel pickers | T-061 room audio (no dependencies) |

Not planned unless Quang picks the side challenge: F10 narration (ElevenLabs key), F12 mood prompt (Gemini key).

## Per agent
- **builder-1:** T-060, T-064. Files: `src/lib/schema/atmosphere.ts`, `src/viewer3d/{Atmosphere,Lighting,Scene}.tsx`, then the viewer page. Read F11, reference R7, R6, R12.
- **builder-2:** T-062, T-063. Files: `src/fixtures/templates/*`, `src/app/page.tsx`, `src/panels/RoomPanel.tsx`.
- **builder-3:** T-061. Files: `src/audio/*`, `public/audio/*`, `package.json` (howler only). License-free music, credited.
- **Reviewers:** builder-1 → reviewer-3; builder-2 and builder-3 → reviewer.
- **devops:** merge order T-061 / T-060 before T-063 / T-064. After 15:30, stabilize; after 17:09, `bugfix` only.

## Retro
(written by the senior at sprint end)

## Checkpoint: **PASS (functional), with one tuning follow-up** (senior, 2026-10-10T14:02:54Z, live https://galleriverse.vercel.app/)
Test gallery `G6nGN8XG9s23N8ausoheO`: 3 rooms set to Neon Bunker / Golden Hour / Moonlit, with tracks night-gallery / warm-hum / soft-drift.
- **Look:** each room is measurably distinct. Average canvas RGB: Neon Bunker (56, 38, 63) purple/magenta, Golden Hour (104, 80, 54) warm amber, Moonlit (10, 12, 17).
- **Sound:** "Tap to start sound" and then each room's own track was requested in order (night-gallery.wav, warm-hum.wav, soft-drift.wav). Mute toggles to Unmute.
- **Templates:** Hall and Journey buttons are live on the start screen (T-062).
- No page or console errors.
- **Follow-up T-065:** Moonlit is too dark (walls near black), so artwork would be hard to see. Raise its ambient/brightness.
- **Not yet verifiable:** artwork under each atmosphere, because of the CORS image bug (T-072, in review). Re-check after it merges.
- **T-074 (360° look-around) verified live** (senior, 15:28Z, f43e647): dragging rotates the view in place (the red/blue artwork leaves the frame and the camera faces a corner). A drag never opens the plaque; a plain click on the artwork still does. No console errors.
- **Live checks** (senior, 16:01Z, galleriverse.vercel.app): rename OK (tab + start screen say "Galleriverse"). Undo/redo OK (2 rooms → undo 1 → redo 2). Minimap OK (3 rooms, current highlighted, click → travels). Moonlit now readable. No console errors. **Bug:** the minimap overlaps the top-right sound controls ("Tap to start sound" / Mute hidden behind it). Proposed T-082.
- **T-081 + T-082 verified live** (senior, 16:22Z): the artwork is fully on-screen on iPhone 13 and Pixel 5 emulation (previously cut off at the left edge). The minimap now sits below the sound control (no overlap; the control is clickable). No console errors.

## Design-check T-110 + T-100 (senior, 13:45 EDT, live)
- **T-110 PASS:** body font Geist, the title in Archivo, self-hosted (0 requests to Google Fonts), `--color-accent` = `#002fa7`, 0 console errors, start screen unchanged. Unused tokens (e.g. plaster) are tree-shaken by Tailwind 4 until a component uses them, which is expected.
- **T-100 PASS (production, AUTH_SECRET set):** register 201 + `gv_session` cookie (HttpOnly, Secure, SameSite=Lax, 7 days); me 200, then 401 after logout; duplicate 409; short password 400; wrong password and unknown email get the identical 401 body (no enumeration); `/api/files/users/<hash>.json` returns 404. Test account `senior-check-*@example.com` was left in storage (harmless).
- **T-083 PASS (14:05 EDT, live, iPhone 13 emulation):** published test gallery "Senior Phone Map Check" (`/g/Xywl4yMdLlTi3aZoItr_X`). The "Map" toggle is 44x44 at the top right and doesn't overlap the HUD; the sheet opens with a Klein-blue current room and closes on Escape; 0 console errors. Nit for later: doorway markers are still amber `#fbbf24`, a second accent.
- **T-115 merged:** the accounts API e2e passes live (builder-3).
- **T-112 PASS (14:09 EDT, live):** the Hall template in the editor shows a Klein-blue selection outline, handles and "+" buttons on a plaster grid; no `#2563eb` left in the DOM; 0 console errors. The panels are still the old style (T-116 approved, merging).
- **T-078 merged** (demo kit).
- **T-116 PASS (14:14 EDT, live):** the panels now use the primitives (uppercase pencil labels, hairline dividers, a styled select), and the editor flow works; 0 console errors. Nit: the top-bar Publish button is still graphite (EditorShell, out of scope).
- **Preview env gap (builder-3):** Vercel Preview deployments lack `AUTH_SECRET` and the Vultr storage env, so auth returns 503 and publish returns 500 on previews. Production is fine. This needs Quang (Vercel env scopes).
- **predemo on Windows fails** (`spawnSync npx.cmd` EINVAL, devops). Product flow verified OK by a direct e2e run.
- **T-101 PASS (14:22 EDT, live):** the landing page matches Quang's reference (Archivo headline, Klein-blue CTA, kraft/graphite showcase, New here / Returning tabs). Register via the form → `/edit/local`, `me` 200; the header Log out works (then `me` 401); the `/login` deep link works; templates (Hall, Journey), New blank gallery and Open edit link are all present; iPhone 390 px has no horizontal scroll. Nits: (1) every anonymous visit logs 2 console errors from `GET /api/auth/me` 401 (harmless, but noisy for judges opening devtools); (2) the "145 cm" showcase label overlaps the first artwork.
- **T-114 PASS (14:26 EDT, live):** in the Journey template's 3D view, the selected room has a blue outline driven by `THEME.colors.accent`; the delete button is danger red; 0 errors apart from the anonymous `me` 401. The outline renders a little lighter than #002fa7 (three.js line color handling), which is acceptable.
- **T-117 first live pass (builder-3):** auth.spec 6/6, with the UI tests enabled. **Regression from T-101:** the "Open edit link" input is `type=url`, so pasting a relative `/edit/<id>?key=` link is blocked by the browser.
- **T-102 PASS (14:52 EDT, live, two users):** user A publishes "Owner A Magenta Show" while logged in, and `GET /api/me/galleries` lists it (id, title, viewUrl, editUrl); user C sees `[]`; anonymous gets 401; an anonymous publish still returns 201; saving with the key updated A's title to "Owner A RENAMED Teal"; the index isn't reachable via `/api/files`. Nit: `createdAt` shows midnight (it comes from the gallery JSON).
- **T-118 merged:** predemo is now `node tests/e2e/predemo.mjs`.
- **ADR-015 (designer, proposed):** any medium, floor placement, room styling. It changes the Gallery schema. **Recommend deferring until after the freeze**, needs Quang. Note: its dates are the old wrong ones (Oct 12/11).
- **T-120 + T-121 PASS (15:13 EDT, live at b29284b):** the editor Publish button is Klein blue `rgb(0,47,167)`; the viewer HUD is graphite pills (Previous room / room name / Next room); the "EAST HALL" arrival title fades in on Next and doesn't block clicks; the minimap current room is Klein blue. The only console error is the anonymous `me` 401, which T-119 fixes once it deploys.
- **Prod deploy FAILED for 2f742c9 (T-119)** about 15 s after start (likely Vercel-side). Needs Quang to read the logs. **PR #70** (MP3 upload, victorgooge) is unplanned: no card, held.
- **T-119 + T-122 PASS (15:37 EDT, live at 2f742c9+):** a logged-out landing has **0 console errors**; a relative `/edit/<id>?key=` link now opens; register → publish "Cobalt Orchard Retrospective" → the landing shows "Welcome back", **Your galleries** with View / Edit (Klein blue), and Log out. Nit: the card date shows **Oct 9** because the owner index `createdAt` is midnight UTC.
- **T-102 security note (reviewer):** the owner index stores the plain edit key in editUrl. It's private storage, so not exposed; fix post-freeze.
- **T-123 follow-ups (builder-1):** Vercel function bodies cap at ~4.5 MB, so the advertised 15 MB audio uploads will fail in prod above that; M4A brand check.
- **T-123 PASS (15:47 EDT, live):** a random-bytes .mp3 and an HTML renamed to .mp3 are both rejected with 400; a valid MP3-signature file (50 KB) uploads and is served as `audio/mpeg` + `nosniff`. **Confirmed bug:** a 5.2 MB upload returns 413 `FUNCTION_PAYLOAD_TOO_LARGE` (Vercel body limit), so the "15 MB" limit is false in prod → T-125.
