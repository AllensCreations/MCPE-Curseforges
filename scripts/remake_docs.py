#!/usr/bin/env python3
"""Remake README.md, DESCRIPTION.md, and CHANGELOG.md for every project (or one) to the Part 2 standard."""
import argparse, datetime, os, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_readme_status as crs
import check_manifest_versions as cmv
import sync_manifest_versions as smv
import sync_project_docs as spd
import sync_readme_links as srl

ROOT = cmv.ROOT
ALL_DOCS = ("readme", "description", "changelog")
CF_URL = "https://www.curseforge.com/members/allenscreations/projects"
MP_URL = "https://mcpedl.com/user/allenscreations/"

from doc_template import (DESCRIPTION_BADGES, GUIDELINES, KEYWORD_ANCHORS,
                          apply_description_policy)  # noqa: E402
COPYRIGHT_RE = re.compile(r"(?m)^---[ \t]*\n+© All rights reserved for ALNStudios\.[ \t]*\n+(?:---[ \t]*\n+)?")
STYLE_CHECKS = (
    ("Markdown table", re.compile(r"(?m)^\|.*\|\s*$")),
    ("badge or image", re.compile(r"img\.shields\.io|!\[[^\]]*\]\(")),
    ("code block", re.compile(r"```")),
    ("BP or RP abbreviation", re.compile(r"\b(?:BP|RP)\b")),
    ("raw identifier", re.compile(r"\bminecraft:[a-z0-9_]+")),
    ("Script API or module name", re.compile(r"Script API|@minecraft/")),
    ("duplicate version suffix", re.compile(r"\(v\d+\.\d+\.\d+(?:\.\d+)?\)\s*\(v\d+")),
)


def category_of(proj):
    return os.path.basename(os.path.dirname(proj))


def clean_name(meta):
    name = meta["name"].replace(" BP", "").replace(" RP", "").strip()
    return re.sub(r"\s*\(v\d+\.\d+\.\d+(?:\.\d+)?\)\s*$", "", name).strip()


def fix_heading(text, version_text=None):
    lines = text.splitlines(keepends=True)
    for i, line in enumerate(lines[:6]):
        if not line.startswith("# "):
            continue
        newline = "\n" if line.endswith("\n") else ""
        title = line.rstrip("\r\n")[2:].strip()
        suffix = ""
        for sep in (" — ", " - ", " -- "):
            if sep in title:
                title, rest = title.split(sep, 1)
                suffix = sep + rest
                break
        title = re.sub(r"\s*\([vV]\d+\.\d+\.\d+(?:\.\d+)?\)\s*$", "", title).strip()
        lines[i] = f"# {title}{suffix}{newline}"
        return "".join(lines), i
    return text, None


def split_sections(text):
    parts = re.split(r"(?m)^(?=## )", text)
    return parts[0], parts[1:]


def heading_of(section):
    return section.split("\n", 1)[0].strip().lower()


def find(sections, prefix):
    for i, section in enumerate(sections):
        if heading_of(section).startswith(prefix):
            return i
    return None


def standardize_description(text, name, version_text, min_engine, notices, label, addon=False):
    text = re.sub(r"(?<![/\w])ALNStudios", "ALNStudios", text)
    text, head = fix_heading(text, version_text)
    lines = text.split("\n")
    if head is not None and not any(l.strip() == "**By ALNStudios**" for l in lines[head + 1:head + 8]):
        lines[head + 1:head + 1] = ["", "**By ALNStudios**"]
        text = "\n".join(lines)
    text = COPYRIGHT_RE.sub("", text)
    pre, sections = split_sections(text)
    sections = [s if s.endswith("\n\n") else s.rstrip("\n") + "\n\n" for s in sections]

    gi = find(sections, "## guidelines and attribution")
    if gi is not None:
        sections.pop(gi)

    profile_section = find(sections, "## creator profiles")
    if profile_section is not None:
        sections.pop(profile_section)

    ki = find(sections, "## search & discovery keywords")
    if ki is None:
        sections.append(f"## Search & Discovery Keywords\n\nMinecraft Bedrock add-on, {name} Bedrock mod, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.\n")
        notices.append(f"{label}: keyword section was missing; added generic anchors. Add feature keywords.")
    ki = find(sections, "## search & discovery keywords")

    ki = find(sections, "## search & discovery keywords")
    head_line, _, kw_rest = sections[ki].partition("\n")
    kw_text = kw_rest.strip()
    missing_kw = [a for a in KEYWORD_ANCHORS if a.lower() not in kw_text.lower()]
    if missing_kw:
        base_kw = kw_text.rstrip(".").rstrip()
        sections[ki] = head_line + "\n\n" + base_kw + (", " if base_kw else "") + ", ".join(missing_kw) + ".\n"
        notices.append(f"{label}: added the general keyword anchors that were missing ({', '.join(missing_kw)}). Add feature keywords too.")

    ci = find(sections, "## compatibility")
    defaults = (
        ("Minecraft Bedrock Edition", f"- Minecraft Bedrock Edition: {min_engine} or newer.\n"),
        ("Experimental features", "- Experimental features: Not verified.\n"),
        ("Achievements", "- Achievements: Likely achievement-friendly.\n" if addon else "- Achievements: Unknown / needs confirmation.\n"),
        ("Verification", "- Verification: Source created, not tested in game.\n"),
    )
    if ci is None:
        body = "".join(line for _, line in defaults)
        cr_at = find(sections, "## creator and permissions")
        sections.insert(ki if cr_at is None else cr_at, f"## Compatibility\n\n{body}\n")
        notices.append(f"{label}: compatibility section was missing; added with unverified defaults. Replace with verified facts.")
    else:
        section = sections[ci].rstrip("\n")
        for key, line in defaults:
            if not re.search(rf"(?im)^\s*[-*]\s*(?:\*\*)?{re.escape(key)}", section):
                section += "\n" + line.rstrip("\n")
                notices.append(f"{label}: compatibility lacked '{key}'; added an unverified default.")
        sections[ci] = section + "\n\n"

    ki = find(sections, "## search & discovery keywords")
    cr = find(sections, "## creator and permissions")
    if cr is None:
        sections.insert(ki, f"## Creator and Permissions\n\n- Creator: ALNStudios\n- Profiles: [CurseForge Profile]({CF_URL}) · [MCPEDL Profile]({MP_URL})\n\n")
    else:
        section = sections[cr].rstrip("\n")
        if CF_URL not in section:
            section += f"\n- [CurseForge Profile]({CF_URL})"
        if MP_URL not in section:
            section += f"\n- [MCPEDL Profile]({MP_URL})"
        sections[cr] = section + "\n\n"
    ki = find(sections, "## search & discovery keywords")
    sections.insert(ki, GUIDELINES)
    return apply_description_policy(pre.rstrip("\n") + "\n\n" + "".join(sections).rstrip("\n") + "\n", addon=addon) + "\n"


def refresh_readme(proj, category, version_text, name, check):
    """Write the add-on README with the same generator the release workflow uses. Returns True if it changed."""
    ab = smv.import_bump()
    path = Path(proj)
    readme = path / "README.md"
    before = readme.read_text(encoding="utf-8") if readme.is_file() else None
    if before is None:
        readme.write_text(f"# {name}\n", encoding="utf-8")
    primary = srl.Project(category, path, ab).primary
    import contextlib, io
    with contextlib.redirect_stdout(io.StringIO()):
        ab.update_project_readme(str(path), f"MCPEDL/{category}", version_text, primary)
    after = readme.read_text(encoding="utf-8")
    if check:
        if before is None:
            readme.unlink()
        else:
            readme.write_text(before, encoding="utf-8")
    return before != after


def lines_of(text):
    return [l for l in text.splitlines() if l.strip()]


def description_complete(text):
    return (len(lines_of(text)) >= 25 and bool(crs.GAMEPLAY_HEADING_REGEX.search(text))
            and not any(m in text for m in crs.PLACEHOLDER_MARKERS + crs.SCAFFOLD_STUB_MARKERS))


def style_report(path, notices, label):
    text = path.read_text(encoding="utf-8")
    if path.name == "DESCRIPTION.md":
        for badge in DESCRIPTION_BADGES:
            text = text.replace(badge, "")
        text = re.sub(
            r"\[!\[(?:CurseForge|MCPEDL)[^\]]*\]\("
            r"https://raw\.githubusercontent\.com/AllensCreations/MCPE-Curseforges/main/assets/Images/[^)\s]+"
            r"\)\]\((?:https?://(?:www\.)?curseforge\.com/[^)\s]+|https?://mcpedl\.com/[^)\s]+)\)",
            "",
            text,
            flags=re.IGNORECASE,
        )
    found = [f"{name} x{len(rx.findall(text))}" for name, rx in STYLE_CHECKS if rx.search(text)]
    if found:
        notices.append(f"{label}: style issues to fix by hand (Part 2): " + ", ".join(found) + ".")


def run(args):
    mode = getattr(args, "remake", None) or "standardize"
    docs = [d.strip() for d in (getattr(args, "docs", None) or "all").split(",") if d.strip()]
    docs = list(ALL_DOCS) if "all" in docs else docs
    bad = [d for d in docs if d not in ALL_DOCS]
    if bad:
        print(f"ERROR: unknown --docs value(s): {', '.join(bad)}. Use readme, description, changelog or all.", file=sys.stderr)
        return 2
    project = getattr(args, "project", None)
    if not project and not getattr(args, "all", False):
        print("ERROR: choose --project NAME or --all.", file=sys.stderr)
        return 2
    if mode == "rebuild" and not project and not getattr(args, "confirm_rebuild", False):
        print("ERROR: rebuilding every project needs --confirm-rebuild. It replaces DESCRIPTION.md and README.md with generic text built from source files.", file=sys.stderr)
        return 2
    check = getattr(args, "check", False)
    date_text = datetime.datetime.now(datetime.timezone.utc).date().isoformat()

    results = crs.scan_projects(target_project=project)
    if not results:
        print(f"ERROR: no project matching '{project}'." if project else "ERROR: no projects found.", file=sys.stderr)
        return 2
    changes, notices = [], []

    def write(path, text, what):
        old = path.read_text(encoding="utf-8") if path.is_file() else None
        if old == text:
            return
        changes.append(f"{'would write' if check else 'wrote'} {path.relative_to(ROOT).as_posix()} ({what})")
        if not check:
            path.write_text(text, encoding="utf-8")

    for item in results:
        proj = item["proj_dir"]
        path = Path(proj)
        rel = path.relative_to(ROOT).as_posix()
        meta = crs.extract_manifest_info(proj)
        name = clean_name(meta)
        version = spd.project_version(path)
        version_text = ".".join(map(str, version)) if version else meta["version"]
        description, readme = path / "DESCRIPTION.md", path / "README.md"

        if mode == "rebuild":
            if "readme" in docs or "description" in docs:
                changes.append(f"{'would rebuild' if check else 'rebuilt'} {rel}/DESCRIPTION.md and README.md from source files")
                if not check:
                    for stale in (description, readme):
                        if stale.is_file():
                            stale.unlink()
                    crs.auto_generate_readme(proj)
                    refresh_readme(proj, category_of(proj), version_text, name, False)
                    description_text = description.read_text(encoding="utf-8") if description.is_file() else None
                    if description_text:
                        description.write_text(standardize_description(description_text, name, version_text, meta["min_engine"], notices, f"{rel}/DESCRIPTION.md", addon=category_of(proj) == "Addons"), encoding="utf-8")
                notices.append(f"{rel}: rebuilt text is generic and based only on source files. Write the real features with the AI export workflow.")

        elif "readme" in docs:
            readme_text = readme.read_text(encoding="utf-8") if readme.is_file() else ""
            desc_text = description.read_text(encoding="utf-8") if description.is_file() else ""
            long_readme = len(lines_of(readme_text)) > 24
            if long_readme and (description_complete(desc_text) or not description.is_file()) and not check:
                crs.auto_generate_readme(proj)
                refresh_readme(proj, category_of(proj), version_text, name, False)
                changes.append(f"wrote {rel}/README.md (product information preserved into DESCRIPTION.md, download page refreshed)")
            elif long_readme and description.is_file() and not description_complete(desc_text):
                notices.append(f"{rel}: README holds product text but DESCRIPTION.md is incomplete; skipped so nothing is lost. Move the text into DESCRIPTION.md first.")
            elif long_readme and check:
                changes.append(f"would refresh {rel}/README.md and preserve its product text in DESCRIPTION.md")
            else:
                if refresh_readme(proj, category_of(proj), version_text, name, check):
                    changes.append(f"{'would write' if check else 'wrote'} {rel}/README.md (download page)")

        if mode != "rebuild" and "description" in docs and description.is_file():
            text = description.read_text(encoding="utf-8")
            if description_complete(text) or mode == "standardize":
                write(description, standardize_description(text, name, version_text, meta["min_engine"], notices, f"{rel}/DESCRIPTION.md", addon=category_of(proj) == "Addons"), "structure and attribution")
            if not description_complete(text):
                notices.append(f"{rel}/DESCRIPTION.md: the text is still a stub or lacks Overview and Features sections. Structure was fixed; write the real features.")
        elif mode != "rebuild" and "description" in docs and not description.is_file():
            notices.append(f"{rel}: DESCRIPTION.md is missing. Run with --remake rebuild --project {os.path.basename(proj)} or write it with the AI export workflow.")

        if "changelog" in docs and version:
            changelog = path / "CHANGELOG.md"
            updated, note = spd.sync_changelog(changelog, version, version_text, name, date_text, [])
            if note:
                notices.append(f"{rel}/CHANGELOG.md: {note}")
            if updated is not None:
                changes.append(f"{'would write' if check else 'wrote'} {rel}/CHANGELOG.md ({'created' if not changelog.is_file() else 'added ' + version_text})")
                if not check:
                    changelog.write_text(updated, encoding="utf-8")
            if changelog.is_file() and re.search(r"https?://|\]\(", changelog.read_text(encoding="utf-8")):
                notices.append(f"{rel}/CHANGELOG.md: contains links; Part 2 says remove them.")

        for doc in (description, readme):
            if doc.is_file() and ((doc is description and "description" in docs) or (doc is readme and "readme" in docs)):
                style_report(doc, notices, f"{rel}/{doc.name}")

    for line in changes:
        print(f"[Remake] {line}")
    for line in notices:
        print(f"NOTICE: {line}")
    if not changes:
        print("[Remake] Everything already matches the standard.")
    else:
        print(f"[Remake] {len(changes)} change(s){' (dry run)' if check else ''} across {len(results)} project(s).")
    return 1 if (check and changes) else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--remake", choices=("standardize", "rebuild"), default="standardize")
    parser.add_argument("--docs", default="all", help="Comma list of readme, description, changelog, or all.")
    parser.add_argument("--project")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--confirm-rebuild", action="store_true")
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
