---
agent: reviewer
role: Reviewer
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: Review, UAT, security
current_sprint: 0
current_ticket:
status: watching
updated_at: 2026-10-10T07:30:39Z
---
## Working on now
Read `plan.md`, the notebook sketches, plan/overview.md (Senior review), architecture.md, stack.md, ADR-001..006, BOARD.md and sprint-0.md. Watching the Docs inbox, `tasks/` and open GitHub PRs (polled every ~90 s). No tickets or PRs yet; Sprint 1 is still in planning.

## What I'll check on each PR (from plan.md)
- **Schema (§6):** frozen after approval. Any change to `lib/schema/` without a senior-approved card is blocking.
- **Compile (§5, F4):** `compile()` stays pure TS, no `three` imports. Tests must cover single room, full shared wall, partial overlap, L-shaped 3 rooms, and art on N/E/S/W. Doorway width = min(1.2 m, overlap), height 2.2 m; walls inset 0.075 m; art placement matches the §5.3 table.
- **Editor (F1/F2):** 0.5 m snap, min 2 × 2 m, overlaps rejected, deleting a room removes its artwork, panel and canvas round-trip both ways.
- **Renderer (§7):** `frameloop="demand"`, textures/geometry disposed, no real-time shadows in P0, `leva`/`r3f-perf` dev only.
- **Publish/API (F7), the main security surface:** edit key stored only as a hash and compared in constant time; PUT without a valid key rejected; IDs unguessable; upload route checks type and size, no path traversal, no SVG/HTML passthrough; gallery JSON validated server-side; no secrets in the client bundle.
- **Viewer (F8):** plaque text rendered as text, never `dangerouslySetInnerHTML`.
- **Module ownership (§8):** a PR touching another builder's module gets flagged.
- **Basement repo (§9):** inspiration only. Copied code, shaders or assets are blocking.

## Sprint 0 review focus (plan/sprints/sprint-0.md)
- **T-001 scaffold:** exact pinned versions, `howler` and the storage SDK left out, nothing secret committed, no `.github/` or CI files (devops owns those), `@/*` alias.
- **T-003 schema:** `types.ts` matches plan.md §6 exactly. `geom.ts` is the only comparison helper and compares in whole grid units (round(m × 2)). `validate` never throws. The fixture is L-shaped, passes validation, and has a full and a partial (≥ 1 m) shared wall.
- **T-004 store:** state and action names exactly as architecture.md §4. Entrance moves on delete, and deleting the last room is refused. No autosave or network.
- **T-005 EditorShell:** props only, no store import.
- **T-002 (devops) CI and repo setup:** the CI job name stays stable. The PR template has the builder.md §8 sections. `CLAUDE.md` is just `@AGENTS.md`. docs-guard fails any PR to main that adds Docs-branch files. `.env.example` lists names only, with `BLOB_READ_WRITE_TOKEN=` left empty. A linked test PR shows CI going red on a failing test, then green.
- **T-006 (devops) Vercel and Blob:** the Blob token exists only in Vercel env vars, never in the repo, logs, PR comments or messages. Preview URLs appear on PRs, and I use them for UAT. The rollback runbook is filled in.
- **Pending decisions that change what I check:** Q6 (wall thickness 0.075 m, frames at 0.08 m), Q7 (1.0 m minimum doorway overlap), Q12 (SceneModel additions). Until Quang answers, I hold PRs to the card text.

## Notes for other agents
- Send `review-request` here. I handle them oldest first. Reports go on the PR and into `handoffs/PR-<n>.md`.
- Same operator (Vic) as builder-1. I review builder-1 work only in a separate session from the one that built it. builder-1 PRs still need a non-Vic GitHub approval (SETUP.md, Open item #1), so I post a comment verdict and say so in my `approved` message.
- On approval I message `devops` with type `approved` (PR number, what I tested, anything to watch on merge or deploy).
