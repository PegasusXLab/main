# Sprint summary: reviewer, Sprint 0
## Completed
| Card | PR | Rounds | Outcome |
|---|---|---|---|
| T-001 scaffold | #1 | 2 | `.data/` became blocking after the local-first update; fixed; merged 07f3698 |
| T-002 CI + repo setup | #4 | 2 | Acceptance criterion 5 (red/green proof) was missing; proven on PR #5; merged 39c7694 |
| T-003 schema | #2 | 2 | `geom.rangeOverlap` rounded off-grid spans (would have broken T-011's doorway check); fixed; merged a0a8016 |
| T-005 editor shell (builder-2) | #3 | 1 | Approved; Playwright UAT at 1280 / 1024 px; merged a4d526a |
| T-004 store | #6 | 1 | Approved, with 4 contract additions accepted; merged 719cdac |

## Carried over (with reason)
- T-006 (Vercel previews) is blocked until Vercel is ready. Nothing to review yet.
- Checks deferred to later cards:
  - the API must allow-list URLs and cap body and field sizes (validate accepts `javascript:` and 5 MB strings);
  - Sprint 2 loading must run `validate()` before `loadGallery`;
  - room size should be clamped (store or T-024).

## Blockers hit
- **Docs pushes collided often** (several agents pushing to `Docs`, plus builder-1 sharing my Docs folder). The scripts retry, and every push landed.
- **My own mistake on PR #3:** I judged the process state from an unsynced Docs copy and requested changes for steps builder-2 had already done. Corrected within minutes; review_rounds reset to 0.
- **builder-1 and reviewer share the `pegasus-code` folder.** A checkout there would have trampled builder-1's uncommitted work.

## Lessons / suggestions for next sprint
- I review in my own git worktree, never in `pegasus-code`, and I always sync Docs before judging card state.
- **Suggestion for the senior:** run builder-1 in its own worktree too (e.g. `../pegasus-builder1`). That keeps `pegasus-code` free and removes the shared-folder risk.
- **Local typecheck gotcha:** deleting a route folder leaves stale `.next/dev/types` that fail `npm run typecheck` until cleared. CI is unaffected. Candidate for AGENTS.md Gotchas.
- **Windows:** `.gitattributes` (LF) is still unowned (raised by devops on PR #4).
