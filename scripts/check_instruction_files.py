#!/usr/bin/env python3
"""Fail when INSTRUCTIONS.md or PACK_GENERATOR_INSTRUCTIONS.md break the repo rules.

Checks: size cap, X.Y.Z-only versions, required sections, referenced scripts exist,
and templates/blocks match scripts/doc_template.py.
Run: python3 scripts/check_instruction_files.py [--root PATH]
"""
import argparse
import re
import sys
from pathlib import Path

MAX_BYTES = 60000
FILES = ("INSTRUCTIONS.md", "PACK_GENERATOR_INSTRUCTIONS.md", "CHECKRM_REFERENCE.md")
REQUIRED = {
    "CHECKRM_REFERENCE.md": ("### 3.1 Authority and Scope", "### 3.2 Procedure"),
    "INSTRUCTIONS.md": ("## Read Only What the Task Needs", "## Reply Format", "## Final Self-Check", "## Version History",
                        "**File Needed:**", "**Changelog:**", "**Termux Script:**"),
    "PACK_GENERATOR_INSTRUCTIONS.md": ("### 4.9 Final self-check", "### 4.11 Reply format",
                                       "**File Needed:**", "**Changelog:**", "**Termux Script:**"),
}
RETIRED = {"update_min_version.py", "create_mcpe_world.py", "check_generator_sync.py"}
FOUR_PART = re.compile(r"(?<![\w.])\d+\.\d+\.\d+\.\d+(?![\w.])")
PLACEHOLDER_FOUR = re.compile(r"X\.Y\.Z\.A|x\.y\.z\.a", re.I)


def blocks(text):
    return re.findall(r"```markdown\n(.*?)\n```", text, re.S)


def check_versions(name, text, errors):
    first = text.split("\n", 1)[0]
    if not re.search(r"\bv\d+\)\s*$", first):
        errors.append(f"{name}: line 1 must end with the file version, e.g. '(v5)' or ', v15)'.")
    for i, line in enumerate(text.split("\n"), 1):
        if FOUR_PART.search(line):
            errors.append(f"{name}:{i}: four-part version found; versions are X.Y.Z only.")
        for m in PLACEHOLDER_FOUR.finditer(line):
            before = line[:m.start()].rstrip("` ").lower()
            if not (before.endswith("never") or before.endswith("no")):
                errors.append(f"{name}:{i}: 'X.Y.Z.A' allowed only after NEVER/No (as a prohibition).")


def check_scripts_exist(name, text, root, errors):
    for rel in sorted(set(re.findall(r"`(scripts/[A-Za-z0-9_./-]+\.(?:py|md))`", text))):
        if Path(rel).name in RETIRED or rel == "scripts/ASSET_SOURCES.md":
            continue
        if not (root / rel).is_file():
            errors.append(f"{name}: references missing file {rel}.")
    for rel in sorted(set(re.findall(r"`(\.github/workflows/[A-Za-z0-9_.-]+\.ya?ml)`", text))):
        if Path(rel).name in {"update-min-version.yml", "create-addon-scaffold.yml", "test-crafting-template.yml", "create-mcpe-world.yml"}:
            continue
        if not (root / rel).is_file():
            errors.append(f"{name}: references missing workflow {rel}.")


def fill(template):
    t = template
    t = t.replace("[Pack Name]", "Test Pack").replace("[Add-on Name]", "Test Pack")
    t = t.replace("verified-direct-download-link", "https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/Addons/README.md")
    t = t.replace("verified-DESCRIPTION-link", "https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/Addons/Test-Pack/DESCRIPTION.md")
    t = t.replace("YYYY-MM-DD", "2026-01-01").replace("[Update Name]", "First Release")
    return t


def check_templates(name, text, root, errors):
    sys.path.insert(0, str(root / "scripts"))
    try:
        import doc_template as dt
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{name}: cannot import scripts/doc_template.py ({exc}).")
        return
    for label, needle in (("attribution block", dt.GUIDELINES.rstrip()), ("Minecraft Bedrock badge", dt.DESCRIPTION_BADGES[0]),
                          ("Format badge", dt.DESCRIPTION_BADGES[1]), ("listing images line", dt.LISTING_LINE),
                          *[(f"install step {i + 1}", s) for i, s in enumerate(dt.INSTALL_STEPS)]):
        if needle not in text:
            errors.append(f"{name}: {label} differs from scripts/doc_template.py.")
    for sec in dt.DESCRIPTION_SECTIONS:
        if f"## {sec}" not in text:
            errors.append(f"{name}: DESCRIPTION template lacks '## {sec}'.")
    for group in dt.CHANGELOG_GROUPS:
        if f"### {group}" not in text:
            errors.append(f"{name}: CHANGELOG template lacks '### {group}'.")
    bl = blocks(text)
    readme = next((b for b in bl if b.startswith("# [Pack Name]\n\nDownload")), None)
    changelog = next((b for b in bl if b.startswith("# Changelog")), None)
    if not readme:
        errors.append(f"{name}: README template block missing.")
    else:
        errs = []
        dt.check_project_readme(fill(readme), errs)
        errors += [f"{name}: README template fails doc_template: {e}" for e in errs]
    if not changelog:
        errors.append(f"{name}: CHANGELOG template block missing.")
    else:
        errs = []
        dt.check_changelog(fill(changelog).replace("[Feature Title]", "First feature").replace("[Enhancement Title]", "Tuning")
                           .replace("[Fix Title]", "Fixed bug").replace("[Clear summary of the new gameplay feature and how players use it]", "Players can use it")
                           .replace("[Player-friendly description of tuning, balance, or visual changes]", "Balance was tuned")
                           .replace("[What in-game bug or glitch was resolved]", "A bug was resolved"), "1.0.0", errs)
        errors += [f"{name}: CHANGELOG template fails doc_template: {e}" for e in errs]


def check(root):
    root = Path(root)
    errors = []
    texts = {}
    for name in FILES:
        p = root / name
        if not p.is_file():
            errors.append(f"{name}: missing.")
            continue
        raw = p.read_bytes()
        texts[name] = raw.decode("utf-8")
        if len(raw) > MAX_BYTES:
            errors.append(f"{name}: {len(raw)} bytes exceeds the {MAX_BYTES} byte limit.")
    for name, text in texts.items():
        check_versions(name, text, errors)
        for needle in REQUIRED[name]:
            if needle not in text:
                errors.append(f"{name}: required section/marker missing: {needle}")
        check_scripts_exist(name, text, root, errors)
        if name != "CHECKRM_REFERENCE.md":
            check_templates(name, text, root, errors)
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    args = ap.parse_args()
    errors = check(args.root)
    for e in errors:
        print(f"ERROR: {e}")
    sizes = ", ".join(f"{n} {(Path(args.root) / n).stat().st_size}" for n in FILES if (Path(args.root) / n).is_file())
    print(f"[Instruction files] {sizes} bytes (limit {MAX_BYTES}); {len(errors)} problem(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
