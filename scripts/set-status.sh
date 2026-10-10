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
  in-progress|in-review) allowed="builder-1 builder-2 builder-3 designer designer-2 devops senior" ;;  # senior: Quang override 2026-10-10 16:40 EDT, builds own cards; reviewed by another operator  # devops only on cards assigned to devops (checked below)
  changes-requested)  allowed="reviewer reviewer-2 reviewer-3 devops human" ;;
  approved)           allowed="reviewer reviewer-2 reviewer-3 human" ;;  # human: Quang one-time review of T-130/T-136/T-137 (2026-10-10)
  merging|merged|deployed) allowed="devops" ;;
  blocked|needs-human) allowed="senior builder-1 builder-2 builder-3 designer designer-2 reviewer reviewer-2 reviewer-3 devops qa pm" ;;
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
# A reviewer may only rule on cards whose reviewer field names it (ADR-011).
if [[ "$status" =~ ^(approved|changes-requested)$ ]] && [[ "$agent" == reviewer* ]]; then
  card_reviewer="$(awk -F': *' '/^reviewer:/{print $2; exit}' "$card")"
  [ "$card_reviewer" = "$agent" ] || die "$task is reviewed by '$card_reviewer', not '$agent'"
  # No operator reviews work built by one of their own agents (ADR-012).
  card_assignee="$(awk -F': *' '/^assignee:/{print $2; exit}' "$card")"
  if [ -n "$card_assignee" ] && in_list "$card_assignee" "$VALID_AGENTS"; then
    [ "$(operator_of "$agent")" != "$(operator_of "$card_assignee")" ] || die "$agent and $card_assignee share an operator; $task needs a reviewer from another operator"
  fi
fi

sed_i "s|^status:.*|status: $status|" "$card"
sed_i "s|^updated_by:.*|updated_by: $agent|" "$card"
sed_i "s|^updated_at:.*|updated_at: $ts|" "$card"
echo "- $ts $agent: status -> $status" >> "$card"

"$D/docs-push.sh" "$agent: $task -> $status" >/dev/null
echo "$task -> $status"
