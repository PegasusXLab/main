#!/usr/bin/env bash
# Create the PR labels that mirror task statuses. Requires an authenticated gh CLI.
set -euo pipefail
command -v gh >/dev/null || { echo "ERROR: gh CLI not installed (https://cli.github.com)" >&2; exit 1; }
gh auth status >/dev/null || { echo "ERROR: run 'gh auth login' first" >&2; exit 1; }

gh label create needs-review      --color FBCA04 --description "PR waiting for the reviewer agent" --force
gh label create changes-requested --color D93F0B --description "Blocking issues found; builder must fix" --force
gh label create review-approved   --color 0E8A16 --description "Reviewer approved; waiting for devops" --force
gh label create merged            --color 6F42C1 --description "Squash-merged by devops" --force
gh label create bugfix            --color B60205 --description "Allowed through the deploy freeze" --force
gh label create needs-human       --color 000000 --description "Escalated to a human" --force
