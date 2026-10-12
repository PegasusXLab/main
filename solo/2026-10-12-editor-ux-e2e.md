---
title: Editor UX + camera re-land (close out) → e2e specs
size: S
status: review
branch: test/editor-ux-spec
pr: 129
---

## 1 Shape
- **Finding:** both backlog items were already shipped. `feat/camera-inertia-reland` 7647a912 has the same patch-id as #102 (fd193836). Editor UX (rooms overview, live preview, split view, object drag) landed via #104, #106, #107, #113, #118; main is ahead of all three `feat/editor-ux-*` branches in every file.
- **Gap:** `tests/e2e/editor-ux.spec.ts` (mandatory in `/ship` for `/edit` changes) never landed; T-135 load race only covered by a latency-dependent spec.

### Acceptance criteria
- [x] `editor-ux.spec.ts`: rooms list → room panel → back → Escape → "+ Add Room", fails on page errors / #185.
- [x] `edit-load-race.spec.ts`: deterministic slow-GET version of T-135.

## Assumptions (autopilot)
- Treated the two M items as "already shipped" and only landed the missing test coverage; the stale branches can be deleted (not done: Vic's call).

## 4 Review
- Self-review (S): test-only, selectors verified on main.

## 5 Ship
- PR #129, CI green, local e2e 3/3 (editor-ux, edit-load-race, editor). Awaiting Vic's merge.

## Follow-ups
- Delete stale branches `feat/editor-ux-relanded`, `feat/editor-ux-v2`, `feat/editor-ux-controls`, `feat/camera-inertia-reland` (Vic to confirm).
