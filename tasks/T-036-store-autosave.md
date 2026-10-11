---
id: T-036
title: "Store: autosave the gallery to localStorage and restore it"
status: merged
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-036-store-autosave
pr: 33
sprint: 2
depends_on: [T-007]
review_rounds: 1
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T12:45:35Z
---
## Goal
A creator never loses work while editing (F7 "autosave to localStorage while editing").
## Acceptance criteria
- [ ] `startAutosave(store, key)` saves the gallery (debounced, e.g. 500 ms) under `pegasus:gallery:<id>` and returns a stop function. `loadAutosave(id)` returns a validated Gallery or null
- [ ] Corrupt or invalid saved data is ignored (never crashes), and storage errors (quota, private mode) are caught
- [ ] Only URLs are saved, never image data (ADR-009). It stays small
- [ ] Unit tests with a fake localStorage
## Files / modules in scope
`src/store/autosave.ts`, `src/store/autosave.test.ts`
## Out of scope
Wiring into the editor page (builder-2, Sprint 2). Server publish (T-031).
## Notes
- Starts after T-007 so the store files aren't touched by two open PRs.
## History
- 2026-10-10T09:44:04Z senior: created as Sprint 2 draft (awaiting Quang approval)
- 2026-10-10T09:47:19Z senior: approved by Quang ("approve")
- 2026-10-10T09:47:49Z senior: status -> ready
- 2026-10-10T10:53:06Z senior: reviewer -> reviewer-2 (ADR-011)
- 2026-10-10T11:27:06Z senior: reviewer -> reviewer-3 (overflow, ADR-012), so Parth can focus on builder-2
- 2026-10-10T11:58:34Z senior: DEFERRED until after 9 am EDT (Quang's crunch plan). Stays ready; don't start before the critical path is done.
- 2026-10-10T12:22:07Z senior: may start now (builder-1 free); was deferred only for priority
- 2026-10-10T12:25:21Z builder-1: status -> in-progress
- 2026-10-10T12:27:18Z builder-1: status -> in-review
- 2026-10-10T12:28:30Z reviewer-2: claimed review (ADR-012 amendment 1)
- 2026-10-10T12:31:05Z reviewer-2: status -> approved
- 2026-10-10T12:45:13Z devops: status -> merging
- 2026-10-10T12:45:35Z devops: status -> merged
