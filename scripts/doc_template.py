#!/usr/bin/env python3
"""Strict README, DESCRIPTION, and CHANGELOG template check (Part 2). Used by build_payload.py and as an audit tool.

  python3 scripts/doc_template.py --all           audit every project under MCPEDL/ (report only)
  python3 scripts/doc_template.py --project NAME  audit one project
  python3 scripts/doc_template.py PATH            audit a folder (a payload folder or a project folder)
"""
import argparse, datetime, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CF_URL = "https://www.curseforge.com/members/allenscreations/projects"
MP_URL = "https://mcpedl.com/user/allenscreations/"
DESCRIPTION_BADGES = (
    "[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)",
    "[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)",
)
GUIDELINES = """## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for AllensCreations.

---

"""
DESCRIPTION_SECTIONS = ("Overview", "Key Features", "How to Use", "Compatibility", "Creator and Permissions",
                        "Guidelines and Attribution", "Search & Discovery Keywords")
COMPAT_LABELS = ("Minecraft Bedrock Edition", "Experimental features", "Achievements", "Verification")
ACHIEVEMENT = ("likely achievement-friendly", "not achievement-friendly", "unknown / needs confirmation")
VERIFIED = ("source created", "package built", "in-game tested")
KEYWORD_ANCHORS = ("Minecraft Bedrock add-on", "MCPEDL add-on", "CurseForge Bedrock", "AllensCreations")
CHANGELOG_GROUPS = ("Added", "Improved & Balanced", "Fixed")
INSTALL_STEPS = ("1. Download the package using the link above.",
                 "2. Open the downloaded file with Minecraft to import it.",
                 "3. If the package contains a pack that must be enabled separately, activate it in your world's settings.")
INFO_LINE = re.compile(r"^For gameplay features, usage details, compatibility notes, and other project information, read the \[full description\]\(([^)\s]+)\)\.$")
EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F]")
BANNED = (
    ("a Markdown table", re.compile(r"(?m)^\s*\|.*\|\s*$")),
    ("a code block", re.compile(r"```")),
    ("a badge", re.compile(r"img\.shields\.io|badge", re.I)),
    ("'BP' or 'RP' (write Behavior Pack / Resource Pack)", re.compile(r"\b(?:BP|RP)\b")),
    ("'Script API' or an @minecraft module name", re.compile(r"Script API|@minecraft/", re.I)),
    ("a raw identifier such as minecraft:diamond", re.compile(r"\bminecraft:[a-z0-9_]+")),
    ("an emoji", EMOJI),
    ("a duplicate version suffix such as (v1.0.0) (v1.0.1)", re.compile(r"\(v\d+\.\d+\.\d+\)\s*\(v\d+")),
)


def norm(text):
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").split("\n"))


def manifest_version(root):
    try:
        data = json.loads((Path(root) / "behavior_pack/manifest.json").read_text(encoding="utf-8-sig"))
        v = data["header"]["version"]
        if isinstance(v, list) and len(v) == 3 and all(type(x) is int for x in v):
            return ".".join(map(str, v))
    except Exception:
        pass
    return None


def vtuple(text):
    return tuple(int(x) for x in text.split("."))


def banned_content(name, text, errors, images_allowed=False):
    if images_allowed:
        for badge in DESCRIPTION_BADGES:
            text = text.replace(badge, "")
    for label, rx in BANNED:
        if label == "a badge" and images_allowed:
            rx = re.compile(r"img\.shields\.io", re.I)
        if rx.search(text):
            errors.append(f"DOC: {name} must not contain {label} (Part 2).")
    if not images_allowed and re.search(r"!\[[^\]]*\]\(", text):
        errors.append(f"DOC: {name} must not contain images (Part 2).")


def check_description_badges(text, errors):
    lines = text.splitlines()
    for badge in DESCRIPTION_BADGES:
        if lines.count(badge) != 1:
            errors.append(f"DOC: DESCRIPTION.md must include this badge exactly once: {badge}")


def apply_description_policy(text, addon=False):
    lines = [line for line in norm(text).split("\n") if line not in DESCRIPTION_BADGES]
    insert_at = next((i + 1 for i, line in enumerate(lines) if line.strip() == "**By AllensCreations**"), None)
    if insert_at is None:
        insert_at = next((i + 1 for i, line in enumerate(lines) if line.startswith("# ")), 0)
    while insert_at < len(lines) and not lines[insert_at].strip():
        lines.pop(insert_at)
    lines[insert_at:insert_at] = ["", *DESCRIPTION_BADGES, ""]
    if addon:
        found = False
        for i, line in enumerate(lines):
            if re.match(r"^- (?:\*\*)?Achievements(?:\*\*)?:", line):
                lines[i] = "- Achievements: Likely achievement-friendly."
                found = True
        if not found:
            compatibility = next((i for i, line in enumerate(lines) if line.strip().lower() == "## compatibility"), None)
            if compatibility is not None:
                insert_at = next((i for i in range(compatibility + 1, len(lines)) if lines[i].startswith("## ")), len(lines))
                lines.insert(insert_at, "- Achievements: Likely achievement-friendly.")
    return "\n".join(lines)


def check_project_readme(text, errors):
    lines = [l for l in norm(text).split("\n") if l.strip()]
    n = "README.md"
    if len(lines) != 11:
        errors.append(f"DOC: {n} must have exactly 11 non-empty lines in the version-free download template (found {len(lines)}).")
    title = re.match(r"^# (.+)$", lines[0]) if lines else None
    if not title:
        errors.append(f"DOC: {n} line 1 must be '# [Pack Name]' with no release version.")
        return
    name = title.group(1)
    if re.search(r"\(v\d+\.\d+\.\d+\)$", name, re.I):
        errors.append(f"DOC: {n} title must not contain a release version.")
    expect = [
        (1, f"Download the current release of **{name}** for Minecraft Bedrock Edition.", "the intro sentence"),
        (2, "## Download", "the '## Download' heading"),
        (5, "## Installation", "the '## Installation' heading"),
        (6, INSTALL_STEPS[0], "installation step 1"),
        (7, INSTALL_STEPS[1], "installation step 2"),
        (9, "## Pack Information", "the '## Pack Information' heading"),
    ]
    for index, wanted, label in expect:
        if index >= len(lines) or lines[index] != wanted:
            errors.append(f"DOC: {n} {label} must read exactly: {wanted}")
    fmt = re.match(r"^- \*\*Package format:\*\* `\.(mcaddon|mcpack|mcworld)`$", lines[3]) if len(lines) > 3 else None
    if not fmt:
        errors.append(f"DOC: {n} line 4 must name a supported package format: `.mcaddon`, `.mcpack`, or `.mcworld`.")
    dl = re.match(r"^- \*\*Direct download:\*\* \[Download (.+) \(\.(mcaddon|mcpack|mcworld)\)\]\(([^)\s]+)\)", lines[4]) if len(lines) > 4 else None
    if not dl:
        errors.append(f"DOC: {n} line 5 must be a direct download link for {name} and its package format.")
    else:
        if dl.group(1) != name and not dl.group(1).startswith(name + " — "):
            errors.append(f"DOC: {n} the download link text must name '{name}'.")
        if fmt and dl.group(2) != fmt.group(1):
            errors.append(f"DOC: {n} the package format and the download link extension must match.")
    if fmt and fmt.group(1) == "mcworld" and len(lines) > 8:
        expected_install = "3. Find the imported world in your Worlds list and open it."
    else:
        expected_install = INSTALL_STEPS[2]
    if len(lines) > 8 and lines[8] != expected_install:
        errors.append(f"DOC: {n} installation step 3 must read exactly: {expected_install}")
    info = INFO_LINE.match(lines[10]) if len(lines) > 10 else None
    if not info:
        errors.append(f"DOC: {n} the last line must link the full DESCRIPTION.md.")
    elif "DESCRIPTION.md" not in info.group(1):
        errors.append(f"DOC: {n} the full description link must point to DESCRIPTION.md.")
    banned_content(n, text, errors)


def section_map(text):
    parts = re.split(r"(?m)^(?=## )", text)
    return parts[0], [(p.split("\n", 1)[0][3:].strip(), p.split("\n", 1)[1] if "\n" in p else "") for p in parts[1:]]


def check_description(text, version, errors):
    n = "DESCRIPTION.md"
    text = norm(text)
    pre, sections = section_map(text)
    head = re.search(r"(?m)^# (.+?) — (\S.*)$", pre)
    if not head or pre.lstrip().split("\n", 1)[0] != head.group(0):
        errors.append(f"DOC: {n} line 1 must be '# [Pack Name] — [Clear, factual subtitle]' with no release version.")
    elif re.search(r"\(v\d+\.\d+\.\d+\)$", head.group(1), re.I):
        errors.append(f"DOC: {n} title must not contain a release version.")
    after = [l for l in pre.split("\n")[1:] if l.strip()]
    if not after or after[0] != "**By AllensCreations**":
        errors.append(f"DOC: {n} the line after the title must be exactly: **By AllensCreations**")
    elif len(after) < 2 or after[1].startswith(("#", "-", "|", "*")):
        errors.append(f"DOC: {n} needs a short summary paragraph after the By line and before ## Overview.")
    names = [s[0] for s in sections]
    if names != list(DESCRIPTION_SECTIONS):
        errors.append(f"DOC: {n} the ## sections must be exactly, in this order: {', '.join(DESCRIPTION_SECTIONS)}. Found: {', '.join(names) or 'none'}.")
        return banned_content(n, text, errors, images_allowed=True)
    body = dict(sections)
    key = body["Key Features"].strip("\n")
    cards = re.split(r"(?m)^(?=### )", key)
    if not key.strip() or not key.lstrip().startswith("### "):
        errors.append(f"DOC: {n} '## Key Features' must contain only '### Feature Name' cards.")
    else:
        for card in cards:
            if not card.strip():
                continue
            if not re.search(r"(?m)^- \*\*What Happens\*\*: \S", card):
                errors.append(f"DOC: {n} the feature card '{card.splitlines()[0][4:].strip()}' needs a '- **What Happens**: ...' bullet.")
    for heading in ("Overview", "How to Use"):
        if not body[heading].strip():
            errors.append(f"DOC: {n} '## {heading}' must not be empty.")
    compat = [l for l in body["Compatibility"].split("\n") if l.strip()]
    found = []
    for line in compat:
        m = re.match(r"^- (Minecraft Bedrock Edition|Experimental features|Achievements|Verification): (\S.*)$", line)
        found.append((m.group(1), m.group(2)) if m else None)
    if [f[0] if f else None for f in found] != list(COMPAT_LABELS):
        errors.append(f"DOC: {n} '## Compatibility' must be exactly four bullets, in this order: " + ", ".join(f"'- {l}: ...'" for l in COMPAT_LABELS) + ".")
    else:
        ach, ver = found[2][1].lower(), found[3][1].lower()
        if not any(a in ach for a in ACHIEVEMENT):
            errors.append(f"DOC: {n} the Achievements line must use one of: Likely achievement-friendly, Not achievement-friendly, Unknown / needs confirmation.")
        if not ach.startswith("likely achievement-friendly"):
            errors.append(f"DOC: {n} add-on Achievements must start with 'Likely achievement-friendly'.")
        if not any(ver.startswith(v) for v in VERIFIED):
            errors.append(f"DOC: {n} the Verification line must start with 'Source created', 'Package built', or 'In-game tested'.")
    creators = body["Creator and Permissions"]
    for label, url in (("CurseForge", CF_URL), ("MCPEDL", MP_URL)):
        if url not in creators:
            errors.append(f"DOC: {n} '## Creator and Permissions' must link the {label} profile ({url}).")
    if GUIDELINES + "## Search & Discovery Keywords" not in text:
        errors.append(f"DOC: {n} the attribution block must be the exact Part 2 text, directly before '## Search & Discovery Keywords'.")
    kw = body["Search & Discovery Keywords"]
    for anchor in KEYWORD_ANCHORS:
        if anchor.lower() not in kw.lower():
            errors.append(f"DOC: {n} the keyword section must include '{anchor}'.")
    banned_content(n, text, errors, images_allowed=True)


def check_changelog(text, version, errors):
    n = "CHANGELOG.md"
    text = norm(text)
    lines = text.split("\n")
    ne = [(i, l) for i, l in enumerate(lines) if l.strip()]
    if not ne or not re.match(r"^# Changelog — \S.*$", ne[0][1]):
        errors.append(f"DOC: {n} line 1 must be '# Changelog — [Add-on Name]'.")
        return
    if len(ne) < 2 or ne[1][1].strip() != "---":
        errors.append(f"DOC: {n} the title must be followed directly by a '---' line, with no boilerplate.")
    versions, group_order, current, bullets_in_group = [], -1, None, 0
    in_entries = False
    for i, line in ne[2:]:
        entry = re.match(r"^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$", line)
        group = re.match(r"^### (.+)$", line)
        bullet = re.match(r"^- \*\*[^*]+\*\*: \S", line)
        if entry:
            if current and bullets_in_group == 0:
                errors.append(f"DOC: {n} entry {current} has an empty group.")
            try:
                datetime.date.fromisoformat(entry.group(2))
            except ValueError:
                errors.append(f"DOC: {n} entry {entry.group(1)} has an invalid date {entry.group(2)}.")
            versions.append(entry.group(1))
            current, group_order, bullets_in_group, in_entries = entry.group(1), -1, 0, True
        elif group:
            if not in_entries:
                errors.append(f"DOC: {n} a '### {group.group(1)}' group appears before any release entry.")
                continue
            if group.group(1) not in CHANGELOG_GROUPS:
                errors.append(f"DOC: {n} group '### {group.group(1)}' is not allowed; use Added, Improved & Balanced, or Fixed.")
                continue
            idx = CHANGELOG_GROUPS.index(group.group(1))
            if idx <= group_order:
                errors.append(f"DOC: {n} entry {current}: groups must appear once, in the order Added, Improved & Balanced, Fixed.")
            if group_order >= 0 and bullets_in_group == 0:
                errors.append(f"DOC: {n} entry {current} has an empty group.")
            group_order, bullets_in_group = idx, 0
        elif bullet:
            if group_order < 0:
                errors.append(f"DOC: {n} entry {current}: bullets must be under a ### group.")
            bullets_in_group += 1
        else:
            errors.append(f"DOC: {n} line {i + 1} is not allowed: only release headings, ### groups, and '- **Title**: text' bullets.")
    if current and bullets_in_group == 0:
        errors.append(f"DOC: {n} entry {current} has an empty group.")
    if not versions:
        errors.append(f"DOC: {n} needs at least one entry like '## [1.0.0] - YYYY-MM-DD'.")
    else:
        if [vtuple(v) for v in versions] != sorted((vtuple(v) for v in versions), reverse=True) or len(set(versions)) != len(versions):
            errors.append(f"DOC: {n} entries must be newest first with no duplicate versions.")
        if version and versions[0] != version:
            errors.append(f"DOC: {n} the newest entry is {versions[0]} but the manifest version is {version}.")
    if re.search(r"https?://|\]\(|www\.", text):
        errors.append(f"DOC: {n} must not contain links or URLs (Part 2).")
    if re.search(r"keep a changelog|semantic versioning", text, re.I):
        errors.append(f"DOC: {n} must not mention Keep a Changelog or Semantic Versioning.")
    if EMOJI.search(text):
        errors.append(f"DOC: {n} must not contain emojis.")
    if re.search(r"\.(?:js|json|mcfunction)\b|\bminecraft:[a-z_]+", text):
        errors.append(f"DOC: {n} must not name files, functions, or identifiers; describe player-visible changes.")


def check_docs(root, ptype):
    """Return a list of 'DOC: ...' failure messages for the documentation of one project or payload folder."""
    root = Path(root)
    errors = []
    version = manifest_version(root)
    texts = {}
    for name in ("README.md", "DESCRIPTION.md", "CHANGELOG.md"):
        p = root / name
        texts[name] = p.read_text(encoding="utf-8") if p.is_file() else None
    if texts["README.md"] is not None:
        check_project_readme(texts["README.md"], errors)
    if texts["DESCRIPTION.md"] is not None:
        check_description_badges(texts["DESCRIPTION.md"], errors)
        if ptype == "addon":
            check_description(texts["DESCRIPTION.md"], version, errors)
        else:
            banned_content("DESCRIPTION.md", texts["DESCRIPTION.md"], errors, images_allowed=True)
            title = re.search(r"(?m)^# (.+?)(?: — .+)?$", texts["DESCRIPTION.md"])
            if title and re.search(r"\(v\d+\.\d+\.\d+\)", title.group(1), re.I):
                errors.append("DOC: DESCRIPTION.md title must not contain a release version.")
    if texts["CHANGELOG.md"] is not None:
        check_changelog(texts["CHANGELOG.md"], version, errors)
    seen, unique = set(), []
    for e in errors:
        if e not in seen:
            seen.add(e)
            unique.append(e)
    return unique


def compliant_docs(ptype, name, version, ext=None, date="2026-01-01"):
    """A set of documentation files that passes every check here (used by tests and as a reference)."""
    ext = ext or {"addon": "mcaddon", "map": "mcworld", "script": "mcpack", "minigame": "mcaddon"}.get(ptype, "mcaddon")
    cards = "\n".join(f"### Feature {i}\n- **What Happens**: Players can use feature {i} in the world.\n" for i in range(1, 9))
    achievement = "Likely achievement-friendly." if ptype == "addon" else "Unknown / needs confirmation."
    description = (f"# {name} (v{version}) — A clear factual subtitle\n\n**By AllensCreations**\n\n"
                   f"{DESCRIPTION_BADGES[0]}\n{DESCRIPTION_BADGES[1]}\n\n"
                   f"**A short player-facing tagline.**\n\n> A concise, factual pitch explains what players can do and what makes the experience distinct.\n\n"
                   f"## Overview\n\nThis creation adds a small experience to your world.\n\n## Key Features\n\n{cards}\n"
                   f"## How to Use\n\nUse the items and interactions provided in the world.\n\n## Compatibility\n\n"
                   f"- Minecraft Bedrock Edition: 1.21.0 or newer.\n- Experimental features: Not verified.\n"
                   f"- Achievements: {achievement}\n- Verification: Source created, not tested in game.\n\n"
                   f"## Creator and Permissions\n\n- Creator: AllensCreations\n- Profiles: [CurseForge Profile]({CF_URL}) · [MCPEDL Profile]({MP_URL})\n\n"
                   f"{GUIDELINES}## Search & Discovery Keywords\n\nMinecraft Bedrock add-on, {name} Bedrock mod, MCPEDL add-on, CurseForge Bedrock, AllensCreations.\n")
    base = "https://github.com/AllensCreations/MCPE-Curseforges/tree/main"
    slug = name.replace(" ", "-")
    category = {"addon": "Addons", "map": "Maps", "script": "Script", "minigame": "Minigame"}.get(ptype, "Addons")
    readme = (f"# {name}\n\nDownload the current release of **{name}** for Minecraft Bedrock Edition.\n\n## Download\n\n"
              f"- **Package format:** `.{ext}`\n"
              f"- **Direct download:** [Download {name} (.{ext})]({base}/MCPEDL/{category}/README.md)\n\n"
              f"## Installation\n\n" + "\n".join(
                  INSTALL_STEPS[:2] + (
                      ("3. Find the imported world in your Worlds list and open it.",)
                      if ext == "mcworld" else INSTALL_STEPS[2:]
                  )
              ) + "\n\n## Pack Information\n\n"
              f"For gameplay features, usage details, compatibility notes, and other project information, read the [full description]({base}/MCPEDL/{category}/{slug}/DESCRIPTION.md).\n")
    description = re.sub(
        r"(?m)^# (.+?) \(v\d+\.\d+\.\d+\)( — .+)$",
        r"# \1\2",
        description,
    )
    changelog = (f"# Changelog — {name}\n\n---\n\n## [{version}] - {date}\n\n### Added\n- **First release**: Players can use the new creation.\n")
    return {"README.md": readme, "DESCRIPTION.md": description, "CHANGELOG.md": changelog}


def audit(targets):
    bad = 0
    for ptype, path in targets:
        errors = check_docs(path, ptype)
        rel = Path(path)
        try:
            rel = rel.relative_to(ROOT)
        except ValueError:
            pass
        if errors:
            bad += 1
            print(f"FAIL {rel.as_posix()} ({ptype})")
            for e in errors:
                print(f"  - {e}")
        else:
            print(f"ok   {rel.as_posix()} ({ptype})")
    return bad


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("path", nargs="?", help="A folder to audit (payload folder or project folder).")
    parser.add_argument("--all", action="store_true", help="Every project under MCPEDL/.")
    parser.add_argument("--project", help="One project folder name under MCPEDL/.")
    parser.add_argument("--type", choices=("addon", "map", "script", "minigame"), help="Project type for a PATH audit (default: addon).")
    args = parser.parse_args()
    kinds = {"Addons": "addon", "Maps": "map", "Script": "script", "Minigame": "minigame"}
    targets = []
    if args.path:
        targets.append((args.type or "addon", Path(args.path)))
    else:
        for cat, ptype in kinds.items():
            base = ROOT / "MCPEDL" / cat
            if base.is_dir():
                for p in sorted(x for x in base.iterdir() if x.is_dir()):
                    if args.all or (args.project and args.project in (p.name, f"MCPEDL/{cat}/{p.name}")):
                        targets.append((ptype, p))
    if not targets:
        print("Nothing to audit: pass --all, --project NAME, or a PATH.", file=sys.stderr)
        return 2
    bad = audit(targets)
    print(f"[Docs] {len(targets)} project(s) audited, {bad} not following the template.")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
