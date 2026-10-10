#!/usr/bin/env bash
# Drop a message into another agent's inbox.
# Usage: scripts/send.sh <from> <to> <type> <task-id> [pr] "<body>"
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
D="$(dirname "${BASH_SOURCE[0]}")"

case $# in
  5) from="$1"; to="$2"; type="$3"; task="$4"; pr=""; body="$5" ;;
  6) from="$1"; to="$2"; type="$3"; task="$4"; pr="$5"; body="$6" ;;
  *) die 'usage: send.sh <from> <to> <type> <task-id> [pr] "<body>"' ;;
esac

"$D/docs-sync.sh" >/dev/null
file="$(write_message "$from" "$to" "$type" "$task" "$pr" "$body")"
"$D/docs-push.sh" "$from: $type to $to $task" >/dev/null
echo "sent: $(basename "$file") -> $to"
