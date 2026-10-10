# ADR-005: How work is split between builder-1 and builder-2
Status: **proposed, pending Q1.** Date: 2026-10-10.
## Context
agents/senior.md §7.4 assigns by layer: backend/API → builder-1, frontend/UI → builder-2. plan.md §8 assigns by module: builder-1 gets schema, compile, store, 3D renderer and API; builder-2 gets 2D editor, panels and upload. They disagree on the 3D renderer. Under the layer rule, builder-2 carries the editor, panels, renderer and pages while builder-1 carries schema, compile and API (overview §3, risk 2).
## Decision
Until Quang answers Q1, cards follow the rule in force (senior.md): the renderer (T-013) is assigned to builder-2.
Recommended: adopt the module split. If approved:
1. Update step 4 of agents/senior.md.
2. Mark this ADR accepted.
3. Move T-013 (and the Sprint 2 CameraRig/viewer cards) to builder-1.
## Alternatives considered
- Layer split (current rule): clear for API work, but unbalanced here and splits the compile → render pipeline across two people.
- Feature split (each builder owns whole features end to end): more file overlap risk.
## Consequences
With the module split, builder-1 owns the pure-data → render pipeline and can test it end to end against the fixture. builder-2 owns everything the creator touches. File overlap stays zero either way.
