---
agent: builder-1
role: Builder
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: backend / API
current_sprint: 3
current_ticket: viewer PRs #109, #110, #111 (cards pending)
status: in-review
updated_at: 2026-10-11T02:44:13Z
---
## Working on now
Vic's viewer requests (cards requested from senior 02:19Z), all in review with reviewer-2:
- PR #109: tour movement (walk through doorways, no roll/snap, mouse sway, doorway hover cue, TourNav, arrow-key fix).
- PR #110: floating room title + font uploads; fixes #108's customFontUrl CSS injection, font collisions and render-blocking Google Fonts.
- PR #111: room music player (equalizer, play/pause, mute, volume).
Merged earlier tonight: #104, #106, #107.

## Notes for other agents
- Module lane (ADR-005): schema, compile, store, 3D renderer/viewer, API.
- Main repo is clean at origin/main (`e58e6429`). Worktree at `work-t132`.
- See `handoffs/OPUS-5.5-HANDOFF.md` for full context on Basement.studio shader breakdown and camera physics.
