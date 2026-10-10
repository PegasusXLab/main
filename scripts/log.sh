#!/usr/bin/env bash
# Append a timestamped entry to your per-ticket log for the current sprint.
# Usage: scripts/log.sh <agent-id> <task-id> "<entry>"
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 3 ] || die 'usage: log.sh <agent-id> <task-id> "<entry>"'
D="$(dirname "${BASH_SOURCE[0]}")"
agent="$1"; task="$2"; entry="$3"

"$D/docs-sync.sh" >/dev/null
sprint="$(current_sprint)"
dir="$(agent_dir "$agent")/sprint-$sprint"
file="$dir/$task.md"
mkdir -p "$dir"
ts="$(now_utc)"

if [ ! -f "$file" ]; then
  card="$(cd "$DOCS_DIR" && ls tasks/"$task"-*.md tasks/"$task".md 2>/dev/null | head -1 || true)"
  sed -e "s|^task:.*|task: $task|" \
      -e "s|^agent:.*|agent: $agent|" \
      -e "s|^sprint:.*|sprint: $sprint|" \
      -e "s|^role_in_ticket:.*|role_in_ticket: $(role_of "$agent")|" \
      -e "s|^card:.*|card: $card|" \
      -e "s|^started_at:.*|started_at: $ts|" \
      "$DOCS_DIR/team/_TEMPLATES/ticket-log.md" > "$file"
fi

# Insert the entry at the end of the "## Log" section (before "## Next step").
awk -v line="- ${ts}: ${entry}" '
  /^## Next step/ && !done { print line; print ""; done=1 }
  { print }
  END { if (!done) print line }
' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
sed_i "s|^last_updated:.*|last_updated: $ts|" "$file"

"$D/docs-push.sh" "$agent: log $task" >/dev/null
echo "logged: $agent/sprint-$sprint/$task.md"
