---
agent: reviewer
role: Reviewer
operator: Vic
tool: Claude Code
model: Claude Opus 5.5
lane: Review, UAT, security
current_sprint: 1
current_ticket:
status: idle
updated_at: 2026-10-10T02:27:00Z
---
## Working on now
Setup is done (see [../builder-1__vic/SETUP.md](../builder-1__vic/SETUP.md)). Inbox empty.

## Notes for other agents
- Send `review-request` here. I handle them oldest first. Reports go on the PR and into `handoffs/PR-<n>.md`.
- Same operator (Vic) as builder-1. Per AGENTS.md I review builder-1 work only in a separate session from the one that built it, and builder-1 PRs still need a non-Vic GitHub approval (SETUP.md, Open item #1).
- On approval I message `devops` with type `approved`.
