# Sprint summary
## Completed
- **T-001 scaffold:** PR #1, merged as 07f3698 (ADR-010 bootstrap, no CI). Review rounds: 2. Round 1 added `.data/` to `.gitignore` after the local-first storage decision.
  - Stack: Next 16.4, React 19.3, strict TS 5.9, Tailwind 4, all packages pinned.
  - Checks: lint, typecheck, vitest.
  - `agentRules: false` so `next dev` doesn't write an AGENTS.md to main.
- **T-003 schema:** PR #2, merged as a0a8016. Review rounds: 2. Round 1 fixed `rangeOverlap`, which rounded off-grid spans.
  - `types.ts` (plan.md §6 verbatim).
  - `geom.ts`: grid-unit line tests, plus range tests in meters with an epsilon.
  - `validate.ts`: zod, a list of issues, never throws, and a compile-time guard against schema/type drift.
  - Defaults, lighting presets as data, and the L-shaped fixture with a placeholder.webp.
- **T-004 store:** PR #6, merged as 719cdac. Review rounds: 1.
  - The architecture §4 contract exactly, plus 4 accepted additions: `deleteRoom` returns a boolean, `addArtwork` can return null, and two helper exports.
  - R11 bail-outs on calls that change nothing.
## Carried over (with reason)
- None. One optional item is offered to the senior: clamp room w/d to 2 m in `updateRoom` (the reviewer's suggestion). The PR merged before my push; the commit is kept locally as 40f7c97.
## Blockers hit
- **Shared checkout:** the reviewer session switched `pegasus-code` to `main` mid-task, twice. No damage, because I checked the branch before committing. The reviewer now uses its own worktree.
- **Docs sync race:** `docs-sync.sh` racing on the shared Docs clone, with transient "Cannot rebase onto multiple branches" errors. Retrying works.
- **CI arrived after PR #2 was opened:** I merged `main` into the branch (no force-push) to get a CI run.
## Lessons / suggestions for next sprint
- **Next 16.4 differs from model memory.** Read `node_modules/next/dist/docs/` before writing pages or API routes; Cache Components is on. (Now in the AGENTS.md Gotchas.)
- **Check the PR state before pushing review follow-ups.** Devops can merge right after approval, and a late push re-creates the deleted branch.
- **Use `rangeOverlap` (meters + epsilon) for doorway and frame spans in compile (T-010/T-011)**, and `sameLine` only for "same grid line".
- **When we load from the API or localStorage (Sprint 2):** run `validate()` and pass `result.gallery` to `loadGallery`. On publish, allow-list image URL schemes and cap sizes (reviewer notes on PR #2 and PR #6).
