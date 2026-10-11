#!/usr/bin/env bash
# Commit everything in the docs worktree and push, retrying on rejection.
# Usage: scripts/docs-push.sh "<agent-id>: <action> <task-id>"
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
[ $# -eq 1 ] || die 'usage: docs-push.sh "<message>"'
require_docs

git -C "$DOCS_DIR" add -A
if ! git -C "$DOCS_DIR" diff --cached --quiet; then
  git -C "$DOCS_DIR" commit --quiet -m "$1"
fi

# Batch mode: with DOCS_DEFER_PUSH=1, commit locally only. A final docs-push.sh run without it
# pushes everything in one go (devops uses this so a merge is one push, not five).
if [ "${DOCS_DEFER_PUSH:-0}" = "1" ]; then
  echo "docs committed (push deferred): $1"
  exit 0
fi

# Several agents push at once, so retry with a short random backoff before giving up.
attempts=8
for attempt in $(seq 1 $attempts); do
  if git -C "$DOCS_DIR" push --quiet; then
    echo "docs pushed: $1"
    exit 0
  fi
  echo "push rejected (attempt $attempt/$attempts); rebasing and retrying" >&2
  sleep $((RANDOM % 3 + 1))
  git -C "$DOCS_DIR" pull --rebase --autostash --quiet
done
die "push failed after $attempts attempts; resolve manually in $DOCS_DIR"
