---
id: T-051
title: "End-to-end test of the Sprint 2 checkpoint: publish, view, edit with key"
status: in-review
lane: infra
assignee: builder-3
reviewer: reviewer
branch: feat/T-051-publish-view-e2e
pr: 46
sprint: 2
depends_on: [T-050]
review_rounds: 0
approved_by_human: true
updated_by: builder-3
updated_at: 2026-10-10T15:15:01Z
---
## Goal
The P0 demo flow (plan.md §11, items 1–4) is checked automatically before every demo.
## Acceptance criteria
- [ ] `tests/e2e/publish-view.spec.ts`: build 3 rooms, add 2 artworks (with a fixture image), publish → capture the view and edit links, open the view link in a **new browser context**, use Next/Previous, click an artwork, check that the plaque shows the title and story, press Esc
- [ ] Editing via the edit link saves. Editing with a wrong key is refused (expects the 403 message)
- [ ] Steps whose feature isn't merged yet are `test.fixme`, and get enabled as T-035 / T-044 / T-046 land
- [ ] Can target a deployed URL via `E2E_BASE_URL` (e.g. the Vercel preview) without code changes
## Files / modules in scope
`tests/e2e/publish-view.spec.ts`, `tests/e2e/fixtures/art-1.jpg`, `tests/e2e/fixtures/art-2.jpg` (team-made or license-free images only)
## Out of scope
App code. CI.
## Notes
- Read: plan.md §11; plan/sprints/sprint-2.md (checkpoint).
## History
- 2026-10-10T11:09:19Z senior: created as draft for builder-3 (ADR-012)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:33Z senior: status -> ready
- 2026-10-10T11:58:34Z senior: DEFERRED until after 9 am EDT (Quang's crunch plan). Stays ready; don't start before the critical path is done.
- 2026-10-10T14:05:40Z builder-3: status -> in-progress
- 2026-10-10T15:06:00Z builder-3: status -> in-review
- 2026-10-10T15:09:11Z reviewer: status -> approved
- 2026-10-10T15:09:37Z devops: status -> needs-human
- 2026-10-10T15:15:01Z builder-3: status -> in-review
