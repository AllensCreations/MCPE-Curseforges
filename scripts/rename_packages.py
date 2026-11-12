#!/usr/bin/env python3
"""Rename every package to '<Shortcut> VX.Y.Z.<ext>' and repair every text reference to the old names.

Old names look like 'Mining Helmet by ALNStudios (V1.0.2).mcaddon' (or 'Release - X v(1.0.2).mcaddon').
Shortcuts come from scripts/pack_shortcuts.json (see manifest_tools.shortcut_for_slug).

  python3 scripts/rename_packages.py --check    # preview, change nothing, exit 1 if work is pending
  python3 scripts/rename_packages.py --apply    # rename files (git mv when possible) and fix references
"""
import argparse
import os
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import manifest_tools as mt

ROOT = HERE.parent
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
EXTS = (".mcaddon", ".mcpack", ".mcworld")
SKIP_DIRS = {".git", "node_modules", "__pycache__"}
TEXT_EXT = {".md", ".json", ".html", ".yml", ".yaml", ".txt", ".py", ".sha256"}
VER = r"(\d+\.\d+\.\d+(?:\.\d+)?)"
OLD_RE = re.compile(rf"^(?P<base>.+?)(?: by ALNStudios)? \(V{VER}\)(?P<rest>.*)(?P<ext>\.mc(?:addon|pack|world))$")
OLD_UPLOAD_RE = re.compile(rf"^(?:Release|Beta|Alpha) - (?P<base>.+?) v\({VER}\)(?P<rest>.*)(?P<ext>\.mc(?:addon|pack|world))$")


def new_name(old, shortcut):
    """New file name for an old package name, or None when it is not an old-style name."""
    m = OLD_RE.match(old) or OLD_UPLOAD_RE.match(old)
    if not m:
        return None
    base, version, rest, ext = m.group("base"), m.group(2), m.group("rest"), m.group("ext")
    pack = re.search(r"\s(BP|RP)$", base)
    mid = f" {pack.group(1)}" if pack else ""
    rest = re.sub(r"^\s*-\s*", " ", rest).rstrip()
    rest = re.sub(r"[^A-Za-z0-9. ]", "", rest)
    rest = (" " + rest.strip()) if rest.strip() else ""
    return f"{shortcut}{mid} V{version}{rest}{ext}"


def slugs():
    out = {}
    for category in CATEGORIES:
        base = ROOT / "MCPEDL" / category
        if base.is_dir():
            for p in sorted(base.iterdir()):
                if p.is_dir():
                    out[p.name] = p
    for p in sorted((ROOT / "builds").glob("*")) if (ROOT / "builds").is_dir() else []:
        if p.is_dir():
            out.setdefault(p.name, p)
    return out


def find_packages():
    found = []
    for slug, project in slugs().items():
        folders = [ROOT / "builds" / slug, project]
        versions = ROOT / "builds" / slug / "versions"
        if versions.is_dir():
            folders += [d for d in sorted(versions.iterdir()) if d.is_dir()]
        for folder in folders:
            if folder.is_dir():
                found += [(slug, f) for f in sorted(folder.iterdir()) if f.is_file() and f.suffix.lower() in EXTS]
    seen, out = set(), []
    for slug, f in found:
        if f not in seen:
            seen.add(f)
            out.append((slug, f))
    return out


def forms(name):
    return [name, urllib.parse.quote(name), urllib.parse.quote(name, safe="()"), name.replace(" ", "%20")]


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


def in_git():
    return (ROOT / ".git").exists()


def rename_one(src, dst):
    if in_git() and git("ls-files", "--error-unmatch", str(src.relative_to(ROOT))).returncode == 0:
        r = git("mv", "-f", str(src.relative_to(ROOT)), str(dst.relative_to(ROOT)))
        if r.returncode == 0:
            return
    os.replace(src, dst)


def text_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            p = Path(dirpath) / name
            if p.suffix.lower() in TEXT_EXT and name != "rename_packages.py" and not name.startswith("test_"):
                try:
                    if p.stat().st_size <= 8 * 1024 * 1024:
                        yield p
                except OSError:
                    continue


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    plan, mapping = [], {}
    for slug, f in find_packages():
        target = new_name(f.name, mt.shortcut_for_slug(slug))
        if target and target != f.name:
            plan.append((f, f.with_name(target)))
            mapping.setdefault(f.name, target)

    kept = []
    for src, dst in plan:
        rel = src.relative_to(ROOT).as_posix()
        if dst.exists():
            same = dst.read_bytes() == src.read_bytes()
            print(f"[Rename] {rel} -> {dst.name} ({'duplicate of existing file, old copy removed' if same else 'TARGET EXISTS WITH DIFFERENT CONTENT, left alone'})")
            if not same:
                kept.append(src)
                continue
            if args.apply:
                if in_git() and git("rm", "-q", "-f", "--", rel).returncode == 0:
                    pass
                else:
                    src.unlink()
            continue
        print(f"[Rename] {rel} -> {dst.name}")
        if args.apply:
            rename_one(src, dst)

    skipped = {s.name for s in kept}
    pairs = [(old, new) for old, new in mapping.items() if old not in skipped]
    touched = 0
    if pairs:
        for p in text_files():
            try:
                text = p.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            updated = text
            for old, new in sorted(pairs, key=lambda x: -len(x[0])):
                for o, n in zip(forms(old), forms(new)):
                    updated = updated.replace(o, n)
            if updated != text:
                touched += 1
                print(f"[Rename] references fixed in {p.relative_to(ROOT).as_posix()}")
                if args.apply:
                    p.write_text(updated, encoding="utf-8")
    print(f"[Rename] {len(plan)} package(s) {'to rename' if args.check else 'processed'}, {touched} file(s) with old names in text.")
    if kept:
        return 2
    return 1 if (args.check and (plan or touched)) else 0


if __name__ == "__main__":
    raise SystemExit(main())
