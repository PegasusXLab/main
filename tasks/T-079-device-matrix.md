---
id: T-079
title: "Works for every user: cross-browser and device e2e matrix against the live site"
status: in-progress
lane: infra
assignee: builder-3
reviewer: reviewer
branch: feat/T-079-device-matrix
pr: 53
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: builder-3
updated_at: 2026-10-10T16:21:59Z
---
## Goal
"Make sure it works properly for every user intended" (Quang). Prove that the creator and visitor flows work in every common browser and device, and surface defects early.
## Acceptance criteria
- [ ] Playwright projects for **Chromium, WebKit (Safari), Firefox**, plus device emulation for an **iPhone** and an **iPad** (touch), runnable against \`E2E_BASE_URL=https://galleriverse.vercel.app\`
- [ ] **Phones are view-only (Quang):** run the editor flow (T-050) on the DESKTOP projects only; on iPhone/iPad/Android, test the VIEWER (open the link, look-around, travel, plaque, minimap). Run the T-051 publish/view/edit-key flow on the desktop projects.
- [ ] **Known test-engine limitation:** Playwright WebKit on Windows may show artwork textures as gray although real Safari renders them (confirmed by Quang on a real device). Note it in MATRIX.md; do not report it as a bug. On touch devices, also check: one-finger drag look-around (T-074), tap to travel, tap artwork → plaque, minimap tap (once T-075 merges)
- [ ] Also check: slow 3G (\`page.route\` throttling or a CDP network profile) still loads with a loading state; a 404 gallery link; an upload of a large image (>2 MB) shows a friendly error
- [ ] **Output:** a results table (browser/device × flow → pass/fail) in \`tests/e2e/MATRIX.md\`. **Every failure** is sent to the senior as a \`question\` with exact repro steps, so it can become a bugfix card. Don't fix app code in this card
## Files / modules in scope
`playwright.config.ts` (projects only), `tests/e2e/matrix.spec.ts`, `tests/e2e/MATRIX.md`
## Out of scope
App code fixes (separate bugfix cards). CI wiring (devops).
## Notes
- Priority over T-078. The demo gallery is no longer needed (T-052 superseded): the team builds the demo through the UI.
## History
- 2026-10-10T15:44:58Z senior: created + approved by Quang ("make sure it works properly for every user")
- 2026-10-10T15:45:47Z senior: status -> ready
- 2026-10-10T15:59:17Z senior: phones view-only; WebKit-on-Windows texture limitation noted (Quang)
- 2026-10-10T16:21:59Z builder-3: status -> in-progress
