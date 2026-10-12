---
title: Animated artwork in 3D (T-145b): GIF/MP4 on wall frames + TV frame style
size: M
status: shipped
branch: feat/animated-art-render
pr: 133
---

## 1 Shape
- **Problem:** T-145a (#99) lets creators upload a GIF/MP4 for an artwork and pick a "TV" frame style, but the 3D view ignores both: walls show only the poster image in the normal frame.
- **For:** visitors in the viewer (`/g/<id>`) and creators in the editor's 3D POV / preview.
- **Surfaces:** 3D wall frames (`Frames`), fed by compile (`frames.ts`) and `Scene`.
- **States:** no media → today's image frame (unchanged) · loading → poster (artwork.image) · playing → animated texture · paused (other room / over budget) → last frame stays · error / unsupported (e.g. GIF on Safari without ImageDecoder) → poster, no console error.
- **Look:** "frame" = existing T-127 moulding + mat. "tv" = dark graphite rounded bezel (~4 cm, `THEME.colors.graphite`-ish #121214 like the TV device) and a soft blue screen glow on the wall (reuse `getGlowTexture` from `DoorwayCue.tsx`); screen unlit (`toneMapped=false`, like the TV device).

### Acceptance criteria (from the card)
- [ ] MP4 → `THREE.VideoTexture` from a hidden `<video muted loop playsInline crossOrigin=anonymous preload=metadata>`; plays only while its room is current, **max 3 playing** (nearest to camera); resumes on first gesture if autoplay is blocked; poster until first frame.
- [ ] GIF → animated (Chrome/Firefox) into a `CanvasTexture` at ≤15 fps, only while active; where it can't animate, the first frame/poster shows with no errors.
- [ ] `frameStyle: "tv"` → bezel + glow instead of moulding/mat (works for image, GIF and MP4).
- [ ] Inspect / click / hover / selection outline behave as for images; 0 console errors; on-demand rendering: invalidate per video frame (rVFC, else ≤30 fps timer) and per GIF tick.
- [ ] Unit tests for media selection, the active-set budget and the TV style; screenshot with a GIF + MP4 on walls; lint, unit, build, `publish-view` + `edit-link` + editor e2e green.

## 2 Plan
- **Files:**
  - `src/lib/compile/frames.ts` (+test): `Frame` gains optional `media?: { kind; url; aspect }` and `frameStyle?: "tv"` passed through from the artwork (compile output only; the schema already has them from T-145a). Poster stays `imageUrl`.
  - `src/viewer3d/MediaTexture.ts` (new, +test): pure `frameMedia(frame)` and `chooseActive(candidates, currentRoomId, max = 3)`; `createVideoSource(url, invalidate)` and `createGifSource(url, invalidate)`, each `{ texture, play(), pause(), dispose(), onReady }`.
    - Video: hidden `<video>` as in the card, `VideoTexture`, `requestVideoFrameCallback` → `invalidate()`, else a 30 fps interval while playing; `play()` falls back to a one-time `pointerdown` listener when autoplay is refused (same as `TvDevice`).
    - GIF: `ImageDecoder` (WebCodecs, Chrome/Edge/Firefox) decodes frames on demand into a canvas → `CanvasTexture`, ticking at min(frame duration, 1000/15 ms) only while playing. No `ImageDecoder` (Safari) → no source: the poster stays. (More robust than drawing an off-DOM `<img>`, which Chromium doesn't animate.)
  - `src/viewer3d/Frames.tsx` (+test): `ArtworkFrame` takes an optional media source and draws the texture on the art plane once ready (standard material for "frame", unlit screen for "tv"); `TvBezel` draws the "tv" style. `Frames` gets `currentRoomId` and runs one 700 ms scheduler (`useThree` camera) that plays the `chooseActive` set and pauses the rest, like `TvDevice`'s near/far check.
  - `src/viewer3d/Scene.tsx`: pass `currentRoomId` to `<Frames>` (one line).
- **Reuse:** `TvDevice` video lifecycle (`Devices.tsx:94–160`), `getGlowTexture` (`DoorwayCue.tsx:22`), `SCREEN_GAIN` idea, existing frame materials/geometries, `noRaycast`.
- **Risks:** too many decoders/videos on phones (budget of 3 + pause off-room); render loops (sources live in refs, and `setState` only once on first frame); texture disposal on unmount/URL change; CORS on media URLs (the same origins already serve WebGL image textures); `frameloop="demand"` freezes video if we forget to invalidate.
- **New deps / paid services:** none. **Schema:** unchanged (fields exist since T-145a).
- **Tests:** vitest `MediaTexture.test.ts`, `Frames.test.tsx` (tv bezel vs moulding, media plane), `frames.test.ts` (pass-through); e2e `publish-view.spec.ts`, `edit-link.spec.ts`, `editor.spec.ts`, `editor-ux.spec.ts` (Scene is used by `/edit`); `npm run build`; screenshots 1440 + 390 with a GIF + an MP4 (MP4 from `public/showcase/sun-eruption.mp4`; a small test GIF generated locally, not committed).

## Assumptions
- Bezel is a plain dark box (no rounded corners), consistent with the TV device body; drei RoundedBox not used.
- GIF animation via ImageDecoder (WebCodecs), not drawing an off-DOM <img> (Chromium doesn't advance those).
- Gate 1 approved by Vic (plan mode), 2026-10-12.

## 3 Build log
- Compile: `Frame.media` / `frameStyle` pass-through (+test).
- `MediaTexture.ts`: video + GIF sources, `chooseActive`, registry (+4 tests). `Frames.tsx`: media plane, TV bezel/glow, scheduler (+2 tests). `Scene.tsx`: passes `currentRoomId`.
- Found in manual test: "texImage2D: no video" when a source was torn down while its material still sampled it (Fast Refresh / StrictMode). Fix: drop to the poster in cleanup, release the video/texture 1 s later.
- Bezel darkened (#0d0d0f, low env reflection); still reads dark grey under gallery spotlights, same as the TV device.
- Checks: lint 0 errors, typecheck, 882+ unit tests, `npm run build`; e2e publish-view, edit-link, editor, editor-ux, editor-preview, edit-mount: 6/6.
- Manual (dev): MP4 on TV plays (frames change), GIF animates (two screenshots differ), editor 3D POV plays, 390 wide OK, load time unchanged (~0.9 s with or without media), 0 console errors from this change.

## 4 Review
- Round 1 (sonnet): approve, 0 blocking. Applied: lazy GIF fetch on first play, animate while streaming (+ stop ticking on failure), video play() no-op while playing, gesture listener removed on dispose. Left: media.aspect unused (poster from T-145a matches the media).

## 5 Ship
- PR #133, merged 69570ea7. CI green; preview smoke on a test gallery (MP4 on TV frame plays, 0 console errors, ~1 s load, 390 OK); prod smoke OK.
- Test gallery left on shared storage: /g/FUv2Y2LSHg-j1D-zWw3XW "T-145b preview check (test)" (its MP4 URL points at the PR preview).
