#!/usr/bin/env python3
"""
Prune old build snapshots across builds/ directories.

Retention policy:
  - Preserves the root compiled packages in builds/<project>/ (current release).
  - Inside builds/<project>/versions/: retains at least 2 versions (1 current + 1 previous old).
  - Deletes legacy_versions/ or version snapshots older than the retention window (>2 versions).
"""

import os
import re
import shutil
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDS_DIR = os.path.join(REPO_ROOT, "builds")

def _version_sort_key(folder_name):
    # Match V1.2.3 or 1.2.3 or similar
    m = re.match(r"V?(\d+)(?:\.(\d+))?(?:\.(\d+))?", folder_name)
    if m:
        return tuple(int(x or 0) for x in m.groups())
    return None

def prune_builds(dry_run=False, min_keep=2):
    if not os.path.isdir(BUILDS_DIR):
        print(f"Error: {BUILDS_DIR} does not exist.")
        sys.exit(1)

    freed_bytes = 0
    deleted_folders = 0

    print(f"Pruning build archives (Keeping at least {min_keep} versions per project)...")

    for project in sorted(os.listdir(BUILDS_DIR)):
        proj_dir = os.path.join(BUILDS_DIR, project)
        if not os.path.isdir(proj_dir):
            continue

        versions_dir = os.path.join(proj_dir, "versions")
        legacy_dir = os.path.join(proj_dir, "legacy_versions")

        # 1. Clean up legacy_versions if versions/ has modern snapshots
        if os.path.isdir(legacy_dir):
            for legacy_ver in os.listdir(legacy_dir):
                lv_path = os.path.join(legacy_dir, legacy_ver)
                if os.path.isdir(lv_path):
                    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(lv_path) for f in fs)
                    freed_bytes += size
                    deleted_folders += 1
                    if not dry_run:
                        shutil.rmtree(lv_path, ignore_errors=True)
                    print(f"  [{project}] Removed legacy version {legacy_ver} ({size / (1024*1024):.2f} MB)")
            if not dry_run and os.path.isdir(legacy_dir) and not os.listdir(legacy_dir):
                shutil.rmtree(legacy_dir, ignore_errors=True)

        # 2. Prune versions/ to keep at least min_keep (1 current + 1 previous old)
        if os.path.isdir(versions_dir):
            subdirs = [d for d in os.listdir(versions_dir) if os.path.isdir(os.path.join(versions_dir, d))]
            # Sort by version tuple
            sorted_vers = sorted(subdirs, key=lambda x: (_version_sort_key(x) or (0,), x))

            if len(sorted_vers) > min_keep:
                to_remove = sorted_vers[:-min_keep]
                for old_ver in to_remove:
                    old_path = os.path.join(versions_dir, old_ver)
                    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(old_path) for f in fs)
                    freed_bytes += size
                    deleted_folders += 1
                    if not dry_run:
                        shutil.rmtree(old_path, ignore_errors=True)
                    print(f"  [{project}] Pruned old version snapshot {old_ver} ({size / (1024*1024):.2f} MB)")

    mode = "Would free" if dry_run else "Freed"
    print(f"\nCompleted! {mode} {freed_bytes / (1024 * 1024):.2f} MB across {deleted_folders} snapshot folders.")

if __name__ == "__main__":
    is_dry = "--dry-run" in sys.argv
    keep = 2
    for arg in sys.argv[1:]:
        if arg.startswith("--keep="):
            try:
                keep = int(arg.split("=")[1])
            except ValueError:
                pass
    prune_builds(dry_run=is_dry, min_keep=keep)
