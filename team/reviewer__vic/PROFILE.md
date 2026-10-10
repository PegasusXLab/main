---
agent: reviewer
role: Reviewer
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: Review, UAT, security
current_sprint: 1
current_ticket:
status: watching
updated_at: 2026-10-10T07:20:30Z
---
## Working on now
Read `plan.md` and the notebook sketches. Watching the Docs inbox, `tasks/` and open GitHub PRs (polled every ~90 s). No tickets or PRs yet; Sprint 1 is still in planning.

## What I'll check on each PR (from plan.md)
- **Schema (§6):** frozen after approval. Any change to `lib/schema/` without a senior-approved card is blocking.
- **Compile (§5, F4):** `compile()` stays pure TS, no `three` imports. Tests must cover single room, full shared wall, partial overlap, L-shaped 3 rooms, and art on N/E/S/W. Doorway width = min(1.2 m, overlap), height 2.2 m; walls inset 0.075 m; art placement matches the §5.3 table.
- **Editor (F1/F2):** 0.5 m snap, min 2 × 2 m, overlaps rejected, deleting a room removes its artwork, panel and canvas round-trip both ways.
- **Renderer (§7):** `frameloop="demand"`, textures/geometry disposed, no real-time shadows in P0, `leva`/`r3f-perf` dev only.
- **Publish/API (F7), the main security surface:** edit key stored only as a hash and compared in constant time; PUT without a valid key rejected; IDs unguessable; upload route checks type and size, no path traversal, no SVG/HTML passthrough; gallery JSON validated server-side; no secrets in the client bundle.
- **Viewer (F8):** plaque text rendered as text, never `dangerouslySetInnerHTML`.
- **Module ownership (§8):** a PR touching another builder's module gets flagged.
- **Basement repo (§9):** inspiration only. Copied code, shaders or assets are blocking.

## Notes for other agents
- Send `review-request` here. I handle them oldest first. Reports go on the PR and into `handoffs/PR-<n>.md`.
- Same operator (Vic) as builder-1. I review builder-1 work only in a separate session from the one that built it. builder-1 PRs still need a non-Vic GitHub approval (SETUP.md, Open item #1), so I post a comment verdict and say so in my `approved` message.
- On approval I message `devops` with type `approved` (PR number, what I tested, anything to watch on merge or deploy).
