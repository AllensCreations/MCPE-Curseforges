#!/usr/bin/env python3
"""Check every pack manifest under MCPEDL/ for version problems that break imports or builds."""
import argparse, json, re, sys, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT / "MCPEDL"
MODULE_VERSION_RE = re.compile(r"^\d+\.\d+\.\d+(-(beta|rc|alpha|internal)[\w.\-]*)?$")
STABLE_MODULE_RE = re.compile(r"^\d+\.\d+\.\d+$")
IMPORT_RE = re.compile(r"""(?:from\s+|import\s*\(?\s*)["'](@minecraft/[\w\-]+)["']""")
KNOWN_MODULES = {"@minecraft/server", "@minecraft/server-ui", "@minecraft/vanilla-data"}
PACK_KINDS = ("behavior_pack", "resource_pack")


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def error(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


def rel(path):
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def is_triple(value):
    return (isinstance(value, list) and len(value) == 3
            and all(type(p) is int and p >= 0 for p in value))


def to_tuple(text):
    parts = str(text).split(".")
    try:
        return tuple(int(p) for p in parts)
    except ValueError:
        return None


def valid_uuid(value):
    if not isinstance(value, str):
        return False
    try:
        return str(uuid.UUID(value)) == value.lower()
    except ValueError:
        return False


def pack_kind(path):
    for part in reversed(path.parts[:-1]):
        if part in PACK_KINDS:
            return part
    return None


def project_of(path):
    parts = path.parts
    for i, part in enumerate(parts[:-1]):
        if part in PACK_KINDS:
            return Path(*parts[:i])
    return path.parent


def load(path, report):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        report.error(rel(path), f"invalid JSON ({exc}).")
        return None
    if not isinstance(data, dict):
        report.error(rel(path), "top level must be a JSON object.")
        return None
    return data


def check_manifest(path, data, report):
    where = rel(path)
    if data.get("format_version") != 2:
        report.error(where, f"format_version must be 2, found {data.get('format_version')!r}.")

    header = data.get("header")
    if not isinstance(header, dict):
        report.error(where, "missing header object.")
        return None
    if not valid_uuid(header.get("uuid")):
        report.error(where, f"header.uuid is not a valid UUID ({header.get('uuid')!r}).")
    if not is_triple(header.get("version")):
        report.error(where, "header.version must be three non-negative integers.")
    mev = header.get("min_engine_version")
    if mev is None:
        report.error(where, "header.min_engine_version is missing.")
    elif not is_triple(mev):
        report.error(where, "header.min_engine_version must be three non-negative integers.")
    elif mev == [0, 0, 0]:
        report.error(where, "header.min_engine_version is the [0, 0, 0] placeholder; use the real looked-up version.")

    modules = data.get("modules")
    seen = {header.get("uuid")} if valid_uuid(header.get("uuid")) else set()
    if not isinstance(modules, list) or not modules:
        report.error(where, "modules must be a non-empty list.")
        modules = []
    for i, module in enumerate(modules):
        tag = f"modules[{i}]"
        if not isinstance(module, dict):
            report.error(where, f"{tag} must be an object.")
            continue
        if not isinstance(module.get("type"), str) or not module["type"]:
            report.error(where, f"{tag}.type is missing.")
        if not valid_uuid(module.get("uuid")):
            report.error(where, f"{tag}.uuid is not a valid UUID ({module.get('uuid')!r}).")
        elif module["uuid"] in seen:
            report.error(where, f"{tag}.uuid {module['uuid']} is duplicated inside this manifest.")
        else:
            seen.add(module["uuid"])
        if not is_triple(module.get("version")):
            report.error(where, f"{tag}.version must be three non-negative integers.")
        if module.get("type") == "script":
            if module.get("language") != "javascript":
                report.error(where, f"{tag}.language must be 'javascript' for a script module.")
            entry = module.get("entry")
            if not isinstance(entry, str) or not entry:
                report.error(where, f"{tag}.entry is missing.")
            elif not (path.parent / entry).is_file():
                report.error(where, f"{tag}.entry '{entry}' does not exist in the pack.")
    return data


def declared_modules(data, where, report):
    names = {}
    deps = data.get("dependencies", [])
    if deps and not isinstance(deps, list):
        report.error(where, "dependencies must be a list.")
        return names, []
    uuid_deps = []
    for i, dep in enumerate(deps or []):
        tag = f"dependencies[{i}]"
        if not isinstance(dep, dict):
            report.error(where, f"{tag} must be an object.")
            continue
        if "module_name" in dep:
            version = dep.get("version")
            name = dep["module_name"]
            if not isinstance(version, str) or not MODULE_VERSION_RE.fullmatch(version):
                report.error(where, f"{tag} ({name}) version must be a string like '2.0.0'; found {version!r}.")
            elif not STABLE_MODULE_RE.fullmatch(version):
                report.warn(where, f"{tag} ({name}) uses non-stable version {version}; allowed only when a requested feature requires it.")
            if name not in KNOWN_MODULES:
                report.warn(where, f"{tag} uses module '{name}', which the generator policy does not allow.")
            if name in names:
                report.error(where, f"{tag} declares {name} more than once.")
            names[name] = version
        elif "uuid" in dep:
            if not valid_uuid(dep.get("uuid")):
                report.error(where, f"{tag}.uuid is not a valid UUID ({dep.get('uuid')!r}).")
            if not is_triple(dep.get("version")):
                report.error(where, f"{tag}.version must be three non-negative integers.")
            else:
                uuid_deps.append((tag, dep["uuid"], dep["version"]))
        else:
            report.error(where, f"{tag} needs either 'module_name' or 'uuid'.")
    return names, uuid_deps


def check_imports(path, names, report):
    scripts = path.parent / "scripts"
    if not scripts.is_dir():
        return
    for js in sorted(scripts.rglob("*.js")):
        try:
            text = js.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for module in sorted(set(IMPORT_RE.findall(text))):
            if module not in names:
                report.error(rel(js), f"imports {module} but {rel(path)} does not declare it in dependencies.")


def check_content_formats(path, data, report):
    mev = data.get("header", {}).get("min_engine_version")
    if not is_triple(mev):
        return
    limit = tuple(mev)
    for folder in ("items", "blocks"):
        base = path.parent / folder
        if not base.is_dir():
            continue
        for file in sorted(base.rglob("*.json")):
            try:
                content = json.loads(file.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
                report.error(rel(file), f"invalid JSON ({exc}).")
                continue
            fv = content.get("format_version") if isinstance(content, dict) else None
            if fv is None:
                continue
            parsed = to_tuple(fv)
            if parsed is None:
                report.error(rel(file), f"format_version {fv!r} is not a version number.")
            elif parsed > limit:
                report.error(rel(file), f"format_version {fv} is newer than min_engine_version {'.'.join(map(str, limit))}.")


def check_all(paths):
    report = Report()
    manifests = []
    for path in paths:
        data = load(path, report)
        if data is None:
            continue
        data = check_manifest(path, data, report)
        if data is None:
            continue
        names, uuid_deps = declared_modules(data, rel(path), report)
        manifests.append((path, data, names, uuid_deps))
        if pack_kind(path) == "behavior_pack":
            check_imports(path, names, report)
            check_content_formats(path, data, report)

    owners = {}
    for path, data, _, _ in manifests:
        value = data["header"].get("uuid")
        if valid_uuid(value):
            owners.setdefault(value, []).append(path)
    for value, where in owners.items():
        if len(where) > 1:
            report.error(", ".join(rel(p) for p in where), f"header.uuid {value} is used by more than one pack.")

    for path, data, _, uuid_deps in manifests:
        for tag, dep_uuid, dep_version in uuid_deps:
            targets = owners.get(dep_uuid)
            if not targets:
                report.warn(rel(path), f"{tag} depends on {dep_uuid}, which is not in the checked packs.")
                continue
            sibling = [t for t in targets if project_of(t) == project_of(path)]
            target = sibling[0] if sibling else targets[0]
            target_data = next(d for p, d, _, _ in manifests if p == target)
            actual = target_data["header"].get("version")
            if is_triple(actual) and is_triple(dep_version) and actual != dep_version:
                report.error(rel(path), f"{tag} expects version {dep_version} but {rel(target)} is {actual}.")

    projects = {}
    for path, data, _, _ in manifests:
        kind = pack_kind(path)
        if kind:
            projects.setdefault(project_of(path), {})[kind] = data["header"]
    for project, kinds in projects.items():
        if len(kinds) == 2:
            bp, rp = kinds["behavior_pack"], kinds["resource_pack"]
            if bp.get("min_engine_version") != rp.get("min_engine_version"):
                report.warn(rel(project), "Behavior Pack and Resource Pack min_engine_version differ.")
    return report, len(manifests)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", help="Check one project folder (or one manifest.json) instead of all of MCPEDL/.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures.")
    args = parser.parse_args()
    target = Path(args.project) if args.project else PROJECT_ROOT
    if not target.is_absolute():
        target = ROOT / target
    if target.is_file() and target.name == "manifest.json":
        paths = [target]
    elif target.is_dir():
        paths = sorted(p for p in target.rglob("manifest.json") if "node_modules" not in p.parts)
    else:
        paths = []
    if not paths:
        print(f"ERROR: no manifest.json files found under {target}.", file=sys.stderr)
        return 2
    report, count = check_all(paths)
    for warning in report.warnings:
        print(f"WARNING: {warning}")
    if report.errors:
        print(f"Manifest version check FAILED: {len(report.errors)} error(s) in {count} manifest(s).")
        for error in report.errors:
            print(f"ERROR: {error}")
        return 1
    if args.strict and report.warnings:
        print(f"Manifest version check FAILED in strict mode: {len(report.warnings)} warning(s).")
        return 1
    print(f"Manifest version check passed for {count} manifest(s) ({len(report.warnings)} warning(s)).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
