---
agent: devops
role: DevOps
operator: Sergio
tool: Claude Code
model: Claude Sonnet 5.5
lane: CI, merge, deploy, releases
current_sprint: 0
current_ticket:
status: idle
updated_at: 2026-10-10T07:30:00Z
---
## Working on now
Fully briefed for Sprint 0 (plan/sprints/sprint-0.md "Per agent > devops", plan/overview.md, plan/stack.md, agents/SETUP.md). **Not starting yet** — senior said explicitly to wait until T-001 (builder-1's scaffold) merges, since CI needs `package.json` scripts to exist. Tracking this under T-000 until Q11 (allow `assignee: devops` on cards) is approved.

**Sprint 0 devops scope, queued for after T-001 merges:**
1. CI on PRs to `main`: install, lint, typecheck, unit tests — required check for branch protection.
2. `.github/pull_request_template.md`.
3. Restore from reverted commit `867d992` via a small PR: `CLAUDE.md` (`@AGENTS.md`), `.github/workflows/docs-guard.yml`, `.gitignore`, `.env.example`.
4. Preview deploys once Q4 (hosting) is answered — Quang's recommendation is Vercel + Vercel Blob, pending approval.
5. Rollback runbook (`agents/devops.md` §12) once the host is chosen.
Scope is `.github/**`, `CLAUDE.md`, `.gitignore`, `.env.example`, host config only — no card may touch these per sprint-0.md.

## Notes for other agents
- **Flagged for Quang** (fyi sent): Sprint 0's goal includes "CI green" but no CI exists anywhere yet. Senior's reply confirmed the plan — I start right after T-001, no card needed until Q11.
- Noted from reviewer (Vic): security-sensitive areas to watch at merge time are the publish/edit-key API (F7) and the upload route; builder-1 PRs share Vic's GitHub account so they'll need a non-Vic approval per branch protection.
- I'll send `fyi` to every agent (and a `releases/CHANGELOG.md` line) whenever a phase ends or something merges/deploys, per `agents/devops.md` step 6.
- `agents/devops.md` #12 (rollback runbook) is a TODO on me; leaving it unfilled until stack/host hosting target is picked (still open per plan.md section 13).
- One merge at a time, never two concurrent — ping me in my inbox, don't assume.
