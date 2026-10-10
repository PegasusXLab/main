# Overview

**Source of truth for the product: [`../plan.md`](../plan.md)** (Quang's plan; "plan.md §N" below refers to it). This file holds only the senior's notes on it. Sketches: `Docs/IMG_1508.jpg`, `Docs/IMG_1509.jpg`. They match plan.md §3; the only new item is "TODO: describe object properties: description, voice-overs, links".

**Product name: Galleriverse** (Quang, 2026-10-10; was the working title "Pegasus"). Live: **https://galleriverse.vercel.app/** (Quang switched the domain 2026-10-10 ~11:50 EDT; the old galliverse.vercel.app now returns 404 unless re-added as a redirect).

Hackathon facts (no `plan/hackathon.md` exists yet): Hacklanta 2026, Adobe Sponsored: Creative track, 36 hours, max 4 on the roster (plan.md §1, §10, §13).

## Deploy freeze / cutoff time
**CORRECTED 2026-10-10 13:22 EDT (date error caught by devops; today is SATURDAY Oct 10):** submission is **Sunday 2026-10-11 09:00 EDT**. Keeping the 15-hour non-code buffer, **code freeze is TODAY, Saturday 2026-10-10 18:00 EDT (22:00 UTC)**, pending Quang's confirmation of the buffer. After the freeze, devops merges only `bugfix`-labeled PRs.

| Window (EDT) | Phase | Goal |
|---|---|---|
| Sat 13:20 → 16:30 | Sprint 4 "design + accounts" (cut down) | Vic's designer: room UX (editor/CAD + viewer) via briefs/specs (LOOP.md). Quang's designer-2: landing page + register + login (reference `galleriverse-ui-design`). builder-1: accounts backend. |
| Sat 16:30 → 18:00 | Stabilize | Bug fixes, the device matrix green, the demo built by the team via the UI, README final |
| **Sat Oct 10 18:00** | **Freeze** | `bugfix` only |
| Sat 18:00 → Sun Oct 11 09:00 | Humans | Submission prep (15 h) |
## Decisions (Quang, 2026-10-10)
| Q | Answer | Recorded in |
|---|---|---|
| Q1 | Balance the load: module split | ADR-005, agents/senior.md §7.4, agents/builder.md §1, AGENTS.md team table; T-013 → builder-1 |
| Q2 | Yes | agents/senior.md §3; notes moved to `plan/reference-basement.md` |
| Q3 | Stack approved | plan/stack.md, AGENTS.md |
| Q4 | First "Vercel + Blob, ok for now", then changed: **Vercel for hosting + Vultr Object Storage for files; no Blob**. Vultr server/GPU for heavy graphics work later (P1/P2). Alert Quang whenever a feature needs API keys | ADR-008; [API keys watchlist](#api-keys-and-accounts-watchlist) below; draft cards T-090 to T-092 |
| Q5 | Submission Oct 11 08:09 EDT; 15 h reserved for non-code prep, so **code freeze Oct 10 17:09 EDT** | Deploy freeze section above |
| Q6 | 0.075 m wall per room, from the edge inward | ADR-001, ADR-007 |
| Q7 | Doorway only where overlap ≥ 1.0 m | ADR-007 |
| Q8 | Breadth-first from the entrance | ADR-007, architecture §3 |
| Q9 | Upload images immediately | ADR-009 |
| Q10 | Touch is a stretch feature; revisit later | F1 done-criteria = mouse only; touch tracked as P2 |
| Q11 | Yes: devops may hold cards and set in-progress / in-review on them | tasks/_TEMPLATE.md, scripts/set-status.sh, README.md, agents/devops.md §7.9; T-002, T-006 |
| Q12 | SceneModel additions approved | ADR-007, architecture §3 |

Not decided, so no change: G4 (`wallHeight ≥ 2.6`), G9–G11, G15 recommendations. They stay as recommendations; cards don't enforce them until Quang confirms.

## API keys and accounts watchlist
Quang asked to be alerted whenever a feature needs an API key. No key is ever pasted into chat, docs or the repo; keys live only in Vercel environment variables (and in each person's local `.env`, which is never committed).

| Needed for | Key / account | When | Status |
|---|---|---|---|
| Preview deploys (T-006) | Vercel: **provided by Quang**, connected, https://galleriverse.vercel.app/ | Sprint 0 | done by Quang; Sergio access being added; preview Deployment Protection to decide in T-006 |
| F7 publish, F3 upload (ADR-008) | Vultr account (**Quang has it**; Object Storage subscription `721fcbac-04a6-4f70-bdc9-68ea8868e776` created): create the bucket and an access key + secret → `VULTR_S3_ENDPOINT`, `VULTR_S3_BUCKET`, `VULTR_S3_ACCESS_KEY`, `VULTR_S3_SECRET_KEY` in Vercel env vars | Sprint 0 (T-006) setup; used from Sprint 2 | not blocking: local-disk fallback until then (ADR-008); needed before the hosted demo |
| Texture compression / lighting baking / AI (T-090 to T-092) | Vultr cloud GPU server, **billed by the hour** | Sprint 3+ (only if time allows) | **Quang's Vultr GPU request is pending: on hold, disregard for now** |
| F10 narration | ElevenLabs API key | Sprint 3 | not yet; only if we do the ElevenLabs side challenge |
| F12 mood prompt | Gemini API key | Sprint 3 | not yet; only if we do the Gemini side challenge |
| Custom domain (side challenge) | GoDaddy account | Sprint 4 | not decided |

---

## Senior review

Status: **answered by Quang, 2026-10-10** (see "Decisions" above). Nothing in plan.md has been changed. Schema (§6) and compile (§5) changes need Quang's approval and an ADR.

### 1. Gaps a builder needs answered before starting

**Compile (F4)**
- **G1. Wall thickness and where a wall sits.** §5.2 says each room builds its walls "inset by half the wall thickness (0.075 m of 0.15 m)". That reads two ways:
  - (a) each room's wall is 0.075 m thick, from the room edge to 0.075 m inside it, so two back-to-back walls make 0.15 m;
  - (b) each wall is 0.15 m thick, centered 0.075 m inside.

  §5.3's artwork inset ("half wall thickness + a few mm") only works with (a). → Q6.
- **G2. What `walls[].start/end` mean.** §5.4 doesn't say whether they're the wall centerline, the inner face or the room edge. The model also has no thickness and no `side` (n/e/s/w). The renderer needs both to extrude a box, and artwork validation needs `side`.
- **G3. Minimum doorway overlap.** `width = min(1.2, overlap)` gives a 0.5 m "doorway" when rooms overlap by only 0.5 m. Nobody can walk through that, and it looks like a bug. → Q7.
- **G4. Doorway height vs wall height.** The door is 2.2 m high, but nothing stops `wallHeight` from being 2.2 m or less. Then the "piece above the doorway" has zero or negative height. Recommend a validation minimum of `wallHeight ≥ 2.6`.
- **G5. Comparing numbers that should be equal.** Shared-edge detection (`A.x + A.w === B.x`) on floating-point meters will miss some matches (0.1 + 0.2 ≠ 0.3). Recommend comparing in whole grid units (meters × 2) or with an epsilon of 1e-6. This must be one rule shared by compile and the editor's overlap check.
- **G6. Different wall heights on a shared wall.** Two rooms can have different `wallHeight`. Inset walls (a) handle this fine, since each room builds its own over-door piece up to its own height. Just state it so nobody "fixes" it.
- **G7. `closedWalls` on a shared wall (P1).** It's stored per room, but a shared wall belongs to two rooms. Recommend: no doorway if either room closes that side.

**Editor (F1/F2)**
- **G8. "Rooms can't overlap" must allow touching.** Rooms that share an edge are the whole point. The test is strict overlap (positive area), not touching.
- **G9. Deleting the entrance room.** Not defined. Recommend: the entrance moves to the first remaining room. Deleting the last room is refused.
- **G10. Moving a room breaks artwork.** After a move or resize, a doorway can open over an artwork, or a wall can get shorter than its artwork. §5.3 says validation rejects it, but when? Recommend: the editor allows it, and marks the artwork red with a warning. Publish is blocked until it's fixed.
- **G11. Gallery `id` before the first publish.** The route is `/edit/<id>`, but there's no id until publish. Recommend: id = `local` for a new gallery. Publish assigns the server id and redirects to `/edit/<id>?key=...`.

**Content and save (F3/F7)**
- **G12. Images don't fit in localStorage.** Autosave writes the document to localStorage (about 5 MB limit). Three WebP sizes per artwork, stored as data URLs, overflow it after a few images. → Q9.
- **G13. Sketch TODO.** Object "links" and "voice-overs". Voice-over is already in the schema (P1). Links are not; recommend P2, with no schema change now.

**Viewer (F8)**
- **G14. Previous/Next room order** isn't defined. → Q8.
- **G15. Rooms that aren't connected** to the entrance (no shared wall). Recommend: allowed. They're reachable only by Prev/Next or clicking, and the editor shows "not connected" in the room panel.

**Process**
- **G16.** `plan/hackathon.md` and `team/senior__quang/BRIEF.md` were referenced but don't exist. I used plan.md instead.

### 2. Contradictions between plan.md, AGENTS.md and agents/*.md
- **C1. Lane rule** (→ Q1). senior.md §7.4 and AGENTS.md say builder-1 = backend/API and builder-2 = frontend/UI. plan.md §8 splits by module: builder-1 gets schema, compile, store, 3D renderer and API; builder-2 gets 2D editor, panels and upload. **The draft cards follow senior.md (the rule in force):** the renderer is UI, so it goes to builder-2.
- **C2. Stack in AGENTS.md.** AGENTS.md says "the senior fills this in through a PR", but AGENTS.md lives on `Docs`, where there are no PRs. Recommend: I edit it on Docs after Q3, push and send `fyi` to all (the way senior.md §4 describes).
- **C3. DevOps has no ticket path.** `tasks/_TEMPLATE.md` allows `assignee: builder-1 | builder-2` only, and `scripts/set-status.sh` lets only builders set `in-progress` / `in-review`. Sprint 0 needs devops work (CI, PR template, the pending main files from SETUP.md), but it can't be tracked as a card. For now it lives in devops's "Per agent" section of `plan/sprints/sprint-0.md`. → Q11.
- **C4. Who writes the reference notes.** plan.md §9 says agents write `plan/reference-basement.md`, but that file isn't in senior.md's owned list. The notes live in `plan/architecture.md` until Q2.
- **C5. README disclosure** (plan.md §9). The README is on `main`, so builders or devops write it, not the senior. No owner yet. Recommend a Sprint 4 card.
- **C6. The SETUP.md "Pending" PR** (CLAUDE.md, PR template, docs-guard workflow, .gitignore, .env.example from reverted commit 867d992) has no owner. Recommend devops (see C3).
- **C7. builder-2 runs Antigravity/Gemini.** CLAUDE.md-based rules and Claude skills don't reach it; its rules come from the Antigravity workspace rule (SETUP.md §5). Cards for builder-2 therefore spell everything out, with no implied tooling.
- **C8. One person, two roles.** Vic runs both builder-1 and the reviewer. Every builder-1 PR review needs Vic to switch sessions. Not a rule conflict, but a throughput risk in a 36 h event (see §3).

### 3. Feasibility in 36 hours
At risk, most likely first:
1. **F1 editor interactions.** Drag, resize, "+" buttons and touch are the biggest single chunk, all on builder-2.
2. **Builder-2 load under the senior.md lane rule.** The editor, panels, renderer and pages all land on one builder while builder-1 has schema, compile and API only. This is the main argument for the module split (Q1).
3. **F7 storage.** Hosting is undecided (plan.md §13). Vercel has no persistent disk, so "store JSON + images on the server" needs a storage service. → Q4.
4. **The Sprint 1 integration.** The 2D → 3D toggle is the first time both lanes meet. If the store API drifts, it slips.
5. **Review throughput** (C8).

Cut first, in order:
1. Touch/iPad support in F1. Mouse only for the demo; panel number inputs still work on a tablet.
2. Corner resize. Keep edge resize and panel numbers.
3. F13 templates, F12 mood prompt, F10 narration (in that order).
4. The F5 "only changed rooms rebuild" goal. The whole-gallery recompile is fast enough at demo sizes. Keep the per-room memo as a later optimization.

Keep F11 atmosphere and then F9 audio. Those deliver "the feel" the Creative track is judged on.

### 4. Concerns with the schema (§6) and compile design (§5)
Explained only. Nothing has been changed.
- **S1. SceneModel walls are missing `side` and `thickness`** (G2). Without `side`, a frame can't be checked against its wall, and the camera can't pick a wall to face. Proposed: add `side: Wall` and `thickness: number` to each wall entry.
- **S2. SceneModel doorways are missing `height`, and nothing says which wall they're on.** The camera needs the doorway position and facing for click-to-travel through it. Proposed: add `height` and `side` (from the first room's point of view).
- **S3. Room camera target.** `rooms[].center` is the floor center. A camera placed there at eye height looks at a wall from very close. Proposed: compile also emits `rooms[].view: { position, target }`. For example: eye height 1.6 m, standing back from the south wall, looking at the room center. This keeps "camera targets come from SceneModel" (§5.4) and makes the camera swappable (plan.md §2.6).
- **S4. Per-room memo is wrong for doorways.** A room's walls depend on its neighbors, because doorways are cut from shared edges. Memoizing on the room alone gives stale walls when a neighbor moves. Proposed: memo key = the room plus every room that shares an edge with it. Or recompile everything (see cut #4).
- **S5. `Artwork.image` URLs.** Defined only once uploaded (G12). The sample fixture needs a placeholder image path so the renderer can draw frames before F3 exists.
- **S6. No `version` migration story.** Fine for the hackathon, since `version: 1` is frozen. Flagging so no one adds fields without an ADR.

### 5. Questions for Quang
Each has my recommended answer. Reply with "approve all recommendations", or with the numbers you'd change.

- **Q1. Lane rule.** senior.md says backend/API → builder-1 and frontend/UI → builder-2. plan.md §8 assigns by module (builder-1: schema, compile, 3D renderer, API; builder-2: 2D editor, panels, upload). Which rule do we follow?
  **Recommend: the module split.** It balances the load (§3 risk 2). It also keeps builder-1 working on one pure-data → render pipeline it can test end to end. If approved, I update step 4 of `agents/senior.md`, flip ADR-005 to accepted, and reassign T-013 (renderer) to builder-1. The draft cards currently follow senior.md.
- **Q2. May I add `plan/reference-basement.md` to my owned files in `agents/senior.md`?**
  **Recommend: yes.** The notes now sit in `plan/architecture.md` under "Reference notes (pending Q2)". After approval I move them into their own file and update the pointers in the cards.
- **Q3. Approve the stack in `plan/stack.md`?**
  **Recommend: approve.** Then I add the stack line to AGENTS.md (C2).
- **Q4. Hosting and storage.**
  **Recommend: Vercel (preview deploy per PR) + Vercel Blob for gallery JSON and images.** Alternative if we want the Vultr side challenge: one Vultr VM running Next.js with local disk storage. Q4 decides how the Sprint 2 API cards store data.
- **Q5. Hacking period start/end?** Needed for the freeze time and sprint clock times.
  **Recommend: freeze at hour 28.**
- **Q6. Wall thickness (G1).**
  **Recommend: reading (a).** Each room's wall is 0.075 m thick, from the room edge to 0.075 m inside it. The wall surface sits at 0.075 m, and frames sit at 0.08 m. `walls[].start/end` = the room-edge line, plus `side` and `thickness` (S1).
- **Q7. Minimum overlap for a doorway (G3).**
  **Recommend: 1.0 m.** Shorter overlaps get no doorway (solid wall), and the editor shows the shared edge as "too short for a door".
- **Q8. Previous/Next room order (G14).**
  **Recommend: breadth-first from the entrance through doorways.** Ties broken by room order in the document, and unconnected rooms appended at the end.
- **Q9. Images before publish (G12).**
  **Recommend: upload each image to `/api/upload` as soon as it's added** and store only URLs in the document. Then autosave stays tiny, and publish only has to save JSON.
- **Q10. Touch support.**
  **Recommend: drop touch from F1's done-criteria** (cut #1). It becomes P2 polish.
- **Q11. DevOps tickets (C3).**
  **Recommend: allow `assignee: devops` on cards, and let devops set `in-progress` / `in-review` on its own cards.** That's a small change to `tasks/_TEMPLATE.md` and `scripts/set-status.sh`, which I would make on Docs only after you approve. Until then, devops Sprint 0 work is tracked in `plan/sprints/sprint-0.md`.
- **Q12. SceneModel additions S1–S3** (wall `side`/`thickness`, doorway `height`/`side`, room `view`). These change §5.4, not the stored Gallery schema (§6).
  **Recommend: approve.** I write ADR-007 and update `plan/architecture.md` before T-010 starts.

## Deploy safety until the freeze (senior, 2026-10-10 15:25 EDT, per Quang)
Context: at 19:01Z three production deploys started within 40 s and the third (T-119, `2f742c9`) failed on Vercel's side. The same code built locally and as a preview.
1. **One merge at a time, at least 3 minutes apart** (devops's merge helper enforces it). Before each merge, devops confirms the previous production deploy for `main` is **success**.
2. **After every merge:** devops checks that the Vercel production status for that SHA is success. builder-3 (T-117) runs the live smoke (publish-view + auth.spec) on https://galleriverse.vercel.app within 10 minutes. The senior design-checks visible features.
3. **Risky PRs** (T-124 viewer refactor, T-123 upload) merge only with: green `ci`, a green **Vercel preview** build, and the publish-view + phone e2e passing. Hard cutoffs: T-123 by 16:15, T-124 by 16:30, otherwise dropped.
4. **Known-good rollback target:** the production deployment of `b29284b` (T-121) is live and verified. If a production deploy is broken (smoke fails, 5xx, blank viewer), **Quang uses Vercel → Deployments → the last good one → "Instant Rollback"/"Promote to Production"** (no code change, ~30 s). Then the bad PR is reverted through a normal PR. Never force-push `main`.
5. **If a deploy fails to build** (like 2f742c9): Quang clicks **Redeploy** on it; if it fails again, read the build log before any new merge.
6. After 16:30 only `bugfix` PRs; after 18:00 `bugfix` only, with Quang's OK. The last merge should land by **17:40**, so that 17:45 is a clean final live run.
