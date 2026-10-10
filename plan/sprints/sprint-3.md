# Sprint 3: The feel

Status: **planning**. Draft cards T-060 to T-064 await Quang's approval. Window: **11:00–15:30 EDT, Oct 10** (plan/overview.md timeline). Code freeze is 17:09 EDT.

## Goal
Rooms look and sound distinct (MVP acceptance item 5). Creators can start from a template.
**Checkpoint (~15:30 EDT):** on https://galliverse.vercel.app/, a visitor walks 3 rooms and sees and hears a different mood in each; mute works; both templates open in the editor.

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
