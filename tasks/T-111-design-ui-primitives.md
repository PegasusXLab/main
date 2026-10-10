---
id: T-111
title: Shared UI primitives (Button, Input, Label, Select, Slider, Toggle, Dialog, Tooltip)
status: in-progress
lane: design
assignee: designer
reviewer: reviewer-2
branch:
pr:
sprint: 3
depends_on: [T-110]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/editor-primitives.md
updated_by: designer
updated_at: 2026-10-10T17:42:03Z
---
## Goal
Ship one set of accessible primitives on the T-110 tokens so that the editor panels (designer) and the landing/auth pages (designer-2) use identical components.
## Acceptance criteria
- [ ] All 8 primitives exist in `src/components/ui/` and are exported from `src/components/ui/index.ts`, matching the spec's variants, sizes and states.
- [ ] No raw hex in primitive code; token utilities only.
- [ ] Keyboard focus and tab order meet WCAG AA; Dialog closes on Escape and on an outside click and traps focus; Tooltip works on focus as well as hover.
- [ ] `disabled` works (reduced opacity, no pointer events); `data-testid` and other DOM props pass through.
- [ ] A unit test per primitive covers render, click/change and keyboard.
- [ ] Not yet adopted anywhere: existing screens are unchanged and `npm run predemo` passes.
## Files / modules in scope
- src/components/ui/{Button,Input,Label,Select,Slider,Toggle,Dialog,Tooltip}.tsx, src/components/ui/index.ts (+ tests)
## Out of scope
- Swapping primitives into panels or pages (later cards per spec, by file owner).
- External UI libraries (shadcn/@base-ui/lucide are pending Quang's decision; the spec says pure React + Tailwind).
## Build kit
- **Libraries:** pure React 19 + Tailwind 4; no new dependency.
- **Primitives:** created in this card.
- **Skills to load:** `pegasus-ui`, `emil-design-eng`, `web-design-guidelines`.
- **References:** team/designer__vic/specs/tokens-fonts-theme.md, decisions/ADR-013-designer-agents.md.
## Notes
- Spec: team/designer__vic/specs/editor-primitives.md.
- designer-2 (Quang) will consume these for the landing/register/login pages (T-101, pending ADR-014).
- Land by ~16:00 EDT.
## History
- 2026-10-10T17:23:20Z senior: drafted from spec editor-primitives; awaiting Quang's approval
- 2026-10-10T17:26:14Z senior: status -> ready
- 2026-10-10T17:42:03Z designer: status -> in-progress
