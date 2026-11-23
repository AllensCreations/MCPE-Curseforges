#!/usr/bin/env python3
"""Update script builder for ALNStudios/MCPE-Curseforges.

Turns a search-and-replace spec (format: see scripts/apply_update.py) into ONE Termux .sh named
<Repofilename>_<Version>_<Rand>.sh. The spec travels inside the .sh as a comment block, so the file is
small, readable and the only thing delivered. The .sh pulls, applies the edits with apply_update.py
(exact unique match, all-or-nothing, idempotent), sets the manifest version, writes both changelogs,
commits and pushes.

File removal: a line "@@ delete-file <path or glob>" (repo-root-relative, tracked files only, * does not cross a
folder, e.g. "scripts/old.py" or "MCPEDL/*/*/test_world.json") makes the .sh run "git rm" on every match. The
line is taken out of the spec before apply_update.py reads it, so older copies of apply_update.py still work.

Usage: python3 make_update_script.py spec.txt [--rand k7q2x] [--out-dir .] [--verify PATH_TO_REPO_CLONE]
  --verify  dry-runs the spec against a local clone and refuses to build if any edit would fail.
Run the .sh:  bash ~/storage/downloads/<file>.sh
"""
import argparse
import re
import secrets
import shutil
import string
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import apply_update as au  # noqa: E402

BEGIN, END = "#--- ALN UPDATE BEGIN ---", "#--- ALN UPDATE END ---"
DELETE = "@@ delete-file "
DELETE_RE = re.compile(r"^[A-Za-z0-9._][A-Za-z0-9._ */-]*$")
REPO_URL = "https://github.com/AllensCreations/MCPE-Curseforges.git"

TEMPLATE = r'''#!/data/data/com.termux/files/usr/bin/bash
# ALNStudios update script: @@PROJECT@@ -> v@@VERSION@@ (search and replace edits stored at the end of this file).
#   bash @@SCRIPT@@
set -e
SELF="$(readlink -f -- "$0")"
SCRIPT_NAME="@@SCRIPT@@"
REPO="@@REPO@@"
VERSION="@@VERSION@@"
DEST="@@PROJECT@@"

# Color constants
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_DIM="\033[2m"
C_GREEN="\033[1;32m"
C_CYAN="\033[1;36m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"
C_BLUE="\033[1;34m"

ui_banner() {
  echo -e "\n${C_CYAN}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${C_RESET}"
  echo -e "${C_CYAN}┃${C_RESET} ${C_BOLD}ALNStudios MCPE Installer${C_RESET}                             ${C_CYAN}┃${C_RESET}"
  echo -e "${C_CYAN}┃${C_RESET} Target:  ${C_YELLOW}$DEST${C_RESET}"
  echo -e "${C_CYAN}┃${C_RESET} Version: ${C_GREEN}v$VERSION${C_RESET}"
  echo -e "${C_CYAN}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${C_RESET}\n"
}

ui_step() {
  echo -e " ${C_CYAN}▸${C_RESET} ${C_BOLD}$1${C_RESET}"
}

ui_ok() {
  echo -e "   ${C_GREEN}✔${C_RESET} $1"
}

ui_warn() {
  echo -e "   ${C_YELLOW}⚠${C_RESET} $1"
}

ui_err() {
  echo -e "   ${C_RED}✖ $1${C_RESET}"
}

ui_banner

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
    echo -e "\n${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
    ui_err "Update failed! Working tree was cleanly rolled back."
    echo -e "${C_RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}\n"
  fi
}
trap cleanup EXIT

cd "$HOME"
if [ ! -d "$HOME/MCPE-Curseforges" ]; then
  ui_step "Cloning repository..."
  git clone "$REPO" "$HOME/MCPE-Curseforges"
  ui_ok "Repository cloned"
fi

cd "$HOME/MCPE-Curseforges"
git checkout -q -- Package changelog_views 2>/dev/null || true

ui_step "Pulling latest upstream changes..."
git pull --rebase --autostash
ui_ok "Repository up to date"

[ -f scripts/apply_update.py ] || { ui_err "scripts/apply_update.py missing in repo."; exit 1; }

ui_step "Extracting embedded update payload..."
sed -n '/^#--- ALN UPDATE BEGIN ---$/,/^#--- ALN UPDATE END ---$/p' "$SELF" | sed '1d;$d' | sed 's/^#//' > "$SPEC"
[ -s "$SPEC" ] || { ui_err "Edit block missing from this file."; exit 1; }

grep '^@@ delete-file ' "$SPEC" | sed 's/^@@ delete-file //' > "$DELETES" || true
grep -v '^@@ delete-file ' "$SPEC" > "$EDITS" || true
ui_ok "Payload verified"

ui_step "Applying edits and validating..."
DATE="$(TZ=Asia/Singapore date +%F)"
python3 scripts/apply_update.py "$EDITS" --date "$DATE" --touched "$TOUCHED"
ui_ok "Edits applied cleanly"

if git diff --name-only | grep -q "INSTRUCTIONS.md"; then
  ui_step "Validating instruction files..."
  python3 scripts/check_instruction_files.py
  ui_ok "Instructions check passed"
fi

while IFS= read -r pat; do
  [ -n "$pat" ] || continue
  found=0
  while IFS= read -r -d '' f; do
    git rm -q -f -- "$f"
    ui_ok "Deleted: $f"
    found=1
  done < <(git ls-files -z -- ":(glob)$pat")
  [ "$found" = "1" ] || ui_warn "Skipped: $pat (no tracked file matches)"
done < "$DELETES"

while IFS= read -r f; do
  [ -n "$f" ] && git add -- "$f"
done < "$TOUCHED"

ui_step "Finalizing git commit and sync..."
if git diff --cached --quiet; then
  ui_warn "Nothing to commit (already applied)"
else
  git commit -m "chore: update $DEST to v$VERSION"
  git push
  ui_ok "Pushed to GitHub main"
fi

DONE=1
rm -f -- "$SELF"

echo -e "\n${C_GREEN}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${C_RESET}"
echo -e "${C_GREEN}┃${C_RESET} ${C_BOLD}UPDATE COMPLETE!${C_RESET}                                      ${C_GREEN}┃${C_RESET}"
echo -e "${C_GREEN}┃${C_RESET} Package ${C_BOLD}$DEST${C_RESET} is now on ${C_GREEN}v$VERSION${C_RESET}."
echo -e "${C_GREEN}┃${C_RESET} Temporary script removed cleanly.                       ${C_GREEN}┃${C_RESET}"
echo -e "${C_GREEN}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${C_RESET}\n"

exit 0
@@BLOCK@@
'''


def fail(msg, code=1):
    print(msg)
    sys.exit(code)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("--rand")
    ap.add_argument("--out-dir", default=".")
    ap.add_argument("--verify", help="path of a local clone of the repo to dry-run against")
    a = ap.parse_args()
    text = Path(a.spec).read_text(encoding="utf-8").replace("\r\n", "\n")
    deletes = [l[len(DELETE):].strip() for l in text.split("\n") if l.startswith(DELETE)]
    for d in deletes:
        if not DELETE_RE.match(d) or ".." in d.split("/") or ":" in d:
            fail(f"SPEC ERROR: unsafe delete-file path: {d!r}")
    try:
        spec = au.parse("\n".join(l for l in text.split("\n") if not l.startswith(DELETE)))
    except au.Fail as e:
        fail(f"SPEC ERROR: {e}")
    rand = a.rand or "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    if not re.fullmatch(r"[a-z0-9]{5,}", rand):
        fail("--rand needs at least 5 lowercase letters or digits.")
    proj = spec["project"].strip().rstrip("/")
    name = "Repo" if proj == "." else proj.split("/")[-1]
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", name):
        fail(f"Project folder name not usable in a file name: {name}")
    if not spec["ops"] and not spec["changelog"] and not deletes:
        fail("SPEC ERROR: no edits and no changelog.")
    if proj != "." and not spec["changelog"]:
        fail("SPEC ERROR: a project update needs '@@ changelog <Update Name>' (CHANGELOG.md is mandatory).")
    if a.verify:
        try:
            notes, touched = au.run(spec, a.verify, "2000-01-01", dry=True)
        except au.Fail as e:
            fail(f"VERIFY FAILED: {e}", e.code)
        print(f"VERIFY OK (dry run): {len(touched)} file(s) would change")
    label = f"v{spec['version']}" if proj == "." and spec["version"].isdigit() else spec["version"]
    script = f"{name}_{label}_{rand}.sh"
    block = BEGIN + "\n" + "\n".join("#" + l for l in text.rstrip("\n").split("\n")) + "\n" + END
    body = (TEMPLATE.replace("@@SCRIPT@@", script).replace("@@VERSION@@", spec["version"])
            .replace("@@PROJECT@@", proj).replace("@@REPO@@", REPO_URL).replace("@@BLOCK@@", block))
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    target = out / script
    target.write_text(body, encoding="utf-8", newline="\n")
    got = "\n".join(l[1:] for l in body.split(BEGIN + "\n", 1)[1].split("\n" + END, 1)[0].split("\n"))
    if got != text.rstrip("\n"):
        target.unlink()
        fail("ROUND-TRIP FAILED: the edit block read back from the .sh differs.", 2)
    if shutil.which("bash") and subprocess.run(["bash", "-n", str(target)]).returncode != 0:
        target.unlink()
        fail("SYNTAX CHECK FAILED", 2)
    print(f"UPDATE SCRIPT OK: {script} ({len(spec['ops'])} edit(s)). Not tested in game.")


if __name__ == "__main__":
    main()
