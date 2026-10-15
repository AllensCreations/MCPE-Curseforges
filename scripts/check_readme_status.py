#!/usr/bin/env python3
"""
Scanner for project README documentation status across MCPE-Curseforges.
Identifies projects with missing READMEs, unwritten documentation placeholders,
or unsupplied logos/banners.
"""

import os
import glob
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

PLACEHOLDER_MARKERS = [
    "Not yet written",
    "Documentation status",
    "Logo: Not supplied",
    "Banner: Not supplied",
    "<!-- TODO:",
    "TODO: Describe what this addon does",
]

def scan_projects():
    categories = [
        "MCPEDL/addons", "MCPEDL/new_addons", "MCPEDL/script", "MCPEDL/maps"
    ]
    # Include all subdirectories under MCPEDL/
    mcpedl_dir = os.path.join(REPO_ROOT, "MCPEDL")
    if os.path.isdir(mcpedl_dir):
        for sub in sorted(os.listdir(mcpedl_dir)):
            subpath = os.path.join(mcpedl_dir, sub)
            if os.path.isdir(subpath):
                rel = f"MCPEDL/{sub}"
                if rel not in categories:
                    categories.append(rel)

    results = []

    for cat in categories:
        cat_path = os.path.join(REPO_ROOT, cat)
        if not os.path.isdir(cat_path):
            continue
        for proj in sorted(glob.glob(os.path.join(cat_path, "*"))):
            if not os.path.isdir(proj):
                continue
            proj_name = os.path.basename(proj)
            readme_path = os.path.join(proj, "README.md")

            if not os.path.isfile(readme_path):
                results.append({
                    "name": proj_name,
                    "path": os.path.relpath(proj, REPO_ROOT),
                    "status": "MISSING_README",
                    "details": "README.md does not exist."
                })
                continue

            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()

            matched_markers = [m for m in PLACEHOLDER_MARKERS if m in content]
            if matched_markers:
                results.append({
                    "name": proj_name,
                    "path": os.path.relpath(proj, REPO_ROOT),
                    "status": "PLACEHOLDER",
                    "details": f"Contains markers: {', '.join(matched_markers)}"
                })
            else:
                results.append({
                    "name": proj_name,
                    "path": os.path.relpath(proj, REPO_ROOT),
                    "status": "COMPLETE",
                    "details": "Documentation is populated."
                })

    return results

def main():
    projects = scan_projects()
    print("=" * 70)
    print("MCPE-Curseforges — README Documentation Status Audit (/checkrm)")
    print("=" * 70)

    pending = [p for p in projects if p["status"] != "COMPLETE"]
    complete = [p for p in projects if p["status"] == "COMPLETE"]

    for p in projects:
        icon = "[OK]" if p["status"] == "COMPLETE" else "[NEEDS UPDATE]"
        print(f"{icon:<15} {p['path']:<45} {p['details']}")

    print("-" * 70)
    print(f"Total projects: {len(projects)} | Complete: {len(complete)} | Needs Update: {len(pending)}")
    print("=" * 70)

if __name__ == "__main__":
    main()
