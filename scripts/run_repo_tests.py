#!/usr/bin/env python3
"""Whole-repo test runner for ALNStudios/MCPE-Curseforges.

One command runs everything that can be tested without Minecraft:

  tools    every scripts/test_*.py, scripts/selftest_project_types.py, scripts/check_instruction_files.py
           (found by name, not from a fixed list), each in its own process with a hard time limit,
           plus a syntax check of every scripts/**/*.py and an audit against .github/workflows/ci.yml.
  checks   the read-only repo checks: check_manifest_versions.py, validate_manifest_titles.py,
           manifest_tools.py --all --check.
  content  a lint of every MCPEDL/<Type>/<Name>/behavior_pack and resource_pack, built from the failures
           seen in real ContentLog files: invalid recipes, vanilla item overrides, geometry comments,
           tick.json entries without a function, unguarded events that do not exist, loops that can trip
           the Watchdog, particle variables no script sets, repo-rule violations (comments, manifest metadata).
  logs     (only with --logs) groups the errors of Minecraft ContentLog files (a folder or a .zip) and fails on
           every error class. --baseline hides known problems so only NEW ones fail.

Usage: python3 scripts/run_repo_tests.py [--only tools,checks,content,logs] [--logs PATH] [--project PATH]
         [--jobs N] [--timeout SECONDS] [--strict] [--fake-foundation] [--events-file FILE]
         [--ignore REGEX] [--baseline FILE] [--write-baseline FILE] [--json FILE] [--verbose]
Exit: 0 all good, 1 at least one FAIL (or a WARN with --strict), 2 bad arguments.
Read-only: it never writes inside the repo (--json and --write-baseline write only where you point them).
"""
import argparse
import concurrent.futures
import gzip
import json
import os
import re
import subprocess
import sys
import time
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGES = ("tools", "checks", "content", "logs")
READ_ONLY_CHECKS = (
    ("check_manifest_versions.py", []),
    ("validate_manifest_titles.py", []),
    ("manifest_tools.py", ["--all", "--check"]),
)
PROJECT_TYPES = ("Addons", "Maps", "Script", "Minigame")
VERIFIED_EVENTS = {
    ("world", "afterEvents"): {"itemUse", "itemStartUse", "itemReleaseUse", "playerPlaceBlock", "playerBreakBlock"},
    ("system", "afterEvents"): {"scriptEventReceive"},
}
MISSING_EVENTS = {"itemThrow"}
BUILTIN_PARTICLE_VARS = {
    "particle_age", "particle_lifetime", "particle_random_1", "particle_random_2", "particle_random_3",
    "particle_random_4", "emitter_age", "emitter_lifetime", "emitter_random_1", "emitter_random_2",
    "emitter_random_3", "emitter_random_4", "entity_scale",
}
ITEM_NAME = re.compile(r"^[a-z0-9_.\-]+:[a-z0-9_./\-]+$")
MOLANG_VAR = re.compile(r"variable\.([A-Za-z_]\w*)")
EVENT_CALL = re.compile(r"\b(world|system)(\?)?\.(afterEvents|beforeEvents)(\?)?\.(\w+)(\?)?\.subscribe\s*\(")
LOG_LINE = re.compile(r"^(\d\d:\d\d:\d\d)\[([^\]]+)\]\[([^\]]+)\]-(.*)$")


class Findings:
    def __init__(self):
        self.items = []

    def add(self, level, rule, where, msg):
        self.items.append({"level": level, "rule": rule, "where": where, "msg": msg})

    def extend(self, other):
        self.items.extend(other.items if isinstance(other, Findings) else other)

    def count(self, level):
        return sum(1 for i in self.items if i["level"] == level)

    def rules(self, level):
        return sorted({i["rule"] for i in self.items if i["level"] == level})


def rel(path, root):
    try:
        return Path(path).resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return Path(path).as_posix()


def strip_jsonc(text):
    out, i, n, in_str = [], 0, len(text), False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == '"':
                in_str = False
            i += 1
        elif c == '"':
            in_str = True
            out.append(c)
            i += 1
        elif text.startswith("//", i):
            while i < n and text[i] != "\n":
                i += 1
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
        else:
            out.append(c)
            i += 1
    return "".join(out)


def load_json(path):
    try:
        text = Path(path).read_text(encoding="utf-8-sig")
    except OSError as err:
        return None, f"unreadable: {err}"
    try:
        return json.loads(text), None
    except ValueError as err:
        first = str(err)
    try:
        return json.loads(strip_jsonc(text)), "comment"
    except ValueError:
        return None, first


def js_comment_lines(text):
    found, i, n, line = [], 0, len(text), 1
    while i < n:
        c = text[i]
        if c == "\n":
            line += 1
            i += 1
        elif c in "'\"`":
            quote = c
            i += 1
            while i < n and text[i] != quote:
                if text[i] == "\\":
                    i += 1
                if i < n and text[i] == "\n":
                    line += 1
                    if quote != "`":
                        break
                i += 1
            i += 1
        elif text.startswith("//", i):
            found.append(line)
            while i < n and text[i] != "\n":
                i += 1
        elif text.startswith("/*", i):
            found.append(line)
            end = text.find("*/", i + 2)
            segment = text[i:n if end == -1 else end]
            line += segment.count("\n")
            i = n if end == -1 else end + 2
        else:
            i += 1
    return found


def run_script(root, name, args, timeout):
    started = time.time()
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    try:
        r = subprocess.run([sys.executable, str(root / "scripts" / name), *args], cwd=root,
                           capture_output=True, text=True, timeout=timeout, env=env)
        return name, r.returncode, (r.stdout or "") + (r.stderr or ""), time.time() - started
    except subprocess.TimeoutExpired as err:
        partial = err.stdout if isinstance(err.stdout, str) else (err.stdout or b"").decode("utf-8", "replace")
        return name, None, partial, time.time() - started


def tail(text, lines=8):
    rows = [r for r in text.replace("\r", "").split("\n") if r.strip()]
    return " | ".join(rows[-lines:])[:900]


def discover_tools(root):
    scripts = root / "scripts"
    names = sorted(p.name for p in scripts.glob("test_*.py"))
    for extra in ("selftest_project_types.py", "check_instruction_files.py"):
        if (scripts / extra).is_file():
            names.append(extra)
    return names


def stage_tools(root, jobs, timeout, fake_foundation):
    f = Findings()
    scripts = root / "scripts"
    if not scripts.is_dir():
        f.add("FAIL", "T-NOSCRIPTS", "scripts/", "scripts folder not found")
        return f
    for path in sorted(scripts.rglob("*.py")):
        if "__pycache__" in path.parts:
            continue
        try:
            compile(path.read_text(encoding="utf-8"), str(path), "exec")
        except (SyntaxError, ValueError, OSError) as err:
            f.add("FAIL", "T-SYNTAX", rel(path, root), f"does not compile: {err}")
    names = discover_tools(root)
    extra = {"selftest_project_types.py": ["--fake-foundation"] if fake_foundation else []}
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, jobs)) as pool:
        futures = [pool.submit(run_script, root, n, extra.get(n, []), timeout) for n in names]
        for fut in futures:
            name, code, out, secs = fut.result()
            where = f"scripts/{name}"
            if code is None:
                f.add("FAIL", "T-HANG", where, f"no result after {timeout}s (hang). Last output: {tail(out)}")
            elif code != 0:
                f.add("FAIL", "T-RUN", where, f"exit {code} in {secs:.1f}s. {tail(out)}")
            else:
                f.add("PASS", "T-RUN", where, f"ok in {secs:.1f}s")
    tests = [n for n in names if n.startswith("test_")]
    ci = root / ".github" / "workflows" / "ci.yml"
    if ci.is_file():
        listed = set(re.findall(r"scripts/((?:test_|selftest_|check_)[\w]+\.py)", ci.read_text(encoding="utf-8")))
        for n in sorted(listed):
            if not (scripts / n).is_file():
                f.add("FAIL", "T-CI-STALE", ".github/workflows/ci.yml", f"runs scripts/{n}, which does not exist")
        ci_text = ci.read_text(encoding="utf-8")
        globbed = re.search(r"scripts/test_\*\.py", ci_text) is not None
        for n in [] if globbed else tests:
            if n not in listed:
                f.add("WARN", "T-CI-MISSING", f"scripts/{n}", "test exists but ci.yml never runs it")
    else:
        f.add("INFO", "T-CI-NONE", ".github/workflows/ci.yml", "not found, CI audit skipped")
    tested = {n[5:] for n in tests}
    untested = sorted(p.name for p in scripts.glob("*.py")
                      if not p.name.startswith(("test_", "selftest_", "check_")) and p.name not in tested
                      and p.name != Path(__file__).name)
    if untested:
        f.add("INFO", "T-NOTEST", "scripts/", "no test_<name>.py for: " + ", ".join(untested))
    return f


def stage_checks(root, timeout):
    f = Findings()
    for name, args in READ_ONLY_CHECKS:
        if not (root / "scripts" / name).is_file():
            f.add("INFO", "C-MISSING", f"scripts/{name}", "not found, skipped")
            continue
        _, code, out, secs = run_script(root, name, args, timeout)
        where = f"scripts/{name} {' '.join(args)}".strip()
        if code is None:
            f.add("FAIL", "C-HANG", where, f"no result after {timeout}s. {tail(out)}")
        elif code != 0:
            f.add("FAIL", "C-RUN", where, f"exit {code}. {tail(out)}")
        else:
            f.add("PASS", "C-RUN", where, f"ok in {secs:.1f}s")
    return f


def load_vanilla_ids(root):
    path = root / "reference" / "bedrock-samples" / "bedrock-samples.min.json.gz"
    if not path.is_file():
        return None
    try:
        with gzip.open(path, "rt", encoding="utf-8") as fh:
            return set(re.findall(r"minecraft:[a-z0-9_]+", fh.read()))
    except (OSError, ValueError):
        return None


def project_dirs(root, only):
    if only:
        return [Path(p) if Path(p).is_absolute() else root / p for p in only]
    base = root / "MCPEDL"
    return sorted(d for t in PROJECT_TYPES for d in (base / t).glob("*") if d.is_dir())


def ingredient_list(node):
    if isinstance(node, dict):
        if "item" in node or "tag" in node:
            return [node]
        return [v for v in node.values() if isinstance(v, (dict, str))]
    if isinstance(node, list):
        out = []
        for v in node:
            out.extend(ingredient_list(v) if isinstance(v, (dict, list)) else [v])
        return out
    return []


def check_ingredient(ing, where, vanilla, custom, f, role):
    if isinstance(ing, str):
        ing = {"item": ing}
    if not isinstance(ing, dict):
        f.add("FAIL", "R-ING", where, f"{role} is not an object")
        return
    if "tag" in ing and "item" not in ing:
        return
    name = ing.get("item")
    if not isinstance(name, str) or not name:
        f.add("FAIL", "R-ING", where, f"{role} has no valid item name or item tag")
    elif not ITEM_NAME.match(name):
        f.add("FAIL", "R-ING", where, f"{role} item name is malformed: {name}")
    elif name.startswith("minecraft:"):
        if vanilla is not None and name not in vanilla:
            f.add("WARN", "R-VANILLA", where, f"{role} {name} not found in the vanilla reference")
    elif name not in custom:
        f.add("WARN", "R-CUSTOM", where, f"{role} {name} is not defined by this project")


def lint_recipe(path, root, data, vanilla, custom, f):
    where = rel(path, root)
    for kind in ("minecraft:recipe_shaped", "minecraft:recipe_shapeless"):
        body = data.get(kind) if isinstance(data, dict) else None
        if not isinstance(body, dict):
            continue
        if kind.endswith("shaped"):
            key = body.get("key") if isinstance(body.get("key"), dict) else {}
            pattern = body.get("pattern") if isinstance(body.get("pattern"), list) else []
            used = {c for row in pattern if isinstance(row, str) for c in row if c != " "}
            for c in sorted(used - set(key)):
                f.add("FAIL", "R-KEY", where, f"pattern uses '{c}' but key has no entry for it")
            for c in sorted(set(key) - used):
                f.add("WARN", "R-KEY", where, f"key '{c}' is never used in the pattern")
            for c, ing in key.items():
                for one in ingredient_list(ing) or [ing]:
                    check_ingredient(one, where, vanilla, custom, f, f"key '{c}'")
        else:
            ings = ingredient_list(body.get("ingredients"))
            if not ings:
                f.add("FAIL", "R-ING", where, "shapeless recipe has no ingredients")
            for one in ings:
                check_ingredient(one, where, vanilla, custom, f, "ingredient")
        for one in ingredient_list(body.get("result")):
            check_ingredient(one, where, vanilla, custom, f, "result")
        unlock = body.get("unlock")
        for one in ingredient_list(unlock) if unlock is not None else []:
            if isinstance(one, dict) and "item" in one:
                check_ingredient(one, where, vanilla, custom, f, "unlock")


def lint_js(path, root, text, events, f, project_js):
    where = rel(path, root)
    for bad in ("mojang-minecraft", "world.events"):
        if bad in text:
            f.add("FAIL", "S-LEGACY", where, f"uses {bad}, which is outdated")
    lines = js_comment_lines(text)
    if lines:
        f.add("FAIL", "S-COMMENT", where, f"comments in a shipped .js (repo rule): lines {lines[:8]}")
    unverified = defaultdict(set)
    for m in EVENT_CALL.finditer(text):
        owner, _, group, _, name, guarded = m.groups()
        line = text.count("\n", 0, m.start()) + 1
        is_guarded = bool(guarded) or re.search(
            r"if\s*\(\s*(?:typeof\s+)?%s\.%s\.%s\b" % (owner, group, name), text) is not None
        if name in MISSING_EVENTS and not is_guarded:
            f.add("FAIL", "S-EVENT", f"{where}:{line}",
                  f"{owner}.{group}.{name}.subscribe is unguarded; the game logs show this event is not available "
                  f"(TypeError: cannot read property 'subscribe' of undefined). Use ?. or an if guard")
        elif name not in VERIFIED_EVENTS.get((owner, group), set()) | events and not is_guarded:
            unverified[f"{owner}.{group}"].add(name)
    for group, names in unverified.items():
        f.add("INFO", "S-EVENT-UNVERIFIED", where, f"{group} events not in the verified list: {', '.join(sorted(names))}")
    for m in re.finditer(r"\bwhile\s*\(\s*(?:true|1)\s*\)|\bfor\s*\(\s*;\s*;\s*\)", text):
        line = text.count("\n", 0, m.start()) + 1
        f.add("WARN", "S-LOOP", f"{where}:{line}", "unbounded loop: can freeze the server and trigger the Watchdog")
    for m in re.finditer(r"\bfor\s*\([^;)]*;[^;)]*<=?\s*(\d[\d_]*)\s*;", text):
        if int(m.group(1).replace("_", "")) >= 100000:
            line = text.count("\n", 0, m.start()) + 1
            f.add("WARN", "S-LOOP", f"{where}:{line}", f"loop with {m.group(1)} iterations in one tick: Watchdog risk")
    project_js.append(text)


def lint_manifest(path, root, f):
    where = rel(path, root)
    data, err = load_json(path)
    if not isinstance(data, dict):
        return
    meta = data.get("metadata") if isinstance(data.get("metadata"), dict) else {}
    if meta.get("authors") != ["ALNStudios"]:
        f.add("FAIL", "M-META", where, 'metadata.authors must be ["ALNStudios"]')
    if meta.get("product_type") != "addon":
        f.add("FAIL", "M-META", where, 'metadata.product_type must be "addon"')
    for mod in data.get("modules", []) if isinstance(data.get("modules"), list) else []:
        if isinstance(mod, dict) and mod.get("type") == "script":
            entry = mod.get("entry")
            if not isinstance(entry, str) or not (path.parent / entry).is_file():
                f.add("FAIL", "M-ENTRY", where, f"script module entry not found: {entry}")


def lint_pack(root, pack, kind, vanilla, events, f, project_js, custom):
    for path in sorted(pack.rglob("*.json")):
        data, err = load_json(path)
        where = rel(path, root)
        if err == "comment":
            f.add("FAIL", "J-COMMENT", where, "comments in a shipped .json (repo rule)")
        elif err:
            f.add("FAIL", "J-PARSE", where, err[:160])
            continue
        parts = path.relative_to(pack).parts
        if kind == "behavior_pack" and parts[0] == "recipes":
            lint_recipe(path, root, data, vanilla, custom, f)
        if kind == "behavior_pack" and parts[0] == "items" and isinstance(data, dict):
            ident = ((data.get("minecraft:item") or {}).get("description") or {}).get("identifier")
            if isinstance(ident, str) and ident.startswith("minecraft:"):
                f.add("FAIL", "I-OVERRIDE", where, f"redefines vanilla item {ident}; the game rejects it "
                      "(no 1.16.100+ vanilla format version)")
        if kind == "resource_pack" and path.name.endswith(".geo.json") and isinstance(data, dict):
            for geo in data.get("minecraft:geometry", []) if isinstance(data.get("minecraft:geometry"), list) else []:
                for bone in (geo.get("bones") or []) if isinstance(geo, dict) else []:
                    for cube in (bone.get("cubes") or []) if isinstance(bone, dict) else []:
                        if isinstance(cube, dict) and "comment" in cube:
                            f.add("FAIL", "G-COMMENT", where, f"bone {bone.get('name')} has a cube with a 'comment' key")
        if kind == "behavior_pack" and path.name == "tick.json" and parts[0] == "functions" and isinstance(data, dict):
            for name in data.get("values", []) if isinstance(data.get("values"), list) else []:
                if not (pack / "functions" / f"{name}.mcfunction").is_file():
                    f.add("FAIL", "F-TICK", where, f"tick.json lists '{name}' but functions/{name}.mcfunction does not exist")
    if (pack / "manifest.json").is_file():
        lint_manifest(pack / "manifest.json", root, f)
    if kind == "behavior_pack":
        for path in sorted((pack / "functions").rglob("*.mcfunction")) if (pack / "functions").is_dir() else []:
            rows = [n for n, ln in enumerate(path.read_text(encoding="utf-8", errors="replace").split("\n"), 1)
                    if ln.lstrip().startswith("#")]
            if rows:
                f.add("FAIL", "F-COMMENT", rel(path, root), f"comments in a shipped .mcfunction (repo rule): lines {rows[:8]}")
        for path in sorted((pack / "scripts").rglob("*.js")) if (pack / "scripts").is_dir() else []:
            lint_js(path, root, path.read_text(encoding="utf-8", errors="replace"), events, f, project_js)


def lint_particles(root, project, project_js, f):
    pdir = project / "resource_pack" / "particles"
    if not pdir.is_dir():
        return
    code = "\n".join(project_js)
    for path in sorted(pdir.rglob("*.json")):
        text = path.read_text(encoding="utf-8", errors="replace")
        for name in sorted(set(MOLANG_VAR.findall(text)) - BUILTIN_PARTICLE_VARS):
            if re.search(r"variable\.%s\s*=" % re.escape(name), text):
                continue
            if f"variable.{name}" in code:
                continue
            f.add("WARN", "P-VAR", rel(path, root),
                  f"variable.{name} is read but never set here or named in any script (heuristic; the logs show "
                  "'unable to find member variable' errors for particle variables)")


def stage_content(root, only, events):
    f = Findings()
    vanilla = load_vanilla_ids(root)
    if vanilla is None:
        f.add("INFO", "R-NOREF", "reference/bedrock-samples", "vanilla reference not found: vanilla ids are not checked")
    projects = project_dirs(root, only)
    if not projects:
        f.add("INFO", "X-NOPROJECTS", "MCPEDL/", "no projects found")
    for project in projects:
        custom = set()
        bp = project / "behavior_pack"
        for sub in ("items", "blocks"):
            for path in sorted((bp / sub).rglob("*.json")) if (bp / sub).is_dir() else []:
                custom.update(re.findall(r'"identifier"\s*:\s*"([^"]+)"', path.read_text(encoding="utf-8", errors="replace")))
        project_js = []
        for kind in ("behavior_pack", "resource_pack"):
            pack = project / kind
            if pack.is_dir():
                lint_pack(root, pack, kind, vanilla, events, f, project_js, custom)
        lint_particles(root, project, project_js, f)
    f.add("PASS", "X-SCANNED", "MCPEDL/", f"{len(projects)} projects scanned")
    return f


def read_logs(path):
    p = Path(path)
    if p.is_file() and p.suffix.lower() == ".zip":
        with zipfile.ZipFile(p) as zf:
            for name in sorted(zf.namelist()):
                if re.search(r"ContentLog.*\.txt$", name):
                    yield Path(name).name, zf.read(name).decode("utf-8", "replace")
    elif p.is_dir():
        for q in sorted(p.rglob("ContentLog*.txt")):
            yield q.name, q.read_text(encoding="utf-8", errors="replace")
    elif p.is_file():
        yield p.name, p.read_text(encoding="utf-8", errors="replace")


def norm(msg):
    return re.sub(r"-?\d+(\.\d+)?", "N", msg)[:200]


def classify(cat, lvl, msg):
    if "[Watchdog]" in msg and lvl == "error":
        return "FAIL", "L-HANG", norm(msg)
    if cat == "Scripting" and lvl == "error":
        return "FAIL", "L-SCRIPT", norm(msg)
    if cat == "Recipes" and lvl == "error":
        m = re.search(r"recipes/[\w/.\-]+", msg)
        return "FAIL", "L-RECIPE", m.group(0) if m else norm(msg)
    if cat == "Item" and lvl == "error":
        m = re.search(r"Item '([^']+)'", msg)
        return "FAIL", "L-ITEM", m.group(1) if m else norm(msg)
    if cat == "Geometry" and lvl == "error":
        return "FAIL", "L-GEO", norm(msg)
    if cat == "Commands" and lvl in ("warning", "error"):
        return "FAIL", "L-FUNC", norm(msg)
    if cat == "Json" and lvl == "error":
        return "FAIL", "L-JSON", norm(re.sub(r"/storage/\S+", "<path>", msg))
    if cat == "Molang" and lvl == "error":
        m = re.search(r"variable '([^']+)'", msg) or re.search(r"member variable (\S+)", msg)
        return "FAIL", "L-MOLANG", m.group(1) if m else norm(msg)
    if cat == "Animation" and lvl == "error":
        return "FAIL", "L-ANIM", norm(msg)
    if cat == "UI" and lvl in ("error", "warning"):
        m = re.search(r"UI Control: (\w+)", msg)
        return ("FAIL" if lvl == "error" else "WARN"), "L-UI", m.group(1) if m else norm(msg)
    if cat == "Scripting" and lvl == "warning" and ("[WARN]" in msg or "Skipped invalid" in msg or "not available" in msg):
        return "WARN", "L-WARN", norm(msg)
    return None


def stage_logs(path, baseline, write_baseline, ignore=()):
    f = Findings()
    skip = [re.compile(x) for x in ignore]
    groups = {}
    sessions = total_lines = 0
    for session, text in read_logs(path):
        sessions += 1
        for line in text.replace("\r", "").split("\n"):
            m = LOG_LINE.match(line)
            if not m:
                continue
            total_lines += 1
            _, cat, lvl, msg = m.groups()
            hit = classify(cat, lvl, msg)
            if not hit or any(r.search(msg) for r in skip):
                continue
            level, rule, key = hit
            g = groups.setdefault((level, rule, key), {"count": 0, "sessions": set(), "example": msg[:240]})
            g["count"] += 1
            g["sessions"].add(session)
    if not sessions:
        f.add("FAIL", "L-NOLOGS", str(path), "no ContentLog files found")
        return f
    known = set()
    if baseline and Path(baseline).is_file():
        known = set(json.loads(Path(baseline).read_text(encoding="utf-8")))
    for (level, rule, key), g in sorted(groups.items(), key=lambda kv: (-kv[1]["count"], kv[0])):
        tag = f"{rule}|{key}"
        where = f"{g['count']}x in {len(g['sessions'])} session(s)"
        if tag in known:
            f.add("INFO", rule, where, f"known: {key}")
        else:
            f.add(level, rule, where, f"{key} | e.g. {g['example']}")
    if write_baseline:
        Path(write_baseline).write_text(
            json.dumps(sorted(f"{r}|{k}" for (_, r, k) in groups), indent=2) + "\n", encoding="utf-8")
    f.add("PASS", "L-READ", str(path), f"{sessions} logs, {total_lines} lines, {len(groups)} distinct problem types")
    return f


def print_report(f, verbose, cap_rows=12):
    order = {"FAIL": 0, "WARN": 1, "INFO": 2, "PASS": 3}
    by_rule = defaultdict(list)
    for i in f.items:
        by_rule[(i["level"], i["rule"])].append(i)
    cap = 10**9 if verbose else cap_rows
    for (level, rule), rows in sorted(by_rule.items(), key=lambda kv: (order[kv[0][0]], kv[0][1])):
        if level == "PASS" and not verbose and len(rows) > 1:
            print(f"PASS  {rule}: {len(rows)} ok")
            continue
        for i in rows[:cap]:
            print(f"{level:<5} {rule}  {i['where']}: {i['msg']}")
        if len(rows) > cap:
            print(f"{level:<5} {rule}  ... {len(rows) - cap} more (use --verbose)")
    print()
    print(f"SUMMARY  FAIL={f.count('FAIL')}  WARN={f.count('WARN')}  INFO={f.count('INFO')}  PASS={f.count('PASS')}")
    if f.count("FAIL"):
        print("FAIL rules: " + ", ".join(f.rules("FAIL")))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=str(ROOT))
    ap.add_argument("--only", default="tools,checks,content", help="comma list of: " + ", ".join(STAGES))
    ap.add_argument("--logs", help="ContentLog folder or .zip (adds the logs stage)")
    ap.add_argument("--project", action="append", help="limit the content lint to this project folder (repeatable)")
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--fake-foundation", action="store_true", help="pass --fake-foundation to selftest_project_types.py")
    ap.add_argument("--events-file", help="file with extra verified event names, one per line")
    ap.add_argument("--ignore", action="append", help="regex; log lines matching it are skipped (repeatable), e.g. third-party packs")
    ap.add_argument("--baseline")
    ap.add_argument("--write-baseline")
    ap.add_argument("--json")
    ap.add_argument("--verbose", action="store_true")
    try:
        a = ap.parse_args(argv)
    except SystemExit:
        return 2
    root = Path(a.root).resolve()
    stages = [s.strip() for s in a.only.split(",") if s.strip()]
    if a.logs and "logs" not in stages:
        stages.append("logs")
    if any(s not in STAGES for s in stages) or ("logs" in stages and not a.logs):
        print("bad --only value or --logs missing", file=sys.stderr)
        return 2
    events = set()
    if a.events_file:
        events = {ln.strip() for ln in Path(a.events_file).read_text(encoding="utf-8").split("\n") if ln.strip()}
    total = Findings()
    for stage in STAGES:
        if stage not in stages:
            continue
        print(f"== {stage} ==")
        if stage == "tools":
            f = stage_tools(root, a.jobs, a.timeout, a.fake_foundation)
        elif stage == "checks":
            f = stage_checks(root, a.timeout)
        elif stage == "content":
            f = stage_content(root, a.project, events)
        else:
            f = stage_logs(a.logs, a.baseline, a.write_baseline, a.ignore or ())
        print_report(f, a.verbose, 6 if stage == "logs" else 12)
        print()
        for i in f.items:
            i["stage"] = stage
        total.extend(f)
    if a.json:
        Path(a.json).write_text(json.dumps(total.items, indent=2) + "\n", encoding="utf-8")
    bad = total.count("FAIL") + (total.count("WARN") if a.strict else 0)
    print(f"RESULT  {'FAILED' if bad else 'OK'}  (FAIL={total.count('FAIL')} WARN={total.count('WARN')})")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
