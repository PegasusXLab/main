---
id: T-124
title: Editor views 2D | 3D POV | Top-down - preview the live, unsaved gallery exactly as visitors see it
status: merged
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch: feat/T-124-editor-view-modes
pr: 72
sprint: 3
depends_on: [T-121, T-120, T-135]
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/editor-view-modes.md
updated_by: builder-1
updated_at: 2026-10-10T20:24:06Z
---
## Goal
Creators preview what visitors feel without publishing: the editor's 3D POV view renders the live, unsaved gallery with the SAME tour component as `/g/[id]`. This is one card covering the spec's A + B, cut for the freeze.
## Acceptance criteria (cut scope, must-haves)
- [ ] Extract the tour body of `/g/[id]` into `src/viewer3d/TourView.tsx`; `/g/[id]` renders it and **looks and behaves exactly as before** (publish-view e2e + phone matrix pass unchanged).
- [ ] The editor top bar switcher becomes `2D` · `3D POV` · `Top-down` (Toggle group). Top-down = today's 3D orbit view (relabelled, starting from above). The old autosaved `view: "3d"` maps to Top-down.
- [ ] **3D POV** renders TourView from the live store: change a wall colour or atmosphere in the panel and POV updates without publishing. Prev/Next, doorway/floor travel, drag-look, plaque, arrival title, minimap and mute work.
- [ ] Empty gallery in POV shows "Add a room in 2D". No three.js loads on the initial 2D view. Existing ids/testids/accessible names kept; the e2e '2D'/'3D' role names are updated in the same PR if renamed.
- [ ] Lint, unit tests, editor + publish-view e2e and `npm run predemo` pass.
## Stretch (only if time; drop otherwise)
- Keys 1/2/3; two-way selection sync (panel ⇄ POV); Top-down tilt clamp of ~55°.
## Files / modules in scope
- src/viewer3d/TourView.tsx (new, + test), src/app/g/[id]/page.tsx, src/viewer3d/CameraRig.tsx (top start only), src/components/EditorShell.tsx, src/app/edit/[id]/page.tsx, src/store/gallery.ts (View type only)
## Out of scope
- Schema, new dependencies, Scene internals beyond passing props, landing/auth, panels.
## Build kit
- **Libraries:** none new.
- **Primitives:** `src/components/ui/Toggle.tsx`, `Button.tsx` (T-111).
- **Patterns:** kit `pegasus-ui` §6 (viewer HUD), §5 (3D look rules).
- **Skills to load:** `pegasus-ui`; `web-design-guidelines` on changed files before the PR.
- **References:** team/designer__vic/specs/editor-view-modes.md; `src/app/g/[id]/page.tsx`.
## Notes
- **HARD RULE: merged by 16:30 EDT or dropped.** It touches the visitor viewer (the core of the demo), so if the viewer e2e isn't green, it doesn't merge.
- Reviewer: reviewer-2 (builder-1 is Vic's). builder-1 starts after T-123 is in review (it is).
## History
- 2026-10-10T19:21:07Z senior: drafted from designer spec editor-view-modes; awaiting Quang
- 2026-10-10T19:23:09Z senior: approved by Quang ("ok, make sure our vercel deployment runs safely")
- 2026-10-10T19:23:11Z senior: status -> ready
- 2026-10-10T19:28:30Z builder-1: status -> in-progress
- 2026-10-10T19:28:32Z builder-1: status -> in-review
- 2026-10-10T19:41:58Z reviewer-3: status -> approved
- 2026-10-10T19:48:50Z devops: status -> needs-human
- 2026-10-10T20:20:53Z senior: Quang approved the HANDOVER: if builder-1 hasn't pushed the save fix by 16:30 EDT, builder-3 takes over the fix on branch of PR #72 (re-check reviewer-2).
- 2026-10-10T20:24:06Z builder-1: status -> in-review
- 2026-10-10T20:26:37Z senior: Quang: T-124 waits for the T-135 save-race fix to merge first; the 16:30 cutoff is lifted (failures were the pre-existing flake). Handover to builder-3 cancelled.
- 2026-10-10T20:40:30Z senior: Quang: T-135 then T-124 ASAP. The T-124 re-check moved to reviewer-3 (reviewer-2 unresponsive).
