---
title: Viewer logo links back to the home page
size: S
status: review
branch: feat/viewer-home-logo
pr: 130
---

## 1 Shape
- **Problem (Vic, 2026-10-12):** someone viewing a space has no way back to the main site.
- **For:** visitor in the viewer. **Surfaces:** `src/viewer3d/TourView.tsx` header.
- **Primitives:** `LogoMark` (T-159), `next/link`.

### Acceptance criteria
- [x] `/g/<id>` header shows the Galleriverse logo left of the gallery title; clicking it goes to `/`.
- [x] Accessible name "Galleriverse home"; keyboard focus ring.
- [x] Not shown in the editor's 3D POV (`fill="parent"`).
- [x] Fits at 390 wide.

## Assumptions (autopilot)
- Logo mark only (no "Galleriverse" wordmark) to keep the HUD light; same size as the title pill (32 px).
- Hidden in the editor POV so creators don't navigate away mid-edit.

## 4 Review
- Self-review (S): 2 files, no ids/testids removed, no deps; screenshots 1440 + 390 local, 1440 preview.

## 5 Ship
- PR #130, CI green, preview smoke OK (logo → `/`, 0 console errors). Awaiting Vic's merge.
