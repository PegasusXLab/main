# ADR-001: Each room builds its own inset walls (no shared double walls)
Status: **accepted** (Quang, Q6, 2026-10-10).
## Context
Rooms that share an edge would each produce a wall on the same line. Two coplanar walls flicker (z-fighting). A single shared wall would couple the rooms (whose color? whose height?). plan.md §5.2 step 4.
## Decision
Each room builds its walls inside its own rectangle, inset from the room edge. Each wall is 0.075 m thick, from the room edge to 0.075 m inside it, so two neighbors make a 0.15 m back-to-back wall. Artwork sits on the inner surface plus a few millimeters (0.08 m from the edge). Each room cuts its own doorway gap and builds its own over-door piece up to its own wall height.
## Alternatives considered
- One shared wall per edge, owned by one room: needs ownership rules and color/height conflicts; more compile code.
- Coplanar walls with a polygon offset: hides z-fighting but not the double geometry, and leaks between room colors.
## Consequences
Rooms stay independent (simpler compile, simpler per-room memo). Different wall heights and colors on two sides of a shared wall just work. Wall geometry doubles on shared edges (negligible at demo sizes).
