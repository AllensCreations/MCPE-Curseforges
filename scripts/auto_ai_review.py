#!/usr/bin/env python3
"""Refresh the AI review file of every package whose files changed.

  python3 scripts/auto_ai_review.py [--all] [--only Name[,Name]] [--no-readme]

For each package folder MCPEDL/<Category>/<Name> it builds the same export as the manual
"Collect Files for AI Review" run (scripts/collect_ai_review.py) and saves ONE file inside the package:
  MCPEDL/<Category>/<Name>/ai-review/<Name>.txt
  MCPEDL/<Category>/<Name>/ai-review/.source-hash     (what the file was built from; a package whose hash matches is skipped)
The helper scripts and instruction files are identical for every package, so they are saved once:
  ai-review/tools.txt
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
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
GITHUB = "https://github.com/AllensCreations/MCPE-Curseforges"
RAW = GITHUB + "/raw/main"
OUT_DIR = "ai-review"
START, END = "<!-- AI-REVIEW:START -->", "<!-- AI-REVIEW:END -->"
SKIP = {".git", "node_modules", "__pycache__", OUT_DIR, "db", "exports"}
TOOL_INPUTS = ["INSTRUCTIONS.md", "PACK_GENERATOR_INSTRUCTIONS.md", "DOCS_RULES.md",
               ".agents/skills/mcpe-new-pack/SKILL.md", "scripts/*.py", "assets/aln-ui-redesign"]


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


def packages():
    for cat in CATEGORIES:
        base = ROOT / "MCPEDL" / cat
        if base.is_dir():
            for p in sorted(base.iterdir(), key=lambda x: x.name.lower()):
                if p.is_dir() and not p.name.startswith("."):
                    yield cat, p


def run_collector(paths: str, out: Path, skip_tools: bool) -> None:
    env = dict(os.environ, PATHS=paths, AI_OUT=str(out), AI_SKIP_TOOLS="1" if skip_tools else "0")
    env.pop("GITHUB_OUTPUT", None)
    subprocess.run([sys.executable, str(ROOT / "scripts" / "collect_ai_review.py")], cwd=ROOT, env=env, check=True)


def write_if_changed(path: Path, data: str) -> bool:
    if path.is_file() and path.read_text(encoding="utf-8") == data:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data, encoding="utf-8")
    return True


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
    entries = []  # (category, name, version, rel path of the ai-review file)
    with tempfile.TemporaryDirectory() as tmp:
        for cat, pack in packages():
            name = pack.name
            rel_pack = pack.relative_to(ROOT).as_posix()
            txt = pack / OUT_DIR / f"{name}.txt"
            stamp = pack / OUT_DIR / ".source-hash"
            if only and name.lower() not in only:
                if txt.is_file():
                    entries.append((cat, name, top_version(pack), txt.relative_to(ROOT).as_posix()))
                continue
            extras = [ROOT / "changelog_views" / (name + ext) for ext in (".github.md", ".curseforge.html")]
            extras.append(ROOT / "Package" / (name + ".listing.md"))
            src_hash = digest(list(files_under(pack)) + [x for x in extras if x.is_file()])
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
        for kit_name, paths_kw in (("tools.txt", "REPO"), ("New-Pack_tools.txt", "NEW"), ("Update-Pack_tools.txt", "UPDATE")):
            kit_path  = tools_dir / kit_name
            kit_stamp = tools_dir / f".{kit_name.replace('.txt', '')}-hash"
            if args.all or not kit_path.is_file() or not kit_stamp.is_file() or kit_stamp.read_text().strip() != tools_hash:
                out = Path(tmp) / f"kit_{paths_kw}"
                try:
                    run_collector(paths_kw, out, skip_tools=False)
                    made = sorted(out.glob("*_tools.txt"))
                    if made:
                        tools_dir.mkdir(exist_ok=True)
                        shutil.copyfile(made[0], kit_path)
                        kit_stamp.write_text(tools_hash + "\n", encoding="utf-8")
                        changed.append(kit_path.relative_to(ROOT).as_posix())
                        print(f"Built {kit_path.relative_to(ROOT)}")
                except subprocess.CalledProcessError:
                    print(f"::warning::{kit_name} could not be built; skipped.")


    # Root README list (only between the markers)
    readme = ROOT / "README.md"
    if not args.no_readme and readme.is_file():
        text = readme.read_text(encoding="utf-8")
        if START in text and END in text:
            lines = [START, "", "Latest AI review files (one per package, refreshed after every package update):", ""]
            if (ROOT / OUT_DIR / "tools.txt").is_file():
                lines.append(f"- [Tools and instructions]({link(OUT_DIR + '/tools.txt')})")
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

    # --- Enrich rebuilt files with Graphify graph context ---
    enrich = ROOT / "scripts" / "enrich_ai_review.py"
    if enrich.exists():
        enrich_args = [sys.executable, str(enrich)]
        if args.all:
            enrich_args.append("--all")
        elif getattr(args, "only", ""):
            enrich_args += ["--only", args.only]
        try:
            subprocess.run(enrich_args, cwd=ROOT, check=True)
        except subprocess.CalledProcessError as exc:
            print(f"WARNING: enrich_ai_review.py failed ({exc}); continuing.")

    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a", encoding="utf-8") as fh:
            fh.write(f"changed={'true' if changed else 'false'}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
