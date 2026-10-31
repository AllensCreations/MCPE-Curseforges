#!/usr/bin/env python3
"""Make every README in the repository agree with the real builds: fix download links, versions, and report broken links."""
import argparse, os, re, sys, urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_manifest_versions as cmv
import sync_manifest_versions as smv
import sync_project_docs as spd

ROOT = cmv.ROOT
GITHUB = "https://github.com/AllensCreations/MCPE-Curseforges"
RAW = GITHUB + "/raw/main"
BLOB = GITHUB + "/blob/main"
CATEGORIES = ("addons", "new_addons", "maps", "script")
PACKAGE_EXT = (".mcaddon", ".mcpack", ".mcworld")
MODES = ("Creative", "Survival", "Hardcore")
LINK_RE = re.compile(r"(\]\()((?:[^()\s]|\([^()]*\))+)(\))")
VERSION_TOKEN = re.compile(r"\(V(\d+)\.(\d+)\.(\d+)\)")
CELL_VERSION = re.compile(r"^(\s*)(v?)(\d+\.\d+\.\d+)(\s*)$")


def posix(path):
    return Path(path).relative_to(ROOT).as_posix()


def file_version(name):
    match = VERSION_TOKEN.search(name)
    return tuple(int(g) for g in match.groups()) if match else (0, 0, 0)


def shape(name):
    return VERSION_TOKEN.sub("(V*)", name)


class Project:
    def __init__(self, category, path, ab):
        self.category = category
        self.path = Path(path)
        self.slug = self.path.name
        version = spd.project_version(self.path)
        self.version = ".".join(map(str, version)) if version else None
        self.title = ab.get_project_title(str(self.path))
        self.build_dir = ROOT / "builds" / self.slug
        files = sorted(p.name for p in self.build_dir.iterdir() if p.is_file() and p.suffix in PACKAGE_EXT) if self.build_dir.is_dir() else []
        self.packages = files
        self.world_archives = [p.name for p in sorted(self.path.glob("*.mcworld"))]
        self.primary = self._primary(ab)

    def _primary(self, ab):
        try:
            ext = "." + ab._get_pack_type(str(self.path), f"MCPEDL/{self.category}", self.version or "1.0.0")[1]
        except Exception:
            ext = ".mcaddon"
        plain = [f for f in self.packages if " BP " not in f and " RP " not in f]
        for wanted in (ext, ".mcaddon", ".mcworld", ".mcpack"):
            hits = [f for f in plain if f.endswith(wanted)]
            if hits:
                return max(hits, key=file_version)
        return None

    def local_world(self):
        ordered = sorted(self.world_archives, key=lambda n: next((i for i, m in enumerate(MODES) if f" - {m}." in n), 9))
        return ordered[0] if ordered else None


def load_projects(ab):
    projects = {}
    for category in CATEGORIES:
        base = ROOT / "MCPEDL" / category
        if not base.is_dir():
            continue
        for path in sorted(p for p in base.iterdir() if p.is_dir()):
            if (path / "behavior_pack").is_dir() or (path / "resource_pack").is_dir() or (path / "manifest.json").is_file():
                projects[path.name] = Project(category, path, ab)
    return projects


def readme_files():
    found = [ROOT / "README.md", ROOT / "builds" / "README.md", ROOT / "Mcpeworlds" / "README.md"]
    found += sorted((ROOT / "builds").glob("*/README.md"))
    found += sorted((ROOT / "MCPEDL").glob("*/README.md"))
    found += sorted((ROOT / "MCPEDL").glob("*/*/README.md"))
    seen, out = set(), []
    for path in found:
        if path.is_file() and path not in seen and "node_modules" not in path.parts:
            seen.add(path)
            out.append(path)
    return out


def to_local(target, readme):
    clean = target.split("#", 1)[0]
    if re.match(rf"^{re.escape(GITHUB)}/(?:raw|blob|tree)/main/", clean):
        rel = urllib.parse.unquote(clean.split("/main/", 1)[1])
        return (ROOT / rel).resolve(), "url"
    if re.match(r"^[a-z][a-z0-9+.\-]*:", clean, re.I) or clean.startswith("//"):
        return None, None
    if clean == "":
        return readme.resolve(), "relative"
    return (readme.parent / urllib.parse.unquote(clean)).resolve(), "relative"


def build_target(local, style, readme, old_target):
    anchor = "#" + old_target.split("#", 1)[1] if "#" in old_target else ""
    rel = Path(local).resolve().relative_to(ROOT.resolve()).as_posix()
    if style == "url":
        kind = "blob" if "/blob/main/" in old_target else ("tree" if "/tree/main/" in old_target else "raw")
        if Path(local).suffix.lower() in (".md", ""):
            kind = "blob"
        return f"{GITHUB}/{kind}/main/{urllib.parse.quote(rel, safe='/')}{anchor}"
    path = os.path.relpath(Path(local).resolve(), readme.parent.resolve()).replace(os.sep, "/")
    return urllib.parse.quote(path, safe="/.-_~") + anchor


def slug_from_path(local):
    try:
        parts = Path(local).resolve().relative_to(ROOT.resolve()).parts
    except ValueError:
        return None, None
    if len(parts) >= 3 and parts[0] == "builds":
        return parts[1], "builds"
    if len(parts) >= 3 and parts[0] == "MCPEDL" and parts[1] in CATEGORIES:
        return parts[2], "project"
    return None, None


def resolve_package(old_local, projects):
    slug, area = slug_from_path(old_local)
    project = projects.get(slug) if slug else None
    if not project or Path(old_local).suffix not in PACKAGE_EXT:
        return None, project
    name = Path(old_local).name
    in_versions = "versions" in Path(old_local).parts
    if in_versions:
        return None, project
    same = [f for f in project.packages if shape(f) == shape(name)]
    if same:
        return ROOT / "builds" / slug / max(same, key=file_version), project
    ext = Path(old_local).suffix
    if ext == ".mcworld" and project.local_world():
        return project.path / project.local_world(), project
    if project.primary and project.primary.endswith(ext):
        return ROOT / "builds" / slug / project.primary, project
    if project.primary:
        return ROOT / "builds" / slug / project.primary, project
    if project.local_world() and ext == ".mcworld":
        return project.path / project.local_world(), project
    return None, project


def project_for_line(line, readme, projects):
    for match in LINK_RE.finditer(line):
        local, _ = to_local(match.group(2), readme)
        if local is None:
            continue
        slug, _ = slug_from_path(local)
        if slug in projects:
            return projects[slug]
        if re.fullmatch(r"[^/]+/?", match.group(2).split("#", 1)[0]) and match.group(2).rstrip("/") in projects:
            return projects[match.group(2).rstrip("/")]
    return None


def sync_versions_in_line(line, project):
    if not project.version:
        return line
    line = re.sub(r"`v\d+\.\d+\.\d+`", f"`v{project.version}`", line)
    if line.lstrip().startswith("|"):
        cells = line.split("|")
        for i, cell in enumerate(cells):
            match = CELL_VERSION.match(cell)
            if match:
                cells[i] = f"{match.group(1)}{match.group(2)}{project.version}{match.group(4)}"
        line = "|".join(cells)
    return line


def sync_text(readme, text, projects, report):
    out_lines = []
    heading_projects = sorted(projects.values(), key=lambda p: -len(p.title or ""))
    for line in text.split("\n"):
        original = line
        replacements = {}

        def swap(match):
            target = match.group(2)
            local, style = to_local(target, readme)
            if local is None or Path(local).suffix not in PACKAGE_EXT or Path(local).exists():
                return match.group(0)
            new_local, project = resolve_package(local, projects)
            if new_local is None and project is not None:
                fallback = project.path / "README.md"
                if fallback.exists():
                    new_target = build_target(fallback, style, readme, target)
                    report["fallback"].append(f"{posix(readme)}: {urllib.parse.unquote(target.rsplit('/', 1)[-1])} has no package; linked the project page instead.")
                    return match.group(1) + new_target + match.group(3)
                return match.group(0)
            if new_local is None:
                return match.group(0)
            new_target = build_target(new_local, style, readme, target)
            replacements[Path(local).name] = Path(new_local).name
            report["fixed"].append(f"{posix(readme)}: {urllib.parse.unquote(target.rsplit('/', 1)[-1])} -> {Path(new_local).name}")
            return match.group(1) + new_target + match.group(3)

        line = LINK_RE.sub(swap, line)
        for old, new in replacements.items():
            line = line.replace(old, new)
        owner = project_for_line(line, readme, projects)
        if owner is not None:
            line = sync_versions_in_line(line, owner)
        elif line.startswith("### ") and "(v" in line:
            hits = [p for p in heading_projects if p.title and p.title.lower() in line.lower()]
            if len(hits) == 1 and hits[0].version:
                line = re.sub(r"\((v)\d+\.\d+\.\d+\)", lambda m: f"({m.group(1)}{hits[0].version})", line, count=1)
        if line != original:
            report["lines"] += 1
        out_lines.append(line)
    return "\n".join(out_lines)


def slugify(heading):
    text = re.sub(r"[^\w\- ]", "", heading.strip().lower())
    return text.replace(" ", "-")


def anchors_of(path):
    found = set()
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            match = re.match(r"^#{1,6}\s+(.*?)\s*#*\s*$", line)
            if match:
                found.add(slugify(match.group(1)))
    except (OSError, UnicodeDecodeError):
        pass
    return found


def check_links(readmes, report):
    broken, bad_anchors = [], []
    for readme in readmes:
        text = readme.read_text(encoding="utf-8")
        for match in LINK_RE.finditer(text):
            target = match.group(2)
            local, _ = to_local(target, readme)
            if local is None:
                continue
            if not local.exists():
                broken.append(f"{posix(readme)}: {urllib.parse.unquote(target)}")
                continue
            if "#" in target and local.suffix == ".md":
                anchor = target.split("#", 1)[1]
                if anchor and anchor not in anchors_of(local):
                    bad_anchors.append(f"{posix(readme)}: {urllib.parse.unquote(target)}")
    report["broken"], report["anchors"] = broken, bad_anchors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report what would change and exit 1 if anything would; write nothing.")
    parser.add_argument("--strict", action="store_true", help="Also exit 1 when broken links remain after fixing.")
    args = parser.parse_args()

    ab = smv.import_bump()
    projects = load_projects(ab)
    readmes = readme_files()
    report = {"fixed": [], "fallback": [], "lines": 0, "stale": [], "projects": [], "broken": [], "anchors": []}
    originals = {r: r.read_text(encoding="utf-8") for r in readmes}
    changed = []

    for readme in readmes:
        new = sync_text(readme, originals[readme], projects, report)
        if new != originals[readme]:
            changed.append(readme)
            if not args.check:
                readme.write_text(new, encoding="utf-8")

    for project in projects.values():
        if project.category in ("maps",) and project.world_archives:
            continue
        if project.category in ("addons", "new_addons", "script") and (project.path / "README.md").is_file() and project.version:
            before = (project.path / "README.md").read_text(encoding="utf-8")
            ab.update_project_readme(str(project.path), f"MCPEDL/{project.category}", project.version, project.primary)
            after = (project.path / "README.md").read_text(encoding="utf-8")
            if after != before:
                report["projects"].append(posix(project.path / "README.md"))
                if args.check:
                    (project.path / "README.md").write_text(before, encoding="utf-8")
        if project.primary and project.version and file_version(project.primary) != tuple(int(x) for x in project.version.split(".")):
            report["stale"].append(f"{project.slug}: package is {'.'.join(map(str, file_version(project.primary)))} but the manifest is {project.version}; rebuild it.")
        if not project.packages and not project.world_archives:
            report["stale"].append(f"{project.slug}: no package in builds/ and no world archive; its download links cannot work until one is built.")

    if args.check:
        for readme in changed:
            readme.write_text(originals[readme], encoding="utf-8")
    final_readmes = readme_files()
    if not args.check:
        check_links(final_readmes, report)
    else:
        check_links(final_readmes, report)

    for line in report["fixed"]:
        print(f"[Links] {'would fix' if args.check else 'fixed'} {line}")
    for line in report["fallback"]:
        print(f"[Links] {line}")
    for path in sorted(set(report["projects"])):
        print(f"[Links] {'would refresh' if args.check else 'refreshed'} {path}")
    for readme in changed:
        print(f"[Links] {'would update' if args.check else 'updated'} {posix(readme)}")
    for line in report["stale"]:
        print(f"NOTICE: {line}")
    for line in report["anchors"]:
        print(f"WARNING: anchor not found: {line}")
    for line in report["broken"]:
        print(f"BROKEN: {line}")
    total = len(changed) + len(set(report["projects"]))
    tail = "broken link(s) before fixing" if args.check else "broken link(s) remain"
    print(f"[Links] {len(readmes)} README file(s) scanned, {total} {'would change' if args.check else 'changed'}, {len(report['broken'])} {tail}.")
    if args.check and total:
        return 1
    if args.strict and report["broken"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
