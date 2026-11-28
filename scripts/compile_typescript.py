#!/usr/bin/env python3
"""Compile TypeScript (.ts) files in Minecraft Bedrock projects to JavaScript (.js).

Finds all .ts files (excluding .d.ts) in the specified directory or files,
runs the TypeScript compiler with Bedrock-compatible ES module settings,
and produces clean, comment-free .js files ready for Minecraft Bedrock.

Usage:
  python3 scripts/compile_typescript.py [PATH_OR_FILES...] [--keep-comments] [--check-only]
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def find_tsc(repo_root: Path = ROOT) -> list[str] | None:
    """Find the best available TypeScript compiler binary."""
    local_tsc = repo_root / "node_modules" / ".bin" / "tsc"
    if local_tsc.is_file() and os.access(local_tsc, os.X_OK):
        return [str(local_tsc)]

    global_tsc = shutil.which("tsc")
    if global_tsc:
        return [global_tsc]

    npx = shutil.which("npx")
    if npx:
        return [npx, "tsc"]

    return None


def _has_node_modules(path: Path) -> bool:
    curr = path.resolve()
    while curr != curr.parent:
        if (curr / "node_modules" / "@minecraft").is_dir():
            return True
        curr = curr.parent
    return False


def compile_ts_files(paths, root: Path = ROOT, remove_comments: bool = True, check_only: bool = False) -> tuple[bool, str]:
    """Compile given .ts paths (or directories containing .ts) into .js files.
    Returns (success: bool, output_or_error: str).
    """
    ts_files = []
    for p in paths:
        path = Path(p)
        if not path.is_absolute():
            path = (root / path).resolve()
        if path.is_file():
            if path.suffix == ".ts" and not path.name.endswith(".d.ts"):
                ts_files.append(path)
        elif path.is_dir():
            for f in path.rglob("*.ts"):
                if not f.name.endswith(".d.ts") and "node_modules" not in f.parts:
                    ts_files.append(f)

    if not ts_files:
        return True, "No TypeScript files to compile."

    tsc_cmd = find_tsc(root)
    if not tsc_cmd:
        return False, "TypeScript compiler ('tsc' or 'npx') not found. Please run 'npm install' to install typescript."

    # For files outside repo root that don't have node_modules in their ancestry,
    # temporarily link the repo's node_modules so @minecraft/* types resolve.
    created_symlinks = []
    repo_nm = (root / "node_modules").resolve()
    if repo_nm.is_dir():
        for f in ts_files:
            if not _has_node_modules(f):
                target_ancestor = f.parent
                for anc in f.parents:
                    if (anc / "project.json").is_file() or (anc / "behavior_pack").is_dir():
                        target_ancestor = anc
                        break
                link = target_ancestor / "node_modules"
                if not link.exists():
                    try:
                        link.symlink_to(repo_nm)
                        created_symlinks.append(link)
                    except OSError:
                        pass

    cmd = list(tsc_cmd) + [
        "--ignoreConfig",
        "--target", "es2022",
        "--module", "es2022",
        "--moduleResolution", "bundler",
        "--skipLibCheck",
        "--noEmitOnError",
    ]
    if remove_comments:
        cmd.append("--removeComments")
    if check_only:
        cmd.append("--noEmit")

    for f in ts_files:
        cmd.append(str(f))

    try:
        res = subprocess.run(cmd, cwd=str(root), capture_output=True, text=True)
        if res.returncode == 0:
            return True, f"Successfully compiled {len(ts_files)} TypeScript file(s)."
        err = (res.stderr + "\n" + res.stdout).strip()
        return False, err
    finally:
        for link in created_symlinks:
            try:
                if link.is_symlink():
                    link.unlink()
            except OSError:
                pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", default=["."], help="Directories or files to compile")
    parser.add_argument("--check-only", action="store_true", help="Typecheck only without emitting .js")
    parser.add_argument("--keep-comments", action="store_true", help="Keep comments in emitted .js")
    parser.add_argument("--root", default=str(ROOT), help="Repository root path")
    args = parser.parse_args()

    ok, msg = compile_ts_files(args.paths, root=Path(args.root), remove_comments=not args.keep_comments, check_only=args.check_only)
    if not ok:
        print(f"Error: {msg}", file=sys.stderr)
        return 1
    print(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
