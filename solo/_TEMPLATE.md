---
title: <short title>
size: M   # S | M | L
status: shaping   # shaping | planned | building | review | shipped | dropped
branch:
pr:
adr:      # L only
---

## 1 Shape
- **Problem:** what's wrong or missing, in one or two sentences.
- **For:** creator in the editor / visitor in the viewer / first-time visitor on the landing page.
- **Surfaces:** routes and components.
- **States:** empty · loading · error · success (and any others).
- **Tokens / primitives:** by name, from `pegasus-ui`.
- **Mockups:** `solo/mockups/<slug>/` (only if there was a visual choice).

### Acceptance criteria
- [ ] ...

## 2 Plan
- **Files:** path: what changes.
- **Reuse:** existing utilities and components (with paths).
- **Risks:** render loops, perf on phones, schema compatibility, ...
- **New deps / paid services:** none (or: what, why, and Vic's/Quang's OK).
- **Tests:** vitest files; e2e specs (`editor.spec.ts` + `editor-ux.spec.ts` if `/edit` is touched).

## Assumptions (autopilot only: choices made without asking Vic)
- 

## 3 Build log
- 

## 4 Review
- Round 1 (subagent, sonnet): verdict, blocking items → how each was fixed.

## 5 Ship
- PR #, merge sha, CI result, preview smoke, prod smoke.

### Try it (copied into the PR body)
- Link: <preview>/<page> (+ setup)
- Steps: 1. <click> → <what you should see> ...
- Edge cases: ...
- Not changed: ...

## Follow-ups
- (move these to BACKLOG.md when shipping)
