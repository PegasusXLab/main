---
id: T-042
title: "Object panel: add and edit artwork on a wall"
status: draft
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr:
sprint: 2
depends_on: [T-041]
review_rounds: 0
approved_by_human: false
updated_by: senior
updated_at: 2026-10-10T11:00:20Z
---
## Goal
The "Add object" panel from the wireframe (plan.md §3.3). Features: F3.
## Acceptance criteria
- [ ] `<ObjectPanel roomId artworkId? />`: image (via `UploadButton`), wall N/E/S/W, position along the wall (slider), center height (slider), width (m), title, artist, story. Save and Cancel buttons
- [ ] New artwork: `addArtwork`. Editing: `updateArtwork`. Delete: `deleteArtwork` (store contract, architecture §4)
- [ ] Slider ranges come from the room size (offset 0 to wall length; height 0 to wallHeight)
- [ ] Shows the compile issues for this artwork (past the wall's ends, over a doorway, sticking out vertically) next to the fields, from `compile(gallery).issues`
- [ ] Tests for create, edit and the issue display
## Files / modules in scope
`src/panels/ObjectPanel.tsx`, `src/panels/ObjectPanel.test.tsx`
## Out of scope
Showing the panel on the editor page (T-046, after T-025). 2D markers (T-043).
## Notes
- Read: plan.md §3.3, §5.3; architecture §3 (frames, issues) and §4 (store). The sketch's "links" property is P2 (overview G13), so it isn't included here.
## History
- 2026-10-10T11:00:20Z senior: created as Sprint 2 draft (awaiting Quang approval)
