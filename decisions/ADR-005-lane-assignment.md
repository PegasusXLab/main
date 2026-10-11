# ADR-005: Work is split between builders by module
Status: **accepted** (Quang, Q1 "balance the load", 2026-10-10).
## Context
agents/senior.md §7.4 assigned by layer (backend/API → builder-1, frontend/UI → builder-2). plan.md §8 assigns by module. Under the layer rule, builder-2 carried the editor, panels, renderer and pages, while builder-1 carried only schema, compile and API (overview §3, risk 2).
## Decision
Assign by module (plan.md §8):
- **builder-1:** schema, compile, store, 3D renderer/viewer (Scene, Floors, Walls, Frames, Lighting, CameraRig, Plaque), API.
- **builder-2:** 2D editor, panels, upload, pages.
- **devops:** CI, deploy and repo-setup cards (Q11).

Done:
- agents/senior.md §7.4, agents/builder.md §1 and the AGENTS.md team table updated
- T-013 moved to builder-1
## Alternatives considered
- Layer split (the previous rule): unbalanced here, and splits the compile → render pipeline across two people.
- Feature split (each builder owns whole features end to end): more risk of file overlap.
## Consequences
builder-1 owns the pure-data → render pipeline and can test it end to end against the fixture. builder-2 owns everything the creator touches. File overlap stays zero. Sprint 2's viewer and camera cards go to builder-1.
