#!/usr/bin/env python3
"""Enrich AI review files with Graphify graph context.

Injects a compact "## Graph Context" section into every pack's ai-review .txt file
so that one single file covers BOTH deep pack code AND repo-wide relationships.

Usage:
  python3 scripts/enrich_ai_review.py [--all] [--only Name[,Name]]

Options:
  --all          Re-enrich every pack even if already up-to-date.
  --only X,Y     Comma-separated pack names to process.

The script:
  1. Reads graphify-out/graph.json (runs scripts/graphify.py first if missing or stale).
  2. For each pack's MCPEDL/AI Review/<Pack>.txt, injects a small graph section at the top
     (after the index / before "## AI Instructions") with:
       - Pack version, type (behavior/resource), API modules used
       - Cross-pack shared dependencies or patterns
       - Sibling packs in same category
     If the section already exists it is replaced, so re-running is safe.
  The shared kits (MCPEDL/AI Review/*_tools.txt) are NOT enriched: they carry a directory map built from the
  working tree by scripts/collect_ai_review.py, which cannot go stale.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH_JSON = ROOT / "graphify-out" / "graph.json"
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
SECTION_START = "<!-- GRAPH-CONTEXT:START -->"
SECTION_END = "<!-- GRAPH-CONTEXT:END -->"


# ---------------------------------------------------------------------------
# Graph helpers
# ---------------------------------------------------------------------------

def load_graph() -> dict:
    """Load graph.json, regenerating if missing."""
    if not GRAPH_JSON.exists():
        print("graphify-out/graph.json not found — running graphify.py …")
        graphify = ROOT / "scripts" / "graphify.py"
        if graphify.exists():
            subprocess.run([sys.executable, str(graphify)], cwd=ROOT, check=True)
        else:
            sys.exit("ERROR: graphify.py not found and graph.json missing. Run graphify first.")
    return json.loads(GRAPH_JSON.read_text(encoding="utf-8"))


def build_index(graph: dict):
    """Return (nodes_by_id, links_for) dicts for fast lookup."""
    nodes_by_id: dict[str, dict] = {n["id"]: n for n in graph["nodes"]}
    links_for: dict[str, list[dict]] = {}
    for lnk in graph["links"]:
        s, t = lnk["source"], lnk["target"]
        links_for.setdefault(s, []).append(lnk)
        links_for.setdefault(t, []).append(lnk)
    return nodes_by_id, links_for


def pack_graph_section(pack_name: str, nodes_by_id: dict, links_for: dict) -> str:
    """Build the compact graph context block for one pack."""
    lines: list[str] = []

    # --- Project node ---
    proj_id = f"Project:{pack_name}"
    proj = nodes_by_id.get(proj_id)
    if proj:
        ver = proj.get("version", "?")
        cat = proj.get("category", "?")
        lines.append(f"- **Project:** `{pack_name}` | Category: `{cat}` | Version: `{ver}`")

    # --- Pack sub-nodes (behavior/resource) ---
    pack_nodes = [
        n for n in nodes_by_id.values()
        if n.get("type") == "pack" and pack_name in n.get("id", "")
    ]
    if pack_nodes:
        pack_types = ", ".join(sorted({n.get("pack_type", "?") for n in pack_nodes}))
        lines.append(f"- **Pack Types:** {pack_types}")

    # --- JS / API modules ---
    js_nodes = [
        n for n in nodes_by_id.values()
        if n.get("type") == "javascript" and pack_name in n.get("id", "")
    ]
    api_imports: set[str] = set()
    for js in js_nodes:
        for lnk in links_for.get(js["id"], []):
            if lnk.get("relation") == "imports_api":
                target = nodes_by_id.get(lnk["target"])
                if target:
                    api_imports.add(target.get("label", lnk["target"]))
    if js_nodes:
        script_files = ", ".join(f"`{n['label']}`" for n in js_nodes)
        lines.append(f"- **Scripts:** {script_files}")
    if api_imports:
        lines.append(f"- **API Imports:** {', '.join(sorted(api_imports))}")

    # --- Sibling packs (same category) ---
    siblings: list[str] = []
    if proj:
        cat_id = f"Category:{cat}"
        for lnk in links_for.get(cat_id, []):
            if lnk.get("relation") == "contains" and lnk["target"] != proj_id:
                sib = nodes_by_id.get(lnk["target"])
                if sib:
                    sib_name = sib.get("label", lnk["target"])
                    sib_ver = sib.get("version", "")
                    siblings.append(f"`{sib_name}`" + (f" ({sib_ver})" if sib_ver else ""))
    if siblings:
        lines.append(f"- **Siblings in {cat}:** " + ", ".join(sorted(siblings)[:8])
                     + (" …" if len(siblings) > 8 else ""))

    # --- Relationships ---
    proj_links = links_for.get(proj_id, []) if proj else []
    relations: list[str] = []
    for lnk in proj_links:
        rel = lnk.get("relation", "")
        if rel in ("uses_templates", "depends_on", "extends", "shared_with"):
            other_id = lnk["target"] if lnk["source"] == proj_id else lnk["source"]
            other = nodes_by_id.get(other_id)
            if other:
                relations.append(f"`{other.get('label', other_id)}` ({rel})")
    if relations:
        lines.append(f"- **Relations:** " + ", ".join(relations))

    if not lines:
        return ""  # No useful graph data for this pack

    block = (
        f"\n{SECTION_START}\n"
        f"## Graph Context\n\n"
        + "\n".join(lines)
        + f"\n\n> _Auto-generated from graphify-out/graph.json — do not edit manually._\n"
        f"{SECTION_END}\n"
    )
    return block


# ---------------------------------------------------------------------------
# File injection
# ---------------------------------------------------------------------------

def inject_section(txt_path: Path, section: str) -> bool:
    """Replace or insert the graph context section. Returns True if changed."""
    content = txt_path.read_text(encoding="utf-8")
    # Remove existing section
    pattern = re.compile(
        re.escape(SECTION_START) + r".*?" + re.escape(SECTION_END) + r"\n?",
        re.DOTALL,
    )
    content_clean = pattern.sub("", content)

    # Find insertion point: after "## Index" block, before "## AI Instructions"
    insert_marker = "## AI Instructions"
    if insert_marker in content_clean:
        prefix, suffix = content_clean.split(insert_marker, 1)
        prefix = re.sub(r"(\n\s*---\s*)+\n*$", "\n\n", prefix)
        new_content = prefix.rstrip() + "\n\n---\n\n" + section.strip() + "\n\n---\n\n" + insert_marker + suffix
    else:
        # Fallback: prepend
        new_content = section.strip() + "\n\n---\n\n" + content_clean.lstrip()

    # Clean up any multi-delimiter runs or excessive empty lines
    new_content = re.sub(r"\n{3,}", "\n\n", new_content)

    if new_content == content:
        return False
    txt_path.write_text(new_content, encoding="utf-8")
    return True


def packages():
    for cat in CATEGORIES:
        base = ROOT / "MCPEDL" / cat
        if base.is_dir():
            for p in sorted(base.iterdir(), key=lambda x: x.name.lower()):
                if p.is_dir() and not p.name.startswith("."):
                    yield cat, p


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Enrich AI review files with graph context.")
    ap.add_argument("--all", action="store_true", help="Re-enrich all packs.")
    ap.add_argument("--only", default="", help="Comma-separated pack names.")
    args = ap.parse_args()

    only_set = {n.strip() for n in args.only.split(",") if n.strip()}

    print("Loading graph …")
    graph = load_graph()
    nodes_by_id, links_for = build_index(graph)

    changed_count = 0
    skipped_count = 0
    missing_count = 0

    for cat, pack_path in packages():
        name = pack_path.name
        if only_set and name not in only_set:
            continue

        # Per-pack AI review file: MCPEDL/AI Review/<Pack>.txt
        review_txt = ROOT / "MCPEDL" / "AI Review" / f"{name}.txt"
        txt_path = review_txt if review_txt.exists() else None

        if txt_path is None:
            missing_count += 1
            continue

        section = pack_graph_section(name, nodes_by_id, links_for)
        if not section:
            skipped_count += 1
            continue

        changed = inject_section(txt_path, section)
        if changed:
            changed_count += 1
            print(f"  ✔ enriched  {txt_path.relative_to(ROOT)}")
        else:
            skipped_count += 1

    print(
        f"\nDone — enriched: {changed_count}, "
        f"skipped/unchanged: {skipped_count}, "
        f"no ai-review file: {missing_count}."
    )
    # Write to GITHUB_OUTPUT if present
    gout = os.environ.get("GITHUB_OUTPUT")
    if gout:
        with open(gout, "a", encoding="utf-8") as fh:
            fh.write(f"changed={'true' if changed_count else 'false'}\n")
            fh.write(f"enriched_count={changed_count}\n")


if __name__ == "__main__":
    main()
