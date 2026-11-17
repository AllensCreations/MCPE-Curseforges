#!/usr/bin/env python3
"""Run a command, show its output in the log and add it to the GitHub step summary.

  python3 scripts/step_summary.py "Title" -- command arg ...

Exit code = the command's exit code (a command that cannot start exits 127). The summary block is only
written when GITHUB_STEP_SUMMARY is set, so the script also works on a phone or laptop.
"""
import os
import subprocess
import sys


def run(title, cmd, summary=None):
    lines = []
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace")
    except OSError as exc:
        lines.append(f"{exc}\n")
        sys.stdout.write(lines[-1])
        code = 127
    else:
        for line in proc.stdout:
            sys.stdout.write(line)
            lines.append(line)
        code = proc.wait()
    sys.stdout.flush()
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write(f"### {title}\n```\n{''.join(lines).rstrip()}\n```\n")
    return code


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    if len(argv) < 3 or argv[1] != "--":
        print('usage: step_summary.py "Title" -- command arg ...', file=sys.stderr)
        return 2
    return run(argv[0], argv[2:], os.environ.get("GITHUB_STEP_SUMMARY"))


if __name__ == "__main__":
    sys.exit(main())
