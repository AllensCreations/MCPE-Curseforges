#!/usr/bin/env python3
"""Recipe image report for every pack. Report only: it never writes images and exits 0 unless --strict.

For each MCPEDL/*/* pack with behavior_pack/recipes/*.json it shows how many crafting-table recipes exist, how
many images are in assets/recipes/, and the exact reason when images are missing: every problem that
scripts/generate_recipe_images.py finds, a missing Bedrock Samples folder, or a crafting board that cannot be drawn.
Output goes to the log, to the GitHub step summary (GITHUB_STEP_SUMMARY) and to --out FILE.

Usage
  python3 scripts/recipe_image_report.py [--root DIR] [--samples PATH] [--out FILE] [--strict]
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_recipe_images as g  # noqa: E402


def environment(samples_root: Path) -> list[str]:
    notes = []
    rp = g._samples_rp(samples_root)
    if not rp.is_dir():
        notes.append(f"Bedrock Samples not found at {rp}: no vanilla ingredient can resolve.")
    try:
        import crafting_template as ct
        ct.render_crafting_table_svg()
    except Exception as exc:
        notes.append(f"The crafting board cannot be drawn ({type(exc).__name__}: {exc}). "
                     "Check requirements.txt (CairoSVG) and scripts/CRAFTING_TABLE.svg.")
    return notes


def skip_reason(path: Path) -> str:
    try:
        doc = g.load_json(path)
    except Exception as exc:
        return f"cannot read ({exc})"
    for kind in g.SUPPORTED:
        if kind in doc:
            return f"{kind.split(':')[1]} with tags {doc[kind].get('tags')}, not a crafting_table recipe"
    kinds = [k for k in doc if k.startswith("minecraft:recipe_")] or [k for k in doc if k != "format_version"]
    return "other recipe type: " + ", ".join(kinds) if kinds else "no recipe object found"


def inspect(pack: Path, samples: Path | None) -> dict:
    info = {"pack": pack, "files": len(g.recipe_files(pack)), "jobs": [], "skipped": [], "problems": [],
            "missing": [], "have": 0, "crash": None}
    try:
        jobs, skipped, problems = g.plan_pack(pack, samples)
    except Exception as exc:
        info["crash"] = f"{type(exc).__name__}: {exc}"
        return info
    out_dir = pack / "assets" / "recipes"
    have = {p.name for p in out_dir.glob("*_recipe.png")} if out_dir.is_dir() else set()
    info.update(jobs=jobs, problems=problems, have=len(have),
                skipped=[(s, skip_reason(pack / s)) for s in skipped],
                missing=[j["out"] for j in jobs if j["out"] not in have])
    return info


def status(info: dict) -> str:
    if info["crash"]:
        return "CRASH"
    if info["problems"]:
        return "BLOCKED"
    if info["missing"]:
        return "MISSING"
    if not info["jobs"]:
        return "NO CRAFTING RECIPES"
    return "OK"


def build_report(root: Path, samples: Path | None) -> tuple[str, list[str], int]:
    env = environment(samples or g.SAMPLES_ROOT)
    infos = [inspect(p, samples) for p in g.find_packs(root, None)]
    lines = ["# Recipe image report", ""]
    if env:
        lines += ["## Environment problems (these block images in every pack)", ""] + [f"- {n}" for n in env] + [""]
    lines += ["| Pack | Recipe files | Crafting recipes | Images in assets/recipes | Status |", "|---|---|---|---|---|"]
    for i in infos:
        lines.append(f"| {i['pack'].relative_to(root).as_posix()} | {i['files']} | {len(i['jobs']) + len(i['problems'])} | {i['have']} | {status(i)} |")
    warnings, bad = [], 0
    for i in infos:
        st = status(i)
        if st in ("OK", "NO CRAFTING RECIPES") and not i["skipped"]:
            continue
        name = i["pack"].relative_to(root).as_posix()
        lines += ["", f"## {name}: {st}", ""]
        if i["crash"]:
            lines.append(f"- The report could not read this pack: {i['crash']}")
        for p in i["problems"]:
            lines.append(f"- BLOCKED, nothing is written for this pack until fixed: {p}")
        if i["missing"] and not i["problems"]:
            cause = "see the environment problem above" if env else "not generated yet, or the generator step failed"
            lines.append(f"- Missing images, {cause}: " + ", ".join(i["missing"]))
        for rel, why in i["skipped"]:
            lines.append(f"- Skipped {rel}: {why}")
        if st in ("CRASH", "BLOCKED", "MISSING"):
            bad += 1
            warnings.append(f"::warning::{name}: {st}, no recipe images are written for it. See the Recipe image report.")
    if not infos:
        lines += ["", "No packs with behavior_pack/recipes found."]
    return "\n".join(lines) + "\n", warnings, bad


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(g.ROOT), help="repo root")
    ap.add_argument("--samples", help="Bedrock Samples folder (default: env BEDROCK_SAMPLES_ROOT or /tmp/bedrock-samples)")
    ap.add_argument("--out", help="also write the report to this file")
    ap.add_argument("--strict", action="store_true", help="exit 1 when any pack is CRASH, BLOCKED or MISSING")
    a = ap.parse_args(argv)
    report, warnings, bad = build_report(Path(a.root), Path(a.samples) if a.samples else None)
    print(report)
    for w in warnings:
        print(w)
    if a.out:
        Path(a.out).write_text(report, encoding="utf-8")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write(report)
    return 1 if (a.strict and bad) else 0


if __name__ == "__main__":
    sys.exit(main())
