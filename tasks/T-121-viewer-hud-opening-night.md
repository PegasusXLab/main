---
id: T-121
title: Viewer HUD and plaque in the design system + room-arrival title (opening night, light)
status: merging
lane: design
assignee: designer
reviewer: reviewer-3
branch: feat/T-121-viewer-hud-opening-night
pr: 67
sprint: 3
depends_on: [T-110, T-111]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/briefs/install-day.md (viewer-opening-night, light cut)
updated_by: devops
updated_at: 2026-10-10T19:01:00Z
---
## Goal
Visitors see the same Galleriverse look as creators: the viewer HUD and the artwork plaque use the tokens and primitives, plus a small "opening night" moment when entering a room.
## Acceptance criteria
- [x] Viewer HUD (`/g/[id]`): the gallery title, room name, Prev/Next, sound controls and other overlay controls use `Button` / `Tooltip` and tokens (graphite pills with paper text, Klein-blue focus ring); no new raw hex.
- [x] Room-arrival title: when the visitor arrives in a room (Prev/Next, minimap or click travel), the room name fades in (Archivo, ~180 ms in, holds ~1.5 s, ~400 ms out); `prefers-reduced-motion` shows it without animation; it never blocks clicks (`pointer-events: none`).
- [x] Plaque: gallery-label styling (title in display font, artist and story in sans, tabular figures for any numbers; paper card, hairline border, 4px radius); keyboard close and focus behaviour unchanged.
- [x] **All ids / data-testids / aria-labels / accessible names unchanged** (publish-view e2e: 'Next room', 'Previous room', dialog role). Works at 390 px portrait (T-081 framing kept) and doesn't overlap the minimap toggle (T-083).
- [x] Lint, unit tests, publish-view e2e and the phone matrix pass; `web-design-guidelines` shows no blockers.
## Files / modules in scope
- src/app/g/[id]/page.tsx (HUD markup/styles only), src/viewer3d/Plaque.tsx (+ tests)
## Out of scope
- 3D scene, camera, lighting/atmospheres, Minimap (T-120), editor files, any schema change, new dependencies.
## Build kit
- **Libraries:** none (CSS transitions; `motion` is approved but not needed).
- **Primitives:** Button, Tooltip, Dialog (if the plaque is a dialog).
- **Skills to load:** `pegasus-ui`, `emil-design-eng`, `improve-animations`, `web-design-guidelines`.
- **References:** team/designer__vic/briefs/install-day.md (viewer opening night), tokens-fonts-theme.md motion tokens.
## Notes
- Vic's room-UX lane. Designer may write a short spec first if wanted; don't let that delay the PR. Target PR ~16:00; hard stop 16:30 EDT.
## History
- 2026-10-10T18:33:51Z senior: carded; approved by Quang
- 2026-10-10T18:33:57Z senior: status -> ready
- 2026-10-10T18:37:51Z designer: status -> in-progress
- 2026-10-10T18:42:30Z designer: PR #67 opened; status -> in-review
- 2026-10-10T18:42:19Z designer: status -> in-review
- 2026-10-10T18:58:36Z reviewer-3: status -> approved
- 2026-10-10T19:01:00Z devops: status -> merging
