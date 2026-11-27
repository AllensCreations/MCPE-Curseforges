#!/usr/bin/env python3
"""Rebase onto the remote branch and push, retrying when another workflow pushed first.

  python3 scripts/git_push_retry.py --branch main [--attempts 5]

Exits non-zero if every attempt is rejected, leaving the commit unpushed.
Auto-resolves rebase conflicts in registry (builds/Curseforge_IDs.json) and generated docs.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, text=True, capture_output=True)


def resolve_rebase_conflicts():
    """Attempt to resolve conflicts on known generated or mergeable files."""
    conflicts_out = git("diff", "--name-only", "--diff-filter=U").stdout.strip()
    if not conflicts_out:
        return True
    conflicts = conflicts_out.splitlines()
    for rel_path in conflicts:
        p = Path(rel_path)
        if p == Path("builds/Curseforge_IDs.json"):
            # Stage 2 = upstream branch during rebase
            # Stage 3 = commit being replayed during rebase
            s2 = git("show", ":2:builds/Curseforge_IDs.json").stdout
            s3 = git("show", ":3:builds/Curseforge_IDs.json").stdout
            try:
                upstream = json.loads(s2) if s2.strip() else {}
                local = json.loads(s3) if s3.strip() else {}
                merged = dict(sorted({**upstream, **local}.items()))
                (ROOT / "builds/Curseforge_IDs.json").write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
                git("add", "builds/Curseforge_IDs.json")
            except Exception as e:
                print(f"::warning::Failed to merge Curseforge_IDs.json: {e}", file=sys.stderr)
                return False
        elif p.name in ("README.md", "MCPEDL.md") or p.as_posix().startswith("changelog_views/") or p.as_posix().endswith(".listing.md"):
            # Generated documentation: take the local version being committed
            git("checkout", "--theirs", rel_path)
            git("add", rel_path)
        else:
            return False

    remaining = git("diff", "--name-only", "--diff-filter=U").stdout.strip()
    if remaining:
        return False

    env = dict(os.environ, GIT_EDITOR="true")
    res = subprocess.run(["git", "rebase", "--continue"], cwd=ROOT, env=env, text=True, capture_output=True)
    if res.returncode == 0:
        # Re-run sync scripts to keep READMEs aligned with the combined registry
        subprocess.run([sys.executable, "scripts/sync_curseforge_status.py"], cwd=ROOT, capture_output=True)
        subprocess.run([sys.executable, "scripts/build_mcpedl_readme.py"], cwd=ROOT, capture_output=True)
        git("add", "-A")
        git("commit", "--amend", "--no-edit")
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--attempts", type=int, default=5)
    args = parser.parse_args()

    for attempt in range(1, args.attempts + 1):
        # First try direct push
        push = git("push", "origin", f"HEAD:refs/heads/{args.branch}")
        if push.returncode == 0:
            print(f"Pushed to {args.branch} (attempt {attempt}).")
            return 0

        print(f"Push rejected or remote has newer commits (attempt {attempt}/{args.attempts}); rebasing onto origin/{args.branch}...", file=sys.stderr)

        pull = git("pull", "--rebase", "origin", args.branch)
        if pull.returncode != 0:
            if resolve_rebase_conflicts():
                print(f"Auto-resolved rebase conflicts onto origin/{args.branch}.", file=sys.stderr)
            else:
                git("rebase", "--abort")
                print(f"::warning::Rebase onto origin/{args.branch} failed and could not auto-resolve:\n{pull.stderr}", file=sys.stderr)
                time.sleep(min(2 ** attempt, 15))
                continue

        push = git("push", "origin", f"HEAD:refs/heads/{args.branch}")
        if push.returncode == 0:
            print(f"Pushed to {args.branch} (attempt {attempt}).")
            return 0

        print(f"Push rejected after rebase (attempt {attempt}/{args.attempts}); retrying.", file=sys.stderr)
        time.sleep(min(2 ** attempt, 15))

    print(f"::error::Could not push to {args.branch} after {args.attempts} attempts.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
