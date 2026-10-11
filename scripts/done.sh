#!/usr/bin/env bash
# Move a handled message into the agent's inbox/done/.
# Usage: scripts/done.sh <agent-id> <message-file>   (basename or path)
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 2 ] || die 'usage: done.sh <agent-id> <message-file>'
D="$(dirname "${BASH_SOURCE[0]}")"
"$D/docs-sync.sh" >/dev/null

inbox="$(agent_dir "$1")/inbox"
name="$(basename "$2")"
[ -f "$inbox/$name" ] || die "message not found: $inbox/$name"
mkdir -p "$inbox/done"
git -C "$DOCS_DIR" mv "$inbox/$name" "$inbox/done/$name"
"$D/docs-push.sh" "$1: processed $name" >/dev/null
echo "done: $name"
