# ADR-003: Reference repo is read-only inspiration
Status: **accepted** (rule given by Quang, 2026-10-10).
## Context
basementstudio/website-2k25 inspired the product. It has no license file, so all rights are reserved by default. plan.md §9.
## Decision
- Pinned at `basementstudio/website-2k25 @ 70d274e3638a20d53246896177e6ed24915c7662`.
- Read it only with `gh api` or raw.githubusercontent.com URLs at that SHA. Never clone it into our repo.
- Never copy code, shaders, models, textures or fonts into our repo or docs. Notes describe patterns in plain language.
- Findings live in plan/architecture.md "Reference notes" (moving to `plan/reference-basement.md` if Q2 is approved).
- The README on main lists it as inspiration (disclosure; owner TBD, see overview C5).
## Alternatives considered
Cloning for local search: faster, but risks accidental copying and breaks the rule.
## Consequences
Everything we build is our own. Some study is slower (API reads). The rule is in AGENTS.md for every agent.
