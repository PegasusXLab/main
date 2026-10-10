# Board
Only the senior edits this file. Regenerate after creating or reprioritizing tasks. The task card is the source of truth.

Updated 2026-10-10 by senior. Sprint 0 checkpoint passed; Sprint 1 started. Sprint 1 cards are `ready` and assigned; T-006 is carried over. Lanes follow the module split (ADR-005); devops may hold cards (Q11).

| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-001 | Scaffold Next.js app with lint and unit tests | infra | builder-1 | merged | #1 |
| T-002 | CI on PRs, PR template and the pending repo-setup files | infra | devops | merged | #4 |
| T-003 | Schema types, defaults, validation, geometry helper and 3-room sample | backend | builder-1 | merged | #2 |
| T-004 | Gallery store (zustand) with the frozen contract | backend | builder-1 | merged | #6 |
| T-005 | Editor shell layout component | frontend | builder-2 | merged | #3 |
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | infra | devops | in-progress | |
| T-007 | Store: clamp room width/depth to the 2 m minimum | backend | builder-1 | merged | #14 |
| T-010 | Compile: shared edges and doorways | backend | builder-1 | merged | #7 |
| T-011 | Compile: wall segments and frame placement | backend | builder-1 | merged | #9 |
| T-012 | compile() assembly, SceneModel type and the F4 test matrix | backend | builder-1 | merged | #10 |
| T-013 | 3D renderer: Scene, Floors, Walls, Lighting with an orbit camera | frontend | builder-1 | merged | #12 |
| T-020 | 2D canvas: SVG grid with pan and zoom | frontend | builder-2 | merged | #8 |
| T-021 | Rooms in 2D: add, select, move, delete, snapping, overlap | frontend | builder-2 | merged | #13 |
| T-022 | Resize handles for rooms | frontend | builder-2 | merged | #16 |
| T-023 | Add-adjacent-room (+) buttons | frontend | builder-2 | ready | |
| T-024 | Gallery and Room properties panels | frontend | builder-2 | ready | |
| T-025 | Editor page with 2D / 3D toggle (Sprint 1 integration) | frontend | builder-2 | ready | |

### Later (draft ideas, not in Sprints 0–1; need Quang's budget approval)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-090 | [P1] Compress artwork textures on a Vultr server at upload | backend | builder-1 | draft | |
| T-091 | [P2] Bake room lighting on a Vultr GPU when a gallery is published | backend | builder-1 | draft | |
| T-092 | [P2] Run artwork AI features (palette, alt-text, curator) on Vultr | backend | builder-1 | draft | |

### Sprint 2: builder-1 (approved by Quang, ready; started early)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-030 | Storage adapter: local disk now, Vultr Object Storage when configured | backend | builder-1 | merged | #15 |
| T-031 | Galleries API: create, read, update with the secret edit key | backend | builder-1 | in-progress | |
| T-032 | Upload API: store resized artwork images and return their URLs | backend | builder-1 | ready | |
| T-033 | 3D frames: render artwork images on the walls | frontend | builder-1 | ready | |
| T-034 | CameraRig: fly to a room, face an artwork, orbit in the editor | frontend | builder-1 | ready | |
| T-035 | Viewer page /g/[id]: tour, Previous/Next, artwork plaque | frontend | builder-1 | ready | |
| T-036 | Store: autosave the gallery to localStorage and restore it | backend | builder-1 | ready | |
