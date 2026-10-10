# Handoff: PR-4 / T-002
## Builder notes
### What changed
CI on every PR to `main`, a PR template, and the repo-setup files pending since the `main` foundation revert.
- **`ci.yml`:** install (cached), `npm run lint`, `npm run typecheck`, `npm test`, on `pull_request` to `main` and `push` to `main`. Job id/name is `ci` — that's the required-check name for branch protection.
- **`docs-guard.yml`:** fails a PR to `main` whose head branch is `Docs`, or that touches `AGENTS.md`, `agents/`, `scripts/`, `plan/`, `tasks/`, `team/`, `handoffs/`, `decisions/`, `releases/`, `Docs/`, `BOARD.md` or `SPRINT.md`. Restored from the reverted `867d992` draft and extended: the original only blocked `plan/ tasks/ team/ handoffs/ decisions/ releases/ BOARD.md SPRINT.md`, but `AGENTS.md`, `agents/`, `scripts/` and the legacy `Docs/` folder moved off `main` onto the Docs root after the revert (see Quang's senior setup-report update), so those now need blocking too.
- **`pull_request_template.md`:** Summary / Task / Changes / Diagram / Test evidence / Handoff note / Checklist, per `agents/builder.md` §8. Matches the reverted draft almost verbatim.
- **`CLAUDE.md`:** `@../pegasus-docs/AGENTS.md`, per the senior's clarification (builder-1's finding) that a bare `@AGENTS.md` would point at nothing since that file lives on the Docs worktree, not `main`.
- **`.env.example`:** `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY`, `VULTR_S3_SECRET_KEY` — names only, per ADR-008. No values anywhere in the repo or in any Docs-branch message.
- **`.prettierignore`:** added `.env.example` — prettier has no dotenv parser and was erroring (not just warning) on it.

Things worth knowing:
- **Windows checkout has no `.gitattributes`.** Running `npm run format:check` locally on Windows shows 11 files "needing" reformatting — all pre-existing T-001 files I didn't touch (`package.json`, `README.md`, `next.config.ts`, etc.), none of mine. This is a Windows `core.autocrlf` artifact: the repo blobs are LF, Windows checks them out as CRLF, prettier (LF-based) flags the CRLF working copy. It's invisible on GitHub Actions (`ubuntu-latest`, LF natively) and wasn't present when the reviewer tested T-001, so CI stays green. The original foundation spec (`867d992`) included a `.gitattributes` forcing LF for exactly this reason, but it fell out of scope in the T-001/T-002 re-breakdown after the revert — nobody currently owns it. **Open question for the senior:** who adds `.gitattributes`, and is it worth a small card, or should devops just fold it into a future PR? Not blocking (CI is unaffected), but it'll keep producing local false-positives for any Windows contributor.
- **`docs-guard.yml`'s path-blocklist logic was verified directly** (not just read): committed a throwaway `plan/should-not-be-here.md` on this branch, confirmed the exact `git diff` + `grep` the workflow uses flags it, then reverted the commit before opening the PR. It isn't in this PR's diff.
- **Required status check name for Quang:** `ci` (from `ci.yml`'s `jobs.ci.name`). `docs-guard` is also available as an optional/required check if the team wants the two-branch rule enforced at the PR level immediately (it only runs on `pull_request`, not `push`, since it has nothing to check on a direct push to `main`... which shouldn't happen anyway per the universal rules).

### Diagram
```mermaid
flowchart LR
  PR[PR opened/updated] --> CI[ci.yml: install, lint, typecheck, test]
  PR --> Guard[docs-guard.yml: block Docs-branch paths]
  CI --> Gate{ADR-010 merge gate}
  Guard --> Gate
  Gate -->|green + review-approved label + card approved| Merge[devops squash-merges]
```

### How to test
```bash
git fetch origin && git switch chore/T-002-ci-and-repo-setup   # or check out PR #4
npm ci
npm run lint && npm run typecheck && npm test && npm run format:check
```
Expected: all four succeed (only files this PR touches are checked by `format:check` on a non-Windows machine; on Windows, 11 pre-existing files show up as noise — see above). Then open the PR on GitHub and confirm the `ci` check goes green, and that a probe commit adding e.g. `plan/test.md` makes `docs-guard` fail with a clear message (revert the probe after).

## Review rounds
### Round 1 (reviewer, 2026-10-10): CHANGES REQUESTED

**Verdict: CHANGES REQUESTED** (1 blocking item; no code changes needed)

**Blocking issues**
1. **Acceptance criterion 5 isn't shown:** "A test PR shows CI going red on a failing test and green on fix (link it in the handoff note)." `handoffs/PR-4.md` has no such link. The docs-guard probe it mentions was run locally and proves something different. To fix:
   - branch off `chore/T-002-ci-and-repo-setup`;
   - open a draft PR with a deliberately failing test (e.g. `expect(1).toBe(2)` in `src/lib/smoke.test.ts`), so `ci` goes red;
   - push the fix, so `ci` goes green;
   - close it without merging, and put the PR link plus both run URLs in the handoff note.

**Non-blocking suggestions**
1. **Least-privilege tokens:** add `permissions: { contents: read }` at the top of `ci.yml` and `docs-guard.yml`. Neither workflow writes anything, and without it the job token gets the repo's default permissions.
2. **`docs-guard.yml:25` uses a two-dot diff** (`git diff --name-only "$BASE_SHA" "$HEAD_SHA"`). If `main` moves after the branch was cut, files changed only on `main` show up in that list too. Today that only gives false failures if Docs paths ever land on main. The three-dot form `"$BASE_SHA...$HEAD_SHA"` (merge-base to head; `fetch-depth: 0` is already there) checks only what the PR changes.
3. **CI doesn't run `format:check`**, so formatting is only enforced locally. The card doesn't ask for it, but it's a one-line add (`- run: npm run format:check`) that Linux runners check without the CRLF noise. `npm run build` would also catch Next build-only errors. Both are your call.
4. **`.gitattributes`:** agreed with your note. `* text=auto eol=lf` would remove the Windows false positives. A small follow-up from you or a card from the senior both make sense; it's not this PR's job.
5. **`.prettierignore` is outside the card's file list**, but the change is justified (prettier errors on dotenv files). Fine as is.
6. **After this merges, PR #2 and PR #3 won't have a `ci` check yet**, because the workflow wasn't on their base. ADR-010 needs green CI, so they'll need a rebase or an empty push to trigger it.

**What I tested** (commit cc7248d, in a separate worktree)
- lint, typecheck, test and format:check exit 0 locally (macOS, so no CRLF noise).
- **On GitHub, both checks ran green on this PR:**
  - `ci`: https://github.com/PegasusXLab/main/actions/runs/38038514728/job/114173913812
  - `docs-guard`: https://github.com/PegasusXLab/main/actions/runs/38038514730/job/114173913772
  - The check is named `ci`, which is stable and usable for branch protection.
- **docs-guard logic,** run locally against a throwaway local commit, never pushed. bash 3.2 lacks `${VAR,,}`, so I substituted an equivalent `tr` for the local run only; Ubuntu runners use bash 5.
  - A commit adding `plan/x.md`, `AGENTS.md`, `SPRINT.md` and `agents/a.md` fails with all four listed. `src/plan/ok.ts` and `docs/ok.md` are correctly allowed.
  - Head branch `Docs` fails; a clean diff passes.
- **Security:**
  - `.env.example` holds names only, with empty values for exactly the four `VULTR_S3_*` vars from ADR-008.
  - No secret-like strings anywhere in the diff.
  - The workflows use `pull_request` (not `pull_request_target`) and pass PR data through `env:` rather than inline `${{ }}` in `run:`, so there's no script injection.
- **Files:**
  - `CLAUDE.md` is exactly `@../pegasus-docs/AGENTS.md`, per the card.
  - The PR template has all 7 sections from builder.md §8.
  - No application code or `package.json` changes.

(filled in by the reviewer)

## DevOps notes
(filled in at merge)
