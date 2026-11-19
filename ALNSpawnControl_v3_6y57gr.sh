#!/data/data/com.termux/files/usr/bin/bash
# ALNStudios update script: MCPEDL/Script/ALNSpawnControl -> vv3 (search and replace edits stored at the end of this file).
#   bash ALNSpawnControl_v3_6y57gr.sh
set -e
SELF="$(readlink -f -- "$0")"
SCRIPT_NAME="ALNSpawnControl_v3_6y57gr.sh"
REPO="https://github.com/AllensCreations/MCPE-Curseforges.git"
VERSION="v3"
DEST="MCPEDL/Script/ALNSpawnControl"
cd "$HOME"
[ -d "$HOME/MCPE-Curseforges" ] || git clone "$REPO" "$HOME/MCPE-Curseforges"
cd "$HOME/MCPE-Curseforges"
git checkout -q -- Package changelog_views 2>/dev/null || true
git pull --rebase --autostash
[ -f scripts/apply_update.py ] || { echo "ERROR: scripts/apply_update.py is missing in the repo. Apply the Search-Replace-Update script first."; exit 1; }

SPEC="$(mktemp)"
EDITS="$(mktemp)"
DELETES="$(mktemp)"
TOUCHED="$(mktemp)"
DONE=0
cleanup() {
  rc=$?
  rm -f -- "$SPEC" "$EDITS" "$DELETES" "$TOUCHED"
  if [ "$rc" -ne 0 ] && [ "$DONE" != "1" ]; then
    git reset -q 2>/dev/null || true
    git checkout -q -- . 2>/dev/null || true
    [ "$DEST" != "." ] && git clean -fdq -- "$DEST" 2>/dev/null || true
    echo "Failed. Nothing was pushed."
  fi
}
trap cleanup EXIT

sed -n '/^#--- ALN UPDATE BEGIN ---$/,/^#--- ALN UPDATE END ---$/p' "$SELF" | sed '1d;$d' | sed 's/^#//' > "$SPEC"
[ -s "$SPEC" ] || { echo "ERROR: the edit block is missing from this file."; exit 1; }

grep '^@@ delete-file ' "$SPEC" | sed 's/^@@ delete-file //' > "$DELETES" || true
grep -v '^@@ delete-file ' "$SPEC" > "$EDITS" || true

DATE="$(TZ=Asia/Singapore date +%F)"
python3 scripts/apply_update.py "$EDITS" --date "$DATE" --touched "$TOUCHED"

if git diff --name-only | grep -q "INSTRUCTIONS.md"; then
  python3 scripts/check_instruction_files.py
fi

while IFS= read -r pat; do
  [ -n "$pat" ] || continue
  found=0
  while IFS= read -r -d '' f; do
    git rm -q -f -- "$f"
    echo "deleted  $f"
    found=1
  done < <(git ls-files -z -- ":(glob)$pat")
  [ "$found" = "1" ] || echo "skipped  $pat (no tracked file matches)"
done < "$DELETES"

while IFS= read -r f; do
  [ -n "$f" ] && git add -- "$f"
done < "$TOUCHED"
if git diff --cached --quiet; then
  echo "Nothing to commit"
else
  git commit -m "chore: update $DEST to v$VERSION"
  git push
fi
DONE=1
rm -f -- "$SELF"
exit 0
#--- ALN UPDATE BEGIN ---
#@@ project MCPEDL/Script/ALNSpawnControl
#@@ version v3
#@@ file behavior_pack/scripts/spawn_ui.js
#@@ replace
#    if (!nameTag || nameTag.trim().toLowerCase() !== "spawn manager") {
#@@ with
#    if (!nameTag || nameTag.trim().toLowerCase() !== "spawn control") {
#@@ replace
#      player.onScreenDisplay.setActionBar("§c[SpawnControl] §fOnly admins can open Spawn Manager!");
#@@ with
#      player.onScreenDisplay.setActionBar("§c[SpawnControl] §fOnly admins can open Spawn Control!");
#
#@@ changelog Book Renamed to Spawn Control
#### Improved & Balanced
#- **Book Trigger Rename**: The book must now be renamed to "Spawn Control" instead of "Spawn Manager" to open the control panel.
#--- ALN UPDATE END ---
