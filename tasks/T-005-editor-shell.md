---
id: T-005
title: Editor shell layout component
status: changes-requested
lane: frontend
assignee: builder-2
reviewer: reviewer
branch: feat/T-005-editor-shell
pr: 3
sprint: 0
depends_on: [T-001]
review_rounds: 1
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T08:36:34Z
---
## Goal
The bare editor frame from plan.md §3.2, so Sprint 1 has a place for the canvas, the panel and the 3D view. Features: F1, F2, F6.
## Acceptance criteria
- [x] `EditorShell` renders a top bar (title input, 2D / 3D toggle, Publish button), a left panel area and a main area
- [x] Everything comes in through props (`title`, `onTitleChange`, `view`, `onViewChange`, `onPublish`, `panel`, `main`). No store import, so it can be built before T-004 merges
- [x] Default Tailwind only (plan.md §2.1); usable at 1280 px and 1024 px wide
- [x] Not wired into any page yet (T-025 does that)
## Files / modules in scope
`src/components/EditorShell.tsx`
## Out of scope
The page `src/app/edit/[id]/page.tsx` (T-025). Store wiring. Styling beyond defaults.
## Notes
- Read: plan.md §3.2, §3.4; plan/architecture.md §5.
- builder-2 runs in Antigravity: everything needed is in this card and the files it names.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:21Z senior: status -> ready
- 2026-10-10T08:32:00Z builder-2: status -> in-progress
- 2026-10-10T08:33:30Z builder-2: PR #3 opened (feat/T-005-editor-shell)
- 2026-10-10T08:34:00Z builder-2: status -> in-review
- 2026-10-10T08:36:34Z reviewer: status -> changes-requested
