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
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | infra | devops | merged | |
| T-007 | Store: clamp room width/depth to the 2 m minimum | backend | builder-1 | merged | #14 |
| T-010 | Compile: shared edges and doorways | backend | builder-1 | merged | #7 |
| T-011 | Compile: wall segments and frame placement | backend | builder-1 | merged | #9 |
| T-012 | compile() assembly, SceneModel type and the F4 test matrix | backend | builder-1 | merged | #10 |
| T-013 | 3D renderer: Scene, Floors, Walls, Lighting with an orbit camera | frontend | builder-1 | merged | #12 |
| T-020 | 2D canvas: SVG grid with pan and zoom | frontend | builder-2 | merged | #8 |
| T-021 | Rooms in 2D: add, select, move, delete, snapping, overlap | frontend | builder-2 | merged | #13 |
| T-022 | Resize handles for rooms | frontend | builder-2 | merged | #16 |
| T-023 | Add-adjacent-room (+) buttons | frontend | builder-2 | merged | #18 |
| T-024 | Gallery and Room properties panels | frontend | builder-2 | merged | #20 |
| T-025 | Editor page with 2D / 3D toggle (Sprint 1 integration) | frontend | builder-2 | merged | #22 |

### Later (draft ideas, not in Sprints 0–1; need Quang's budget approval)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-090 | [P1] Compress artwork textures on a Vultr server at upload | backend | builder-1 | draft | |
| T-091 | [P2] Bake room lighting on a Vultr GPU when a gallery is published | backend | builder-1 | draft | |
| T-092 | [P2] Run artwork AI features (palette, alt-text, curator) on Vultr | backend | builder-1 | draft | |
| T-110 | Design tokens, fonts and theme mirror (Klein blue) | design | designer | merged | #55 |
| T-111 | Shared UI primitives (8, on T-110 tokens) | design | designer | merged | #58 |
| T-100 | Accounts backend: register, log in, log out, me (ADR-014) | backend | builder-3 | merged | #57 |
| T-101 | Landing page + register + log in (Quang's reference) | design | designer-2 | merged | #62 |
| T-083 | Viewer on phones: tap-to-open map | frontend | builder-2 | merged | #56 |
| T-112 | 2D editor adopts design colors (Klein blue) | frontend | builder-2 | merged | #60 |
| T-114 | 3D viewer adopts design colors (Klein blue) | frontend | builder-1 | merged | #63 |
| T-115 | E2E: register, log in, log out (API + landing UI) | infra | builder-3 | merged | #59 |
| T-116 | Editor panels adopt shared UI primitives | design | designer | merged | #61 |
| T-117 | Live regression runs after merges + 16:30/17:45 | infra | builder-3 | merged | #65 |
| T-118 | BUGFIX: predemo fails on Windows | infra | builder-3 | merged | #64 |
| T-119 | BUGFIX: landing edit-link input, console 401s, label overlap | design | designer-2 | merged | #69 |
| T-120 | Editor top bar + minimap in the design system | frontend | builder-2 | merged | #66 |
| T-121 | Viewer HUD + plaque in the design system, room-arrival title | design | designer | merged | #67 |
| T-122 | Landing: Your galleries (uses T-102) | design | designer-2 | merged | #71 |
| T-123 | Room audio upload (MP3 etc.), merge by 16:15 or drop | backend | builder-1 | approved | #70 |
| T-124 | Editor views 2D / 3D POV / Top-down (live preview), merge by 16:30 or drop | frontend | builder-1 | in-review | #72 |
| T-127 | Look foundation L1 (lights, materials, no deps) | frontend | builder-1 | ready | |
| T-128 | Objects schema (ADR-015 v2, additive) | backend | builder-3 | ready | |
| T-102 | My galleries backend (owner on publish + list), merge by 16:15 or drop | backend | builder-1 | merged | #68 |

### Sprint 2: builder-1 (approved by Quang, ready; started early)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-030 | Storage adapter: local disk now, Vultr Object Storage when configured | backend | builder-1 | merged | #15 |
| T-031 | Galleries API: create, read, update with the secret edit key | backend | builder-1 | merged | #17 |
| T-032 | Upload API: store resized artwork images and return their URLs | backend | builder-1 | merged | #19 |
| T-033 | 3D frames: render artwork images on the walls | frontend | builder-1 | merged | #21 |
| T-034 | CameraRig: fly to a room, face an artwork, orbit in the editor | frontend | builder-1 | merged | #25 |
| T-035 | Viewer page /g/[id]: tour, Previous/Next, artwork plaque | frontend | builder-1 | merged | #29 |
| T-036 | Store: autosave the gallery to localStorage and restore it | backend | builder-1 | merged | #33 |

### Sprint 2: builder-2 (approved by Quang, ready)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-040 | Browser image resize to 512 / 1024 / 2048 px WebP | frontend | builder-2 | merged | #26 |
| T-041 | Upload button: pick an image, resize, upload, return URLs | frontend | builder-2 | merged | #32 |
| T-042 | Object panel: add and edit artwork on a wall | frontend | builder-2 | merged | #35 |
| T-043 | 2D art markers on walls, draggable along the wall | frontend | builder-2 | merged | #34 |
| T-044 | Publish panel: publish, save edits, show view and edit links | frontend | builder-2 | merged | #27 |
| T-045 | Start screen: new gallery, templates placeholder, open an edit link | frontend | builder-2 | merged | #28 |

### builder-3 (lane: tests + demo, then audio; approved, ready)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-050 | Playwright setup + end-to-end test of the Sprint 1 checkpoint | infra | builder-3 | merged | #23 |
| T-051 | End-to-end test of the Sprint 2 checkpoint: publish, view, edit with key | infra | builder-3 | merged | #46 |
| T-052 | Seeded demo gallery and a one-command publish script | infra | builder-3 | blocked (superseded) | |
| T-053 | README: what Pegasus is, how to run it, how it works, inspiration disclosure | infra | builder-3 | merged | #24 |

### New drafts (awaiting Quang approval)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-037 | Storage hardening: trim Vultr config, log the real error, fix flaky shared-.data tests | backend | builder-1 | merged | #31 |
| T-046 | Editor page: wire up artwork, publish, autosave and load-by-link | frontend | builder-2 | merged | #37 |

### Sprint 3 (approved, ready; window 11:00–15:30 EDT)
| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-060 | Atmosphere: per-room presets (fog, light, background) that blend between rooms | frontend | builder-1 | merged | #36 |
| T-061 | Room audio: per-room music, crossfade between rooms, mute, tap-to-start | frontend | builder-3 | merged | #39 |
| T-062 | Templates: two starter floor plans on the start screen | frontend | builder-2 | merged | #38 |
| T-063 | Room panel: atmosphere preset and music pickers | frontend | builder-2 | merged | #40 |
| T-064 | Viewer: mount room audio and atmosphere with Mute in the title bar | frontend | builder-1 | merged | #41 |
| T-072 | BUGFIX: artwork doesn't render, so serve images same-origin via /api/files (CORS) | backend | builder-1 | merged | #42 |
| T-070 | BUGFIX: Safari upload fails, so fall back to JPEG and accept JPEG/PNG | backend | builder-1 | in-progress | |
| T-071 | 3D editor preview: blue highlight for the selected room and artwork | frontend | builder-1 | merged | #44 |
| T-065 | Tune the Moonlit preset so walls and artwork stay visible | frontend | builder-1 | merged | #47 |
| T-074 | Viewer: 360 degree look-around (drag to look) while touring | frontend | builder-2 | merged | #45 |
| T-075 | Viewer minimap: rooms in 2D, current room highlighted, click to travel | frontend | builder-2 | merged | #49 |
| T-076 | Editor undo/redo (Ctrl+Z / Ctrl+Shift+Z) | backend | builder-1 | merged | #48 |
| T-078 | Demo kit: README screenshots/GIF + pre-demo check | infra | builder-1 | merged | #54 |
| T-079 | Works for every user: cross-browser and device e2e matrix | infra | builder-3 | merged | #53 |
| T-080 | Rename the product to Galleriverse in user-visible text | frontend | builder-2 | merged | #50 |
| T-081 | Viewer on portrait phones: widen the view so artwork is not cut off | frontend | builder-1 | merged | #51 |
| T-082 | BUGFIX: the minimap hides the sound controls in the viewer | frontend | builder-2 | merged | #52 |
