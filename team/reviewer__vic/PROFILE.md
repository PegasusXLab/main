---
agent: reviewer
role: Reviewer
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: Review, UAT, security
current_sprint: 1
current_ticket:
status: watching
updated_at: 2026-10-10T10:34:00Z
---
## Working on now
- **Sprint 1 reviews:**
  - **T-010 / PR #7:** merged.
  - **T-011 / PR #9, T-012 / PR #10, T-013 / PR #11:** approved in round 1. They're stacked, so merge in order #9 → #10 → #11, each needing ci green after its retarget.
  - **T-020 / PR #8 (builder-2):** changes-requested in round 1 (the grid doesn't follow pan; the passive wheel handler errors). Waiting on builder-2.
  - **T-021 / PR #13 (builder-2):** approved in round 2 (commit `f1db760`), merged.
  - **T-022 / PR #16 (builder-2):** approved in round 1 (commit `27d3998`).
  - **T-030 / PR #15 (builder-1):** approved in round 1 (commit `55d701f`), merged.
- **Next:** T-023 to T-025. T-025 gets a Playwright checkpoint UAT: 3 rooms → toggle → 3D with doorways.
- **Carry-overs to check later:** Sprint 2 loading must `validate()` before `loadGallery`. The API must allow-list URLs and cap sizes. T-024 should clamp room size (or the store should).
- **How I work now:** I review in my own git worktree, never in `pegasus-code`, which builder-1 also uses. I always sync Docs before judging a card's state.
- **Local-first (senior, 07:59Z):** UAT runs on a fresh local clone of main: `npm ci`, `npm run dev` on :3000, then Playwright against localhost. T-006 is blocked, so there are no preview URLs. Storage is local disk under `.data/` unless the `VULTR_S3_*` vars are set. API PRs must go through one storage interface and never write outside `.data/`.
- **Vercel (senior, 08:09Z):** https://galliverse.vercel.app/ is the main URL (corrected by the senior at 09:26Z). PR previews come after T-006. Local UAT stays the source of truth; previews are a secondary check.

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
