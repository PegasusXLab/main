---
id: T-062
title: "Templates: two starter floor plans on the start screen"
status: changes-requested
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr: 38
sprint: 3
depends_on: [T-046]
review_rounds: 1
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T12:57:34Z
---
## Goal
Creators start fast (F13). The start screen already shows the two buttons as "coming soon".
## Acceptance criteria
- [ ] `single-hall.json` (one large room) and `three-room-journey.json` (3 connected rooms, distinct colors/lighting), both passing `validate`, with no artwork
- [ ] The start screen buttons are enabled and open `/edit/local` with that template loaded (fresh ids each time)
- [ ] Test: each template validates and loads
## Files / modules in scope
`src/fixtures/templates/single-hall.json`, `src/fixtures/templates/three-room-journey.json`, `src/app/page.tsx`, `src/app/page.test.tsx`
## Out of scope
Editor page changes (if loading needs one, ask the senior first).
## Notes
- Read: plan.md §3.1, §4 F13.
## History
- 2026-10-10T12:11:29Z senior: created as Sprint 3 draft (awaiting Quang approval)
- 2026-10-10T12:14:15Z senior: approved by Quang ("yes approved")
- 2026-10-10T12:15:07Z senior: status -> ready
- 2026-10-10T12:52:32Z builder-2: status -> in-progress
- 2026-10-10T12:55:00Z builder-2: status -> in-review
- 2026-10-10T12:57:34Z reviewer: status -> changes-requested
