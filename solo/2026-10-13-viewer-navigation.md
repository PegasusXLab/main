---
title: Viewer navigation - smoother walks, WASD, click-to-walk
size: L
status: building
branch:
pr:
adr: decisions/ADR-018-free-movement.md
---

## 1 Shape
- **Problem:** Room-to-room walks feel jerky, and inside a room a visitor can only turn on the spot.
  Measured on prod (2026-10-13): frame rate is a steady 60 fps during walks (even at 4x CPU throttle),
  except one 67-83 ms hitch at the start of the first walk. The jerk is the motion itself: walks use
  easeInOutCubic, so speed peaks at **3x the average (7.1-7.2 m/s, a sprint)**, and the heading follows
  the path tangent, so the view whips around at doorway bends at **up to 490 deg/s**.
- **For:** visitors in the viewer (`/g/[id]`) and creators in the editor's 3D POV (same TourView).
- **Surfaces:** `src/viewer3d/CameraRig.tsx` (TravelCamera), `TourView.tsx`, `Scene.tsx`, `Floors.tsx`,
  new `walkMotion.ts`, `walkable.ts`, `FloorCursor.tsx`.
- **Vic's decisions (2026-10-13):** game-style keys (WASD walks/strafes, arrows keep today's look);
  clicking the floor walks to that spot (through doorways); works in the viewer and the editor POV;
  walls and furniture block movement.
- **States:** walking (scripted), free-walking (keys), idle; plaque open (moving closes it);
  typing in a field (keys ignored); touch (no hover ring; tap floor to walk).
- **Tokens:** hover ring in `accent` (#002fa7) on a `paper` halo; no new UI chrome.

### Acceptance criteria
PR A - smoother walks
- [ ] Walk speed has a cruise phase: peak speed <= 1.35x the walk's average (was 3.0x).
- [ ] Heading turns at <= 130 deg/s on the three reference routes (door to the side / behind / ahead).
- [ ] Multi-room walks stay under 6 s; single-doorway walks keep a calm pace (~1.8 m/s cruise).
- [ ] The first walk after load has no long task > 50 ms (scene precompiled at load).
- [ ] Tour nav, minimap and room clicks still walk through doorways; Enter-after-drag still works (#136).

PR B - WASD free movement
- [ ] W/S walk forward/back, A/D strafe, relative to where you look; start/stop eases (no snap).
- [ ] You can't pass through walls; you leave a room only through a doorway; you slide along walls
      and around furniture (plinths, sculptures, chairs) instead of stopping dead.
- [ ] Walking into another room updates the HUD (room title, nav pill, minimap, room music) without
      triggering a scripted walk.
- [ ] Keys are ignored while typing (guestbook, editor fields) or with Cmd/Ctrl/Alt; releasing focus
      stops movement. Moving closes an open plaque. Arrow keys keep today's look-around.
- [ ] Works in the editor's 3D POV (2D shortcuts like A/F aren't mounted there).

PR C - click-to-walk
- [ ] Hovering the floor shows a ring where you'd stand (hidden on touch, while dragging, and where
      you can't stand).
- [ ] Clicking the floor walks there along a path that goes through doorways and around furniture,
      with PR A's motion; clicking art still opens its plaque; a drag never counts as a click.
- [ ] Clicking a spot you can't reach does nothing (no ring shown there).

## 2 Plan
- **PR A files:** `walkMotion.ts` (new, pure: cruise progress profile, walk duration, look-ahead
  heading, rate-limited angle approach) + test; `CameraRig.tsx` walking branch uses it;
  `tourRoute.ts` speed/duration constants; `Scene.tsx` precompile at load (drei `Preload`, already a dep).
- **PR B files:** `walkable.ts` (new, pure: walk map from SceneModel = room rects inset by body
  radius, doorway passages, object circles; `canStand`, `slide`) + test; `CameraRig.tsx` key input +
  velocity + collision + `onStandingRoomChange`; `TourView.tsx` wires room tracking (no walk when the
  camera itself reported the change) and closes the plaque on move; e2e in `tour-nav.spec.ts`.
- **PR C files:** `walkable.ts` adds grid A* (0.2 m cells) + line-of-sight smoothing; `Floors.tsx`
  passes the hit point; `FloorCursor.tsx` (new ring); `Scene.tsx`/`TourView.tsx` wire floor point ->
  walk target; `CameraRig.tsx` plans a curve from the path; e2e.
- **Reuse:** `roomAt`, `doorwayRoute`, `routeWaypoints`, `arrivalPose`, `yawOf`, `angleDelta`,
  `lerpAngle` (`tourRoute.ts`); TourView's `wasDrag` guard; LookControls unchanged.
- **Risks:** render loops (room-change callback must fire only on change, never per frame);
  arrival audio/HUD logic keys off `cameraMoving` (free-walking must not toggle it every frame);
  phone perf (A* grid is ~20k cells max, run once per click); editor POV regressions (run
  `editor.spec.ts` + `editor-ux.spec.ts` on every PR since TourView renders in /edit).
- **New deps / paid services:** none. **Schema:** no change.
- **Tests:** vitest `walkMotion.test.ts`, `walkable.test.ts`, `tourRoute.test.ts`; e2e `tour-nav.spec.ts`
  (+ editor specs). Evidence: before/after walk simulation + prod frame-timing script.

## 3 Build log
- PR A #138 (fix/viewer-smooth-walks): cruise profile + look-ahead heading capped at 120 deg/s. Reference
  routes: peak 7.1 -> 2.5 m/s, turns 490 -> 120 deg/s. A 1.8 m/s cruise first broke room-audio e2e
  (music switches on arrival); kept the old 2.4 m/s average pace. First-walk hitch: WarmUp alone did
  nothing; a CPU profile showed shader linking caused by Atmosphere toggling scene.fog; fog now always
  attached. Quandale first-walk long task 71 ms -> none; Vic's Space reduced, not gone (follow-up).
- PR B #139 (feat/viewer-wasd): walkable.ts + key movement + room tracking. e2e lessons: headless
  software GL runs ~4-8 fps (rig clamps frames), and a single keydown can land before the scene
  mounts; tests now hold keys with repeated keydowns (like OS auto-repeat) and wait for the room.
- PR C (click-to-walk): waits for #138 + #139 to merge (needs both).

## 4 Review
- PR A: self-review (S-sized part). PR B round 1 (Sonnet subagent): approve with nits; fixed the one
  real issue (slide() off-floor start could walk through walls) + test; rest checked, no change.

## 5 Ship
-

## Follow-ups
- Touch joystick for phones (tap-to-walk covers it for now).
- Run/Shift speed, head bob: not planned.
