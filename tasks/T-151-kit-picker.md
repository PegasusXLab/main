---
id: T-151
title: Kit chips in the room panel (one click, undoable)
status: draft
lane: frontend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-150]
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
The room panel shows the 5 kits as visual chips; one click applies a whole look; Undo reverts it. Layer 1 of light customization (≤5 visible controls). Serves: Creative track, demo moment.
## Acceptance criteria
- [ ] New `src/panels/KitPicker.tsx`: a row of 5 chips (swatch dots + name), keyboard-focusable buttons, `aria-pressed` on the kit applied last in this session.
- [ ] Click → `applyKit(roomId, kitId)`; the live 3D preview updates; inline note "Applied <Kit> · Undo" whose Undo calls the store undo.
- [ ] Mounted at the top of RoomPanel's style section with a one-line insert; existing controls stay below, untouched (they are the "Advanced" layer).
- [ ] Component test: renders 5 chips; click applies; undo restores the previous room. Fits a 400 px-wide panel.
## Files / modules in scope
- src/panels/KitPicker.tsx (new, + test), src/panels/RoomPanel.tsx (mount line only)
## Out of scope
- Restyling RoomPanel, collapsing advanced controls (roadmap), the mood field (T-152).
## Build kit
- **Libraries:** none new. Use src/components/ui primitives (Button, Tooltip).
## Notes
- Senior builds; reviewer-3 or fresh reviewer subagent; human Approve; demo-path gate before merge.
- **Demo priority 1.**
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
