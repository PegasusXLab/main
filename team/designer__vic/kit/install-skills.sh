#!/usr/bin/env bash
# Install the Pegasus UI skill kit into a code checkout (local only, git-excluded).
# Usage (from anywhere; Windows: Git Bash):
#   bash <docs>/team/designer__vic/kit/install-skills.sh <code-checkout> [--tool claude|antigravity] [--set builder|designer]
#   builder  (default): pegasus-ui, emil-design-eng, web-design-guidelines
#   designer: builder set + impeccable, frontend-design, design-taste-frontend,
#             find-animation-opportunities, improve-animations, review-animations
# Third-party skills are pinned to the commits the designer reviewed (team/designer__vic/SETUP.md §3).
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:?usage: install-skills.sh <code-checkout> [--tool claude|antigravity] [--set builder|designer]}"; shift
TOOL=claude; SET=builder
while [ $# -gt 0 ]; do
  case "$1" in
    --tool) TOOL="$2"; shift 2 ;;
    --set) SET="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done
case "$TOOL" in claude) SUB=.claude/skills ;; antigravity) SUB=.agents/skills ;; *) echo "bad --tool" >&2; exit 1 ;; esac
TARGET="$(cd "$TARGET" && pwd)"
git -C "$TARGET" rev-parse --git-dir >/dev/null 2>&1 || { echo "not a git checkout: $TARGET" >&2; exit 1; }
DEST="$TARGET/$SUB"; mkdir -p "$DEST"

# repo|commit|path-in-repo|installed-name
PINNED_BUILDER="
emilkowalski/skill|e8a175de22ae1e49370fc144c1f3bb9aeedf988d|skills/emil-design-eng|emil-design-eng
vercel-labs/agent-skills|063bee94c3f4df8453406c830b0a7df0f2860278|skills/web-design-guidelines|web-design-guidelines"
PINNED_DESIGNER="
pbakaus/impeccable|d631a8827f99414d2b6daba4ef08b7f8701751d7|.claude/skills/impeccable|impeccable
anthropics/skills|dbd4588f9e1033efb41dad4bef2f7947c8993d44|skills/frontend-design|frontend-design
leonxlnx/taste-skill|717446e07a78d4e6d7918b1fde1a263378eebac9|skills/taste-skill|design-taste-frontend
emilkowalski/skill|e8a175de22ae1e49370fc144c1f3bb9aeedf988d|skills/find-animation-opportunities|find-animation-opportunities
emilkowalski/skill|e8a175de22ae1e49370fc144c1f3bb9aeedf988d|skills/improve-animations|improve-animations
emilkowalski/skill|e8a175de22ae1e49370fc144c1f3bb9aeedf988d|skills/review-animations|review-animations"
LIST="$PINNED_BUILDER"; [ "$SET" = designer ] && LIST="$PINNED_BUILDER$PINNED_DESIGNER"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
fetch() { # repo commit -> dir
  local repo="$1" commit="$2" dir="$TMP/${1//\//_}"
  if [ ! -d "$dir" ]; then
    git init -q "$dir" && git -C "$dir" remote add origin "https://github.com/$repo"
    git -C "$dir" fetch -q --depth 1 origin "$commit"
    git -C "$dir" -c advice.detachedHead=false checkout -q "$commit"
  fi
  echo "$dir"
}

echo "$LIST" | while IFS='|' read -r repo commit path name; do
  [ -z "$repo" ] && continue
  src="$(fetch "$repo" "$commit")/$path"
  [ -d "$src" ] || { echo "missing $repo@$commit:$path" >&2; exit 1; }
  rm -rf "$DEST/$name"; cp -R "$src" "$DEST/$name"
  echo "installed $name ($repo@$commit)"
done
rm -rf "$DEST/pegasus-ui"; cp -R "$KIT_DIR/skills/pegasus-ui" "$DEST/pegasus-ui"; echo "installed pegasus-ui (Docs kit)"

EX="$(git -C "$TARGET" rev-parse --git-common-dir)/info/exclude"
case "$EX" in /*) ;; *) EX="$TARGET/$EX" ;; esac
for p in "$SUB/" PRODUCT.md DESIGN.md .impeccable/; do grep -qxF "$p" "$EX" 2>/dev/null || echo "$p" >> "$EX"; done
echo "done -> $DEST (git-excluded). Re-run after the designer updates the kit to refresh pegasus-ui."
