---
id: T-110
title: Design tokens, fonts and theme mirror (Klein blue, one accent)
status: in-review
lane: design
assignee: designer
reviewer: reviewer-2
branch: feat/T-110-design-tokens-fonts-theme
pr: "#55"
sprint: 3
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec: team/designer__vic/specs/tokens-fonts-theme.md
updated_by: designer
updated_at: 2026-10-10T17:32:05Z
---
## Goal
Make one canonical design system (ADR-013) that the whole app, the 2D plan and 3D read from, so that both designers build on the same tokens.
## Acceptance criteria
- [ ] `@theme` in `src/app/globals.css` exposes every token in the spec (plaster, paper, graphite(+hover), pencil, hairline, accent #002fa7 (+hover, +subtle), danger(+hover), kraft, radius 2/2/4 px, motion durations), with no breakage in light/dark OS mode.
- [ ] `next/font/google` loads Archivo (display) and Geist (sans) as `--font-display` / `--font-sans` in `src/app/layout.tsx`, with no layout shift and no runtime external font requests.
- [ ] `src/lib/theme.ts` exports `THEME` with hex values matching the CSS tokens.
- [ ] Focus rings use the accent; `prefers-reduced-motion` disables transitions.
- [ ] Tokens only: existing components keep working (adopting them happens on later cards). All `id` / `data-testid` attributes are unchanged.
- [ ] `npm run lint`, unit tests and `npm run predemo` pass; `web-design-guidelines` shows no blocking issues on changed files.
## Files / modules in scope
- src/app/globals.css (tokens only)
- src/app/layout.tsx (font registration only)
- src/lib/theme.ts (new)
## Out of scope
- Restyling panels, the canvas, the viewer or the start page (later spec cards).
- Replacing `#2563eb` inside editor2d/viewer3d files (those files belong to builder-1 and builder-2; separate cards).
- Any new npm dependency.
## Build kit
- **Libraries:** `next/font/google` (built into Next.js, no new dependency).
- **Primitives:** none (this is the foundation).
- **Skills to load:** `pegasus-ui`, `web-design-guidelines` (install: `bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh . --set designer`).
- **References:** decisions/ADR-013-designer-agents.md, team/designer__vic/briefs/install-day.md, mockup team/designer__vic/mockups/d000/install-day-editor-1440.png.
## Notes
- Spec: team/designer__vic/specs/tokens-fonts-theme.md (status ready-for-cards).
- Reviewer gate: the spec's acceptance criteria. reviewer-2 is Parth's (designer is Vic's).
- Land by ~15:00 EDT so T-111 and designer-2 can build on it before the 18:00 freeze.
## History
- 2026-10-10T17:23:20Z senior: drafted from spec tokens-fonts-theme; awaiting Quang's approval
- 2026-10-10T17:25:59Z senior: status -> ready
- 2026-10-10T17:28:26Z designer: status -> in-progress
- 2026-10-10T17:32:05Z designer: status -> in-review
