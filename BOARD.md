# Board
Only the senior edits this file. Regenerate after creating or reprioritizing tasks. The task card is the source of truth.

Updated 2026-10-11T03:30Z by senior (regenerated from tasks/). Hacklanta final night: piece/kit/Gemini cards T-149 to T-157 are drafts pending Quang; T-147 dropped to roadmap.

| ID | Title | Lane | Assignee | Status | PR |
|---|---|---|---|---|---|
| T-001 | Scaffold Next.js app with lint and unit tests | infra | builder-1 | merged | 1 |
| T-002 | CI on PRs, PR template and the pending repo-setup files | infra | devops | merged | 4 |
| T-003 | Schema types, defaults, validation, geometry helper and 3-room sample | backend | builder-1 | merged | 2 |
| T-004 | Gallery store (zustand) with the frozen contract | backend | builder-1 | merged | 6 |
| T-005 | Editor shell layout component | frontend | builder-2 | merged | 3 |
| T-006 | Vercel previews per PR and the Vultr Object Storage bucket | infra | devops | merged |  |
| T-007 | "Store: clamp room width/depth to the 2 m minimum" | backend | builder-1 | merged | 14 |
| T-010 | "Compile: shared edges and doorways" | backend | builder-1 | merged | 7 |
| T-011 | "Compile: wall segments and frame placement" | backend | builder-1 | merged | 9 |
| T-012 | compile() assembly, SceneModel type and the F4 test matrix | backend | builder-1 | merged | 10 |
| T-013 | "3D renderer: Scene, Floors, Walls, Lighting with an orbit camera" | frontend | builder-1 | merged | 12 |
| T-020 | "2D canvas: SVG grid with pan and zoom" | frontend | builder-2 | merged | 8 |
| T-021 | "Rooms in 2D: add, select, move, delete, snapping, overlap" | frontend | builder-2 | merged | 13 |
| T-022 | Resize handles for rooms | frontend | builder-2 | merged | 16 |
| T-023 | Add-adjacent-room (+) buttons | frontend | builder-2 | merged | 18 |
| T-024 | Gallery and Room properties panels | frontend | builder-2 | merged | 20 |
| T-025 | Editor page with 2D / 3D toggle (Sprint 1 integration) | frontend | builder-2 | merged | 22 |
| T-030 | "Storage adapter: local disk now, Vultr Object Storage when configured" | backend | builder-1 | merged | 15 |
| T-031 | "Galleries API: create, read, update with the secret edit key" | backend | builder-1 | merged | 17 |
| T-032 | "Upload API: store resized artwork images and return their URLs" | backend | builder-1 | merged | 19 |
| T-033 | "3D frames: render artwork images on the walls" | frontend | builder-1 | merged | 21 |
| T-034 | "CameraRig: fly to a room, face an artwork, orbit in the editor" | frontend | builder-1 | merged | 25 |
| T-035 | "Viewer page /g/[id]: tour, Previous/Next, artwork plaque" | frontend | builder-1 | merged | 29 |
| T-036 | "Store: autosave the gallery to localStorage and restore it" | backend | builder-1 | merged | 33 |
| T-037 | "Storage hardening: trim Vultr config, log the real error, fix flaky shared-.data tests" | backend | builder-1 | merged | 31 |
| T-040 | "Browser image resize to 512 / 1024 / 2048 px WebP" | frontend | builder-2 | merged | 26 |
| T-041 | "Upload button: pick an image, resize, upload, return URLs" | frontend | builder-2 | merged | 32 |
| T-042 | "Object panel: add and edit artwork on a wall" | frontend | builder-2 | merged | 35 |
| T-043 | "2D art markers on walls, draggable along the wall" | frontend | builder-2 | merged | 34 |
| T-044 | "Publish panel: publish, save edits, show view and edit links" | frontend | builder-2 | merged | 27 |
| T-045 | "Start screen: new gallery, templates placeholder, open an edit link" | frontend | builder-2 | merged | 28 |
| T-046 | "Editor page: wire up artwork, publish, autosave and load-by-link" | frontend | builder-2 | merged | 37 |
| T-050 | "Playwright setup + end-to-end test of the Sprint 1 checkpoint" | infra | builder-3 | merged | 30 |
| T-051 | "End-to-end test of the Sprint 2 checkpoint: publish, view, edit with key" | infra | builder-3 | merged | 46 |
| T-052 | "Seeded demo gallery and a one-command publish script" | infra | builder-3 | blocked |  |
| T-053 | "README: what Pegasus is, how to run it, how it works, inspiration disclosure" | infra | builder-3 | merged | 24 |
| T-060 | "Atmosphere: per-room presets (fog, light, background) that blend between rooms" | frontend | builder-1 | merged | 36 |
| T-061 | "Room audio: per-room music, crossfade between rooms, mute, tap-to-start" | frontend | builder-3 | merged | 39 |
| T-062 | "Templates: two starter floor plans on the start screen" | frontend | builder-2 | merged | 38 |
| T-063 | "Room panel: atmosphere preset and music pickers" | frontend | builder-2 | merged | 40 |
| T-064 | "Viewer: mount room audio and atmosphere with Mute in the title bar" | frontend | builder-1 | merged | 41 |
| T-065 | "Tune the Moonlit preset so walls and artwork stay visible" | frontend | builder-1 | merged | 47 |
| T-070 | "BUGFIX: Safari upload fails, so fall back to JPEG and accept JPEG/PNG" | backend | builder-1 | merged | 43 |
| T-071 | "3D editor preview: blue highlight for the selected room and artwork" | frontend | builder-1 | merged | 44 |
| T-072 | "BUGFIX: artwork doesn't render, so serve images same-origin via /api/files (CORS)" | backend | builder-1 | merged | 42 |
| T-074 | "Viewer: 360° look-around (drag to look) while touring" | frontend | builder-2 | merged | 45 |
| T-075 | "Viewer minimap: rooms in 2D, current room highlighted, click to travel" | frontend | builder-2 | merged | 49 |
| T-076 | "Editor undo/redo (Ctrl+Z / Ctrl+Shift+Z)" | backend | builder-1 | merged | 48 |
| T-078 | "Demo kit: README screenshots/GIF + one-command pre-demo check against the live site" | infra | builder-1 | merged | 54 |
| T-079 | "Works for every user: cross-browser and device e2e matrix against the live site" | infra | builder-3 | merged | 53 |
| T-080 | "Rename the product to Galleriverse in user-visible text" | frontend | builder-2 | merged | 50 |
| T-081 | "Viewer on portrait phones: widen the view so artwork isn't cut off" | frontend | builder-1 | merged | 51 |
| T-082 | "BUGFIX: the minimap hides the sound controls in the viewer" | frontend | builder-2 | merged | 52 |
| T-083 | Viewer on phones - tap-to-open map | frontend | builder-2 | merged | 56 |
| T-090 | "[P1] Compress artwork textures on a Vultr server at upload" | backend | builder-1 | draft |  |
| T-091 | "[P2] Bake room lighting on a Vultr GPU when a gallery is published" | backend | builder-1 | draft |  |
| T-092 | "[P2] Run artwork AI features (palette, alt-text, curator) on Vultr" | backend | builder-1 | draft |  |
| T-100 | Accounts backend - register, log in, log out, me (ADR-014) | backend | builder-3 | merged | 57 |
| T-101 | Landing page for new users + register + log in (Quang's reference design) | design | designer-2 | merged |  |
| T-102 | My galleries (backend): record the owner on publish + list a user's galleries | backend | builder-1 | merged | 68 |
| T-110 | Design tokens, fonts and theme mirror (Klein blue, one accent) | design | designer | merged | " |
| T-111 | Shared UI primitives (Button, Input, Label, Select, Slider, Toggle, Dialog, Tooltip) | design | designer | merged | " |
| T-112 | 2D editor adopts the design colors (Klein blue accent, plaster grid) | frontend | builder-2 | merged |  |
| T-114 | 3D viewer adopts the design colors (Klein blue selection) | frontend | builder-1 | merged | 63 |
| T-115 | End-to-end tests - register, log in, log out (API now, landing UI when T-101 lands) | infra | builder-3 | merged | 59 |
| T-116 | Editor panels adopt the shared UI primitives (design system in the sidebar) | design | designer | merged | 61 |
| T-117 | Live regression runs after each design merge and at 16:30 (matrix + accounts) | infra | builder-3 | merged | 79 |
| T-118 | BUGFIX - npm run predemo fails on Windows (spawnSync npx.cmd EINVAL) | infra | builder-3 | merged | 64 |
| T-119 | BUGFIX - landing: relative edit links blocked, console 401 noise, showcase label overlap | design | designer-2 | merged | 69 |
| T-120 | Editor top bar adopts the design system (Klein-blue Publish, 2D/3D toggle) + minimap colors | frontend | builder-2 | merged | 66 |
| T-121 | Viewer HUD and plaque in the design system + room-arrival title (opening night, light) | design | designer | merged | 67 |
| T-122 | Landing - "Your galleries" for logged-in users (uses T-102) | design | designer-2 | merged | 71 |
| T-123 | Room audio - creators upload their own MP3/WAV/OGG/M4A; plays when visitors enter the room | backend | builder-1 | merged | 70 |
| T-124 | Editor views 2D / 3D POV / Top-down - preview the live, unsaved gallery exactly as visitors see it | frontend | builder-1 | merged | 72 |
| T-125 | BUGFIX - audio upload: cap at 4 MB with a clear message (Vercel body limit) | backend | builder-3 | merged | 75 |
| T-126 | BUGFIX - Your galleries shows the wrong date (createdAt midnight UTC) | backend | builder-3 | merged | 76 |
| T-127 | Look foundation (L1) - IBL, picture lights, ceilings, baseboards, corner AO, PBR floors, frame moulding | design | designer | merged | 77 |
| T-128 | Objects schema (ADR-015 v2, additive) - Gallery.objects[], room look fields, compile stage, store actions | backend | builder-3 | in-review | 85 |
| T-129 | Landing showcase strip drifts like a conveyor belt (seamless left-to-right loop) | design | designer-2 | merged | 74 |
| T-130 | Security - owner index stores no edit keys; the owner edits via session (ADR-014) | backend | senior | merged | 82 |
| T-131 | Objects render - plinths, cutout sculptures, GLB models in rooms (object-render spec) | frontend | builder-1 | merged | 81 |
| T-132 | Objects add flow - '+ Add' menu, place/drag/rotate in 2D, library + .glb upload (no AI) | frontend | builder-1 | approved | 95 |
| T-133 | Object library - 12 CC0 objects (benches, plants, plinths, vitrine...) with posters and credits | design | designer | merged | 78 |
| T-134 | Link previews - title, description and Open Graph image for sharing galleriverse.vercel.app | design | designer-2 | merged | 89 |
| T-135 | BUGFIX - intermittent: after 'Saved.' a reload shows the OLD title (editor load/save race) | frontend | builder-1 | merged |  |
| T-136 | Per-gallery link previews: /g/<id> shares show that gallery's title + an OG image | frontend | senior | merged | 83 |
| T-137 | BUGFIX - audio upload: M4A must be audio (check the ftyp brand), not any MP4 | backend | senior | merged | 80 |
| T-138 | README refresh for the submission - today's features, screenshots, live link | infra | senior | merged | 86 |
| T-139 | Link-preview title in Archivo (bundle the font for next/og) | frontend | senior | merged | 94 |
| T-140 | Landing - 'See a featured gallery' link to the team's demo gallery | design | designer-2 | ready |  |
| T-141 | T-130 part 2 - owners open and save their galleries without the edit key; remove the encrypted key copy | backend | senior | ready |  |
| T-142 | BUGFIX - library/GLB objects never become visible in production builds (placeholder column stays) | frontend | senior | in-progress |  |
| T-143 | Landing hanging wall - real public-domain artworks from the Art Institute of Chicago (AIC) | frontend | senior | blocked |  |
| T-144 | BUGFIX - custom room songs don't play; must play on enter, stop on leave, resume where left off on return | frontend | senior | merged | 92 |
| T-145a | Animated artwork - upload + schema + editor: GIF and MP4 (≤4 MB) on the Object panel | backend | builder-3 | merged | 99 |
| T-145b | Animated artwork - render GIF/MP4 on wall frames in 3D, with a TV frame style | frontend | senior | ready |  |
| T-146 | BUGFIX auth - logins keep the session and user data; track new vs returning users | backend | builder-3 | merged | 103 |
| T-147 | Auth - new accounts verify their email with a 6-digit code (Gmail SMTP) | backend | senior | draft |  |
| T-148 | Landing showcase - click a painting to see it big, with its wall label and a "Did you know?" fact | design | designer-2 | ready |  |
| T-149 | Piece model core - registry + toPiece (pure, no UI) | backend | senior | draft |  |
| T-150 | Space kits - 5 one-click room presets from existing fields + applyKit | backend | senior | draft |  |
| T-151 | Kit chips in the room panel (one click, undoable) | frontend | senior | draft |  |
| T-152 | Gemini mood -> kit - server route + "Describe the mood" field | backend | senior | draft |  |
| T-153 | Renderers read pieces - mount lookup, per-piece error boundary, plaque fallback | frontend | senior | draft |  |
| T-154 | Add-piece flow - content first, suggested mount, coming-soon kinds | frontend | senior | draft |  |
| T-155 | Showcase gallery - about-me, music, sculpture, video rooms; one room via Gemini | infra | senior | draft |  |
| T-156 | Roadmap slide content + tech list (plan/hackathon.md) | design | senior | draft |  |
| T-157 | BUGFIX - viewer crash guard (post chain + Canvas error boundaries, WebGL context loss) | frontend | senior | draft |  |
