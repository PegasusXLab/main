#!/usr/bin/env bash
# List pending messages for an agent, oldest first.
# Usage: scripts/inbox.sh <agent-id>
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 1 ] || die 'usage: inbox.sh <agent-id>'
"$(dirname "${BASH_SOURCE[0]}")/docs-sync.sh" >/dev/null

dir="$(agent_dir "$1")/inbox"
count=0
for f in $(ls -1 "$dir" 2>/dev/null | grep -E '\.md$' | sort); do
  type="$(awk -F': *' '/^type:/{print $2; exit}' "$dir/$f")"
  task="$(awk -F': *' '/^task:/{print $2; exit}' "$dir/$f")"
  printf '%-45s type=%-18s task=%s\n' "$f" "$type" "$task"
  count=$((count + 1))
done
[ "$count" -gt 0 ] || echo "inbox empty for $1"
