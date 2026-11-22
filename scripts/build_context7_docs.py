#!/usr/bin/env python3
"""Regenerate the generated Context7 pages in docs/ from the repo's own files.

docs/ is the ONLY folder Context7 indexes (context7.json). Two pages are copies and are rebuilt here:
  docs/instructions-reference.md   INSTRUCTIONS.md + DOCS_RULES.md + PACK_GENERATOR_INSTRUCTIONS.md (lines the generator repeats from INSTRUCTIONS.md are omitted)
  docs/scripts-and-workflows.md    one summary per script (module docstring) and per workflow, plus key snippets
  docs/where-we-left-off.md        REPO_VERSION, next spec number, newest spec ledger entries and each project's latest version
docs/bedrock-guide.md is written by hand and is never touched.

Usage: python3 scripts/build_context7_docs.py [--check]
  --check  write nothing; exit 1 when a generated page is out of date.
"""
import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SOURCES = ["INSTRUCTIONS.md", "DOCS_RULES.md", "PACK_GENERATOR_INSTRUCTIONS.md"]
SNIPPETS = ["apply_update.py", "make_update_script.py"]


def drop_repeats(text, base):
    """Replace each run of lines that appear word for word in INSTRUCTIONS.md with one marker line."""
    out, run = [], 0
    for line in text.split("\n"):
        if len(line.strip()) > 90 and line.strip() in base:
            run += 1
            continue
        if run:
            out.append(f"<!-- {run} line(s) identical to INSTRUCTIONS.md omitted -->")
            run = 0
        out.append(line)
    if run:
        out.append(f"<!-- {run} line(s) identical to INSTRUCTIONS.md omitted -->")
    return "\n".join(out)


def instructions_page():
    out = ["# Instructions Reference (copy)\n",
           "Copy of the repo's three rule files. PACK_GENERATOR_INSTRUCTIONS.md repeats many INSTRUCTIONS.md lines word for word; "
           "those repeated lines are left out of its copy here (marked) so a lookup does not return the same rule twice. "
           "Source of truth: the files in the repository root. "
           "Rebuilt by `python3 scripts/build_context7_docs.py`.\n",
           "Context7 usage: " + ", ".join(f"`{s}`" for s in SOURCES) + " are all in this page; "
           "look here instead of the repository root.\n"]
    base = {l.strip() for l in (ROOT / "INSTRUCTIONS.md").read_text(encoding="utf-8").split("\n") if len(l.strip()) > 90}
    for s in SOURCES:
        text = (ROOT / s).read_text(encoding="utf-8").rstrip("\n")
        if s == "PACK_GENERATOR_INSTRUCTIONS.md":
            text = drop_repeats(text, base)
        out.append(f"\n\n<!-- BEGIN {s} -->\n\n{text}\n\n<!-- END {s} -->\n")
    return "".join(out)


def first_para(doc):
    return " ".join((doc or "").strip().split("\n\n")[0].split())


def workflow_rows():
    rows = []
    for f in sorted((ROOT / ".github/workflows").glob("*.yml")):
        t = f.read_text(encoding="utf-8")
        name = (re.search(r"^name:\s*(.+)$", t, re.M) or [None, f.stem])[1].strip().strip("\"'")
        m = re.search(r"^on:\s*\n((?:[ \t]+.*\n|\n)+)", t, re.M)
        trig = []
        if m:
            trig = re.findall(r"^  ([a-z_]+):", m.group(1), re.M)
        runs = re.findall(r"python3? (scripts/[\w./-]+\.py)", t)
        rows.append((f.name, name, ", ".join(trig) or "?", ", ".join(dict.fromkeys(runs))))
    return rows


def scripts_page():
    o = ["# Scripts and Workflows (summary)\n\n",
         "Generated from the module docstrings in `scripts/` and the files in `.github/workflows/`. "
         "Rebuilt by `python3 scripts/build_context7_docs.py`. A script that must RUN needs its complete file "
         "(kit zip `files/`), never this summary.\n\n",
         "## Workflows\n\n| File | Name | Triggers | Scripts it runs |\n| :--- | :--- | :--- | :--- |\n"]
    for fn, name, trig, runs in workflow_rows():
        o.append(f"| `{fn}` | {name} | {trig} | {runs.replace(', ', '<br>') or '-'} |\n")
    o.append("\n## AI review workflow\n\n"
             "`build-and-sync.yml` runs `python3 scripts/auto_ai_review.py` and uploads the `ai-review-bundle` artifact. "
             "It ignores pushes that only touch `docs/**` or `context7.json`. The review prompt "
             "(`AI_PROMPT` in `scripts/collect_ai_review.py`) holds no rules: it tells the reviewer to query this "
             "documentation once.\n\n"
             "- `collect_ai_review.py`: builds one export, or a shared kit zip (`New-Pack.zip`, `Update-Pack.zip`, "
             "`Maintenance.zip`: map text + scripts under `files/`).\n"
             "- `auto_ai_review.py`: refreshes the per-pack export of every pack whose files changed (hash stamps).\n"
             "\n"
             "## Scripts\n\n")
    for f in sorted((ROOT / "scripts").glob("*.py")) + sorted((ROOT / "scripts" / "lib").glob("*.py")):
        if f.name.startswith("test_"):
            continue
        d = ast.get_docstring(ast.parse(f.read_text(encoding="utf-8")))
        o.append(f"- `{f.relative_to(ROOT).as_posix()}`: {first_para(d) or '(no description)'}\n")
    o.append("\n## Key snippets\n")
    for s in SNIPPETS:
        d = ast.get_docstring(ast.parse((ROOT / "scripts" / s).read_text(encoding="utf-8"))) or ""
        o.append(f"\n### `scripts/{s}` (docstring)\n\n```text\n{d}\n```\n")
    return "".join(o)


def ledger_page():
    """Where we left off: REPO_VERSION, next spec, newest ledger entries, each project's latest version."""
    vf = ROOT / "REPO_VERSION"
    ver = vf.read_text(encoding="utf-8").strip() if vf.is_file() else "?"
    nxt = f"spec_v{int(ver) + 1}.txt (`@@ version {int(ver) + 1}`)" if ver.isdigit() else "unknown"
    entries, cur = [], None
    cl = ROOT / "CHANGELOG.md"
    if cl.is_file():
        for line in cl.read_text(encoding="utf-8").split("\n"):
            if line.startswith("## ["):
                cur = [line]
                entries.append(cur)
            elif cur is not None and line.startswith("**Spec**"):
                cur.append(line)
    o = ["# Where we left off (spec ledger)\n\n",
         "Snapshot written by `python3 scripts/build_context7_docs.py` after the last spec. "
         "The files in the repository win over this page.\n\n",
         f"- REPO_VERSION: {ver}. The next repo-level spec is {nxt}.\n",
         "- A spec that is not listed below or in the root `CHANGELOG.md` is NOT applied.\n",
         "- A project spec uses `@@ version` = the project's latest version below + 0.0.1.\n\n",
         "## Newest specs (root CHANGELOG.md)\n\n"]
    for e in entries[:10]:
        o.append("- " + " | ".join(x.lstrip("# ").strip() for x in e) + "\n")
    o.append("\n## Projects (latest heading in each project CHANGELOG.md)\n\n")
    for f in sorted((ROOT / "MCPEDL").glob("*/*/CHANGELOG.md")):
        head = next((l for l in f.read_text(encoding="utf-8").split("\n") if l.startswith("## [")), None)
        o.append(f"- `{f.parent.relative_to(ROOT).as_posix()}`: {head.lstrip('# ').strip() if head else '(no entry)'}\n")
    return "".join(o)

def mcicons_page():
    """Text index of the MCicons ids (the .tgz itself is binary and cannot be indexed). None when the file is absent."""
    sys.path.insert(0, str(ROOT / "scripts" / "lib"))
    import mcicons
    tgz = mcicons.tgz_path()
    if not tgz or not Path(tgz).is_file():
        return None
    import tarfile
    ids = []
    with tarfile.open(tgz) as t:
        for m in t.getmembers():
            n = m.name.rsplit("/", 1)[-1]
            if m.isfile() and m.name.startswith("package/dist/icons/") and n.startswith("minecraft_") and n.endswith(".png"):
                ids.append(n[len("minecraft_"):-4])
    ids.sort()
    o = ["# MCicons: Minecraft Icon Index\n\n",
         f"Generated by `scripts/build_context7_docs.py`. {len(ids)} vanilla icons in `{Path(tgz).name}` (`reference/mcicons/`).\n\n",
         "The icon images are inside that release file (binary, so Context7 cannot index them). This page lists which ids exist: use it to check an id BEFORE using an icon.\n\n",
         "- File inside the release: `package/dist/icons/minecraft_<id>.png`, 64x64 RGBA. Only `minecraft:` ids exist; custom ids and newer items may have no icon.\n",
         "- Read it in code with `scripts/lib/mcicons.py`: `has_icon(item_id)` and `icon_image(item_id)` (PIL RGBA).\n",
         "- Id in the list: use MCicons. Id missing: report it; there is no fallback (INSTRUCTIONS.md 1.5).\n",
         "- Keep `ASSET-NOTICE.md` with any redistributed icon.\n\n",
         "## Icon ids (without the `minecraft_` prefix)\n\n```text\n", "\n".join(ids), "\n```\n"]
    return "".join(o)


def main():
    pages = {"instructions-reference.md": instructions_page(), "scripts-and-workflows.md": scripts_page(), "where-we-left-off.md": ledger_page()}
    mc = mcicons_page()
    if mc:
        pages["mcicons-index.md"] = mc
    bad = []
    for n, text in pages.items():
        p = DOCS / n
        if "--check" in sys.argv:
            if not p.exists() or p.read_text(encoding="utf-8") != text:
                bad.append(n)
        else:
            DOCS.mkdir(exist_ok=True)
            p.write_text(text, encoding="utf-8")
            print(f"wrote docs/{n} ({len(text.encode())} bytes)")
    if bad:
        print("out of date: " + ", ".join(bad))
        sys.exit(1)


if __name__ == "__main__":
    main()
