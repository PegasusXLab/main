# Sprint summary
## Completed
- T-110 tokens, fonts, theme mirror; T-111 shared UI primitives; T-116 panels adopt primitives.
- T-121 viewer HUD "opening night" (kit pegasus-ui v3, §6 viewer HUD patterns).
- T-127 look foundation L1 (#77); T-131 objects render, component half (#81); T-133 object library (12 CC0 objects).
- Briefs/specs: install-day, objects-and-look (ADR-015 v2), editor-view-modes (became T-124), look-foundation, objects-schema, object-render, object-add-flow, object-pipeline, post-and-looks, object-library.
## Carried over (with reason)
- Editor UX re-land (rooms overview, live 3D preview, split view, object drag): branch `feat/editor-ux-relanded` (c996f601), no card/PR. It re-lands work reverted in #101 (React #185 on /edit). Now conflicts with main after #120–#127; it needs a rebase, a card and a review before a PR.
- object-pipeline and post-and-looks: blocked on stack approvals (gltf-transform/meshoptimizer, postprocessing, AI provider, background removal).
## Blockers hit
- Stack approvals for the objects pipeline never landed before the freeze.
- #100 (inertial camera + vignette) crashed /edit in prod and was reverted (#101).
## Lessons / suggestions for next sprint
- Never self-merge: #81, #87, #88 and #108 skipped ADR-010 review and the devops gate. Open the PR and let devops merge.
- Don't build ahead of a card (T-127 and T-132 duplicated work). Ask the senior, who cards within minutes.
- Any change that touches the editor needs an e2e test that loads /edit before merge (the #185 lesson).
- Keep sprint-N/log.md current; this log stopped at 20:22Z on day 1.
