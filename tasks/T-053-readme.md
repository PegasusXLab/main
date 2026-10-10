---
id: T-053
title: "README: what Pegasus is, how to run it, how it works, inspiration disclosure"
status: approved
lane: infra
assignee: builder-3
reviewer: reviewer
branch: feat/T-053-readme
pr: 24
sprint: 2
depends_on: []
review_rounds: 0
approved_by_human: true
updated_by: reviewer
updated_at: 2026-10-10T11:42:22Z
---
## Goal
Judges and teammates understand the project from the repo alone. Closes overview C5 (the README disclosure had no owner).
## Acceptance criteria
- [ ] Sections: one-paragraph pitch, live link (https://galliverse.vercel.app/), how to run locally (Node 24, `npm ci`, `npm run dev`, tests), how it works (2D plan → `compile()` → SceneModel → 3D, with a short Mermaid diagram), tech stack, and team
- [ ] **Inspiration disclosure** (plan.md §9, ADR-003): "Inspired by basement.studio's website (basementstudio/website-2k25). No code, shaders, models, textures or fonts were copied."
- [ ] No secrets. No internal agent-workflow details (those live on the Docs branch)
## Files / modules in scope
`README.md`
## Out of scope
Docs-branch files.
## Notes
- Read: plan.md §1, §5, §9; plan/architecture.md §1; plan/stack.md "As built".
## History
- 2026-10-10T11:09:19Z senior: created as draft for builder-3 (ADR-012)
- 2026-10-10T11:12:52Z senior: approved by Quang ("1 ok lets go")
- 2026-10-10T11:13:41Z senior: status -> ready
- 2026-10-10T11:36:25Z builder-3: status -> in-progress
- 2026-10-10T11:38:20Z builder-3: status -> in-review
- 2026-10-10T11:42:22Z reviewer: status -> approved
