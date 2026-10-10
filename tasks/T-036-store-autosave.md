---
id: T-036
title: "Store: autosave the gallery to localStorage and restore it"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-007]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T09:44:04Z
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
