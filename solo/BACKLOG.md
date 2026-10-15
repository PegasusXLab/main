# Backlog (solo mode)

Top = next. One line each: `- [size] title: context (links)`. Strike through when shipped and add the PR number.

## Awaiting Vic
(Autopilot parks items here: reason + PR / feature file link.)

## Up next
- ~~[M] **Consolidate editor UX** into one PR: rooms overview, live 3D preview, split view, object drag. Three attempts exist: `feat/editor-ux-relanded` (pushed, conflicts with main), `feat/editor-ux-v2` (WIP snapshot), `feat/editor-ux-controls` (WIP snapshot, adds the LookControls/CameraRig changes + `edit-load-race.spec.ts`). Pick the best base, rebase on main, keep the #185 guard (#101).~~ Already shipped (#104/#106/#107/#113/#118); missing e2e specs in PR #129.
- ~~[M] **Inertial camera re-land**: `feat/camera-inertia-reland` (7647a912). It was reverted in #101 for crashing /edit. Re-land it with a test that mounts /edit.~~ Already shipped as #102 (identical patch).
- ~~[S] **Post-merge review of #124 and #127**: they were merged unreviewed during the freeze (+712 and +2351 lines). Run a review-only pass with the subagent checklist and fix the blocking items.~~ No blocking; hardening in PR #128.

- ~~[S] Guestbook: durable rate limit + no lost signatures on concurrent writes.~~ PR #132.
- ~~[S] Delete stale branches feat/editor-ux-relanded, -v2, -controls, feat/camera-inertia-reland.~~ Done 2026-10-12.
- ~~[S] `/g/[id]` dev console: "URL data in generateMetadata()".~~ PR #131.

- ~~[M] **Viewer navigation**: smoother walks + WASD + click-to-walk.~~ Shipped #138 #139 #141 (ADR-018).
- [S] First-walk hitch residue: Vic's Space still shows a ~55 ms long task on some first walks (Quandale fixed by #138). PR #143 ready-for-vic.
- [M] Touch joystick for phones (tap-to-walk covers it for now).
- [S] **Parallel /ship sessions**: per-worktree port for dev + Playwright (e2e reuses :3000 today, so two sessions would test each other's server), plus a short "parallel" section in the ship skill (claim items, one lane per worktree).
- [S] Waiting on Quang: new `ELEVENLABS_API_KEY` in Vercel + prod redeploy, then smoke voiceovers; Vercel Ignored Build Step `Docs` -> `docs`.
- [S] Optional: GitHub Support purge of orphaned commit 09f3abf3 (old key, now revoked).

## Carried cards (from team mode; card files in `tasks/`)
- ~~[M] T-145b Animated artwork in 3D: GIF/MP4 on wall frames, TV frame style.~~ PR #133.
- [M] T-150 Space kits: 5 one-click room presets + `applyKit`.
- [S] T-151 Kit chips in the room panel (needs T-150).
- [M] T-152 Gemini mood → kit: server route + "Describe the mood" field (paid API: needs an OK).
- [L] T-149 / T-153 / T-154 Piece model: registry + `toPiece`, renderers read pieces, add-piece flow (ADR-016).
- [M] T-155 Showcase gallery: about-me, music, sculpture and video rooms.

## Blocked on a stack decision (needs Vic + Quang)
- [L] Object pipeline: gltf-transform / meshoptimizer, AI 3D provider, background removal (`team/designer__vic/specs/object-pipeline.md`).
- [M] Post-processing looks: `@react-three/postprocessing` (`specs/post-and-looks.md`).

## Ideas
- 
