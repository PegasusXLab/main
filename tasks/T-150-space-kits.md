---
id: T-150
title: Space kits - 5 one-click room presets from existing fields + applyKit
status: draft
lane: backend
assignee: senior
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: false
design_spec:
updated_by: senior
updated_at: 2026-10-11T03:30:00Z
---
## Goal
A creator gives a room a whole look in one click. Kits bundle EXISTING room fields only (no schema change). Serves: Creative track ("the feel"); base for T-151 and T-152.
## Acceptance criteria
- [ ] `src/lib/kits.ts` exports `KITS` (5): `gallery`, `studio-loft`, `neon-bunker`, `golden-hour`, `dreamscape`. Each `{ id, name, blurb, swatch: string[], keywords: string[], patch }`; `patch` sets only wallColor, floor, lighting, wallFinish, look, titleFont (curated id), music.trackId, atmosphere.
- [ ] Every kit's atmosphere uses `preset: "custom"` (Quang decision 5, 23:35 EDT: accent + intensity must work on every kit with what exists today). Starting values below; tune by eye in POV.
- [ ] Pure `kitPatch(room, kitId, opts?: { accentColor?: string; overlayIntensity?: number }): RoomPatch`. Accent replaces `atmosphere.moodColor`; intensity (0–1) scales grain/glow/vignette as `clamp01(base * 2 * intensity)` (0.5 = kit default). Keeps `music` when the room has an uploaded `music.url`; keeps `titleFont`/`customFontUrl` when `titleFont === "custom"`.
- [ ] Store action `applyKit(roomId, kitId, opts?)` is ONE `updateRoom` call, so one undo reverts the whole kit (history test).
- [ ] Every kit patch passes `validateGallery` on a sample gallery (test). Lint, typecheck, tests green.

### Starting values
| id | wall | floor | lighting | finish | look | font | track | moodColor | haze | bright | dir | grain | glow | vignette |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gallery | #f4f2ee | wood | gallery | smooth | museum | archivo | still-air | #fff4e6 | 0 | 0.9 | 30 | 0 | 0.1 | 0.1 |
| studio-loft | #d9d4cc | concrete | warm | brick | film | syne | warm-hum | #ffd9b0 | 0.15 | 0.75 | 120 | 0.25 | 0.2 | 0.25 |
| neon-bunker | #1a1024 | concrete | moody | concrete | retro | mono | night-gallery | #ff3cac | 0.6 | 0.45 | 200 | 0.35 | 0.7 | 0.45 |
| golden-hour | #e8d2b0 | wood | warm | plaster | film | cormorant | soft-drift | #ffb35c | 0.35 | 0.8 | 250 | 0.2 | 0.4 | 0.3 |
| dreamscape | #e9e4f5 | marble | gallery | smooth | dream | fraunces | soft-drift | #b9a7ff | 0.5 | 0.7 | 300 | 0.1 | 0.6 | 0.2 |
## Files / modules in scope
- src/lib/kits.ts (new, + test), src/store/gallery.ts (add `applyKit` only, + test)
## Out of scope
- UI (T-151), Gemini (T-152), new named atmosphere presets, schema.
## Build kit
- **Libraries:** none new.
## Notes
- Session plan: ADR-016 + Quang's Phase-0 answers. Senior builds; reviewer-3 or fresh reviewer subagent; human Approve; demo-path gate before merge.
- **Demo priority 1.**
## History
- 2026-10-11T03:30:00Z senior: carded (draft)
