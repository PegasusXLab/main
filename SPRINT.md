---
sprint: 2
phase: build   # planning | build | stabilize | freeze | demo
goal: Content + publish: artwork, 3D interactions, save/publish, viewer; P0 complete on the deployed link
start: 2026-10-10
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
| T-030 | Storage adapter: local disk now, Vultr Object Storage when configured | builder-1 | merged |
| T-031 | Galleries API: create, read, update with the secret edit key | builder-1 | merged |
| T-032 | Upload API: store resized artwork images and return their URLs | builder-1 | merged |
| T-033 | 3D frames: render artwork images on the walls | builder-1 | merged |
| T-034 | CameraRig: fly to a room, face an artwork, orbit in the editor | builder-1 | merged |
| T-035 | Viewer page /g/[id]: tour, Previous/Next, artwork plaque | builder-1 | merged |
| T-036 | Store: autosave the gallery to localStorage and restore it | builder-1 | merged |
| T-040 | Browser image resize to 512 / 1024 / 2048 px WebP | builder-2 | merged |
| T-041 | Upload button: pick an image, resize, upload, return URLs | builder-2 | merged |
| T-042 | Object panel: add and edit artwork on a wall | builder-2 | merged |
| T-043 | 2D art markers on walls, draggable along the wall | builder-2 | merged |
| T-044 | Publish panel: publish, save edits, show view and edit links | builder-2 | merged |
| T-045 | Start screen: new gallery, templates placeholder, open an edit link | builder-2 | merged |
| T-050 | Playwright setup + end-to-end test of the Sprint 1 checkpoint | builder-3 | merged |
| T-051 | End-to-end test of the Sprint 2 checkpoint: publish, view, edit with key | builder-3 | merged |
| T-052 | Seeded demo gallery and a one-command publish script | builder-3 | blocked |
| T-053 | README: what Pegasus is, how to run it, how it works, inspiration disclosure | builder-3 | merged |
| T-037 | Storage hardening: trim Vultr config, log the real error, fix flaky shared-.data tests | builder-1 | merged |
| T-046 | Editor page: wire up artwork, publish, autosave and load-by-link | builder-2 | merged |
| T-072 | BUGFIX: artwork doesn't render (CORS), so serve images via /api/files | builder-1 | merged |
| T-070 | BUGFIX: Safari upload, JPEG fallback | builder-1 | merged |
| T-071 | 3D editor selection highlight | builder-1 | merged |
| T-074 | Viewer: 360 degree look-around while touring | builder-2 | merged |
| T-065 | Moonlit brightness tuning | builder-1 | merged |
| T-076 | Editor undo/redo | builder-1 | merged |
| T-075 | Viewer minimap | builder-2 | merged |
| T-078 | Demo kit (README media + predemo check) | builder-1 | in-progress |
| T-079 | Cross-browser/device e2e matrix (works for every user) | builder-3 | merged |
| T-080 | Rename to Galleriverse (user-visible text) | builder-2 | merged |
| T-081 | Portrait-phone viewer framing | builder-1 | merged |
| T-082 | BUGFIX: minimap hides sound controls | builder-2 | merged |
## Notes
- **P0 checkpoint PASSED at ~09:15 EDT** on the live link (plan/sprints/sprint-2.md). Crunch over; next is the Sprint 2 finish (T-051, T-052, backup video), then Sprint 3 (T-060, T-061, T-063, T-064).
- Sprint 1 checkpoint PASSED (plan/sprints/sprint-1.md Retro). Sprint 2 cards were approved and started early.
- Checkpoint: P0 complete on https://galleriverse.vercel.app/, plus a backup demo video (plan/sprints/sprint-2.md).
- Review routing: builder-1 T-033 goes to reviewer-2; T-034 to T-036 go to reviewer-3; builder-2 and builder-3 go to reviewer (ADR-011, ADR-012).
- Vultr uploads WORK in production (fixed 12:04Z: the endpoint was missing https://). **Code freeze moved: Sat 2026-10-11 18:00 EDT** (submission Sun 09:00 EDT); see plan/overview.md.
