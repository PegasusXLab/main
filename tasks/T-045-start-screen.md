---
id: T-045
title: "Start screen: new gallery, templates placeholder, open an edit link"
status: ready
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T11:13:25Z
---
## Goal
The landing page from wireframe plan.md §3.1. Features: F7 (open by edit link), F13 placeholder.
## Acceptance criteria
- [ ] `/` shows "New blank gallery" (goes to `/edit/local` with a fresh gallery), two template buttons shown disabled with "coming soon" (F13 is P1), and an "Open edit link" input
- [ ] Pasting an edit link (`…/edit/<id>?key=<k>`) or just its path opens it; invalid input shows an error
- [ ] Default Tailwind only (plan.md §2.1)
## Files / modules in scope
`src/app/page.tsx` (replaces the T-001 placeholder), `src/app/page.test.tsx`
## Out of scope
Real templates (F13, Sprint 3). Loading by id inside the editor (T-046).
## Notes
- Read: plan.md §3.1; AGENTS.md Gotchas (Next 16.4 pages: read the installed docs).
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:25Z senior: status -> ready
