#!/usr/bin/env bash
# Change a task card's status, enforcing who may set which status.
# Usage: scripts/set-status.sh <task-id> <new-status> <agent-id>
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 3 ] || die 'usage: set-status.sh <task-id> <new-status> <agent-id>'
D="$(dirname "${BASH_SOURCE[0]}")"
task="$1"; status="$2"; agent="$3"

allowed=""
case "$status" in
  draft|ready)        allowed="senior" ;;
  in-progress|in-review) allowed="builder-1 builder-2 devops" ;;  # devops only on cards assigned to devops (checked below)
  changes-requested)  allowed="reviewer reviewer-2 devops" ;;
  approved)           allowed="reviewer reviewer-2" ;;
  merging|merged|deployed) allowed="devops" ;;
  blocked|needs-human) allowed="senior builder-1 builder-2 reviewer reviewer-2 devops qa pm" ;;
  *) die "unknown status '$status'" ;;
esac
in_list "$agent" "$allowed" || die "$agent may not set '$status' (allowed: $allowed)"

"$D/docs-sync.sh" >/dev/null
card="$(cd "$DOCS_DIR" && ls tasks/"$task"-*.md tasks/"$task".md 2>/dev/null | head -1 || true)"
[ -n "$card" ] || die "no task card found for $task in tasks/"
card="$DOCS_DIR/$card"
ts="$(now_utc)"

if [ "$status" = "ready" ] && ! grep -q '^approved_by_human: true' "$card"; then
  die "refusing 'ready': add 'approved_by_human: true' to the card frontmatter only after Quang approves the plan"
fi
if [[ "$status" =~ ^in-progress|in-review$ ]]; then
  assignee="$(awk -F': *' '/^assignee:/{print $2; exit}' "$card")"
  [ "$assignee" = "$agent" ] || die "$task is assigned to '$assignee', not '$agent'"
fi

sed_i "s|^status:.*|status: $status|" "$card"
sed_i "s|^updated_by:.*|updated_by: $agent|" "$card"
sed_i "s|^updated_at:.*|updated_at: $ts|" "$card"
echo "- $ts $agent: status -> $status" >> "$card"

"$D/docs-push.sh" "$agent: $task -> $status" >/dev/null
echo "$task -> $status"
