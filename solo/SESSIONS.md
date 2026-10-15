# Active Claude sessions (solo mode, parallel)

Vic runs several Claude Code sessions at once (terminal + `claude rc` from his phone). They are
separate conversations: they only know about each other through **this file** and **direct
cross-session messages** (`ListAgents` / `SendMessage`). Keep your row current.

## Rules
1. **One checkout, one owner.** Only the owner switches branches or runs the dev server in a
   checkout. Everyone else works in their own worktree (`pegasus-code/.claude/worktrees/<name>`, see
   `CLAUDE.local.md` → "Spawned sessions": `npm ci`, own port, `E2E_BASE_URL`).
2. **Claim before you build.** Add your task here (and its BACKLOG line) before starting; don't pick
   up something another row has claimed.
3. **Tell the other session** (SendMessage, by the name in `ListAgents`) when you open/merge a PR,
   touch shared files (`CameraRig.tsx`, `TourView.tsx`, `Scene.tsx`, docs indexes), or need a decision.
4. **Docs pushes:** `scripts/docs-sync.sh` before editing, `scripts/docs-push.sh` right after. Small
   commits, so two sessions rarely touch the same file at once.
5. Vic's gates still apply: plans (M/L) and merges are his call, whichever session asks.

## Sessions
| Session (ListAgents name) | Where | Owns | Working on | Branch / PR | Port |
|---|---|---|---|---|---|
| `antigravity-builder` | terminal / Antigravity | the `pegasus-code/` checkout + dev server | monitoring RC for next task; #143 shipped | none (main) | 3000 |
| `rc-phone` (title `victors-macbook-pro`) | `agy remote-control` from Vic's phone | nothing | coordination & directing next task | none | none |

_Last updated 2026-10-14 by antigravity-builder._
