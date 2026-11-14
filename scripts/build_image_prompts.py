#!/usr/bin/env python3
"""Build a Logo and Banner image prompt file for each pack from its DESCRIPTION.md.

Output: image_prompts/<n>.md. Copy the prompts into your image generator and attach your own logo and
in-game snapshots as reference images. This script only writes prompt text, it never makes images.

Run: python3 scripts/build_image_prompts.py --all | --project MCPEDL/Addons/<n> [--changed] [--check] [--out DIR]
  --changed  skip every pack whose DESCRIPTION.md did not change since its prompt file was written
NEVER edit the generated files by hand.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_description_views as bdv  # noqa: E402

SIG = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
MANIFEST = ".inputs.json"


def facts(md, fallback):
    pre, sec = bdv.sections(md)
    name = bdv.pack_name(pre, fallback)
    tagline = re.search(r"(?m)^\*\*(?!By )(.+)\*\*\s*$", pre)
    features = re.findall(r"(?m)^###\s+(.+?)\s*$", sec.get("Key Features", ""))
    return name, (tagline.group(1).strip() if tagline else ""), features[:5]


def render(md, fallback):
    name, tagline, features = facts(md, fallback)
    about = f" {tagline}" if tagline else ""
    hint = f"\nHint at these pack features visually: {', '.join(features)}." if features else ""
    lines = [
        f"# Image Prompts: {name}",
        "",
        "Copy a prompt below into your image generator. Attach your own images first so the generator uses them as references.",
        "",
        "## Reference Images",
        "",
        "- **Logo reference**: attach your own logo. The generator uses it only for brand colors and mood. The result must be a new design, not a copy.",
        "- **Snapshot references**: attach 1 to 4 of your in-game snapshots of this pack. The generator copies their look, not their screen layout.",
        "",
        "## Logo Prompt",
        "",
        "```text",
        "Use the attached logo only as a brand reference for its color palette and overall mood. Do not copy it. "
        "Create a new, original logo with a different composition and a different main symbol. "
        "Do not just recolor, resize, crop, mirror or tweak the attached logo.",
        f'Create a clean, square (1:1) logo image for the Minecraft Bedrock add-on "{name}".{about}',
        "Base the main symbol on the pack idea above. Match the blocky look of the attached in-game snapshots. "
        "Center the logo, use a simple background, and keep it readable at small sizes.",
        f'Text: "{name}" and, in small letters, "ALNStudios". ALNStudios is the brand name, so always keep it and never remove or change it. Spell both exactly.',
        "Do not add Minecraft, Mojang or Microsoft logos, watermarks, or characters from other games.",
        "```",
        "",
        "## Banner Prompt",
        "",
        "```text",
        f'Create a wide (16:9) banner image for the Minecraft Bedrock add-on "{name}".{about}',
        "Use the attached in-game snapshots as scene and style references: copy their blocky look, lighting, colors "
        "and the kind of scenery they show. Make a new composition inspired by them. "
        "Do not copy the on-screen HUD, chat or hotbar.",
        "Use the attached logo only as a brand reference for its colors and mood. Do not copy it. "
        "Put a new, original logo design in the banner, large enough to read, on the left or center." + hint,
        f'Text: "{name}" and, in small letters, "by ALNStudios". ALNStudios is the brand name, so always keep it and never remove or change it. Spell both exactly.',
        "Leave clear space around the logo. No Minecraft, Mojang or Microsoft logos, no watermarks.",
        "```",
        "",
        "## Notes",
        "",
        "- These prompts come from the pack DESCRIPTION.md. Edit the description, not this file.",
        "- No listing image size is set here. Resize the result to what CurseForge or MCPEDL asks for when you upload.",
        "",
    ]
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", help="one pack folder, e.g. MCPEDL/Addons/Mining-Helmet")
    ap.add_argument("--all", action="store_true", help="every pack under MCPEDL/*/*")
    ap.add_argument("--changed", action="store_true", help="only packs whose DESCRIPTION.md changed")
    ap.add_argument("--check", action="store_true", help="write nothing; exit 1 if a prompt file is missing or stale")
    ap.add_argument("--out", default="image_prompts", help="output folder (default: image_prompts)")
    ap.add_argument("--root", default=".", help="repo root")
    a = ap.parse_args(argv)
    if not a.project and not a.all:
        ap.error("use --all or --project <folder>")
    root = Path(a.root)
    out = root / a.out
    projects = bdv.find_projects(root, (root / a.project) if a.project else None)
    if not projects:
        print("No DESCRIPTION.md found.")
        return 1
    manifest = out / MANIFEST
    seen = {}
    if manifest.is_file():
        try:
            seen = json.loads(manifest.read_text(encoding="utf-8"))
        except ValueError:
            seen = {}
    built = skipped = bad = 0
    for p in projects:
        md = (p / "DESCRIPTION.md").read_text(encoding="utf-8")
        key = hashlib.sha256((SIG + md).encode("utf-8")).hexdigest()
        target = out / f"{p.name}.md"
        text = render(md, p.name)
        if a.check:
            if not target.is_file() or target.read_text(encoding="utf-8") != text:
                print(f"STALE {target}")
                bad += 1
            continue
        if a.changed and target.is_file() and seen.get(target.name) == key:
            skipped += 1
            continue
        out.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
        seen[target.name] = key
        built += 1
    if not a.check and (built or not manifest.is_file()):
        out.mkdir(parents=True, exist_ok=True)
        manifest.write_text(json.dumps(seen, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    if a.check:
        print(f"Checked {len(projects)} image prompt file(s), {bad} problem(s).")
    else:
        print(f"Built {built} image prompt file(s), skipped {skipped} unchanged.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
