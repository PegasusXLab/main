# ADR-004: compile() is pure, and SceneModel is the renderer's only input
Status: **proposed**, awaiting Quang's approval. Date: 2026-10-10.
## Context
Doorway and wall geometry is the riskiest logic (plan.md §12). It must be testable without a browser, and two builders must be able to work on the editor and the renderer in parallel. plan.md §2.4, §5.
## Decision
- `compile(gallery) → { scene: SceneModel, issues }` lives in `src/lib/compile/`, is plain TypeScript and imports no three.js, React or store.
- The renderer reads only SceneModel. The editor writes only the Gallery (through the store).
- P0 recompiles the whole gallery on change. A per-room memo is allowed later only if its key includes every room that shares an edge (doorways depend on neighbors).
## Alternatives considered
- Build three.js meshes directly from the Gallery: fewer types, but untestable geometry and the editor/renderer tied together.
- Per-room memo keyed on the room only: stale doorways when a neighbor moves (overview S4).
## Consequences
The F4 test matrix runs in vitest. The renderer can be built against a fixture before the editor exists. The camera targets also come from SceneModel (ADR-002).
