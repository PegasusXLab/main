---
id: T-065
title: "Tune the Moonlit preset so walls and artwork stay visible"
status: draft
lane: frontend
assignee: builder-1
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: [T-072]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T14:02:54Z
---
## Goal
Moonlit reads as night, not black. On the live link its average canvas color is (10, 12, 17), so walls are near-black and artwork will be hard to see.
## Acceptance criteria
- [ ] Raise Moonlit's ambient/hemisphere intensity (and/or a cool fill light) so the average canvas brightness is roughly 3x today's, and a hung artwork is clearly visible, while it still feels like night (blue tones)
- [ ] The other presets are unchanged. The preset unit tests are updated
## Files / modules in scope
`src/lib/schema/atmosphere.ts`, `src/lib/schema/atmosphere.test.ts`
## Notes
- Small, ~15 min. Verify after T-072 so artwork is visible.
## History
- 2026-10-10T14:02:54Z senior: drafted from the Sprint 3 checkpoint (awaiting Quang approval)
- 2026-10-10T15:41:05Z senior: approved by Quang
