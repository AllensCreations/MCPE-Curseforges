#!/usr/bin/env python3
"""Refresh the AI review file of every package whose files changed.

  python3 scripts/auto_ai_review.py [--all] [--only Name[,Name]] [--no-readme]

For each package folder MCPEDL/<Category>/<Name> it builds the same export as the manual
"Collect Files for AI Review" run (scripts/collect_ai_review.py) and saves ONE file inside the package:
  MCPEDL/AI Review/<Name>.txt  (+ <Name>.zip)
  MCPEDL/AI Review/.<Name>.source-hash     (what the file was built from; a package whose hash matches is skipped)
The kits are identical for every package, so they are saved once. Each is a directory map plus skills (no file
contents) and, where the task has to run scripts, a zip with the complete scripts as real files:
  MCPEDL/AI Review/Maintenance.zip  (repo maintenance)
  MCPEDL/AI Review/New-Pack.zip     (new project)
Each kit zip holds <Kit>_tools.txt (directory map + skills) and the runnable scripts under files/.
Each package review zip holds <Name>.txt (including embedded skills) and runnable update scripts under files/.
Generated views (changelog_views/, Package/*.listing.md) are not part of an export and do not trigger a rebuild.
The root README.md list is refreshed only when it holds the two marker lines
  <!-- AI-REVIEW:START -->  and  <!-- AI-REVIEW:END -->
(nothing in README.md is touched without them).

Nothing changed = nothing written. Prints changed=true/false to GITHUB_OUTPUT.
"""
import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
GITHUB = "https://github.com/AllensCreations/MCPE-Curseforges"
RAW = GITHUB + "/raw/main"
OUT_DIR = "MCPEDL/AI Review"
LEGACY_DIR = "ai-review"
START, END = "<!-- AI-REVIEW:START -->", "<!-- AI-REVIEW:END -->"
SKIP = {".git", "node_modules", "__pycache__", LEGACY_DIR, "db", "exports"}
TOOL_INPUTS = [".agents/skills/*/SKILL.md", "scripts/collect_ai_review.py", "scripts/make_pack_script.py", "scripts/build_payload.py",
               "scripts/import_project_payload.py", "scripts/doc_template.py", "scripts/pixel_json_to_png.py", "scripts/make_update_script.py",
               "scripts/apply_update.py", "scripts/check_instruction_files.py", "assets/aln-ui-redesign",
               "INSTRUCTIONS.md", "DOCS_RULES.md", "PACK_GENERATOR_INSTRUCTIONS.md"]


def digest(paths) -> str:
    h = hashlib.sha256()
    for p in sorted(paths, key=lambda x: x.as_posix()):
        h.update(p.relative_to(ROOT).as_posix().encode() + b"\0")
        h.update(p.read_bytes() + b"\0")
    return h.hexdigest()


def files_under(folder: Path):
    for dirpath, dirs, files in os.walk(folder):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for f in files:
            yield Path(dirpath) / f


def top_version(pack: Path) -> str:
    log = pack / "CHANGELOG.md"
    if log.is_file():
        m = re.search(r"^## \[(?:v)?(\d+(?:\.\d+\.\d+)?)", log.read_text(encoding="utf-8", errors="replace"), re.M)
        if m:
            val = m.group(1)
            return f"v{val}" if "." not in val else val
    return ""


def repo_version() -> str:
    vp = ROOT / "REPO_VERSION"
    if vp.is_file():
        v = vp.read_text(encoding="utf-8").strip()
        if v:
            return f"v{v}" if not v.startswith("v") else v
    return ""


def packages():
    for cat in CATEGORIES:
        base = ROOT / "MCPEDL" / cat
        if base.is_dir():
            for p in sorted(base.iterdir(), key=lambda x: x.name.lower()):
                if p.is_dir() and not p.name.startswith("."):
                    yield cat, p


def run_collector(paths: str, out: Path, skip_tools: bool) -> None:
    env = dict(os.environ, PATHS=paths, AI_OUT=str(out), AI_SKIP_TOOLS="1" if skip_tools else "0")
    env.setdefault("AI_MAX_BYTES", "150000")
    env.pop("GITHUB_OUTPUT", None)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "collect_ai_review.py")], cwd=ROOT, env=env, check=True)


def write_if_changed(path: Path, data: str) -> bool:
    if path.is_file() and path.read_text(encoding="utf-8") == data:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data, encoding="utf-8")
    return True


def write_kit_zip(dest: Path, tools_txt: Path, map_name: str, files_zips) -> None:
    """ONE zip per kit: the map/skill text at the top plus the runnable scripts under files/. Deterministic bytes."""
    def info(name):
        i = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
        i.compress_type = zipfile.ZIP_DEFLATED
        i.external_attr = 0o644 << 16
        return i
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(info(map_name), tools_txt.read_bytes(), compresslevel=9)
        # Also include SKILL.md inside the root of the kit zip for AI tools looking for SKILL.md
        if map_name != "SKILL.md":
            zf.writestr(info("SKILL.md"), tools_txt.read_bytes(), compresslevel=9)
        for fz in files_zips:
            with zipfile.ZipFile(fz) as src:
                for member in src.namelist():
                    zf.writestr(info(member), src.read(member), compresslevel=9)


def link(rel: str) -> str:
    return RAW + "/" + urllib.parse.quote(rel)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="rebuild every package even when its hash matches")
    ap.add_argument("--only", default="", help="comma separated package folder names")
    ap.add_argument("--no-readme", action="store_true")
    args = ap.parse_args()
    only = {n.strip().lower() for n in args.only.split(",") if n.strip()}

    changed, built = [], 0
    # One-time move of the old root file (too large to ship in an update script)
    old_samples, new_samples = ROOT / LEGACY_DIR / "bedrock-samples.txt", ROOT / OUT_DIR / "bedrock-samples.txt"
    if old_samples.is_file() and not new_samples.exists():
        new_samples.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(old_samples), str(new_samples))
        changed.append(new_samples.relative_to(ROOT).as_posix())
        print(f"Moved {LEGACY_DIR}/bedrock-samples.txt to {new_samples.relative_to(ROOT)}")
    entries = []  # (category, name, version, rel path of the ai-review file)
    rebuilt_packs = set()
    with tempfile.TemporaryDirectory() as tmp:
        for cat, pack in packages():
            name = pack.name
            rel_pack = pack.relative_to(ROOT).as_posix()
            txt = ROOT / OUT_DIR / f"{name}.txt"
            stamp = ROOT / OUT_DIR / f".{name}.source-hash"
            if only and name.lower() not in only:
                if txt.is_file():
                    entries.append((cat, name, top_version(pack), txt.relative_to(ROOT).as_posix()))
                continue
            src_hash = digest(list(files_under(pack)))
            fresh = txt.is_file() and stamp.is_file() and stamp.read_text().strip() == src_hash
            if fresh and not args.all:
                entries.append((cat, name, top_version(pack), txt.relative_to(ROOT).as_posix()))
                continue
            out = Path(tmp) / name
            try:
                run_collector(rel_pack, out, skip_tools=True)
            except subprocess.CalledProcessError:
                print(f"::warning::AI review file for {rel_pack} could not be built; skipped.")
                continue
            made = sorted(out.glob("*.txt"))
            if not made:
                print(f"::warning::No export produced for {rel_pack}.")
                continue
            txt.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(made[0], txt)
            stamp.write_text(src_hash + "\n", encoding="utf-8")
            built += 1
            rebuilt_packs.add(name.lower())
            changed.append(txt.relative_to(ROOT).as_posix())
            entries.append((cat, name, top_version(pack), txt.relative_to(ROOT).as_posix()))
            print(f"Built {txt.relative_to(ROOT)}")

        # Tools: three root kits for the whole repo
        tool_paths = []
        for pat in TOOL_INPUTS:
            target = ROOT / pat
            if "*" in pat:
                tool_paths += [p for p in ROOT.glob(pat) if p.is_file() and "__pycache__" not in p.parts]
            elif target.is_dir():
                tool_paths += [p for p in target.rglob("*") if p.is_file()]
            elif target.is_file():
                tool_paths.append(target)
        tools_dir = ROOT / OUT_DIR
        tools_hash = digest(tool_paths)
        rver = repo_version()
        rver_suffix = f"-{rver}" if rver else ""
        for base_name, paths_kw in (("Maintenance", "REPO"), ("New-Pack", "NEW")):
            zip_name = f"{base_name}{rver_suffix}.zip"
            kit_path = tools_dir / zip_name
            kit_stamp = tools_dir / f".{base_name}-hash"
            old_kit_zips = [p for p in tools_dir.glob(f"{base_name}-*.zip") if p != kit_path]
            old_kit_zips += [tools_dir / f"{base_name}.zip"]  # unversioned
            if args.all or not kit_path.is_file() or not kit_stamp.is_file() or kit_stamp.read_text().strip() != tools_hash:
                out = Path(tmp) / f"kit_{paths_kw}"
                try:
                    run_collector(paths_kw, out, skip_tools=False)
                    made = sorted(out.glob("*_tools.txt"))
                    if made:
                        tools_dir.mkdir(parents=True, exist_ok=True)
                        write_kit_zip(kit_path, made[0], base_name + "_tools.txt", sorted(out.glob("*_files.zip")))
                        # Also keep unversioned copy for backwards compatibility with existing links/workflows
                        unversioned_kit = tools_dir / f"{base_name}.zip"
                        if unversioned_kit != kit_path:
                            shutil.copyfile(kit_path, unversioned_kit)
                        for old in old_kit_zips:
                            if old.is_file() and old != kit_path and old != unversioned_kit:
                                old.unlink()
                        changed.append(kit_path.relative_to(ROOT).as_posix())
                        print(f"Built {kit_path.relative_to(ROOT)}")
                        kit_stamp.write_text(tools_hash + "\n", encoding="utf-8")
                except subprocess.CalledProcessError:
                    print(f"::warning::{zip_name} could not be built; skipped.")


    # Package AI review zips: <Pack>.txt + update scripts under files/
    update_scripts = [
        ("files/scripts/make_update_script.py", ROOT / "scripts" / "make_update_script.py"),
        ("files/scripts/apply_update.py", ROOT / "scripts" / "apply_update.py"),
        ("files/scripts/pixel_json_to_png.py", ROOT / "scripts" / "pixel_json_to_png.py"),
        ("files/docs/mcicons-index.md", ROOT / "docs" / "mcicons-index.md"),
        ("files/INSTRUCTIONS.md", ROOT / "INSTRUCTIONS.md"),
        ("files/DOCS_RULES.md", ROOT / "DOCS_RULES.md"),
        ("files/PACK_GENERATOR_INSTRUCTIONS.md", ROOT / "PACK_GENERATOR_INSTRUCTIONS.md"),
    ]
    for cat, pack in packages():
        name = pack.name
        if only and name.lower() not in only:
            continue
        if not args.all and not only and name.lower() not in rebuilt_packs:
            continue
        txt = ROOT / OUT_DIR / f"{name}.txt"
        if not txt.is_file():
            continue
        ver = top_version(pack)
        vsuffix = f"-{ver}" if ver else ""
        zpath = ROOT / OUT_DIR / f"{name}{vsuffix}.zip"
        old_zips = [p for p in (ROOT / OUT_DIR).glob(f"{name}-*.zip") if p != zpath]
        old_zips += [ROOT / OUT_DIR / f"{name}.zip"]  # legacy unversioned name
        if args.all or name.lower() in rebuilt_packs or not zpath.is_file() or txt.stat().st_mtime > zpath.stat().st_mtime:
            with zipfile.ZipFile(zpath, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                zf.write(txt, arcname=f"{name}.txt")
                for arcname, script_file in update_scripts:
                    if script_file.is_file():
                        info = zipfile.ZipInfo(arcname, date_time=(2020, 1, 1, 0, 0, 0))
                        info.compress_type = zipfile.ZIP_DEFLATED
                        info.external_attr = 0o644 << 16
                        zf.writestr(info, script_file.read_bytes(), compresslevel=9)
            for old in old_zips:
                if old.is_file() and old != zpath:
                    old.unlink()
            changed.append(zpath.relative_to(ROOT).as_posix())
            print(f"Bundled {zpath.relative_to(ROOT)}")

    # Root README list (only between the markers)

    readme = ROOT / "README.md"
    if not args.no_readme and readme.is_file():
        text = readme.read_text(encoding="utf-8")
        if START in text and END in text:
            lines = [START, "", "Latest AI review files (one per package, refreshed after every package update):", ""]
            if (ROOT / OUT_DIR / "Maintenance.zip").is_file():
                lines.append(f"- [Repo maintenance kit]({link(OUT_DIR + '/Maintenance.zip')})")
            if (ROOT / "reference/bedrock-samples/bedrock-samples.min.json.gz").is_file():
                lines.append(f"- [Vanilla Bedrock reference (JSON, gzip)]({link('reference/bedrock-samples/bedrock-samples.min.json.gz')})")
            for cat in CATEGORIES:
                items = [e for e in entries if e[0] == cat]
                if items:
                    lines += ["", f"**{cat}**", ""]
                    lines += [f"- [{n}{' ' + v if v else ''}]({link(rel)})" for _, n, v, rel in sorted(items, key=lambda e: e[1].lower())]
            lines += ["", END]
            new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: "\n".join(lines), text, flags=re.S)
            if new != text:
                readme.write_text(new, encoding="utf-8")
                changed.append("README.md")
                print("Updated README.md AI review list")

    print(f"{built} package file(s) rebuilt; {len(changed)} path(s) changed.")

    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a", encoding="utf-8") as fh:
            fh.write(f"changed={'true' if changed else 'false'}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
