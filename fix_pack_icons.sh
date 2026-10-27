#!/data/data/com.termux/files/usr/bin/env bash
# fix_pack_icons.sh - Termux helper for the MCPE-Curseforges repo
#   1. Fixes the missing pack_icon.png in built .mcpack/.mcaddon files
#   2. Removes unnecessary files (dry run by default)
#
# Run from inside your repo clone:
#   bash fix_pack_icons.sh              # patch scripts + dry-run cleanup report
#   bash fix_pack_icons.sh --apply      # patch + actually delete leftovers (backup made first)
#   bash fix_pack_icons.sh --build      # also rebuild packs locally and verify icons
#   bash fix_pack_icons.sh --apply --build --push   # everything, then commit + push
set -euo pipefail

APPLY=0; BUILD=0; PUSH=0
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;; --build) BUILD=1 ;; --push) PUSH=1 ;;
    -h|--help) sed -n 2,13p "$0"; exit 0 ;;
    *) echo "Unknown option: $a"; exit 1 ;;
  esac
done

# ---- locate repo -----------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
[ -f scripts/auto_bump_and_build.py ] || { echo "ERROR: run this inside the repo (scripts/auto_bump_and_build.py not found)."; exit 1; }

# ---- dependencies (Termux) -------------------------------------------------
if command -v pkg >/dev/null 2>&1; then
  command -v python3 >/dev/null || pkg install -y python
  python3 -c "import PIL" 2>/dev/null || pkg install -y python-pillow || true
fi
python3 -c "import PIL" 2>/dev/null || pip install pillow || { echo "ERROR: Pillow missing"; exit 1; }

# ---- 1. new scripts/make_pack_icon.py --------------------------------------
cat > scripts/make_pack_icon.py <<'PY'
#!/usr/bin/env python3
"""Guarantee every pack has a valid pack_icon.png (256x256 PNG, pack root).

Used two ways:
  * CLI (refresh workflow):  python3 scripts/make_pack_icon.py [--strict]
  * Imported by auto_bump_and_build.py so EVERY build gets the icon, not only
    the "Refresh Add-ons and Rebuild Packs" workflow.

Source lookup inside each behavior_pack/ and resource_pack/ (top level only,
case-insensitive): pack_icon.*, icon.*, logo.* in png/jpg/jpeg/webp/bmp/gif.
Fallbacks when a pack has none: the sibling pack's pack_icon.png, then an
icon image at the project root. Leftover source files are deleted after
conversion. Packs that still have no icon are reported loudly.
"""
import glob, os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 256
EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
STEMS = ["pack_icon", "packicon", "icon", "logo"]   # priority order
PACKS = ("behavior_pack", "resource_pack")


def _norm(stem):
    return stem.lower().replace(" ", "_").replace("-", "_")


def _find_sources(folder):
    found = []
    for name in os.listdir(folder):
        stem, ext = os.path.splitext(name)
        if ext.lower() in EXTS and _norm(stem) in STEMS and name != "pack_icon.png":
            found.append(name)
    return sorted(found, key=lambda n: (STEMS.index(_norm(os.path.splitext(n)[0])), n))


def _convert(src, dest):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
    side = min(img.size)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    tmp = dest + ".tmp"
    img.save(tmp, "PNG", optimize=True)
    os.replace(tmp, dest)


def _rel(p):
    return os.path.relpath(p, ROOT)


def ensure_pack_icon(pack_dir, fallbacks=(), warn=True):
    """Return True when pack_dir ends up with a usable pack_icon.png."""
    dest = os.path.join(pack_dir, "pack_icon.png")
    sources = _find_sources(pack_dir)
    try:
        if sources:
            _convert(os.path.join(pack_dir, sources[0]), dest)
            for s in sources:
                os.remove(os.path.join(pack_dir, s))
            print(f"[Pack Icon] {_rel(pack_dir)}/{sources[0]} -> pack_icon.png (sources removed: {len(sources)})")
            return True
        if os.path.isfile(dest):
            with Image.open(dest) as im:
                w, h = im.size
            if w != h or w > SIZE:
                _convert(dest, dest)
                print(f"[Pack Icon] {_rel(dest)} normalized to {SIZE}x{SIZE}")
            return True
        for fb in fallbacks:
            if os.path.isfile(fb):
                _convert(fb, dest)
                print(f"[Pack Icon] {_rel(dest)} created from {_rel(fb)}")
                return True
    except Exception as exc:  # corrupt image etc.
        print(f"[Pack Icon] ERROR in {_rel(pack_dir)}: {exc}", file=sys.stderr)
        return False
    if warn:
        print(f"[Pack Icon] WARNING: {_rel(pack_dir)} has NO pack_icon.png "
              f"(add icon.png next to manifest.json)", file=sys.stderr)
    return False


def ensure_project_icons(project_path):
    """Handle both packs of one project. Returns list of pack dirs still missing an icon."""
    dirs = {p: os.path.join(project_path, p) for p in PACKS}
    present = [p for p in PACKS if os.path.isdir(dirs[p])]
    project_srcs = []
    if os.path.isdir(project_path):
        project_srcs = [os.path.join(project_path, n) for n in _find_sources(project_path)]
        pi = os.path.join(project_path, "pack_icon.png")
        if os.path.isfile(pi):
            project_srcs.insert(0, pi)
    missing = []
    # first pass: packs that have their own icon; second pass: fill gaps from siblings
    done = {p: ensure_pack_icon(dirs[p], fallbacks=project_srcs, warn=False) for p in present}
    for p in present:
        if not done[p]:
            sib = [os.path.join(dirs[q], "pack_icon.png") for q in present if q != p]
            if not ensure_pack_icon(dirs[p], fallbacks=sib):
                missing.append(dirs[p])
    return missing


def main():
    strict = "--strict" in sys.argv
    missing, n = [], 0
    for project in sorted(glob.glob(os.path.join(ROOT, "MCPEDL", "*", "*"))):
        if not os.path.isdir(project):
            continue
        if any(os.path.isdir(os.path.join(project, p)) for p in PACKS):
            n += 1
            missing += ensure_project_icons(project)
    print(f"[Pack Icon] checked {n} project(s); {len(missing)} pack(s) without icon.")
    return 1 if (strict and missing) else 0


if __name__ == "__main__":
    sys.exit(main())
PY

# ---- 2. patch auto_bump_and_build.py (idempotent) ---------------------------
python3 - <<'PY'
import re, sys
p = "scripts/auto_bump_and_build.py"
s = open(p, encoding="utf-8").read()
if "ensure_project_icons" in s:
    print("[patch] auto_bump_and_build.py already patched"); sys.exit(0)

def rep(old, new, count=1):
    global s
    if s.count(old) != count:
        sys.exit(f"[patch] FAILED: expected {count} match(es) of: {old[:60]!r}, found {s.count(old)}")
    s = s.replace(old, new)

rep("import urllib.parse\n", '''import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import make_pack_icon
except Exception as _exc:  # Pillow missing etc.
    make_pack_icon = None
    print(f"WARNING: pack icon helper unavailable: {_exc}", file=sys.stderr)

JUNK_DIRS = {"__pycache__", ".git", ".github"}
JUNK_FILES = {".ds_store", "thumbs.db", "desktop.ini", ".gitkeep"}


def is_junk(filename):
    low = filename.lower()
    return low in JUNK_FILES or low.endswith(("~", ".bak", ".tmp", ".orig", ".importing"))
''')

rep('''        for root, _, files in os.walk(src_dir):
            for file in sorted(files):
                full_path''', '''        for root, dirs, files in os.walk(src_dir):
            dirs[:] = [d for d in dirs if d not in JUNK_DIRS]
            for file in sorted(files):
                if is_junk(file):
                    continue
                full_path''')

for d in ("bp_dir", "rp_dir"):
    rep(f'''            for root, _, files in os.walk({d}):
                for file in sorted(files):
                    fp''', f'''            for root, dirs, files in os.walk({d}):
                dirs[:] = [x for x in dirs if x not in JUNK_DIRS]
                for file in sorted(files):
                    if is_junk(file):
                        continue
                    fp''')

rep('''    os.makedirs(build_dir, exist_ok=True)
''', '''    os.makedirs(build_dir, exist_ok=True)

    # Always make sure pack_icon.png exists BEFORE zipping (fixes missing pack icons)
    if make_pack_icon is not None:
        make_pack_icon.ensure_project_icons(project_path)
''')
open(p, "w", encoding="utf-8").write(s)
print("[patch] auto_bump_and_build.py patched")
PY
python3 -m py_compile scripts/auto_bump_and_build.py scripts/make_pack_icon.py
echo "[ok] scripts compile"

# ---- 3. cleanup of unnecessary files ---------------------------------------
python3 - "$APPLY" <<'PY'
import os, shutil, sys, tarfile, time
apply = sys.argv[1] == "1"
root = os.getcwd()
remove = []   # (relpath, reason)

def add(rel, why):
    if os.path.exists(os.path.join(root, rel)):
        remove.append((rel, why))

# generated bundle that should only live as a workflow artifact
add("ai_review_bundle", "generated by collect-ai-review-files workflow (not meant to be committed)")

# leftovers in incoming/
inc = os.path.join(root, "MCPEDL", "incoming")
if os.path.isdir(inc):
    for n in sorted(os.listdir(inc)):
        if n not in {"README.md", ".gitkeep"}:
            add(f"MCPEDL/incoming/{n}", "leftover import payload")

# failed-import staging, OS junk, caches
skip = {".git", "node_modules", "reference"}
for dp, dns, fns in os.walk(root):
    dns[:] = [d for d in dns if d not in skip]
    for d in list(dns):
        if d.endswith(".importing") or d == "__pycache__":
            add(os.path.relpath(os.path.join(dp, d), root), "staging/cache folder"); dns.remove(d)
    for f in fns:
        low = f.lower()
        if low in {".ds_store", "thumbs.db", "desktop.ini"} or low.endswith(("~", ".bak", ".orig", ".pyc")):
            add(os.path.relpath(os.path.join(dp, f), root), "OS/editor junk")

# stale builds/ folders that match no project in MCPEDL/
projects = set()
for cat in ("addons", "new_addons", "maps", "script"):
    d = os.path.join(root, "MCPEDL", cat)
    if os.path.isdir(d):
        projects |= {n for n in os.listdir(d) if os.path.isdir(os.path.join(d, n))}
b = os.path.join(root, "builds")
if os.path.isdir(b):
    for n in sorted(os.listdir(b)):
        if os.path.isdir(os.path.join(b, n)) and n not in projects:
            add(f"builds/{n}", "stale build folder - no matching MCPEDL project")

# de-dup (don't list children of an already-listed parent)
seen, final = [], []
for rel, why in sorted(remove):
    if any(rel == s or rel.startswith(s + "/") for s in seen):
        continue
    seen.append(rel); final.append((rel, why))

print("\n=== Cleanup", "APPLY" if apply else "DRY RUN", "===")
if not final:
    print("Nothing to remove."); sys.exit(0)
for rel, why in final:
    print(f"  {'remove' if apply else 'would remove'}: {rel}   ({why})")

if apply:
    bk = os.path.expanduser(f"~/repo-cleanup-backup-{time.strftime('%Y%m%d-%H%M%S')}.tar.gz")
    with tarfile.open(bk, "w:gz") as tf:
        for rel, _ in final:
            tf.add(os.path.join(root, rel), arcname=rel)
    print(f"Backup of removed files: {bk}")
    for rel, _ in final:
        t = os.path.join(root, rel)
        shutil.rmtree(t) if os.path.isdir(t) and not os.path.islink(t) else os.remove(t)
    print(f"Removed {len(final)} item(s).")
else:
    print("\nRe-run with --apply to delete these (a backup tar.gz is created first).")
PY

# ---- 4. optional local rebuild + verification ------------------------------
if [ "$BUILD" = 1 ]; then
  echo "=== Converting icons and rebuilding packs ==="
  python3 scripts/make_pack_icon.py
  python3 scripts/auto_bump_and_build.py --all --no-bump
fi

echo "=== Verifying pack_icon.png inside built packs ==="
python3 - <<'PY'
import glob, zipfile
bad = ok = 0
for f in sorted(glob.glob("builds/*/*.mcpack") + glob.glob("builds/*/*.mcaddon")):
    try:
        names = zipfile.ZipFile(f).namelist()
    except Exception as e:
        print("  BAD ZIP", f, e); bad += 1; continue
    if f.endswith(".mcpack"):
        good = "pack_icon.png" in names
    else:
        tops = {n.split("/")[0] for n in names if "/" in n}
        good = bool(tops) and all(f"{t}/pack_icon.png" in names for t in tops)
    if good: ok += 1
    else: bad += 1; print("  MISSING ICON:", f)
print(f"  {ok} OK, {bad} missing/bad.")
if bad:
    print("  (Old builds are fixed by rebuilding: run with --build, or run the workflow on GitHub.)")
PY

# ---- 5. optional commit/push -----------------------------------------------
if [ "$PUSH" = 1 ]; then
  git add -A
  if git diff --cached --quiet; then echo "Nothing to commit."; else
    git commit -m "fix(build): always generate pack_icon.png; clean unused files"
    git push
  fi
fi
echo "Done."
