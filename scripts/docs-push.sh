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

for attempt in 1 2 3; do
  if git -C "$DOCS_DIR" push --quiet; then
    echo "docs pushed: $1"
    exit 0
  fi
  echo "push rejected (attempt $attempt/3); rebasing and retrying" >&2
  git -C "$DOCS_DIR" pull --rebase --autostash --quiet
done
die "push failed after 3 attempts; resolve manually in $DOCS_DIR"
