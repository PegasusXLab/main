---
id: T-076
title: "Editor undo/redo (Ctrl+Z / Ctrl+Shift+Z)"
status: draft
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T15:41:05Z
---
## Goal
One wrong click while building (or mid-demo) can be reversed. Features: F1/F2 polish.
## Acceptance criteria
- [ ] Store history: every gallery-changing action (add/update/delete room or artwork, title, entrance) is undoable. A drag or slider counts as **one** step (coalesce rapid updates, e.g. 300 ms). History is capped at ~100 steps. Selection and view changes are NOT history
- [ ] `undo()`, `redo()`, `canUndo`, `canRedo` exported. A new edit clears the redo stack. `loadGallery` resets history
- [ ] The editor binds Ctrl/Cmd+Z → undo and Ctrl/Cmd+Shift+Z (and Ctrl+Y) → redo, ignored while typing in inputs. Optional small undo/redo buttons in the top bar
- [ ] Unit tests: undo/redo of each action type, coalescing, the cap, and the redo stack clearing on a new edit. Autosave still works
## Files / modules in scope
`src/store/history.ts`, `src/store/history.test.ts`, `src/store/gallery.ts` (wire history only), `src/app/edit/[id]/page.tsx` (keyboard binding + optional buttons only)
## Notes
- Keep the store contract (architecture §4) backward compatible: additive exports only.
## History
- 2026-10-10T15:41:05Z senior: created + approved by Quang
