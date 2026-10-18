#!/usr/bin/env python3
"""Validate versioned Bedrock pack titles and creator attribution."""
import argparse, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT / "MCPEDL"
TITLE_RE = re.compile(r"^(.+?) \(v(\d+\.\d+\.\d+)\)$")
ATTRIBUTION = "by AllensCreations"

def validate(paths):
    errors, records = [], []
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc}).")
            continue
        rel = path.relative_to(ROOT)
        header = data.get("header")
        if not isinstance(header, dict):
            errors.append(f"{rel}: missing header object.")
            continue
        version = header.get("version")
        if (not isinstance(version, list) or len(version) != 3
                or any(type(part) is not int or part < 0 for part in version)):
            errors.append(f"{rel}: header.version must be [major, minor, patch] integers.")
            expected = None
        else:
            expected = ".".join(map(str, version))
        name = header.get("name")
        match = TITLE_RE.fullmatch(name) if isinstance(name, str) else None
        if not match:
            errors.append(f"{rel}: header.name must have exactly one terminal '(vX.Y.Z)' suffix; malformed or duplicate suffixes are invalid.")
        else:
            shown = match.group(2)
            if expected is not None and shown != expected:
                errors.append(f"{rel}: title version v{shown} does not match header.version v{expected}.")
            records.append((path, shown))
        desc = header.get("description")
        if not isinstance(desc, str) or desc.count(ATTRIBUTION) != 1:
            errors.append(f"{rel}: header.description must contain '{ATTRIBUTION}' exactly once.")

    # Compare sibling BP/RP pack versions; nested world packs are checked individually.
    pairs = {}
    for path, version in records:
        parts = path.parts
        idx = max((i for i,p in enumerate(parts) if p in ("behavior_pack","resource_pack")), default=-1)
        if idx < 0: continue
        root, kind = Path(*parts[:idx]), parts[idx]
        pairs.setdefault(root, {}).setdefault(kind, []).append(version)
    for root, kinds in pairs.items():
        if "behavior_pack" in kinds and "resource_pack" in kinds:
            if set(kinds["behavior_pack"]) != set(kinds["resource_pack"]):
                errors.append(f"{root}: Behavior Pack version(s) {sorted(set(kinds['behavior_pack']))} do not match Resource Pack version(s) {sorted(set(kinds['resource_pack']))}.")
    return errors

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", help="Validate every manifest under one project directory.")
    args = parser.parse_args()
    target = Path(args.project) if args.project else PROJECT_ROOT
    if not target.is_absolute(): target = ROOT / target
    paths = [target] if target.is_file() and target.name == "manifest.json" else sorted(target.rglob("manifest.json")) if target.is_dir() else []
    if not paths:
        print(f"ERROR: No manifest.json files found under {target}.", file=sys.stderr)
        return 2
    errors = validate(paths)
    if errors:
        print(f"Manifest title validation failed with {len(errors)} error(s):")
        for error in errors: print(f" - {error}")
        return 1
    print(f"Manifest title validation passed for {len(paths)} manifest(s).")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
