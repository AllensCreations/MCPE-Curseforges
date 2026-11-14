#!/usr/bin/env python3
"""Pack script builder for ALNStudios/MCPE-Curseforges.

Turns build/<Project-Name>/ into ONE Termux .sh file that carries the whole project inside it
(as a base64 block at the end). Nothing else is written or delivered: no .zip, .mcaddon, .mcworld,
.mcpack, .json, .js or .b64 file.

It runs the same checks as scripts/build_payload.py, builds the ZIP in memory, wraps it, then proves
the round trip with the importer's own reader.

Usage:  python3 make_pack_script.py build/Project-Name [--rand k7q2x] [--out-dir .] [--check-only]
Output: <Project-Name>_<Version>_<Rand>.sh  (Version = the Behavior Pack version, Rand = 6 random characters)

Run the .sh:
  bash <file>.sh          Termux: creates the project, builds worlds, commits and pushes
  bash <file>.sh stage    Termux: only copies the .sh into MCPEDL/incoming/ and pushes, then run the GitHub
                          workflow "Create Project from Base64" with payload_file = <file>.sh
The workflow only READS the payload block of a .sh. It never executes the file.
Exit codes: 0 ok, 1 checks failed, 2 packaging or round-trip failed.
"""
import argparse
import contextlib
import io
import json
import re
import secrets
import shutil
import string
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_payload as bp  # noqa: E402
import import_project_payload as ipp  # noqa: E402

BEGIN, END = ipp.SH_BEGIN, ipp.SH_END
REPO_URL = "https://github.com/AllensCreations/MCPE-Curseforges.git"

TEMPLATE = r'''#!/data/data/com.termux/files/usr/bin/bash
# ALNStudios pack script: creates @@DEST@@ from the payload stored at the end of this file.
#   bash @@SCRIPT@@          create the project here (Termux), build worlds, commit and push
#   bash @@SCRIPT@@ stage    copy this file to MCPEDL/incoming/ and push, then run the GitHub workflow
#                            "Create Project from Base64" with payload_file = @@SCRIPT@@
set -e
SELF="$(readlink -f -- "$0")"
SCRIPT_NAME="@@SCRIPT@@"
NAME="@@NAME@@"
DISPLAY_NAME='@@DISPLAY@@'
VERSION="@@VERSION@@"
PTYPE="@@PTYPE@@"
REPO="@@REPO@@"
ACTION="${1:-create}"
case "$ACTION" in create|stage) ;; *) echo "Usage: bash $SCRIPT_NAME [create|stage]"; exit 1 ;; esac

cd "$HOME"
[ -d "$HOME/MCPE-Curseforges" ] || git clone "$REPO" "$HOME/MCPE-Curseforges"
cd "$HOME/MCPE-Curseforges"
git checkout -q -- description_views image_prompts changelog_views 2>/dev/null || true
git pull --rebase --autostash

for f in scripts/import_project_payload.py scripts/build_payload.py scripts/manifest_tools.py; do
  [ -f "$f" ] || { echo "ERROR: $f is missing in the repo."; exit 1; }
done

if git ls-tree -r --name-only HEAD | grep -q "^MCPEDL/[^/]*/$NAME/"; then
  echo "Nothing to commit: $NAME already exists in the repo."
  rm -f -- "$SELF"
  exit 0
fi

if [ "$ACTION" = "stage" ]; then
  grep -q "ALN PAYLOAD BEGIN" scripts/import_project_payload.py \
    || { echo "ERROR: the repo importer cannot read .sh files yet. Update the repo first."; exit 1; }
  mkdir -p MCPEDL/incoming
  cp -- "$SELF" "MCPEDL/incoming/$SCRIPT_NAME"
  git add -- "MCPEDL/incoming/$SCRIPT_NAME"
  git diff --cached --quiet || git commit -m "chore(incoming): stage $NAME pack script"
  git push
  echo "Staged. Now: GitHub > Actions > Create Project from Base64 > Run workflow > payload_file = $SCRIPT_NAME"
  rm -f -- "$SELF"
  exit 0
fi

mkdir -p MCPEDL/incoming
TMPB64="MCPEDL/incoming/$NAME.b64"
GO="$(mktemp)"
DONE=0
CREATED=0
DEST_REAL="MCPEDL/@@DESTDIR@@/$NAME"
cleanup() {
  rc=$?
  rm -f -- "$TMPB64" "$GO"
  if [ "$rc" -ne 0 ] && [ "$DONE" != "1" ]; then
    git checkout -q -- . 2>/dev/null || true
    [ "$CREATED" = "1" ] && rm -rf -- "$DEST_REAL"
    echo "Failed. Nothing was pushed."
  fi
}
trap cleanup EXIT

sed -n '/^#--- ALN PAYLOAD BEGIN ---$/,/^#--- ALN PAYLOAD END ---$/p' "$SELF" | sed '1d;$d' | sed 's/^#//' | tr -d ' \r\n' > "$TMPB64"
[ -s "$TMPB64" ] || { echo "ERROR: the payload block is missing from this file."; exit 1; }

CREATED=1
python3 scripts/import_project_payload.py --mode create --payload-file "$NAME.b64" --github-output "$GO"
TYPE="$(sed -n 's/^type=//p' "$GO")"
DEST_REAL="$(sed -n 's/^dest=//p' "$GO")"
HAS_TW="$(sed -n 's/^has_test_world=//p' "$GO")"

if [ "$TYPE" = "map" ]; then
  for m in Creative Survival Hardcore; do
    [ -f "Mcpeworlds/$m/level.dat" ] || { echo "ERROR: missing Mcpeworlds/$m/level.dat"; exit 1; }
  done
  python3 scripts/build_oneblock_variants_from_template.py
  python3 scripts/sync_oneblock_map_readmes.py
fi
if [ "$HAS_TW" = "true" ]; then
  python3 scripts/build_test_world.py --project "$DEST_REAL"
fi
python3 scripts/manifest_tools.py --project "$DEST_REAL" --align
python3 scripts/validate_manifest_titles.py --project "$DEST_REAL"

NAME="$NAME" DISPLAY_NAME="$DISPLAY_NAME" TYPE="$TYPE" python3 - <<'ALN_LOG'
import os, pathlib, subprocess
date = subprocess.check_output(["date", "+%F"], env={"TZ": "Asia/Singapore", "PATH": "/usr/bin:/bin:/data/data/com.termux/files/usr/bin"}, text=True).strip()
title = f"New {os.environ['TYPE'].capitalize()} {os.environ['DISPLAY_NAME']}"
p = pathlib.Path("CHANGELOG.md")
t = p.read_text(encoding="utf-8")
if f"## {date} - {title}" not in t:
    entry = f"## {date} - {title}\n\n### Added\n- **{os.environ['DISPLAY_NAME']}**: New {os.environ['TYPE']} project created from a pack script.\n\n"
    i = t.index("---\n") + 4
    p.write_text(t[:i] + "\n" + entry.rstrip("\n") + "\n" + t[i:], encoding="utf-8")
ALN_LOG

git add -A -- "$DEST_REAL" CHANGELOG.md
if git diff --cached --quiet; then
  echo "Nothing to commit"
else
  git commit -m "feat($TYPE): create $NAME from pack script"
  git push
fi
DONE=1
rm -f -- "$SELF"
exit 0
@@PAYLOAD@@
'''


def fail(msg, code=1):
    print(msg)
    sys.exit(code)


def version_of(root: Path) -> str:
    try:
        v = json.loads((root / "behavior_pack/manifest.json").read_text(encoding="utf-8-sig"))["header"]["version"]
        if bp_is_triple(v):
            return ".".join(str(p) for p in v)
    except (OSError, ValueError, KeyError, TypeError):
        pass
    return "1.0.0"


def bp_is_triple(v):
    return isinstance(v, list) and len(v) == 3 and all(type(p) is int and p >= 0 for p in v)


def build_zip_b64(root: Path) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "p.b64"
        with contextlib.redirect_stdout(io.StringIO()):
            bp.pack(root, out)
        return out.read_text(encoding="ascii")


def wrap(b64: str, width=100) -> str:
    return "\n".join("#" + b64[i:i + width] for i in range(0, len(b64), width))


def make(root: Path, out_dir: Path, rand: str) -> Path:
    pj = bp.read_project(root)
    files = {p.relative_to(root).as_posix(): p.read_bytes()
             for p in root.rglob("*") if p.is_file() and not bp._is_test_world_output(p)}
    name = ipp.name_from_project_json(files)
    if not bp.NAME_RE.match(name):
        fail("Name: 1-64 chars, letters/numbers/. _ - only, starting with a letter or number.")
    version = version_of(root)
    display = re.sub(r"[^A-Za-z0-9 .&_-]", "", str(pj.get("name", name))).strip() or name
    script = f"{name}_{version}_{rand}.sh"
    b64 = build_zip_b64(root)
    body = (TEMPLATE.replace("@@SCRIPT@@", script).replace("@@NAME@@", name).replace("@@DISPLAY@@", display)
            .replace("@@VERSION@@", version).replace("@@PTYPE@@", pj["type"]).replace("@@REPO@@", REPO_URL)
            .replace("@@DESTDIR@@", bp.DEST_DIR[pj["type"]]).replace("@@DEST@@", f"MCPEDL/{bp.DEST_DIR[pj['type']]}/{name}")
            .replace("@@PAYLOAD@@", BEGIN + "\n" + wrap(b64) + "\n" + END))
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / script
    target.write_text(body, encoding="utf-8", newline="\n")
    back = ipp.payload_from_text(target.read_text(encoding="utf-8"), target.name)
    if back != b64:
        target.unlink()
        fail("ROUND-TRIP FAILED: the payload read back from the .sh differs.", 2)
    z = zipfile.ZipFile(io.BytesIO(__import__("base64").b64decode(back, validate=True)))
    if z.testzip() is not None or "project.json" not in z.namelist():
        target.unlink()
        fail("ROUND-TRIP FAILED: the ZIP inside the .sh is damaged.", 2)
    if shutil.which("bash"):
        r = subprocess.run(["bash", "-n", str(target)], capture_output=True, text=True)
        if r.returncode != 0:
            target.unlink()
            fail("SYNTAX CHECK FAILED: " + r.stderr, 2)
    print(f"PACK SCRIPT OK: {script} ({target.stat().st_size} bytes, {len(z.namelist())} files inside). "
          "Structure only: not tested in game.")
    return target


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="e.g. build/Project-Name")
    ap.add_argument("--rand", help="at least 5 lowercase letters or digits (default: random)")
    ap.add_argument("--out-dir", default=".")
    ap.add_argument("--check-only", action="store_true")
    a = ap.parse_args()
    root = Path(a.project)
    if not root.is_dir():
        fail(f"Project folder not found: {root}")
    if bp.read_project(root) is None:
        fail('Missing or invalid project.json. Create it first: {"type": "addon|map|script|minigame", "name": "Display Name"}')
    rand = a.rand or "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    if not re.fullmatch(r"[a-z0-9]{5,}", rand):
        fail("--rand needs at least 5 lowercase letters or digits.")
    bp.install_assets(root)
    fails, warns, n, total = bp.run_checks(root)
    for w in sorted(set(warns)):
        print("WARNING:", w)
    fails = [f for f in fails if f]
    if fails:
        print("SELF-TEST FAILED")
        for f in sorted(set(fails)):
            print(" -", f)
        sys.exit(1)
    print(f"SELF-TEST PASSED ({n} files, {total} bytes)")
    if not a.check_only:
        make(root, Path(a.out_dir), rand)
        print("BUILD OK. Structure only: not tested in game.")


if __name__ == "__main__":
    main()
