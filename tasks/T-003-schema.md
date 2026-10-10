---
id: T-003
title: Schema types, defaults, validation, geometry helper and 3-room sample
status: ready
lane: backend
assignee: builder-1
reviewer: reviewer
branch:
pr:
sprint: 0
depends_on: [T-001]
review_rounds: 0
approved_by_human: true
updated_by: senior
updated_at: 2026-10-10T07:54:12Z
---
## Goal
Freeze the Gallery document (plan.md §6) in code so both lanes build against the same types. Features: F4 plus shared groundwork for F1–F8.
## Acceptance criteria
- [ ] `types.ts` matches plan.md §6 exactly (P1 fields optional, as written)
- [ ] `defaults.ts`: `newGallery()`, `newRoom(rect)` (6 × 6 m, wallHeight 3, wallColor `#f2efe9`, floor `wood`, lighting `gallery`), and one plain-number preset object per lighting value (`gallery`, `warm`, `moody`) for T-013 to consume
- [ ] `validate.ts` (zod): rejects bad hex, rooms under 2 × 2 m, coordinates off the 0.5 m grid, an unknown `entranceRoomId`, artwork with an unknown `roomId`; returns a list of issues and never throws on user data
- [ ] `geom.ts`: the single equality/overlap helper (plan/architecture.md §2): grid-unit conversion, same-line test, range overlap, strict rect overlap (touching is not overlap)
- [ ] `src/fixtures/sample-3room.json`: an L-shaped 3-room gallery (one full shared wall, one partial shared wall ≥ 1 m) with 2 artworks using `/fixtures/placeholder.webp`; passes `validate`
- [ ] Unit tests for validate and geom, including touching rooms and a float case like 0.1 + 0.2
## Files / modules in scope
`src/lib/schema/types.ts`, `src/lib/schema/defaults.ts`, `src/lib/schema/validate.ts`, `src/lib/schema/geom.ts`, their `*.test.ts` files, `src/fixtures/sample-3room.json`, `public/fixtures/placeholder.webp`
## Out of scope
The SceneModel type (T-012). The store (T-004). Any change to the plan.md §6 shape (needs the senior + an ADR). A `wallHeight ≥ 2.6` rule until Quang answers G4.
## Notes
- Read: plan.md §5.1, §6; plan/architecture.md §2; plan/overview.md Senior review G1–G5, G8.
- Reference Top idea 2 / R7: lighting presets are data, not code.
- Once merged, the schema is frozen: changes only through the senior.
## History
- 2026-10-10T07:24:55Z senior: created as draft (awaiting Quang approval)
- 2026-10-10T07:53:35Z senior: approved by Quang (breakdown approval, session 2026-10-10)
- 2026-10-10T07:54:12Z senior: status -> ready
