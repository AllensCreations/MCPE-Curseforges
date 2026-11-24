#!/usr/bin/env python3
"""Build one Listing Kit per pack: every text you paste into a CurseForge listing, in one Markdown page.

Output: Package/<n>.listing.md. GitHub shows each ```text block with a Copy button, so open the file on GitHub
and tap Copy next to: Package name, Summary (max 256), the description HTML, and the Logo / Banner AI image prompts.
Everything comes from DESCRIPTION.md (same code as lib/build_description_views.py and lib/build_image_prompts.py).

Run: python3 scripts/build_listing_kits.py --all | --project MCPEDL/Addons/<n> [--check] [--out DIR]
NEVER edit the generated files by hand.
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
import build_description_views as bdv  # noqa: E402
import build_image_prompts as bip  # noqa: E402

SUMMARY_MAX = 256


def clean(text):
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[`*_]+", "", text)
    return re.sub(r"\s+", " ", text).strip()


def make_summary(tagline):
    """The DESCRIPTION tagline as plain text, at most 256 characters (cut at a sentence, else at a word)."""
    s = clean(tagline)
    if len(s) <= SUMMARY_MAX:
        return s
    cut = s[:SUMMARY_MAX]
    sentence = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if sentence >= 60:
        return cut[:sentence + 1]
    word = s[:SUMMARY_MAX - 3].rsplit(" ", 1)[0].rstrip(" ,;:-")
    return word + "..."


def fence_for(text):
    longest = max((len(m) for m in re.findall(r"`+", text)), default=0)
    return "`" * max(3, longest + 1)


def block(text, lang):
    f = fence_for(text)
    return f"{f}{lang}\n{text}\n{f}"


def first_paragraph(md):
    pre, _ = bdv.sections(md)
    for para in re.split(r"\n\s*\n", pre):
        s = para.strip()
        if not s or s.startswith(("#", "[![", "![", ">", "---", "<")) or re.match(r"\*\*By ", s):
            continue
        return s
    return ""


def render_kit(root, project):
    md = (project / "DESCRIPTION.md").read_text(encoding="utf-8")
    name, tagline, _ = bip.facts(md, project.name)
    if not tagline:
        tagline = first_paragraph(md)
    if not tagline:
        raise ValueError("DESCRIPTION.md has no bold tagline line to use as the summary")
    summary = make_summary(tagline)

    banner_file = project / "assets" / "banner.png"
    if not banner_file.is_file() and not (project / "assets" / "Banner.png").is_file():
        try:
            import generate_title_banner as gtb
            gtb.render_banner(name, "BEDROCK ADDON", out_path=banner_file)
        except Exception:
            pass

    try:
        import generate_title_banner as gtb
        gtb.render_labels_for_project(project)
    except Exception:
        pass

    html = bdv.render(md, project.name, None, None, style="minimal",
                      media=bdv.find_media(root, project, md), min_version=bdv.find_min_version(project))
    errs = bdv.check_html(html)
    if errs:
        raise ValueError("; ".join(errs))
    prompts = bip.render(md, project.name)
    start, end = prompts.index("## Reference Images"), prompts.index("## Notes")
    lines = [
        f"# Listing Kit: {name}",
        "",
        "Tap the Copy button on a block, then paste it into the CurseForge listing. Generated from DESCRIPTION.md: edit that, not this file.",
        "",
        "## Package Name",
        "",
        block(name, "text"),
        "",
        f"## Summary ({len(summary)}/{SUMMARY_MAX})",
        "",
        block(summary, "text"),
        "",
        "## Description (HTML)",
        "",
        "Paste into the CurseForge description editor in source (HTML) mode.",
        "",
        block(html.strip(), "html"),
        "",
        "## AI Image Prompts",
        "",
        prompts[start:end].replace("## Reference Images", "### Reference Images").replace("## Logo Prompt", "### Logo Prompt").replace("## Banner Prompt", "### Banner Prompt").rstrip(),
        "",
    ]
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", help="one pack folder, e.g. MCPEDL/Addons/Mining-Helmet")
    ap.add_argument("--all", action="store_true", help="every pack under MCPEDL/*/*")
    ap.add_argument("--check", action="store_true", help="write nothing; exit 1 if a kit is missing or stale")
    ap.add_argument("--out", default="Package", help="output folder (default: Package)")
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
    built = same = bad = 0
    for p in projects:
        try:
            text = render_kit(root, p)
        except ValueError as e:
            print(f"FAIL {p.name}: {e}")
            bad += 1
            continue
        target = out / f"{p.name}.listing.md"
        current = target.read_text(encoding="utf-8") if target.is_file() else None
        if a.check:
            if current != text:
                print(f"STALE {target}")
                bad += 1
        elif current == text:
            same += 1
        else:
            out.mkdir(parents=True, exist_ok=True)
            target.write_text(text, encoding="utf-8", newline="\n")
            built += 1
    if a.check:
        print(f"Checked {len(projects)} listing kit(s), {bad} problem(s).")
    else:
        print(f"Built {built} listing kit(s), {same} unchanged, {bad} problem(s).")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
