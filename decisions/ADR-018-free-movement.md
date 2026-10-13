# ADR-018: Free movement in the 3D viewer

- **Status:** accepted (Vic, 2026-10-13)
- **Context:** The viewer only moved the camera between fixed room "arrival" poses (ADR-002), with
  drag-look on the spot. Visitors expect to walk around a room (Google Street View, virtual tours,
  games). Walks between rooms also felt jerky: measured peak speed 3x average and turns up to 490 deg/s.

## Decision
1. **Motion:** scripted walks use a cruise speed profile (ease in, constant speed, ease out) and a
   look-ahead, rate-limited heading (<= ~120 deg/s). Glides to art keep their 1 s ease.
2. **Input:** game style. W/S forward/back, A/D strafe relative to the view; arrows keep look-around;
   drag keeps look-around. Keys are ignored in text fields and with Cmd/Ctrl/Alt.
3. **Click-to-walk:** clicking the floor walks to that point. Paths come from A* on a 0.2 m grid over
   the walkable area, smoothed by line of sight, then walked with (1).
4. **Collision model (pure, `src/viewer3d/walkable.ts`):** each room floor inset by a 0.3 m body
   radius; doorway passages connect rooms; free-standing objects are circles. Movement slides along
   blockers (axis-separated) instead of stopping.
5. **Room membership follows the camera:** walking into a room updates the HUD, minimap and music.
   Tour nav, minimap and art clicks still travel to a room or piece as before.
6. **Scope:** viewer and editor 3D POV (both render TourView). No new dependencies, no schema change.

## Consequences
- The camera has a free position, so "current room" is derived from position (`roomAt`) rather than
  only from nav state.
- Ships as three PRs (smoother walks, WASD, click-to-walk), each usable on its own.
- Phones get tap-to-walk; a touch joystick is a possible follow-up.
