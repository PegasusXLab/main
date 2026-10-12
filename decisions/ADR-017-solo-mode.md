# ADR-017: Solo mode

- Status: accepted
- Date: 2026-10-12
- Decided by: Vic

## Context
The hackathon ended on 2026-10-11. Vic keeps building Galleriverse alone. The team process (ADR-005, ADR-010 to ADR-013) coordinated four operators and about ten agent ids through inbox messages, status scripts, cross-operator review and a devops merge gate. Running all those roles as separate sessions for one person would cost a lot of tokens and machine time, and most of the coordination has no one left to coordinate.

## Decision
When Vic works alone, one agent session (the `/ship` skill, `solo/README.md`) covers designer → senior → builder → reviewer → devops, scaled by change size (S/M/L).

- **Amends ADR-010 (merge gate):** Vic's agent may squash-merge its own PR once (1) `ci` and Vercel are green, (2) the agent has smoke-tested the preview, and (3) Vic said "merge". Direct pushes to `main` stay forbidden.
- **Amends ADR-011/012 (review independence):** for M/L changes, independent review is one fresh subagent (Sonnet) that sees only the diff, the acceptance criteria and the security checklist. S changes get a checklist self-review.
- **Suspends:** inbox/`send.sh`/`set-status.sh`, task cards, BOARD/SPRINT upkeep and reviewer routing. Planning lives in `solo/` (one feature file per M/L change, plus `BACKLOG.md`).
- **Keeps:** two-branch rule, no secrets, rollback runbook, changelog, Next 16 docs gotcha, and new dependencies/paid services need an explicit OK (Quang's too while Vercel/Vultr are on his accounts).

## When team mode returns
Whenever another operator is active, their PRs and cards follow the team rules (ADR-010 to ADR-013), and Vic's agent never merges someone else's PR. Solo work in flight can stay on the solo flow.

## Consequences
- Faster loop with two human gates (plan, merge) instead of four handoffs.
- Less independence in review. This is mitigated by the fresh subagent, the mandatory /edit e2e (the #101 lesson) and the preview + prod smoke.
