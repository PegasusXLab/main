---
id: T-050
title: "Playwright setup + end-to-end test of the Sprint 1 checkpoint"
status: approved
lane: infra
assignee: builder-3
reviewer: reviewer
branch: feat/T-050-playwright-e2e
pr: 23
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T11:34:51Z
---
## Goal
The Sprint 1 checkpoint ("build 3 rooms in 2D → toggle → see them in 3D") becomes a repeatable test instead of a manual click-through.
## Acceptance criteria
- [ ] `playwright.config.ts`: Chromium only. Starts `npm run dev` (or `next start` after build), base URL `http://localhost:3000`
- [ ] `npm run test:e2e` script added (the only `package.json` change)
- [ ] `tests/e2e/editor.spec.ts`: on `/edit/local`, add 3 connected rooms with the "+" buttons, change one wall color in the panel, toggle to 3D, and assert the WebGL canvas renders (non-blank pixels or a test hook). Marked `test.fixme` until T-025 merges, then enabled in the same PR or a follow-up commit on this card
- [ ] Runs locally with no accounts (local storage adapter). It doesn't need to run in CI; adding it to CI is devops's call
- [ ] `tests/e2e/README.md`: how to run it
## Files / modules in scope
`playwright.config.ts`, `tests/e2e/editor.spec.ts`, `tests/e2e/README.md`, `package.json` + lockfile (the `test:e2e` script only)
## Out of scope
App code. CI config (`.github/`, devops). Sprint 2 flows (T-051).
## Notes
- Read: plan/sprints/sprint-1.md (checkpoint steps), agents/reviewer.md (UAT), AGENTS.md Gotchas.
- `@playwright/test` is already a dev dependency (T-001). If browsers need installing, note `npx playwright install chromium` in the README.
## History
- 2026-10-10T11:09:19Z senior: created as draft for builder-3 (ADR-012; lane approved by Quang)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:29Z senior: status -> ready
- 2026-10-10T11:23:03Z builder-3: status -> in-progress
- 2026-10-10T11:30:11Z builder-3: status -> in-review
- 2026-10-10T11:34:51Z reviewer: status -> approved
