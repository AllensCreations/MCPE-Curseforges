#!/usr/bin/env python3
"""Generate a 3D Minecraft-styled Title Banner with a 3D Red Ribbon Subtitle.

Matches the authentic Minecraft logo and ribbon header aesthetic:
- 3D stone/metallic Minecraft title text with extrusion shadow and black outline.
- 3D red ribbon banner with white pixel font subtitle ("BEDROCK ADDON" / "ADDON").
- Transparent PNG output, ideal for embedding directly into CurseForge HTML listings.

Usage:
  python3 scripts/generate_title_banner.py --title "Mining Helmet" --out assets/title.png
  python3 scripts/generate_title_banner.py --project MCPEDL/Addons/Mining-Helmet
  python3 scripts/generate_title_banner.py --all
"""
import argparse
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FONT_PATH = ROOT / "assets" / "fonts" / "Minecraft-Bold.otf"


MAX_BANNER_WIDTH = 900  # px at scale=1; wrap title to fit


def _wrap_title(title: str, font, max_px: int, draw) -> list[str]:
    """Split a long title across lines so each line fits within max_px."""
    words = title.split()
    lines, current = [], []
    for word in words:
        trial = " ".join(current + [word])
        box = draw.textbbox((0, 0), trial, font=font)
        if box[2] - box[0] <= max_px or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines or [title]


def render_banner(
    title: str,
    subtitle: str = "BEDROCK ADDON",
    font_path: Path | str = DEFAULT_FONT_PATH,
    out_path: Path | str | None = None,
    scale: float = 1.0,
) -> Image.Image:
    """Render a 3D Minecraft title with a red ribbon subtitle and return an RGBA Image."""
    font_path = Path(font_path)
    if not font_path.is_file():
        raise FileNotFoundError(f"Font file not found: {font_path}")

    title_size = int(54 * scale)
    subtitle_size = int(20 * scale)

    font_title = ImageFont.truetype(str(font_path), title_size)
    font_sub = ImageFont.truetype(str(font_path), subtitle_size)

    # Measure text bounds
    dummy = Image.new("RGBA", (1, 1))
    draw_dummy = ImageDraw.Draw(dummy)

    title_clean = title.strip().upper()
    subtitle_clean = subtitle.strip().upper()

    t_box = draw_dummy.textbbox((0, 0), title_clean, font=font_title)
    tw = t_box[2] - t_box[0]
    th = t_box[3] - t_box[1]

    s_box = draw_dummy.textbbox((0, 0), subtitle_clean, font=font_sub)
    sw = s_box[2] - s_box[0]
    sh = s_box[3] - s_box[1]

    # Wrap title if too wide
    max_title_w = int(MAX_BANNER_WIDTH * scale)
    title_lines = _wrap_title(title_clean, font_title, max_title_w, draw_dummy)
    if len(title_lines) > 1:
        line_boxes = [draw_dummy.textbbox((0, 0), ln, font=font_title) for ln in title_lines]
        tw = max(b[2] - b[0] for b in line_boxes)
        single_lh = line_boxes[0][3] - line_boxes[0][1]
        th = single_lh * len(title_lines) + int(8 * scale) * (len(title_lines) - 1)
    else:
        single_lh = th

    # Ribbon box dimensions
    pad_x = int(22 * scale)
    pad_y = int(6 * scale)
    rw = sw + pad_x * 2
    rh = sh + pad_y * 2

    # Canvas dimensions
    canvas_w = max(tw + int(100 * scale), rw + int(120 * scale), int(600 * scale))
    canvas_h = th + rh + int(70 * scale)

    img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Title placement
    tx = (canvas_w - tw) // 2
    ty = int(14 * scale)

    # 3D extrusion depth
    depth = max(4, int(6 * scale))

    # 1. Outer Black Outline for 3D extrusion (all lines)
    for dx in range(-3, 4):
        for dy in range(-3, depth + 4):
            cur_y = ty
            for ln in title_lines:
                draw.text((tx + dx, cur_y + dy), ln, font=font_title, fill=(0, 0, 0, 255))
                cur_y += single_lh + int(8 * scale)

    # 2. 3D Shadow Layers (dark stone bevel)
    for d in range(1, depth + 1):
        color = (55, 55, 55, 255) if d > (depth // 2) else (95, 95, 95, 255)
        cur_y = ty
        for ln in title_lines:
            draw.text((tx, cur_y + d), ln, font=font_title, fill=color)
            draw.text((tx + 1, cur_y + d), ln, font=font_title, fill=color)
            cur_y += single_lh + int(8 * scale)

    # 3. Main Title Face (Silver / White with highlight)
    cur_y = ty
    for ln in title_lines:
        draw.text((tx, cur_y), ln, font=font_title, fill=(240, 240, 240, 255))
        draw.text((tx, cur_y - 1), ln, font=font_title, fill=(255, 255, 255, 210))
        cur_y += single_lh + int(8 * scale)

    # 4. Ribbon Subtitle Placement
    rx = (canvas_w - rw) // 2
    ry = ty + th + int(12 * scale)
    ribbon_depth = max(3, int(4 * scale))

    # Ribbon Black Border
    draw.rectangle([rx - 2, ry - 2, rx + rw + 2, ry + rh + ribbon_depth + 2], fill=(0, 0, 0, 255))
    # Ribbon Bottom Dark Red Shadow (3D extrusion)
    draw.rectangle([rx, ry + rh, rx + rw, ry + rh + ribbon_depth], fill=(105, 5, 5, 255))
    # Ribbon Face (Vibrant Minecraft Red)
    draw.rectangle([rx, ry, rx + rw, ry + rh], fill=(237, 44, 41, 255))
    # Ribbon Top Highlight Line
    draw.line([rx + 1, ry + 1, rx + rw - 1, ry + 1], fill=(255, 120, 120, 255), width=1)

    # 5. Subtitle Text
    stx = rx + (rw - sw) // 2
    sty = ry + (rh - sh) // 2 - int(2 * scale)
    # Subtitle Drop Shadow
    draw.text((stx + 2, sty + 2), subtitle_clean, font=font_sub, fill=(75, 0, 0, 255))
    # Subtitle White Text
    draw.text((stx, sty), subtitle_clean, font=font_sub, fill=(255, 255, 255, 255))

    # Crop excess transparent borders with clean padding
    bbox = img.getbbox()
    if bbox:
        pad = int(8 * scale)
        img = img.crop((
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(canvas_w, bbox[2] + pad),
            min(canvas_h, bbox[3] + pad),
        ))

    if out_path:
        out_p = Path(out_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(out_p), "PNG")

    return img


def render_label(
    text: str,
    out_path: Path | str | None = None,
    font_path: Path | str = DEFAULT_FONT_PATH,
    style: str = "tooltip",
    font_size: int = 16,
) -> Image.Image:
    """Render text as an authentic Minecraft pixel font label image.

    Styles:
      - 'tooltip': Minecraft GUI tooltip style (dark purple #100c1c fill, #3c1e7a border)
      - 'plain': Transparent background with classic black text shadow
      - 'badge': Minecraft emerald green pill (#15803d fill, #0d5227 border)
    """
    font_path = Path(font_path)
    font = ImageFont.truetype(str(font_path), font_size)

    dummy = Image.new("RGBA", (1, 1))
    d = ImageDraw.Draw(dummy)
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    if style == "plain":
        w = tw + 6
        h = th + 6
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow
        draw.text((2, 2), text, font=font, fill=(0, 0, 0, 255))
        # Front face
        draw.text((0, 0), text, font=font, fill=(255, 255, 255, 255))
    elif style == "badge":
        pad_x, pad_y = 10, 4
        w = tw + pad_x * 2
        h = th + pad_y * 2
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, w - 1, h - 1], fill=(21, 128, 61, 255), outline=(13, 82, 39, 255), width=2)
        draw.text((pad_x + 1, pad_y + 1), text, font=font, fill=(10, 50, 25, 255))
        draw.text((pad_x, pad_y), text, font=font, fill=(255, 255, 255, 255))
    else:  # tooltip
        pad_x, pad_y = 8, 4
        w = tw + pad_x * 2
        h = th + pad_y * 2
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, w - 1, h - 1], fill=(16, 12, 28, 255), outline=(58, 20, 100, 255), width=2)
        draw.text((pad_x + 1, pad_y + 1), text, font=font, fill=(50, 35, 75, 255))
        draw.text((pad_x, pad_y), text, font=font, fill=(255, 255, 255, 255))

    if out_path:
        out_p = Path(out_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(out_p), "PNG")

    return img


def render_labels_for_project(project_path: Path) -> int:
    """Generate <stem>_label.png for all images in assets/recipes and assets/items."""
    count = 0
    # Process recipes
    recipes_dir = project_path / "assets" / "recipes"
    if recipes_dir.is_dir():
        for f in recipes_dir.glob("*.png"):
            if f.name.endswith("_label.png"):
                continue
            # Generate label name
            cap = f.stem.replace("_recipe", "").replace("-", " ").replace("_", " ").title()
            label_out = recipes_dir / f"{f.stem}_label.png"
            render_label(cap, out_path=label_out, style="tooltip")
            count += 1

    # Process items
    items_dir = project_path / "assets" / "items"
    if items_dir.is_dir():
        for f in items_dir.glob("*.png"):
            if f.name.endswith("_label.png"):
                continue
            cap = f.stem.replace("-", " ").replace("_", " ").title()
            label_out = items_dir / f"{f.stem}_label.png"
            render_label(cap, out_path=label_out, style="tooltip")
            count += 1

    return count


def render_common_ui_labels(out_dir: Path) -> int:
    """Generate common listing heading word badges (About, Features, Recipes, etc.)."""
    common_words = [
        ("ABOUT", "badge"),
        ("WHAT YOU GET", "badge"),
        ("FEATURES", "badge"),
        ("CRAFTING RECIPES", "badge"),
        ("CUSTOM ITEMS", "badge"),
        ("INSTALL", "badge"),
        ("HOW TO PLAY", "badge"),
        ("COMMANDS", "badge"),
        ("SUPPORT", "badge"),
        ("BEDROCK ADDON", "tooltip"),
        ("SURVIVAL READY", "tooltip"),
        ("NO EXPERIMENTS", "tooltip"),
        ("ACHIEVEMENT FRIENDLY", "tooltip"),
    ]
    count = 0
    out_dir.mkdir(parents=True, exist_ok=True)
    for word, style in common_words:
        slug = re.sub(r"[^a-z0-9]+", "_", word.lower()).strip("_")
        out_file = out_dir / f"{slug}.png"
        render_label(word, out_path=out_file, style=style, font_size=14)
        count += 1
    return count


def extract_pack_name(project_path: Path) -> str:
    """Read human pack name from DESCRIPTION.md or fallback to folder name."""
    desc = project_path / "DESCRIPTION.md"
    if desc.is_file():
        m = re.search(r"(?m)^#\s+(.+?)\s*$", desc.read_text(encoding="utf-8", errors="replace"))
        if m:
            raw = re.sub(r"\s*\(v?\d+\.\d+\.\d+\)\s*$", "", m.group(1))
            name = re.split(r"\s+[\u2014\u2013-]+\s+|:\s+", raw, maxsplit=1)[0].strip()
            if name:
                return name
    return project_path.name.replace("-", " ").replace("_", " ").title()


def main():
    parser = argparse.ArgumentParser(description="Generate 3D Minecraft Title Banners.")
    parser.add_argument("--title", help="Pack Title text (e.g. 'Mining Helmet').")
    parser.add_argument("--subtitle", default="BEDROCK ADDON", help="Subtitle text inside ribbon.")
    parser.add_argument("--project", type=Path, help="Project directory (e.g. MCPEDL/Addons/Mining-Helmet).")
    parser.add_argument("--all", action="store_true", help="Generate banners for all packs in MCPEDL/Addons.")
    parser.add_argument("--out", type=Path, help="Output PNG path.")
    parser.add_argument("--font", type=Path, default=DEFAULT_FONT_PATH, help="Path to Minecraft TrueType/OpenType font.")
    parser.add_argument("--label", help="Single text to render as a Minecraft font label image.")
    parser.add_argument("--labels", action="store_true", help="Generate <stem>_label.png for all recipes and items in --project.")
    parser.add_argument("--common-labels", action="store_true", help="Generate common heading badges in assets/labels/.")
    parser.add_argument("--label-style", default="tooltip", choices=["tooltip", "plain", "badge"], help="Label visual style.")
    args = parser.parse_args()

    if args.common_labels:
        out_dir = args.out or (ROOT / "assets" / "labels")
        count = render_common_ui_labels(out_dir)
        print(f"Generated {count} common UI labels in {out_dir}")
        return

    if args.label:
        out_path = args.out or (ROOT / "assets" / "label.png")
        render_label(args.label, out_path=out_path, font_path=args.font, style=args.label_style)
        print(f"Generated label: {out_path} for '{args.label}'")
        return

    if args.project and args.labels:
        p = Path(args.project).resolve()
        count = render_labels_for_project(p)
        print(f"Generated {count} item/recipe labels in {p / 'assets'}")
        return

    if args.all:
        addons_dir = ROOT / "MCPEDL" / "Addons"
        count = 0
        for p in sorted(addons_dir.iterdir()):
            if p.is_dir() and (p / "DESCRIPTION.md").is_file():
                title = extract_pack_name(p)
                out_path = p / "assets" / "banner.png"
                render_banner(title, args.subtitle, font_path=args.font, out_path=out_path)
                print(f"Generated: {out_path.relative_to(ROOT)} ({title})")
                count += 1
        print(f"Finished generating {count} banner(s).")
        return

    if args.project:
        p = Path(args.project).resolve()
        title = args.title or extract_pack_name(p)
        out_path = args.out or (p / "assets" / "banner.png")
        render_banner(title, args.subtitle, font_path=args.font, out_path=out_path)
        print(f"Generated banner: {out_path} for '{title}'")
        return

    if not args.title:
        parser.error("Must specify --title, --project, or --all")

    out_path = args.out or (ROOT / "assets" / "banner.png")
    render_banner(args.title, args.subtitle, font_path=args.font, out_path=out_path)
    print(f"Generated banner: {out_path} for '{args.title}'")


if __name__ == "__main__":
    main()
