# ADR-002: Click-to-travel first, behind a swappable camera component
Status: **proposed**, awaiting Quang's approval. Date: 2026-10-10.
## Context
Visitors need to move through the gallery without instructions (F8). First-person (WASD) controls are wanted later (P2) but cost collision handling and onboarding. plan.md §2.6.
## Decision
P0 uses click-to-travel: click a floor or doorway to fly to that room; click art to face it; Prev/Next buttons. All movement goes through one CameraRig component that takes a target pose (position, look-at, fov) and eases to it from the current pose over about 1 s. Target poses come from SceneModel (room `view`, frame position and rotation), never from hand-placed values. The editor preview uses an orbit mode of the same component. A first-person mode can be added later as another mode, with no change to compile.
## Alternatives considered
- First-person from the start: more natural for gamers, but needs collisions and teaching; too risky in 36 h.
- Fixed "tour" camera on rails: simpler, but takes control away from the visitor.
## Consequences
Compile must emit camera targets (proposed SceneModel addition, Q12). Camera code stays in one file per mode. Reference notes R4–R6 in plan/architecture.md.
