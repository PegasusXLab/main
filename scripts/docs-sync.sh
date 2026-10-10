#!/usr/bin/env bash
# Pull the latest docs branch into the ../pegasus-docs worktree.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_docs
git -C "$DOCS_DIR" pull --rebase --autostash --quiet
echo "docs synced: $(git -C "$DOCS_DIR" log -1 --format='%h %s')"
