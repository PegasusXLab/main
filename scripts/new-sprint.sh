#!/usr/bin/env bash
# Senior only: start a new sprint.
# Usage: scripts/new-sprint.sh <N> "<goal>"
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 2 ] || die 'usage: new-sprint.sh <N> "<goal>"'
D="$(dirname "${BASH_SOURCE[0]}")"
n="$1"; goal="$2"
[[ "$n" =~ ^[0-9]+$ ]] || die "sprint number must be an integer"

"$D/docs-sync.sh" >/dev/null
cat > "$DOCS_DIR/SPRINT.md" <<EOF
---
sprint: $n
phase: planning   # planning | build | stabilize | freeze | demo
goal: $goal
start: $(date -u +%F)
end:
---
## Tickets
| ID | Title | Assignee | Status |
|---|---|---|---|
## Notes
EOF

for d in "$DOCS_DIR"/team/*__*/; do
  id="$(basename "$d")"; id="${id%%__*}"
  mkdir -p "$d/sprint-$n"
  [ -f "$d/sprint-$n/summary.md" ] || cp "$DOCS_DIR/team/_TEMPLATES/sprint-summary.md" "$d/sprint-$n/summary.md"
  in_list "$id" "qa pm" && continue
  write_message senior "$id" fyi "SPRINT-$n" "" "Sprint $n started (phase: planning). Goal: $goal. Read SPRINT.md, then your PROFILE.md." >/dev/null
done

"$D/docs-push.sh" "senior: start sprint $n" >/dev/null
echo "sprint $n started"
