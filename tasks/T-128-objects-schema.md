---
id: T-128
title: Objects schema (ADR-015 v2, additive) - Gallery.objects[], room look fields, compile stage, store actions
status: in-review
lane: backend
assignee: builder-3
reviewer: reviewer-2
branch: feat/T-128-store-actions
pr: 85
sprint: 4
depends_on: [T-124]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/objects-schema.md
updated_by: builder-3
updated_at: 2026-10-10T21:31:08Z
---
## Goal
The data model for free-standing objects and room styling, ADDITIVE ONLY: existing galleries load, save and render unchanged (ADR-015 v2).
## Acceptance criteria
(Copied from the spec; the reviewer checks these.)
- [ ] Every existing fixture, autosave and published gallery validates and compiles exactly as before (snapshot test). No changes in `src/editor2d`, `src/panels` or `frames.ts`.
- [ ] Round-trip: a gallery with one cutout, one model (ready), one model (job running, with a fallback) and one library object validates, compiles (the generating object compiles as a cutout), autosaves and reloads.
- [ ] Every validation rule above has a failing-case test with the right `path`.
- [ ] Undo/redo covers add, move and delete of objects.
- [ ] The zod ↔ types `Equal<>` guard still compiles.

- [ ] Gate: every existing fixture and every published test gallery validates unchanged; `version` stays 1; publish-view + editor e2e green.
## Files / modules in scope
- src/lib/schema/types.ts, validate.ts (+test), defaults.ts
- src/lib/compile/types.ts, compile.ts, objects.ts (new, +test)
- src/store/gallery.ts (object actions + undo). **Only after T-124 merges** (T-124 also edits this file).
## Out of scope
- Rendering (object-render, next card), the add flow/UI, the upload/AI pipeline (needs Quang: deps + money).
## Build kit
- **Libraries:** none new (zod exists).
- **Skills to load:** `pegasus-ui` (for naming only). This card is data-layer work.
- **References:**
  - `src/lib/schema/validate.ts` (patterns and messages)
  - `src/lib/compile/frames.ts` (stage pattern and world coordinates)
  - `src/store/gallery.ts` (artwork actions and undo)
  - ADR-004 (pure compile), ADR-007 (SceneModel additions)

## Notes
- ADR-015 v2 accepted by Quang ("continue on", 15:45 EDT) as ADDITIVE schema only; the AI/pipeline parts stay pending.
- Reviewer: reviewer (builder-3 is Sergio's).
## History
- 2026-10-10T19:40:24Z senior: carded from spec objects-schema; approved by Quang
- 2026-10-10T19:40:32Z senior: status -> ready
- 2026-10-10T19:47:28Z builder-3: status -> in-progress
- 2026-10-10T20:01:02Z builder-3: status -> in-review
- 2026-10-10T20:18:36Z reviewer-2: status -> approved
- 2026-10-10T20:28:59Z devops: status -> merging
- 2026-10-10T20:29:10Z devops: status -> merged
- 2026-10-10T21:20:27Z builder-3: status -> in-progress
- 2026-10-10T21:31:08Z builder-3: status -> in-review
