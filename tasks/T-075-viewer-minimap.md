---
id: T-075
title: "Viewer minimap: rooms in 2D, current room highlighted, click to travel"
status: merged
lane: frontend
assignee: builder-2
reviewer: reviewer
branch:
pr: 49
sprint: 3
depends_on: []
review_rounds: 1
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T15:59:35Z
---
## Goal
Visitors always know where they are and can jump to any room. This supports Quang's click-to-move priority. Features: P2 "minimap in the viewer".
## Acceptance criteria
- [ ] A small corner overlay (~180 px, collapsible) draws every room as a rectangle from the SceneModel floors (plan coordinates), with doorways as gaps or ticks
- [ ] The current room is highlighted. Clicking a room travels there through the same path as Previous/Next (CameraRig easing)
- [ ] It never blocks the 3D view's clicks outside its own box, and it hides gracefully on very small screens
- [ ] Unit test for the plan → minimap scaling. A browser check on the live link
## Files / modules in scope
`src/viewer3d/Minimap.tsx`, `src/viewer3d/Minimap.test.tsx`, `src/app/g/[id]/page.tsx` (mount only)
## Out of scope
The editor. WASD (dropped by Quang).
## History
- 2026-10-10T15:41:05Z senior: created + approved by Quang
- 2026-10-10T15:41:32Z senior: status -> ready
- 2026-10-10T15:48:49Z builder-2: status -> in-progress
- 2026-10-10T15:51:17Z builder-2: status -> in-review
- 2026-10-10T15:53:17Z reviewer: status -> changes-requested
- 2026-10-10T15:56:20Z builder-2: status -> in-review
- 2026-10-10T15:58:58Z reviewer: status -> approved
- 2026-10-10T15:59:20Z devops: status -> merging
- 2026-10-10T15:59:35Z devops: status -> merged
