---
id: T-149
title: Piece model core - registry + toPiece (pure, no UI)
status: draft
lane: backend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
Every artwork and floor object can be read as a piece (content + mount + interaction) through a pure function and a registry (ADR-016). Serves: Creative track (personal spaces); base for T-153 and T-154.
## Acceptance criteria
- [ ] `src/lib/pieces/types.ts` contains exactly the frozen interface from ADR-016.
- [ ] `src/lib/pieces/registry.ts`: one `PieceDef` per content kind. Available: image, gif, video, cutout, model, library. Coming soon: photo-album, record, book, link, guestbook, story. Suggested `mounts[0]`: image/gif → wall-frame, video → wall-tv, cutout/model/library → floor-plinth.
- [ ] Exports `pieceDef(content)`, `suggestedMount(content)`, `availablePieceDefs()`, `comingSoonPieceDefs()`.
- [ ] `src/lib/pieces/toPiece.ts`: `pieceFromArtwork`, `pieceFromObject`, `piecesForRoom(gallery, roomId)` following the ADR-016 mapping table (wall + floor pieces together).
- [ ] Unit tests cover every row of the mapping table, missing optional fields (no `media`, no `frameStyle`, no `objects`), and an unknown `source.kind` (falls back without throwing).
- [ ] No react/three imports. Lint, typecheck, tests green.
## Files / modules in scope
- src/lib/pieces/types.ts, src/lib/pieces/registry.ts, src/lib/pieces/toPiece.ts (all new, + tests)
## Out of scope
- Any renderer or panel change (T-153, T-154). Anything under src/lib/schema/.
## Build kit
- **Libraries:** none new.
## Notes
- Session plan: ADR-016 + Quang's Phase-0 answers (2026-10-10 ~23:35 EDT). Senior builds (builder hat); review by reviewer-3 or a fresh reviewer subagent (card + diff + agents/reviewer.md only); a human clicks Approve; merge by devops (or senior acting as devops, logged).
- Demo-path gate before merge: create gallery → 3 rooms → hang 2 works → overview → publish → view link → walk → expand a work.
- Rule: if not approved by 03:00 EDT, moves to roadmap with T-153/T-154.
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
