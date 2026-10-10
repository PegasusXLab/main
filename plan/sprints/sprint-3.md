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
