---
id: T-072
title: "BUGFIX: artwork doesn't render, so serve images same-origin via /api/files (CORS)"
status: merged
lane: backend
assignee: builder-1
reviewer: reviewer-2
branch: feat/T-072-same-origin-images
pr: 42
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: devops
updated_at: 2026-10-10T14:04:05Z
---
## Goal
Uploaded artwork appears in 3D. Today every frame stays empty, because images load from `atl2.vultrobjects.com`, which sends no `Access-Control-Allow-Origin`, so WebGL texture loads are blocked (confirmed in a browser: "blocked by CORS policy").
## Acceptance criteria
- [ ] `VultrStorage.publicUrl(key)` returns a **same-origin** path `/api/files/<key>` (like the local adapter), not the Vultr URL
- [ ] `GET /api/files/[...key]` serves public objects from **whichever adapter is active** (Vultr in production): correct `Content-Type`, long immutable cache headers, 404 for missing or private objects, traversal still refused
- [ ] Tests: Vultr adapter URL shape; files route serving through a faked Vultr adapter (public → 200 + type; private → 404)
- [ ] **Live check after merge:** upload a *colorful* image, hang it, publish, and confirm the frame shows the picture in the viewer with no CORS errors in the console. Record the result in the handoff
## Files / modules in scope
`src/lib/storage/vultr.ts`, `src/lib/storage/vultr.test.ts`, `src/app/api/files/[...key]/route.ts`, `src/app/api/files/[...key]/route.test.ts`
## Out of scope
Bucket CORS configuration (not needed). Rewriting URLs in already-published test galleries.
## Notes
- **Priority 1** (Quang approved, 2026-10-10). This blocks the core demo.
## History
- 2026-10-10T13:56:52Z senior: created + approved by Quang (urgent bugfix)
- 2026-10-10T13:57:18Z senior: status -> ready
- 2026-10-10T13:58:16Z builder-1: status -> in-progress
- 2026-10-10T13:59:25Z builder-1: status -> in-review
- 2026-10-10T14:02:25Z reviewer-2: status -> approved
- 2026-10-10T14:03:58Z devops: status -> merging
- 2026-10-10T14:04:05Z devops: status -> merged
