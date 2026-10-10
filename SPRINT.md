---
sprint: 1
phase: build   # planning | build | stabilize | freeze | demo
goal: Editor + compile: build 3 rooms in 2D, toggle, see them in 3D with doorways
start: 2026-10-10
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | devops | needs-human |
| T-010 | Compile: shared edges and doorways | builder-1 | merged |
| T-011 | Compile: wall segments and frame placement | builder-1 | merged |
| T-012 | compile() assembly, SceneModel type and the F4 test matrix | builder-1 | ready |
| T-013 | 3D renderer: Scene, Floors, Walls, Lighting with an orbit camera | builder-1 | ready |
| T-020 | 2D canvas: SVG grid with pan and zoom | builder-2 | ready |
| T-021 | Rooms in 2D: add, select, move, delete, snapping, overlap | builder-2 | ready |
| T-022 | Resize handles for rooms | builder-2 | ready |
| T-023 | Add-adjacent-room (+) buttons | builder-2 | ready |
| T-024 | Gallery and Room properties panels | builder-2 | ready |
| T-025 | Editor page with 2D / 3D toggle (Sprint 1 integration) | builder-2 | ready |
## Notes
- Sprint 0 checkpoint PASSED (plan/sprints/sprint-0.md Retro). Sprint 1 cards are approved, `ready` and assigned. T-006 is carried over from Sprint 0.
- Lane A (builder-1): T-010 → T-011 → T-012 → T-013. Lane B (builder-2): T-020 → T-021 → T-022 / T-023 / T-024 → T-025 (integration, needs T-013).
- Contracts are frozen: store (architecture.md §4, as built) and SceneModel (architecture.md §3, ADR-007). Changes go through a `question` to the senior.
- Checkpoint: verified locally on a fresh clone (plan/sprints/sprint-1.md). Every merge needs green `ci` + `docs-guard` (ruleset active).
- Open: hacking period start/end (freeze time) not set yet; working assumption is hour 28.
