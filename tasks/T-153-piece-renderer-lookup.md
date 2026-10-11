---
id: T-153
title: Renderers read pieces - mount lookup, per-piece error boundary, plaque fallback
status: draft
lane: frontend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-149, T-145b]
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
A broken or unknown piece can never blank a room; renderers pick the mount through the registry. Serves: stability on the demo path.
## Acceptance criteria
- [ ] Frames.tsx chooses frame vs TV via `pieceFromArtwork(a).mount` (not raw `frameStyle`); Objects.tsx chooses plinth vs standing via `pieceFromObject(o).mount`.
- [ ] Each wall piece sits in its own error boundary (reuse the per-object pattern in Objects.tsx); on error it renders a plain plaque card (title + artist on a light panel) and console.warns once.
- [ ] Unknown content renders the plain plaque, no throw.
- [ ] Tests: a throwing texture → plaque fallback while the rest of the room renders; existing Frames/Objects tests green.
## Files / modules in scope
- src/viewer3d/Frames.tsx, src/viewer3d/Objects.tsx, src/viewer3d/PiecePlaque.tsx (new) (+ tests)
## Out of scope
- New mounts; renderer refactors beyond the lookup. Starts only AFTER T-145b merges (both touch Frames.tsx).
## Build kit
- **Libraries:** none new.
## Notes
- Senior builds; reviewer-3 or fresh reviewer subagent; human Approve; demo-path gate before merge.
- Demo priority 3 (drop to roadmap if not merged by 05:00 EDT).
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
