# Pegasus UI kit (for builders)

The designer owns this kit. The senior references it in every UI card's **Build kit**, and builders install it once, then re-run the script whenever the designer sends an `fyi: kit updated`.

## Install (each teammate, in your code checkout)
```bash
# Claude Code builders (builder-1, builder-3):
bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh . --tool claude
# Antigravity (builder-2, Parth):
bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh . --tool antigravity
# Designer machine (full set):
bash ../pegasus-docs/team/designer__vic/kit/install-skills.sh . --set designer
```
Run it from the code checkout; on Windows, use Git Bash. Skills go in `.claude/skills/` or `.agents/skills/` and are git-excluded automatically. Third-party skills are pinned to the commits the designer reviewed, and it takes about 10 seconds.

| Skill | Set | Use it for |
|---|---|---|
| `pegasus-ui` | builder | **Always** on UI cards: tokens, primitives, motion, 3D look rules, non-negotiables |
| `emil-design-eng` | builder | Anything that animates: easing, springs, durations, polish details |
| `web-design-guidelines` | builder | Run on changed files before opening a PR (a11y, forms, motion, perf) |
| `impeccable`, `frontend-design`, `design-taste-frontend`, `find-animation-opportunities`, `improve-animations`, `review-animations` | designer | Direction, audits, critique, motion planning |

## How a card uses it
A UI card's Notes link the spec (`team/designer__vic/specs/<slug>.md`) and copy its **Build kit**: the libraries, primitives and skills to load. If the card and the spec disagree, ask the senior. If the spec is unclear, ask the designer.
