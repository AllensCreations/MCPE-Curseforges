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

    # 1. Outer Black Outline for 3D extrusion
    for dx in range(-3, 4):
        for dy in range(-3, depth + 4):
            draw.text((tx + dx, ty + dy), title_clean, font=font_title, fill=(0, 0, 0, 255))

    # 2. 3D Shadow Layers (dark stone bevel)
    for d in range(1, depth + 1):
        color = (55, 55, 55, 255) if d > (depth // 2) else (95, 95, 95, 255)
        draw.text((tx, ty + d), title_clean, font=font_title, fill=color)
        draw.text((tx + 1, ty + d), title_clean, font=font_title, fill=color)

    # 3. Main Title Face (Silver / White with highlight)
    draw.text((tx, ty), title_clean, font=font_title, fill=(240, 240, 240, 255))
    draw.text((tx, ty - 1), title_clean, font=font_title, fill=(255, 255, 255, 210))

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
    args = parser.parse_args()

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
