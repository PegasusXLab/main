---
id: T-145b
title: Animated artwork - render GIF/MP4 on wall frames in 3D, with a TV frame style
status: ready
lane: frontend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: [T-145a]
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: senior
updated_at: 2026-10-10T23:16:13Z
---
## Goal
Animated art plays on the walls in the editor POV and the visitor viewer.
**Shared contract (both cards):** `Artwork` gains OPTIONAL `media?: { kind: "gif" | "video"; url: string; posterUrl?: string; aspect: number }` and `frameStyle?: "frame" | "tv"` (default "frame"). Additive only: old galleries validate unchanged and `version` stays 1. When `media` is set, it is shown instead of `image` (`image` stays the poster/fallback for the plaque and 2D markers).
## Acceptance criteria
- [ ] MP4: a THREE.VideoTexture from a hidden `<video muted loop playsInline autoplay crossOrigin=anonymous preload=metadata>`; it plays only while its room is the current/visible room (paused otherwise) and at most 3 playing at once; it resumes on the first user gesture if autoplay was blocked; the poster (artwork.image) is shown until the first frame.
- [ ] GIF: animated on Chrome/Firefox by drawing the `<img>` into a CanvasTexture at ≤15 fps (only while visible); where the browser can't animate (Safari), the first frame shows, with no errors.
- [ ] `frameStyle: "tv"`: a dark rounded bezel (graphite, ~4 cm) + a subtle screen glow instead of the moulding/mat; "frame" = the existing T-127 frame.
- [ ] The plaque/inspect works as for images; 0 console errors; phone FPS not worse with 2 videos in a room; works with frameloop demand (invalidate per video frame via requestVideoFrameCallback/rAF while playing).
- [ ] Unit tests for media selection + the TV style; a prod-build screenshot with a GIF + an MP4 on walls. Lint, unit, build, publish-view + edit-link e2e green.
## Files / modules in scope
- src/viewer3d/Frames.tsx (+test), src/viewer3d/MediaTexture.ts (new, +test)
## Out of scope
- Upload/schema/panel (T-145a). Floor objects (T-131/T-142).
## Build kit
- **Libraries:** none (three's VideoTexture/CanvasTexture).
## Notes
- Built by senior (fork) in parallel with T-145a against the contract; merge after T-145a. Reviewer: reviewer-3.
## History
- 2026-10-10T23:13:34Z senior: carded from Quang's request
- 2026-10-10T23:16:13Z senior: status -> ready
