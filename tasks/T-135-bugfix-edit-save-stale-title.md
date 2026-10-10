---
id: T-135
title: BUGFIX - intermittent: after 'Saved.' a reload shows the OLD title (editor load/save race)
status: in-progress
lane: frontend
assignee: builder-1
reviewer: reviewer-3
branch:
pr:
sprint: 4
depends_on: []
review_rounds: 0
approved_by_human: true
design_spec:
updated_by: builder-1
updated_at: 2026-10-10T20:37:16Z
---
## Goal
Saving edits through an edit link always persists. A creator who edits the title and sees "Saved." must see that title after a reload, every time.
## Evidence
- About 2 of ~12 live publish-view runs today fail at step 5 (builder-3, 18:25Z and 20:16Z on prod; devops twice on PR #72). Re-runs pass.
- The senior's API probe (20:22Z): a PUT then 6 GETs all return the new title, with `Cache-Control: max-age=0, must-revalidate` and `X-Vercel-Cache: MISS`. **The API is fresh, so the race is client-side**: e.g. the edit page's initial GET/autosave restore landing AFTER the user's edit and overwriting it; Save sending a stale store snapshot (input not yet committed); or a localStorage autosave of the old gallery re-hydrating on reload.
## Acceptance criteria
- [ ] Root cause identified and written in the PR.
- [ ] Fix: e.g. the editor ignores a late initial load once the user has edited; Save serializes the CURRENT store state after pending input commits; on reload the server copy wins over a stale localStorage autosave for a published gallery (or the autosave is keyed by version/updatedAt).
- [ ] publish-view.spec passes **20/20** in a loop locally (`--repeat-each=20`) and 5/5 live after the merge.
## Files / modules in scope
- src/app/edit/[id]/page.tsx, src/components/EditorShell.tsx, src/components/PublishPanel.tsx, src/components/publishClient.ts, src/store/gallery.ts (autosave/hydrate only)
- **Overlaps T-124 (#72)**: if T-124 merges first, rebase; if not, coordinate with builder-1.
## Out of scope
- API routes (verified fresh), schema.
## Build kit
- **Libraries:** none.
## Notes
- Core demo flow (edit and save). Bugfix, so allowed any time.
## History
- 2026-10-10T20:22:39Z senior: carded from builder-3/devops reports + senior API probe; awaiting Quang
- 2026-10-10T20:26:37Z senior: approved by Quang; assigned to builder-3 (reviewer: reviewer). T-124 may not merge until this lands.
- 2026-10-10T20:26:38Z senior: status -> ready
- 2026-10-10T20:27:53Z senior: ROOT CAUSE (builder-3 + builder-1 independently): edit page isLoading starts false, so the default sample gallery renders and a late loadGallery() overwrites typed edits. builder-1 already has the 5-line fix (PR #72 e8266a7f) → reassigned to builder-1 as a standalone bugfix PR from main (reviewer-3). builder-3 adds the regression e2e (tests only).
- 2026-10-10T20:37:16Z builder-1: status -> in-progress
