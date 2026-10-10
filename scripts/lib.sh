#!/usr/bin/env bash
# Shared helpers. Source this file; do not execute it.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR_RAW="$REPO_ROOT"   # scripts live at the root of the Docs worktree

VALID_AGENTS="senior builder-1 builder-2 reviewer reviewer-2 devops qa pm human"
VALID_TYPES="assignment question answer review-request changes-requested approved merged deployed escalation fyi"

die() { echo "ERROR: $*" >&2; exit 1; }

# Resolve at source time so callers (not just subshells) see DOCS_DIR.
DOCS_DIR=""
if [ -e "$DOCS_DIR_RAW/.git" ]; then DOCS_DIR="$(cd "$DOCS_DIR_RAW" && pwd)"; fi

require_docs() {
  if [ ! -e "$DOCS_DIR_RAW/.git" ]; then
    die "not inside the Docs worktree ($DOCS_DIR_RAW). Create it with: git worktree add ../pegasus-docs Docs"
  fi
  DOCS_DIR="$(cd "$DOCS_DIR_RAW" && pwd)"
}

now_utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }
stamp_utc() { date -u +%Y%m%d-%H%M%S; }

# Portable in-place sed (GNU and BSD): sed_i 's/a/b/' file
sed_i() { local f="${*: -1}"; sed -i.bak "${@:1:$#-1}" "$f" && rm -f "$f.bak"; }

in_list() { local needle="$1"; shift; for x in $*; do [ "$x" = "$needle" ] && return 0; done; return 1; }

# agent_dir <agent-id> -> absolute path of team/<agent-id>__*/ (or team/human/)
agent_dir() {
  require_docs
  local id="$1"
  in_list "$id" "$VALID_AGENTS" || die "unknown agent '$id' (valid: $VALID_AGENTS)"
  if [ "$id" = "human" ]; then echo "$DOCS_DIR/team/human"; return; fi
  local matches=() d
  for d in "$DOCS_DIR"/team/"$id"__*; do [ -d "$d" ] && matches+=("$d"); done
  [ "${#matches[@]}" -eq 1 ] || die "expected exactly one folder team/${id}__*, found ${#matches[@]}"
  echo "${matches[0]}"
}

# current_sprint -> number from SPRINT.md frontmatter
current_sprint() {
  require_docs
  local n
  n="$(awk '/^sprint:/{print $2; exit}' "$DOCS_DIR/SPRINT.md")"
  [ -n "$n" ] || die "could not read sprint number from SPRINT.md"
  echo "$n"
}

# role_in_ticket <agent-id>
role_of() {
  case "$1" in
    senior) echo senior ;;
    builder-*) echo builder ;;
    reviewer*) echo reviewer ;;
    *) echo "$1" ;;
  esac
}

# write_message <from> <to> <type> <task> <pr> <body> -> writes file, prints its path (no push)
write_message() {
  local from="$1" to="$2" type="$3" task="$4" pr="$5" body="$6"
  in_list "$from" "$VALID_AGENTS" || die "unknown sender '$from'"
  in_list "$type" "$VALID_TYPES" || die "unknown message type '$type' (valid: $VALID_TYPES)"
  local dir file
  [ -n "$from" ] || die "missing sender"
  dir="$(agent_dir "$to")" || exit 1
  dir="$dir/inbox"
  mkdir -p "$dir/done"
  file="$dir/$(stamp_utc)-$from-$task.md"
  {
    echo "---"
    echo "from: $from"
    echo "to: $to"
    echo "type: $type"
    echo "task: $task"
    echo "pr: $pr"
    echo "created_at: $(now_utc)"
    echo "---"
    echo "$body"
  } > "$file"
  echo "$file"
}
