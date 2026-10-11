# Setup report: `designer` agent (operator: Vic), pilot

_Written 2026-10-10 by Vic's setup agent. The agent is a Product Designer that pairs with `senior` to (1) polish the CAD menus and the 3D navigation/customization UX, and (2) give the site a distinctive theme. **Quang is building a competing version, and the team will compare the two.**_

> **TL;DR for other agents:** Set up on Vic's laptop with 8 vetted design skills. One agent with two playbooks: **site** and **space**. It's waiting for its first session with Vic. The shared scripts don't know the id `designer` yet (§5).

## 1. Shape
- **One agent, two playbooks.**
  - **Site** (theme): tokens in `globals.css` `@theme`, a `next/font` pair, shared primitives, editor chrome, viewer HUD.
  - **Space** (3D/CAD): the system users style their spaces with ("space kits" on the atmosphere and lighting presets, visual pickers, camera choreography, one shared accent token across 2D/3D/UI). Not a single fixed look.
- **Working with the senior** (full protocol in [LOOP.md](LOOP.md)): two-way. Briefs and specs go to the senior; decisions, cards and design-lane assignments come back. The senior puts each spec's **Build kit** (libraries, primitives, skills) on the builders' cards, and builders install the skills with [kit/install-skills.sh](kit/README.md).
- **Steps:**
  1. The designer reads the plan, board and handoffs to learn what's built.
  2. It writes specs and mockups in this folder.
  3. It proposes cards to the senior, who creates them (lane `design`).
  4. The designer implements its own cards like a builder.
  5. Review goes to **reviewer-2 (Parth)**, never Vic's `reviewer`.

## 2. Research verdicts
| Resource | Verdict | Why |
|---|---|---|
| **Impeccable** (pbakaus, Apache-2.0) | Installed, **primary** | `init`/`document` capture PRODUCT.md and DESIGN.md; `shape`/`critique`/`audit`/`polish`/`animate`/`typeset`… cover both playbooks. Its engine downloads from GitHub releases with sha256 verification. The optional edit hook is **not** enabled. |
| **frontend-design** (Anthropic, Apache-2.0) | Installed | The skill basement.studio keeps in its own repo. Forces a distinctive direction (palette, type roles, signature element) before code. |
| **Taste Skill** (`design-taste-frontend`, MIT) | Installed (core only) | Variance/motion/density dials, used as a second opinion. Skipped its brutalist/soft/imagegen variants. |
| **Emil Kowalski** (MIT) | Installed: `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `review-animations` | Motion craft (easing, springs, under 300ms UI). `review-animations` is part of the review gate. |
| **Vercel web-design-guidelines** | Installed | The final gate: file:line findings. Fetches the rules live from `vercel-labs/web-interface-guidelines` (MIT). |
| **Motion.dev** | Proposed dependency (§5) | React layout and gesture animation, with R3F support. Chosen over Anime.js. |
| Anime.js | Skipped | Overlaps Motion and is weaker in React. |
| Magic UI / Smooth UI / Kokonut / Unlumen (MIT) | Reference only | shadcn registries on Motion + Tailwind. Copy one component at a time, rebuilt on our tokens; no shadcn base. |
| RetroUI | Skipped | Neo-brutalist; only if we choose that direction. |
| Bklit UI | Skipped | Charts plus a shadcn skill, and we have neither. |
| 21st.dev Magic MCP | Skipped | Needs an API key, and its generic shadcn output works against anti-slop. |
| Manus | Skipped | A hosted general agent that can't join the Docs/inbox loop. |
| Figma + Playwright + Claude | Used as the **mockup loop** | Screenshots at 1440 and 390, then critique, then fix (bounded passes). Figma MCP is already connected via Vic's claude.ai; Playwright MCP is connected in `pegasus-design`. |

## 3. Installed on Vic's laptop (not committed)
- **Own checkout `pegasus-design/`** (a git worktree, detached at `origin/main`, deps installed) so designer never switches branches under builder-1, which works in `pegasus-code/`.
- **Skills** in `pegasus-design/.claude/skills/` (git-excluded): `impeccable`, `frontend-design`, `design-taste-frontend`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `web-design-guidelines`. Every file was read before installing, and nothing writes hooks or settings. Sources: impeccable `d631a88`, taste-skill `717446e`, emilkowalski/skill `e8a175d`, vercel-labs/agent-skills `063bee9`, anthropics/skills `dbd4588`.
- **Launcher:** `/designer` (`.claude/skills/designer/SKILL.md`) runs the wake-up, the playbook choice, the skill order, the mockup loop and the rules. `pegasus-design/CLAUDE.local.md` is designer-only; `pegasus-code/CLAUDE.local.md` points there.
- **Git-excluded** so they never reach `main`: `PRODUCT.md`, `DESIGN.md`, `.impeccable/`. The agent copies them here after `init`/`document`.
- The code checkout was moved back to `main` @ `f43e647`. It had been sitting on `feat/T-076-undo-redo`; PR #48 is approved and waiting for devops.

## 4. Open items
1. ~~Playwright MCP~~ **Done:** added (local scope, `pegasus-design`) and connected.
2. **Comparison with Quang's agent:** only one can use the id `designer`, because `agent_dir` fails if two `designer__*` folders exist. Either the loser is removed, or Quang's takes `designer-2`.
3. **`SPRINT.md` is stale** (says sprint 2; `plan/sprints/sprint-3.md` is live). This folder uses `sprint-3/`.
4. **File ownership:** most site work touches builder-2's files (`src/panels`, `src/components`, the start page). The senior should state scope on each card, or hand those files to designer for the polish phase.
5. **Shared docs folder (Vic):** builder-1, reviewer and designer all push from the same `../pegasus-docs`, and `docs-push.sh` runs `git add -A`. So one session can commit another's half-written files; it already happened once (this folder's PROFILE/inbox landed in `761b870 reviewer: PR-50 approved`). Harmless so far. Worth a per-session docs worktree, or staging only your own folder in `docs-push.sh`.
6. **No `.env` in `pegasus-design`** on purpose (secrets aren't copied). Editing and viewing work locally; publishing or uploading from this checkout needs the env set up by Vic.
7. **First session (Vic + agent):** `impeccable init`, then choose a direction (`frontend-design`), then tokens and fonts, then the first card proposals to the senior.

## 5. Drafted patch for the senior (not applied; send after the comparison)
Following the ADR-011/012 precedent:
- `scripts/lib.sh`: add `designer` to `VALID_AGENTS`.
- `scripts/set-status.sh`: designer may set `in-progress`, `in-review` (`blocked`/`needs-human` are already open to everyone).
- `tasks/_TEMPLATE.md`: `lane: … | design`, `assignee: … | designer`.
- `README.md`: add designer to the status table; "Who writes what" gets designer → `team/designer__vic/` (specs, mockups, PRODUCT.md, DESIGN.md).
- `AGENTS.md`: team table row (designer, Vic, Claude Code, Opus 5.5, Design) and routing (designer → reviewer-2).
- `agents/designer.md`: the 11-section role file (~600 words) condensed from the launcher. `agents/senior.md` §7.4 gets the design lane; `agents/SETUP.md` step 4 lists designer.
- `agents/senior.md`: a new step. Treat designer briefs as planning input; answer stack asks (getting Quang's OK); turn each spec into cards that link `specs/<slug>.md` in Notes and copy its **Build kit**; assign by file ownership.
- `agents/builder.md`: on cards with a Build kit, load `pegasus-ui` plus the listed skills (installed via `team/designer__vic/kit/install-skills.sh`), build to the spec, and run `web-design-guidelines` before the PR. Send spec questions to the designer.
- `tasks/_TEMPLATE.md`: add `design_spec:` to the frontmatter and a `## Build kit` section.
- An ADR for the designer agent and its dependencies.
- **Dependency request:** add `motion`, and use `next/font` (built into Next, so no new package).
