#!/usr/bin/env python3
"""Library: the Logo and Banner image prompt text built from a pack's DESCRIPTION.md.

It writes no files. scripts/build_listing_kits.py calls it and puts the prompts into description_views/<n>.listing.md
(the separate image_prompts/ files were removed). Prompt text only, it never makes images.

Run: python3 scripts/build_listing_kits.py --all | --project MCPEDL/Addons/<n> [--check]
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
