#!/usr/bin/env python3
"""Sync pack manifest versions, UUID references, and engine versions for MCPEDL projects, or verify them."""
import argparse, copy, json, os, sys, uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_manifest_versions as cmv

ROOT = cmv.ROOT
LINK_FILES = ("world_behavior_packs.json", "world_resource_packs.json")


def import_bump():
    import auto_bump_and_build as ab
    return ab


def resolve_projects(args):
    ab = import_bump()
    project_dirs = ab.find_target_project_dirs()
    if args.all:
        return sorted(project_dirs)
    if args.project:
        matched = [p for p in project_dirs if args.project in (p, os.path.basename(p)) or args.project in p]
        if not matched:
            print(f"ERROR: no project matching '{args.project}' found.", file=sys.stderr)
            sys.exit(2)
        return sorted(matched)
    changed = ab.get_git_diff_files(args.base)
    return ab.detect_changed_projects(changed, project_dirs)


def read_json(path):
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, (dict, list)) else None


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")


def strip_suffix(name):
    import re
    return re.sub(r"(?:\s*\(v\d+\.\d+\.\d+\))+\s*$", "", name).rstrip()


def content_format_max(bp_manifest_path):
    best = None
    for folder in ("items", "blocks"):
        base = bp_manifest_path.parent / folder
        if not base.is_dir():
            continue
        for file in base.rglob("*.json"):
            data = read_json(file)
            if isinstance(data, dict) and data.get("format_version") is not None:
                parsed = cmv.to_tuple(data["format_version"])
                if parsed and len(parsed) == 3 and (best is None or parsed > best):
                    best = parsed
    return best


def global_header_uuids():
    found = set()
    for path in cmv.PROJECT_ROOT.rglob("manifest.json"):
        if cmv.is_installed_copy(path):
            continue
        data = read_json(path)
        if isinstance(data, dict) and isinstance(data.get("header"), dict):
            value = data["header"].get("uuid")
            if cmv.valid_uuid(value):
                found.add(value)
    return found


def sync_project(project, raise_engine, known_uuids, changes, notices):
    project = Path(project)
    manifests = {}
    for path in sorted(project.rglob("manifest.json")):
        if "node_modules" in path.parts:
            continue
        data = read_json(path)
        if isinstance(data, dict) and isinstance(data.get("header"), dict):
            manifests[path] = data
    sources = {p: d for p, d in manifests.items() if not cmv.is_installed_copy(p)}
    copies = {p: d for p, d in manifests.items() if cmv.is_installed_copy(p)}
    if not sources:
        return
    original = {p: copy.deepcopy(d) for p, d in manifests.items()}

    versions = [tuple(d["header"]["version"]) for d in sources.values() if cmv.is_triple(d["header"].get("version"))]
    canonical = list(max(versions)) if versions else None
    version_text = ".".join(map(str, canonical)) if canonical else None

    for path, data in sources.items():
        header = data["header"]
        if canonical:
            header["version"] = list(canonical)
            if isinstance(header.get("name"), str) and header["name"].strip():
                header["name"] = f"{strip_suffix(header['name'])} (v{version_text})"
            for module in data.get("modules", []) if isinstance(data.get("modules"), list) else []:
                if isinstance(module, dict):
                    module["version"] = list(canonical)
        used = {header.get("uuid")}
        for module in data.get("modules", []) if isinstance(data.get("modules"), list) else []:
            if not isinstance(module, dict):
                continue
            if not cmv.valid_uuid(module.get("uuid")) or module["uuid"] in used:
                module["uuid"] = str(uuid.uuid4())
                notices.append(f"{cmv.rel(path)}: replaced an invalid or duplicate module UUID with a fresh one (module UUIDs are not used by world links).")
            used.add(module["uuid"])

    engines = []
    for path, data in sources.items():
        mev = data["header"].get("min_engine_version")
        if cmv.is_triple(mev) and mev != [0, 0, 0]:
            engines.append(tuple(mev))
    if raise_engine:
        for path in sources:
            if cmv.pack_kind(path) == "behavior_pack":
                needed = content_format_max(path)
                if needed:
                    engines.append(needed)
    if engines:
        target = list(max(engines))
        before = [tuple(d["header"]["min_engine_version"]) for d in sources.values() if cmv.is_triple(d["header"].get("min_engine_version"))]
        for path, data in sources.items():
            if data["header"].get("min_engine_version") != target:
                if raise_engine or cmv.is_triple(data["header"].get("min_engine_version")) or "min_engine_version" not in data["header"]:
                    data["header"]["min_engine_version"] = list(target)
        if before and max(before) < tuple(target):
            notices.append(f"{cmv.rel(project)}: min_engine_version raised to {'.'.join(map(str, target))} because item or block files need it. Players on older versions can no longer load this pack; add that to the CHANGELOG.")

    headers = {d["header"]["uuid"]: d["header"] for d in sources.values() if cmv.valid_uuid(d["header"].get("uuid"))}
    bp = [p for p in sources if cmv.pack_kind(p) == "behavior_pack"]
    rp = [p for p in sources if cmv.pack_kind(p) == "resource_pack"]
    for path, data in sources.items():
        deps = data.get("dependencies")
        if not isinstance(deps, list):
            continue
        for dep in deps:
            if isinstance(dep, dict) and "uuid" in dep and dep["uuid"] in headers:
                dep["version"] = list(headers[dep["uuid"]]["version"]) if cmv.is_triple(headers[dep["uuid"]].get("version")) else dep.get("version")
    if len(bp) == 1 and len(rp) == 1:
        bp_data, rp_data = sources[bp[0]], sources[rp[0]]
        rp_uuid = rp_data["header"].get("uuid")
        deps = bp_data.get("dependencies") if isinstance(bp_data.get("dependencies"), list) else []
        uuid_deps = [d for d in deps if isinstance(d, dict) and "uuid" in d]
        unresolved = [d for d in uuid_deps if d["uuid"] not in headers and d["uuid"] not in known_uuids]
        if cmv.valid_uuid(rp_uuid) and not any(d["uuid"] == rp_uuid for d in uuid_deps) and len(unresolved) == 1:
            notices.append(f"{cmv.rel(bp[0])}: dependency UUID {unresolved[0]['uuid']} matched no pack; repointed to the Resource Pack header UUID {rp_uuid}.")
            unresolved[0]["uuid"] = rp_uuid
            unresolved[0]["version"] = list(rp_data["header"]["version"]) if cmv.is_triple(rp_data["header"].get("version")) else unresolved[0].get("version")

    for path, data in copies.items():
        value = data["header"].get("uuid")
        for source_path, source in sources.items():
            if cmv.valid_uuid(value) and source["header"].get("uuid") == value:
                manifests[path] = copy.deepcopy(source)
                break

    for path, data in {**sources, **{p: manifests[p] for p in copies}}.items():
        if data != original[path]:
            changes.append(f"updated {cmv.rel(path)}")
            write_json(path, data)

    final_headers = {}
    for path, data in sources.items():
        value = data["header"].get("uuid")
        if cmv.valid_uuid(value) and cmv.is_triple(data["header"].get("version")):
            final_headers[value] = data["header"]["version"]
    for name in LINK_FILES:
        for link in sorted(project.rglob(name)):
            packs = read_json(link)
            if not isinstance(packs, list):
                continue
            before = copy.deepcopy(packs)
            for entry in packs:
                if isinstance(entry, dict) and entry.get("pack_id") in final_headers:
                    entry["version"] = list(final_headers[entry["pack_id"]])
            if packs != before:
                changes.append(f"updated {cmv.rel(link)}")
                write_json(link, packs)


def verify(projects):
    paths = sorted(p for p in cmv.PROJECT_ROOT.rglob("manifest.json") if "node_modules" not in p.parts)
    report, count = cmv.check_all(paths)
    scoped = [cmv.rel(Path(p)) for p in projects]
    def in_scope(message):
        return any(s in message for s in scoped)
    blocking = [e for e in report.errors if in_scope(e)]
    outside = [e for e in report.errors if not in_scope(e)]
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    for error in outside:
        print(f"OUTSIDE SCOPE (not blocking): {error}")
    if blocking:
        print(f"Manifest version check FAILED: {len(blocking)} error(s) in the processed projects.")
        for error in blocking:
            print(f"ERROR: {error}")
        return 1
    print(f"Manifest version check passed for the processed projects ({count} manifest(s) scanned).")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git ref to diff against, to pick changed projects (same rule as auto_bump_and_build.py).")
    parser.add_argument("--project", help="One project folder or name.")
    parser.add_argument("--all", action="store_true", help="Every project under MCPEDL/.")
    parser.add_argument("--raise-engine", action="store_true", help="Raise min_engine_version to cover item and block format versions.")
    parser.add_argument("--check", action="store_true", help="Report what would change and exit 1 if anything would; write nothing.")
    parser.add_argument("--verify-only", action="store_true", help="Only run the version checker on the selected projects; write nothing.")
    args = parser.parse_args()

    projects = resolve_projects(args)
    if not projects:
        print("[Sync] No projects selected; nothing to do.")
        return 0
    print(f"[Sync] {len(projects)} project(s) selected.")

    if args.verify_only:
        return verify(projects)

    changes, notices = [], []
    known = global_header_uuids()
    if args.check:
        scratch = {}
        for project in projects:
            for path in Path(project).rglob("manifest.json"):
                scratch[path] = path.read_bytes()
            for name in LINK_FILES:
                for link in Path(project).rglob(name):
                    scratch[link] = link.read_bytes()
        for project in projects:
            sync_project(project, args.raise_engine, known, changes, notices)
        for path, content in scratch.items():
            path.write_bytes(content)
    else:
        for project in projects:
            sync_project(project, args.raise_engine, known, changes, notices)

    for line in changes:
        print(f"[Sync] {'would have ' if args.check else ''}{line}")
    for line in notices:
        print(f"NOTICE: {line}")
    if not changes:
        print("[Sync] Versions, UUID references, and engine versions already in sync.")
    return 1 if (args.check and changes) else 0


if __name__ == "__main__":
    raise SystemExit(main())
