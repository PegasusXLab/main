---
id: T-154
title: Add-piece flow - content first, suggested mount, coming-soon kinds
status: draft
lane: frontend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-149]
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
One add flow for everything: Add piece → pick content → we suggest a mount → place. Serves: Creative track (lightweight UI, no Sims).
## Acceptance criteria
- [ ] AddMenu shows content tiles from `availablePieceDefs()` (Image, GIF, Video, Photo cutout, 3D model, Library object) and a disabled "Coming soon" group from `comingSoonPieceDefs()` with a tooltip each.
- [ ] Choosing content routes to the EXISTING wall flow (ObjectPanel) or floor flow (ObjectAddPanel) with the suggested mount preselected (video → TV frameStyle; cutout/model/library → plinth shape from the entry).
- [ ] No new piece types; nothing new stored. Existing add/edit tests green; new tests for tile → flow routing and disabled coming-soon tiles.
## Files / modules in scope
- src/components/AddMenu.tsx, src/panels/ObjectAddPanel.tsx (preselect only) (+ tests)
## Out of scope
- ObjectPanel/FloorObjectPanel rewrites, new uploads, photo → 3D (roadmap).
## Build kit
- **Libraries:** none new.
## Notes
- Senior builds; reviewer-3 or fresh reviewer subagent; human Approve; demo-path gate before merge.
- Demo priority 3 (drop to roadmap if not merged by 05:00 EDT).
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
