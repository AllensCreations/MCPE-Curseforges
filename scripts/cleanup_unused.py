#!/usr/bin/env python3
"""Find (and optionally delete) unused leftovers in the repository.

Deletes only when --apply is given. Without it, it just prints what it would do.

Removes:
  1. MCPEDL/incoming/* older than --keep-days (leftover payloads/zips), except README/.gitkeep
  2. *.importing staging folders left by a failed import under MCPEDL/
  3. Known obsolete workflow files whose helper script no longer exists
Reports only (never deletes):
  - builds/<Name> folders that match no project in MCPEDL/
Writes a Markdown report to --report (for the job summary).
"""
import argparse, shutil, subprocess, time
from pathlib import Path

OBSOLETE = {
    ".github/workflows/create-oneblock-from-base64.yml": "scripts/import_oneblock_payload.py",
}
KEEP_IN_INCOMING = {"README.md", ".gitkeep"}


def last_commit_ts(root, rel):
    out = subprocess.run(["git", "log", "-1", "--format=%ct", "--", rel], cwd=root,
                         capture_output=True, text=True).stdout.strip()
    return int(out) if out else int(time.time())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--keep-days", type=int, default=7)
    ap.add_argument("--root", default=".")
    ap.add_argument("--report", default="cleanup_report.md")
    a = ap.parse_args()
    root = Path(a.root).resolve()
    cutoff = time.time() - a.keep_days * 86400
    remove, notes = [], []

    inc = root / "MCPEDL" / "incoming"
    if inc.is_dir():
        for p in sorted(inc.iterdir()):
            rel = p.relative_to(root).as_posix()
            if p.name in KEEP_IN_INCOMING:
                continue
            if last_commit_ts(root, rel) < cutoff:
                remove.append((rel, f"leftover in incoming/, older than {a.keep_days} days"))

    for p in sorted((root / "MCPEDL").rglob("*.importing")):
        remove.append((p.relative_to(root).as_posix(), "failed-import staging folder"))

    for wf, helper in OBSOLETE.items():
        if (root / wf).is_file() and not (root / helper).exists():
            remove.append((wf, f"obsolete: calls missing {helper}"))

    projects = {p.name for d in ("addons", "new_addons", "maps", "script")
                for p in (root / "MCPEDL" / d).glob("*") if p.is_dir()}
    b = root / "builds"
    if b.is_dir():
        for p in sorted(b.iterdir()):
            if p.is_dir() and p.name not in projects:
                notes.append(f"builds/{p.name} matches no project folder (review manually)")

    lines = [f"### Cleanup {'APPLIED' if a.apply else 'DRY RUN'}", ""]
    lines += [f"- {'removed' if a.apply else 'would remove'}: `{r}` ({why})" for r, why in remove] or ["- Nothing to remove."]
    if notes:
        lines += ["", "Review manually (not deleted):"] + [f"- {n}" for n in notes]
    Path(a.report).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))

    if a.apply:
        for rel, _ in remove:
            t = root / rel
            shutil.rmtree(t) if t.is_dir() else t.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
