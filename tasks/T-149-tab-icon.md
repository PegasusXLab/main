---
id: T-149
title: New tab icon - isometric room corner (Quang's favicon-3-corner.svg)
status: draft
lane: design
assignee: senior
reviewer: reviewer
branch: feat/T-149-tab-icon
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec: Quang's file favicon-3-corner.svg (2026-10-11)
updated_by: senior
updated_at: 2026-10-11T08:05:40Z
---
## Goal
The browser tab shows Quang's new icon: a room corner in plaster greys with a blue artwork on the wall.
## Acceptance criteria
- [ ] src/app/icon.svg is Quang's favicon-3-corner.svg, byte for byte (static SVG, no scripts).
- [ ] On the Vercel preview the tab shows the new icon on /, /g/[id] and /edit/[id] (hard refresh; browsers cache favicons).
- [ ] Build + CI green.
## Files / modules in scope
- src/app/icon.svg
## Out of scope
- The Open Graph image (T-134), apple-touch icon.
## Build kit
- **Libraries:** none.
## Notes
- Built by senior (Quang, 2026-10-11). Reviewer: reviewer (Vic, another operator); devops merges.
## History
- 2026-10-11T08:05:40Z senior: carded from Quang's request ("i want this to be our tab icon ... update it")
