#!/usr/bin/env python3
"""Update script builder for ALNStudios/MCPE-Curseforges.

Turns a search-and-replace spec (format: see scripts/apply_update.py) into ONE Termux .sh named
<Repofilename>_<Version>_<Rand>.sh. The spec travels inside the .sh as a comment block, so the file is
small, readable and the only thing delivered. The .sh pulls, applies the edits with apply_update.py
(exact unique match, all-or-nothing, idempotent), sets the manifest version, writes both changelogs,
commits and pushes.

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
cd "$HOME"
[ -d "$HOME/MCPE-Curseforges" ] || git clone "$REPO" "$HOME/MCPE-Curseforges"
cd "$HOME/MCPE-Curseforges"
git checkout -q -- description_views image_prompts changelog_views 2>/dev/null || true
git pull --rebase --autostash
[ -f scripts/apply_update.py ] || { echo "ERROR: scripts/apply_update.py is missing in the repo. Apply the Search-Replace-Update script first."; exit 1; }

SPEC="$(mktemp)"
TOUCHED="$(mktemp)"
DONE=0
cleanup() {
  rc=$?
  rm -f -- "$SPEC" "$TOUCHED"
  if [ "$rc" -ne 0 ] && [ "$DONE" != "1" ]; then
    git checkout -q -- . 2>/dev/null || true
    [ "$DEST" != "." ] && git clean -fdq -- "$DEST" 2>/dev/null || true
    echo "Failed. Nothing was pushed."
  fi
}
trap cleanup EXIT

sed -n '/^#--- ALN UPDATE BEGIN ---$/,/^#--- ALN UPDATE END ---$/p' "$SELF" | sed '1d;$d' | sed 's/^#//' > "$SPEC"
[ -s "$SPEC" ] || { echo "ERROR: the edit block is missing from this file."; exit 1; }

DATE="$(TZ=Asia/Singapore date +%F)"
python3 scripts/apply_update.py "$SPEC" --date "$DATE" --touched "$TOUCHED"

if git diff --name-only | grep -q "INSTRUCTIONS.md"; then
  python3 scripts/check_instruction_files.py
fi

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
    try:
        spec = au.parse(text)
    except au.Fail as e:
        fail(f"SPEC ERROR: {e}")
    rand = a.rand or "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    if not re.fullmatch(r"[a-z0-9]{5,}", rand):
        fail("--rand needs at least 5 lowercase letters or digits.")
    proj = spec["project"].strip().rstrip("/")
    name = "Repo" if proj == "." else proj.split("/")[-1]
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", name):
        fail(f"Project folder name not usable in a file name: {name}")
    if not spec["ops"] and not spec["changelog"]:
        fail("SPEC ERROR: no edits and no changelog.")
    if proj != "." and not spec["changelog"]:
        fail("SPEC ERROR: a project update needs '@@ changelog <Update Name>' (CHANGELOG.md is mandatory).")
    if a.verify:
        try:
            notes, touched = au.run(spec, a.verify, "2000-01-01", dry=True)
        except au.Fail as e:
            fail(f"VERIFY FAILED: {e}", e.code)
        print(f"VERIFY OK (dry run): {len(touched)} file(s) would change")
    script = f"{name}_{spec['version']}_{rand}.sh"
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
