#!/usr/bin/env python3
"""Rebase onto the remote branch and push, retrying when another workflow pushed first.

  python3 scripts/git_push_retry.py --branch main [--attempts 5]

Exits non-zero if a rebase conflicts or every attempt is rejected, leaving the commit unpushed.
"""
import argparse
import subprocess
import sys
import time


def git(*args):
    return subprocess.run(["git", *args], text=True, capture_output=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--attempts", type=int, default=5)
    args = parser.parse_args()

    for attempt in range(1, args.attempts + 1):
        pull = git("pull", "--rebase", "origin", args.branch)
        if pull.returncode != 0:
            git("rebase", "--abort")
            print(f"::error::Rebase onto origin/{args.branch} failed:\n{pull.stderr}", file=sys.stderr)
            return 1
        push = git("push", "origin", f"HEAD:refs/heads/{args.branch}")
        if push.returncode == 0:
            print(f"Pushed to {args.branch} (attempt {attempt}).")
            return 0
        print(f"Push rejected (attempt {attempt}/{args.attempts}); retrying.", file=sys.stderr)
        time.sleep(min(2 ** attempt, 15))
    print(f"::error::Could not push to {args.branch} after {args.attempts} attempts.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
