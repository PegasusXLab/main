---
spec: <slug>
brief: briefs/<slug>.md
status: draft   # draft | ready-for-cards | carded | built | superseded
suggested_assignee: builder-1 | builder-2 | builder-3 | designer
files_in_scope: []
mockups: []     # mockups/<file>.png
---
## What and why
## Behavior and states
default · hover · focus-visible · active · disabled · loading · empty · error, plus the mobile (390px) differences.

## Tokens used
By name only (e.g. `--color-accent`, `--radius-panel`, `--ease-out-quint`). No raw hex or px values in code.

## Motion
| Interaction | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|

## Acceptance criteria (reviewer checks these)
- [ ] Matches the mockup at 1440 and 390
- [ ] Keyboard and focus-visible work; contrast is AA
- [ ] Existing `id`/`data-testid` kept

## Build kit (the senior copies this into the card)
- **Libraries:** e.g. `motion` (approved?), drei `<Html>`, …
- **Primitives:** e.g. `src/components/ui/Button.tsx` (exists / created by card T-…)
- **Skills to load:** always `pegasus-ui`; plus e.g. `emil-design-eng` for motion, `web-design-guidelines` before the PR
- **References:** files to read first
