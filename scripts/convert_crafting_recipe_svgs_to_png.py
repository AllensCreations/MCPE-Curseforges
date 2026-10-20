#!/usr/bin/env python3
"""Export SVG assets to PNG. Crafting-table PNG is a derivative of CRAFTING_TABLE.svg, never a separate reference."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import base64
import re
import sys

import cairosvg

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

def embed_remote_images(svg: str) -> str:
    pattern = re.compile(r'(<image\b[^>]*?\b(?:href|xlink:href)=["\'])(https?://[^"\']+)(["\'][^>]*>)', re.I)
    def replace(match):
        url = match.group(2)
        request = Request(url, headers={"User-Agent": "AllensCreations-RecipeImageBuilder/1.0"})
        try:
            with urlopen(request, timeout=30) as response:
                data = response.read()
                mime = response.headers.get_content_type()
        except Exception as exc:
            raise RuntimeError(f"Unable to fetch linked recipe texture {url}: {exc}") from exc
        encoded = base64.b64encode(data).decode("ascii")
        return match.group(1) + f"data:{mime};base64,{encoded}" + match.group(3)
    return pattern.sub(replace, svg)

def main():
    candidates = sorted(ASSETS.glob("CRAFTING_RECIPE*.svg"))
    # Always export the crafting board template to PNG as well.
    template_svg = ASSETS / "CRAFTING_TABLE.svg"
    if template_svg.exists():
        candidates.insert(0, template_svg)
    if not candidates:
        print("No crafting recipe SVGs found; nothing to convert.")
        return
    for source in candidates:
        output = source.with_suffix(".png")
        svg = source.read_text(encoding="utf-8")
        svg = embed_remote_images(svg)
        cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(output), output_width=400 if source == template_svg else 800)
        print(f"Generated {output.relative_to(ROOT)}")
if __name__ == "__main__":
    main()
