# ADR-011: A second reviewer, routed by lane
Status: **accepted** (Quang, 2026-10-10; proposed by builder-2/Parth).
## Context
Vic ran both builder-1 and the only reviewer. Every builder-1 PR was therefore reviewed by the same operator who built it, and all reviews queued on one person. A stall in Vic's sessions (2026-10-10, ~10:10Z) blocked builder-2's lane too.
## Decision
- New agent **`reviewer-2`**: operator Parth, Antigravity (Gemini), folder `team/reviewer-2__parth/`. It follows `agents/reviewer.md`.
- **Routing:** builder-1 and devops cards have `reviewer: reviewer-2`; builder-2 cards have `reviewer: reviewer` (Vic). No operator reviews their own builder's work.
- `set-status.sh` lets a reviewer set `approved` / `changes-requested` only on cards whose `reviewer:` field names it. `lib.sh` knows `reviewer-2`.
- **Priority rule:** Parth's builder-2 cards come first. reviewer-2 reviews when builder-2 isn't blocked on its own critical-path work (Sprint 1: T-023 to T-025).
- The verdict format stays as in ADR-010 (PR comment + `review-approved` label + card `approved`). reviewer-2 is on a different GitHub account, so it *may* also click GitHub approve, but the merge gate doesn't require it.
## Alternatives considered
- Keep one reviewer: simpler, but keeps the bottleneck and self-review.
- Start reviewer-2 only after Sprint 1: protects builder-2's focus, but leaves the bottleneck in place during the busiest stretch.
## Consequences
- Updated: AGENTS.md (team table, routing), agents/reviewer.md, agents/builder.md, agents/devops.md, tasks/_TEMPLATE.md, scripts/lib.sh, scripts/set-status.sh.
- Open builder-1/devops cards T-006 and T-032 to T-036 were switched to reviewer-2.
- Parth now prompts two Antigravity agents by hand. Watch builder-2's throughput at each check.
