# ADR-013: Two designer agents, one design system
Status: **accepted** (Quang, 2026-10-10 ~13:10 EDT). Proposed by Vic (`team/designer__vic/SETUP.md` §5).

## Context
With the deadline at **Sun 2026-10-11 09:00 EDT** (code freeze **today Sat 2026-10-10 18:00 EDT**; corrected date), there is time to turn "function first" into a product people want to use. Vic set up a `designer` agent with a brief/spec protocol (`team/designer__vic/LOOP.md`). Quang is running his own designer for the public entry surfaces, from his reference design `galleriverse-ui-design`.

## Decision
- **`designer`** (Vic, Claude Code) owns the **room experience**: editor/CAD (2D canvas, panels, pickers) and what visitors see in rooms (viewer HUD, plaque, atmosphere look, new media).
- **`designer-2`** (Quang) owns the **public entry**: the landing page for new users, **register** and **log in**.
- **One design system.** Quang's reference palette is canonical: plaster `#eff0ee`, paper `#ffffff`, graphite `#1e2022`, pencil `#7d8085`, hairline `#d5d7d4`, **one accent: Klein blue `#002fa7`**, danger `#c7353f`, radius 2px, tabular figures, a visible focus ring, `prefers-reduced-motion`. Vic's "Install Day" ideas (the tape tag, kraft templates, true-scale markers, opening-night viewer) are built **on these tokens**. Any second accent needs Quang.
- **Token and primitive ownership:** `designer` owns `src/app/globals.css` tokens, `src/lib/theme.ts` (the 2D/3D mirror) and `src/components/ui/*` (shared primitives). `designer-2` consumes them and owns the landing/auth pages and `src/components/auth/*`. Neither forks primitives.
- **Protocol:** LOOP.md. Briefs → senior answers (stack asks → Quang). Specs → senior cards with `design_spec:` and a **Build kit** (`tasks/_TEMPLATE.md`). Builders install the kit with `team/designer__vic/kit/install-skills.sh` (third-party skills are pinned to reviewed commits; nothing is executed).
- **Review routing:** `designer` (Vic) PRs go to reviewer-2 or reviewer-3; `designer-2` (Quang) PRs go to any reviewer. `set-status.sh` enforces the same-operator block.
- **Scripts:** `designer` and `designer-2` are in `VALID_AGENTS`; designers may set `in-progress` / `in-review` on their own cards.

## Consequences
- AGENTS.md, agents/designer.md (new), agents/senior.md §7.4, agents/builder.md §7.3, tasks/_TEMPLATE.md, README.md and the scripts are updated.
- File ownership shifts: designer-lane cards touch builder-2's panels and the start page, so every card states its exact scope (no shared files across open cards).
- Accounts (register/login) need a backend and an ADR of their own (ADR-014).
