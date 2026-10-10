---
id: T-116
title: Editor panels adopt the shared UI primitives (design system in the sidebar)
status: ready
lane: design
assignee: designer
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: [T-110, T-111]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/editor-primitives.md
updated_by: senior
updated_at: 2026-10-10T17:53:53Z
---
## Goal
The editor sidebar looks like Galleriverse (ADR-013): the panels use the T-111 primitives and T-110 tokens instead of ad-hoc zinc/blue styling.
## Acceptance criteria
- [ ] GalleryPanel, RoomPanel, ObjectPanel and PublishPanel use `src/components/ui` primitives (Button, Input, Label, Select, Slider, Toggle, Tooltip, Dialog where it fits) and token utilities; no new raw hex, and the old `#2563eb` / blue-600 classes are gone from these files.
- [ ] Behaviour unchanged: every field, button, keyboard shortcut and validation works as before. **All `id` / `data-testid` / aria-labels are unchanged** (e2e and unit tests depend on them).
- [ ] Panel layout follows the mockup (team/designer__vic/mockups/d000/install-day-editor-1440.png): uppercase pencil labels, hairline dividers, 2px radius, Klein-blue primary action (Publish), danger for delete.
- [ ] Keyboard and focus order unchanged or better; visible focus ring on every control.
- [ ] Lint, unit tests, `npm run predemo` and the editor e2e pass; `web-design-guidelines` shows no blocking issues on changed files.
## Files / modules in scope
- src/panels/GalleryPanel.tsx, src/panels/RoomPanel.tsx, src/panels/ObjectPanel.tsx, src/components/PublishPanel.tsx (+ their tests only where they assert classes)
## Out of scope
- src/components/ui/* changes (if a primitive needs a fix, make it a separate tiny PR/card note to the senior first).
- EditorShell.tsx, editor2d (T-112, builder-2), viewer3d (T-114/T-083), landing/auth (T-101).
- Any new dependency.
## Build kit
- **Libraries:** none.
- **Primitives:** Button, Input, Label, Select, Slider, Toggle, Tooltip, Dialog from `src/components/ui` (T-111).
- **Skills to load:** `pegasus-ui`, `emil-design-eng`, `web-design-guidelines`.
- **References:** team/designer__vic/specs/editor-primitives.md, tokens-fonts-theme.md, decisions/ADR-013-designer-agents.md.
## Notes
- Panels were builder-2's files; builder-2 is on editor2d (T-112), so there's no overlap. Approved by Quang.
- Target PR ~15:30 EDT; hard stop 16:30 (stabilize). Freeze 18:00 EDT.
## History
- 2026-10-10T17:53:51Z senior: carded; approved by Quang
- 2026-10-10T17:53:53Z senior: status -> ready
