---
agent: reviewer
role: Reviewer
operator: Vic
tool: Antigravity (temporarily, while Vic's Claude usage resets)
model: Gemini
lane: Review, UAT, security
current_sprint: 2
current_ticket:
status: watching
updated_at: 2026-10-10T17:13:00Z
---
## Working on now
- **T-079 (PR #53) reviewed and APPROVED**: cross-browser & device matrix verified against https://galleriverse.vercel.app (tested chromium-matrix 6/6 and iphone 3 pass / 3 skip; clean skip without E2E_BASE_URL). CI green, labeled review-approved, status approved, handoff PR-53.md updated, devops notified.
- **P0 checkpoint passed** (on the old galliverse URL; live is now galleriverse.vercel.app) (~09:15 EDT). All of builder-2's crunch PRs that I reviewed are merged: #32 upload, #35 artwork panel, #34 art markers, #37 editor wiring, #38 templates (it fixed the stale-autosave bug from #37+#38).
- **Next:** finish Sprint 2 (T-051 e2e, T-052 demo gallery, both builder-3) and Sprint 3 (T-060 to T-064). Code freeze at 17:09 EDT; after it, `bugfix` PRs only.
- **Product name is Galleriverse (Quang).** On T-080 (builder-2, UI rename) and T-078 (builder-3, README), check that only user-visible text changes. Internal identifiers stay `pegasus`; in particular, the `pegasus:gallery:*` localStorage keys must NOT change, or existing autosaves are lost. T-052 is superseded. On rename/README/e2e PRs, flag any `galliverse.vercel.app` URL: it's dead (404). The live URL is https://galleriverse.vercel.app/.
- **Routing (ADR-011/012):** builder-2 PRs come to me; builder-3 PRs come to me or reviewer-2; builder-1 and devops PRs go to reviewer-2 or reviewer-3. I never review work by Vic's agents: builder-1 **and designer** (Vic's pilot designer agent, added 2026-10-10). The card's `reviewer:` field is the source of truth.
- **Timeline (EDT):** until 09:00, P0 crunch; 09:00-11:00, finish Sprint 2 + checkpoint; 11:00-15:30, Sprint 3 'the feel'; 15:30-17:09, stabilize. **Code freeze 17:09 EDT (21:09 UTC):** after it, I approve only `bugfix`-labeled PRs. Submission is tomorrow at 08:09 EDT.
- **Claim rule (ADR-012 amendment 1):** when I'm free, I may claim an open, unclaimed PR that wasn't built by Vic's agents. Comment 'claimed by reviewer' on the PR, set the card's `reviewer:` to me with a History line, and send an fyi to the senior. Never builder-1's PRs.
- **Deferred until after 9 AM:** T-036 autosave, T-043 art markers, T-051, T-052.
- **Carry-overs to check later:** Sprint 2 loading must `validate()` before `loadGallery`. The API must allow-list URLs and cap sizes. T-024 should clamp room size (or the store should).
- **How I work now:** I review in my own git worktree, never in `pegasus-code`, which builder-1 also uses. I always sync Docs before judging a card's state.
- **Local-first (senior, 07:59Z):** UAT runs on a fresh local clone of main: `npm ci`, `npm run dev` on :3000, then Playwright against localhost. T-006 is blocked, so there are no preview URLs. Storage is local disk under `.data/` unless the `VULTR_S3_*` vars are set. API PRs must go through one storage interface and never write outside `.data/`.
- **Vercel (senior, 08:09Z):** https://galleriverse.vercel.app/ is the live URL (changed again at 15:53Z; the old galliverse URL returns 404). PR previews come after T-006. Local UAT stays the source of truth; previews are a secondary check.

## What I'll check on each PR (from plan.md)
- **Schema (§6):** frozen after approval. Any change to `lib/schema/` without a senior-approved card is blocking.
- **Compile (§5, F4):** `compile()` stays pure TS, no `three` imports. Tests must cover single room, full shared wall, partial overlap, L-shaped 3 rooms, and art on N/E/S/W. Doorway width = min(1.2 m, overlap), height 2.2 m; walls inset 0.075 m; art placement matches the §5.3 table.
- **Editor (F1/F2):** 0.5 m snap, min 2 × 2 m, overlaps rejected, deleting a room removes its artwork, panel and canvas round-trip both ways.
- **Renderer (§7):** `frameloop="demand"`, textures/geometry disposed, no real-time shadows in P0, `leva`/`r3f-perf` dev only.
- **Publish/API (F7), the main security surface:** edit key stored only as a hash and compared in constant time; PUT without a valid key rejected; IDs unguessable; upload route checks type and size, no path traversal, no SVG/HTML passthrough; gallery JSON validated server-side; no secrets in the client bundle.
- **API (F7) carry-over from PR #2:** `validate` accepts any URL string and has no length caps. The publish/PUT route must allow only relative or our-storage `https:` URLs and cap body and field sizes.
- **Viewer (F8):** plaque text rendered as text, never `dangerouslySetInnerHTML`.
- **Module ownership (§8):** a PR touching another builder's module gets flagged.
- **Basement repo (§9):** inspiration only. Copied code, shaders or assets are blocking.

## Sprint 0 review focus (plan/sprints/sprint-0.md)
- **T-001 scaffold:** exact pinned versions, `howler` and the storage SDK left out, nothing secret committed, no `.github/` or CI files (devops owns those), `@/*` alias.
- **T-003 schema:** `types.ts` matches plan.md §6 exactly. `geom.ts` is the only comparison helper and compares in whole grid units (round(m × 2)). `validate` never throws. The fixture is L-shaped, passes validation, and has a full and a partial (≥ 1 m) shared wall.
- **T-004 store:** state and action names exactly as architecture.md §4. Entrance moves on delete, and deleting the last room is refused. No autosave or network.
- **T-005 EditorShell:** props only, no store import.
- **T-002 (devops) CI and repo setup:** the CI job name stays stable. The PR template has the builder.md §8 sections. `CLAUDE.md` is just `@AGENTS.md`. docs-guard fails any PR to main that adds Docs-branch files. `.env.example` lists names only, with `VULTR_S3_ENDPOINT=`, `VULTR_S3_BUCKET=`, `VULTR_S3_ACCESS_KEY=` and `VULTR_S3_SECRET_KEY=` left empty. A linked test PR shows CI going red on a failing test, then green.
- **T-006 (devops) Vercel hosting and Vultr storage:** the Vultr S3 keys exist only in Vercel env vars, never in the repo, logs, PR comments or messages. Preview URLs appear on PRs, and I use them for UAT. The rollback runbook is filled in.
- **Quang's decisions (Q1-Q12) that I check against:**
  - Module split: builder-1 owns schema, compile, store, the 3D renderer/viewer and the API. builder-2 owns the 2D editor, panels, upload and pages. T-013 is now builder-1's, so I review it only in a separate session.
  - Walls are 0.075 m thick, measured from the room edge inward. Frames sit 0.08 m from the edge.
  - A doorway needs at least 1.0 m of shared wall. Previous/Next room order is breadth-first from the entrance (ADR-007).
  - The SceneModel additions are approved: wall `side`/`thickness`, doorway `height`/`side`, room `view` at 1.6 m eye height.
  - Hosting is Vercel. Storage is Vultr Object Storage through `@aws-sdk/client-s3`, and its keys live only in Vercel env vars (ADR-008, revised). Images upload as soon as they're added (ADR-009).
  - The editor's done-criteria are mouse only; touch is a stretch feature.
  - Not decided, so not blocking: G4 (`wallHeight ≥ 2.6`), G9-G11, G15.
- **T-001 addition:** `.gitignore` must cover `.env*`.
- **AGENTS.md Gotchas (every PR):** `agentRules: false` must stay in `next.config.ts`; flag any PR that removes it. For Next 16.4 behaviour (Cache Components, route types), check `node_modules/next/dist/docs/`, not memory.

## Sprint 2 security checklist (builder-1 cards T-030 to T-036, approved early)
- **T-030 storage:**
  - `getStorage()` is server-only (`import "server-only"` or equivalent, never in the client bundle);
  - `/api/files/[...key]` serves public objects only and refuses `..`, encoded `%2e%2e`, absolute paths, backslashes and null bytes; the resolved path stays under `.data/`;
  - private objects (gallery JSON, key hashes) are never served;
  - env values never appear in logs or error responses.
- **T-031 galleries API:**
  - the edit key is random (≥ 128 bits) and only its scrypt hash (with salt) is stored;
  - the compare is constant-time (`timingSafeEqual` on equal-length buffers);
  - no hash in any response;
  - 403 for a missing or wrong key, 400 with issues, 413 for over 1 MB;
  - the client can't choose the id (server nanoid), and PUT can't change the id or swap in another gallery's id;
  - **my carry-over from PR #2:** allow-list artwork, music and audio URLs (only relative `/` or our storage origin over `https:`; refuse `javascript:` and `data:`), plus field length caps.
- **T-032 upload:**
  - WebP checked by magic bytes (`RIFF....WEBP`), not just Content-Type;
  - per-file cap, `medium` required;
  - storage keys are server-generated (no user-controlled path);
  - the Vultr check is recorded without keys.
- **T-033 / T-034 (frames / camera):** textures disposed; R11 no-op flags; Scene keeps T-025's props working.
- **T-035 viewer:** plaque text rendered as text (no `dangerouslySetInnerHTML`); the edit key never appears.
- **T-036 autosave:** `loadAutosave` runs `validate()` (my carry-over from PR #6); quota and private-mode errors are caught; no image data.

## Notes for other agents
- Send `review-request` here. I handle them oldest first. Reports go on the PR and into `handoffs/PR-<n>.md`.
- I never review in the session that built the PR.
- **My verdict (ADR-010):** a PR comment, plus the `review-approved` label and card status `approved`. I don't press GitHub's approve button, and the branch needs 0 required approvals. Devops merges when the card is `approved`, the PR has the label and CI is green.
- On approval I message `devops` with type `approved` (PR number, what I tested, anything to watch on merge or deploy).
