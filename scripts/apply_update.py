#!/usr/bin/env python3
"""Search-and-replace updater for ALNStudios/MCPE-Curseforges (runs inside every update .sh).

Applies a small text spec to a project instead of rewriting whole files. All-or-nothing: every edit is
checked in memory first, nothing is written if any edit fails. Safe to run twice (applied edits are skipped).

Spec format (lines starting with "@@ " are directives; a content line that must start with "@@" is written
"@@@"; the first "@" is removed):
  @@ version 1.2.4                      new X.Y.Z (must be the current highest + 0.0.1, or already applied)
  @@ project MCPEDL/Addons/Mining-Helmet   folder every @@ file path is relative to ("." = repo root, no version step)
  @@ file behavior_pack/scripts/main.js
  @@ replace                            exact text that must occur ONCE (partial lines are fine)
  old text
  @@ with
  new text
  @@ replace-all ... @@ with ...        every occurrence
  @@ insert-after / @@ insert-before    anchor line(s) occurring once, then @@ with + the lines to insert
  @@ delete                             exact text occurring once (whole lines remove their newline too)
  @@ append                             text added to the end (skipped when already there)
  @@ create                             new file (error when it exists with other content)
  @@ overwrite                          whole-file replacement (only for new content over 60% of the file)
  @@ changelog Update Name              project CHANGELOG.md entry "## [X.Y.Z] - date - Update Name" + body
  @@ root-changelog Update Name         optional; default = same name and body in the root CHANGELOG.md
Block text is the lines between directives, joined with newlines (no trimming). Put no blank line before the
next directive unless the text needs it.

Usage: python3 scripts/apply_update.py SPEC --date YYYY-MM-DD [--root DIR] [--dry-run] [--touched FILE]
Exit: 0 ok, 1 spec or match error, 3 version is stale, 4 validation failed.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

NAMES = {"version", "project", "file", "replace", "replace-all", "insert-after", "insert-before", "delete", "with",
         "append", "create", "overwrite", "changelog", "root-changelog"}
NEEDS_WITH = {"replace", "replace-all", "insert-after", "insert-before"}
VER = re.compile(r"^\d+\.\d+\.\d+$")


class Fail(Exception):
    def __init__(self, msg, code=1):
        super().__init__(msg)
        self.code = code


def parse(text):
    toks = []
    for n, line in enumerate(text.replace("\r\n", "\n").split("\n"), 1):
        if line.startswith("@@@"):
            toks[-1][2].append(line[1:]) if toks else None
        elif line == "@@" or line.startswith("@@ "):
            name, _, arg = line[3:].strip().partition(" ")
            if name not in NAMES:
                raise Fail(f"spec line {n}: unknown directive '@@ {name}'")
            toks.append([name, arg.strip(), []])
        elif toks:
            toks[-1][2].append(line)
        elif line.strip():
            raise Fail(f"spec line {n}: text before the first directive")
    if toks and toks[-1][2] and toks[-1][2][-1] == "":
        toks[-1][2].pop()
    spec = {"version": None, "project": None, "ops": [], "changelog": None, "root": None}
    cur, i = None, 0
    while i < len(toks):
        name, arg, lines = toks[i]
        body = "\n".join(lines)
        i += 1
        if name == "version":
            spec["version"] = arg
        elif name == "project":
            spec["project"] = arg
        elif name == "file":
            cur = arg
        elif name in ("changelog", "root-changelog"):
            spec["changelog" if name == "changelog" else "root"] = (arg or "Update", body)
        elif name == "with":
            raise Fail("'@@ with' without a matching @@ replace, @@ replace-all, @@ insert-after or @@ insert-before")
        else:
            if cur is None:
                raise Fail(f"'@@ {name}' needs a '@@ file <path>' before it")
            new = None
            if name in NEEDS_WITH:
                if i >= len(toks) or toks[i][0] != "with":
                    raise Fail(f"'@@ {name}' on {cur} needs '@@ with'")
                new = "\n".join(toks[i][2])
                i += 1
            spec["ops"].append({"op": name, "file": cur, "old": body, "new": new})
    if not spec["version"] or not VER.match(spec["version"]):
        raise Fail("spec needs '@@ version X.Y.Z'")
    if not spec["project"]:
        raise Fail("spec needs '@@ project <folder>'")
    return spec


def apply_op(t, o):
    op, old, new = o["op"], o["old"], o["new"]
    if op in ("replace", "replace-all"):
        c = t.count(old) if old else 0
        if not old:
            raise Fail(f"{o['file']}: empty search text")
        if c == 0:
            if new in t:
                return t, False
            raise Fail(f"{o['file']}: text not found: {old.splitlines()[0][:80]!r}")
        if new in t and old in new:
            return t, False
        if op == "replace" and c > 1:
            raise Fail(f"{o['file']}: text found {c} times, add more context or use replace-all: {old.splitlines()[0][:80]!r}")
        return t.replace(old, new), True
    if op in ("insert-after", "insert-before"):
        if new in t and old in t:
            return t, False
        c = t.count(old)
        if c != 1:
            raise Fail(f"{o['file']}: anchor found {c} times (needs exactly 1): {old.splitlines()[0][:80]!r}")
        a = t.index(old)
        if op == "insert-after":
            e = t.find("\n", a + len(old))
            e = len(t) if e < 0 else e
            return t[:e] + "\n" + new + t[e:], True
        s = t.rfind("\n", 0, a) + 1
        return t[:s] + new + "\n" + t[s:], True
    if op == "delete":
        c = t.count(old)
        if c == 0:
            return t, False
        if c > 1:
            raise Fail(f"{o['file']}: delete text found {c} times: {old.splitlines()[0][:80]!r}")
        a = t.index(old)
        e = a + len(old)
        if (a == 0 or t[a - 1] == "\n") and t[e:e + 1] == "\n":
            e += 1
        return t[:a] + t[e:], True
    if op == "append":
        if old.strip("\n") and old.strip("\n") in t:
            return t, False
        return (t if t.endswith("\n") or not t else t + "\n") + old.rstrip("\n") + "\n", True
    raise Fail(f"unknown op {op}")


def vtuple(v):
    return tuple(int(x) for x in v.split("."))


def current_highest(proj):
    best = None
    for m in proj.rglob("manifest.json"):
        try:
            v = json.loads(m.read_text(encoding="utf-8-sig"))["header"]["version"]
            if isinstance(v, list) and len(v) == 3:
                best = max(best or (0, 0, 0), tuple(v))
        except (OSError, ValueError, KeyError, TypeError):
            pass
    c = proj / "CHANGELOG.md"
    if c.is_file():
        m = re.search(r"(?m)^## \[(\d+\.\d+\.\d+)\]", c.read_text(encoding="utf-8"))
        if m:
            best = max(best or (0, 0, 0), vtuple(m.group(1)))
    return best


def add_entry(t, heading, body):
    if heading in t:
        return t, False
    i = t.index("---\n") + 4 if "---\n" in t else len(t)
    return t[:i] + "\n" + heading + "\n\n" + body.strip("\n") + "\n" + t[i:], True


def js_syntax(path):
    """(ran, error). A missing or broken node (for example a Termux library error) is 'not checked', never a syntax error."""
    node = shutil.which("node")
    if not node:
        return False, ""
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t) / "check.mjs"
        shutil.copyfile(path, tmp)
        r = subprocess.run([node, "--check", str(tmp)], capture_output=True, text=True)
    if r.returncode == 0:
        return True, ""
    if "SyntaxError" not in r.stderr:
        return False, ""
    errs = [ln for ln in r.stderr.splitlines() if "Error" in ln]
    return True, (errs[-1] if errs else "syntax error").strip()


def run(spec, root, date, dry=False):
    root = Path(root).resolve()
    ver = spec["version"]
    project = spec["project"].strip().rstrip("/")
    repo_level = project == "."
    proj = (root / project).resolve()
    if not repo_level and root not in proj.parents:
        raise Fail(f"project path leaves the repo: {project}")
    if not proj.is_dir():
        raise Fail(f"project folder not found: {project}")
    if not repo_level:
        hi = current_highest(proj)
        want = vtuple(ver)
        if hi is not None and hi != want and (hi[0], hi[1], hi[2] + 1) != want:
            raise Fail(f"stale script: {project} is at {'.'.join(map(str, hi))}, this script makes {ver}. "
                       "Expected the new version to be exactly one patch above.", 3)
    files, notes = {}, []
    for o in spec["ops"]:
        rel = o["file"]
        p = (proj / rel).resolve()
        if proj not in p.parents and not (repo_level and root in p.parents):
            raise Fail(f"{rel}: path leaves the project folder")
        if rel.endswith("CHANGELOG.md") and not repo_level:
            raise Fail("edit CHANGELOG.md with @@ changelog, not with a file edit")
        if p not in files:
            files[p] = p.read_text(encoding="utf-8") if p.is_file() else None
        t = files[p]
        if o["op"] in ("create", "overwrite"):
            new = o["old"].rstrip("\n") + "\n"
            if t == new:
                notes.append(f"skipped  {rel} (already identical)")
                continue
            if t is not None and o["op"] == "create":
                raise Fail(f"{rel}: already exists with other content (use @@ overwrite only for big rewrites)")
            files[p] = new
            notes.append(f"{'created' if t is None else 'rewrote'}  {rel}")
            continue
        if t is None:
            raise Fail(f"{rel}: file not found")
        files[p], changed = apply_op(t, o)
        notes.append(f"{'patched ' if changed else 'skipped '} {rel} ({o['op']}{'' if changed else ', already applied'})")
    if spec["changelog"] and not repo_level:
        c = proj / "CHANGELOG.md"
        if not c.is_file():
            raise Fail(f"{project}/CHANGELOG.md not found")
        name, body = spec["changelog"]
        files[c], ch = add_entry(files.get(c) or c.read_text(encoding="utf-8"), f"## [{ver}] - {date} - {name}", body)
        notes.append(f"{'added   ' if ch else 'skipped '} {project}/CHANGELOG.md entry {ver}")
    rootspec = spec["root"] or spec["changelog"]
    if rootspec:
        rc = root / "CHANGELOG.md"
        name, body = rootspec
        rt = files.get(rc) or rc.read_text(encoding="utf-8")
        vp = root / "REPO_VERSION"
        dup = re.search(r"^## \[\d+\.\d+\.\d+\] - " + re.escape(f"{date} - {name}") + r"$", rt, re.M)
        if dup or f"## {date} - {name}" in rt:
            ch = False
        else:
            cur = vp.read_text(encoding="utf-8").strip() if vp.is_file() else ""
            if re.match(r"^\d+\.\d+\.\d+$", cur):
                a, b, c = (int(x) for x in cur.split("."))
                cur = f"{a}.{b}.{c + 1}"
            else:
                cur = "1.0.0"
            files[vp] = cur + "\n"
            rt, ch = add_entry(rt, f"## [{cur}] - {date} - {name}", body)
            files[rc] = rt
        notes.append(f"{'added   ' if ch else 'skipped '} CHANGELOG.md (root) entry")
    for p, t in files.items():
        if p.suffix == ".json" and t is not None:
            try:
                json.loads(t)
            except ValueError as e:
                raise Fail(f"{p.relative_to(root)}: invalid JSON after the edit: {e}", 4)
    touched = []
    for p, t in files.items():
        if t is None:
            continue
        before = p.read_text(encoding="utf-8") if p.is_file() else None
        if before != t:
            touched.append(p)
            if not dry:
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(t, encoding="utf-8", newline="\n")
    if not dry:
        unchecked = False
        for p in touched:
            if p.suffix in (".js", ".mjs"):
                ran, err = js_syntax(p)
                if err:
                    raise Fail(f"{p.relative_to(root)}: JavaScript syntax error: {err}", 4)
                unchecked = unchecked or not ran
        if unchecked:
            notes.append("warning: node is missing or not usable, JavaScript syntax not checked")
    if not dry and not repo_level and (proj / "behavior_pack/manifest.json").is_file():
        tools = root / "scripts" / "manifest_tools.py"
        for args in (["--set", ver], ["--check"]):
            r = subprocess.run([sys.executable, str(tools), "--project", str(proj), *args], capture_output=True, text=True)
            if r.returncode != 0:
                raise Fail("manifest_tools " + args[0] + " failed: " + (r.stdout + r.stderr).strip()[-300:], 4)
        for m in proj.rglob("manifest.json"):
            if m not in touched:
                touched.append(m)
    return notes, sorted({p for p in touched})


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("--date", required=True)
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--touched", help="write the list of changed repo-relative paths to this file")
    a = ap.parse_args(argv)
    try:
        spec = parse(Path(a.spec).read_text(encoding="utf-8"))
        notes, touched = run(spec, a.root, a.date, a.dry_run)
    except Fail as e:
        print("ERROR:", e)
        return e.code
    for n in notes:
        print(n)
    root = Path(a.root).resolve()
    rel = [p.relative_to(root).as_posix() for p in touched]
    if a.touched:
        Path(a.touched).write_text("\n".join(rel) + ("\n" if rel else ""), encoding="utf-8")
    print(f"{'DRY RUN: ' if a.dry_run else ''}{len(rel)} file(s) changed, {sum(1 for n in notes if n.startswith('skipped'))} edit(s) already applied.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
