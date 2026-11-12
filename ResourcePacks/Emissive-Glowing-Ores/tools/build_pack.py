#!/usr/bin/env python3
import argparse
import json
import math
import shutil
import sys
import zipfile
from pathlib import Path

from PIL import Image

PACK_NAME = "Emissive Glowing Ores by ALNStudios"
VERSION = "1.0.0"

DEFAULT_THRESHOLD = 14

ORES = [
    ("coal_ore", "", "stone", None),
    ("iron_ore", "", "stone", None),
    ("copper_ore", "", "stone", None),
    ("gold_ore", "", "stone", None),
    ("redstone_ore", "", "stone", None),
    ("lapis_ore", "", "stone", None),
    ("emerald_ore", "", "stone", None),
    ("diamond_ore", "", "stone", None),
    ("quartz_ore", "", "netherrack", None),
    ("nether_gold_ore", "", "netherrack", None),
    ("ancient_debris_side", "", None, None),
    ("ancient_debris_top", "", None, None),
    ("deepslate_coal_ore", "deepslate", "deepslate", 8),
    ("deepslate_iron_ore", "deepslate", "deepslate", None),
    ("deepslate_copper_ore", "deepslate", "deepslate", None),
    ("deepslate_gold_ore", "deepslate", "deepslate", None),
    ("deepslate_redstone_ore", "deepslate", "deepslate", None),
    ("deepslate_lapis_ore", "deepslate", "deepslate", None),
    ("deepslate_emerald_ore", "deepslate", "deepslate", None),
    ("deepslate_diamond_ore", "deepslate", "deepslate", None),
]

BASES = {
    "stone": "stone.png",
    "netherrack": "netherrack.png",
    "deepslate": "deepslate/deepslate.png",
}

DEFAULT_ROUGHNESS = 200


def pixels(img):
    return list(getattr(img, "get_flattened_data", img.getdata)())


def rel(sub, name, ext):
    return f"{sub}/{name}{ext}" if sub else f"{name}{ext}"


def load_rgb(path):
    return Image.open(path).convert("RGB")


def palette(img):
    return sorted(set(pixels(img)))


def luminance(p):
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]


def speckle_mask(img, base_palette, threshold, percentile):
    px = pixels(img)
    if base_palette is not None:
        return [min(math.dist(p, q) for q in base_palette) > threshold for p in px]
    lums = sorted(luminance(p) for p in px)
    cut = lums[int(len(lums) * percentile / 100.0)]
    return [luminance(p) >= cut for p in px]


def border_flags(w, h):
    return [x in (0, w - 1) or y in (0, h - 1) for y in range(h) for x in range(w)]


def build_mer(color, mask, vanilla_mers, glow, outline_level, keep_metalness):
    w, h = color.size
    border = border_flags(w, h)
    out = []
    vm = pixels(vanilla_mers) if vanilla_mers is not None else None
    for i in range(w * h):
        r, g, b = (vm[i][0], 0, vm[i][2]) if vm else (0, 0, DEFAULT_ROUGHNESS)
        if mask[i]:
            g = glow
            if not keep_metalness:
                r = 0
        if border[i] and outline_level > 0:
            g = max(g, outline_level)
            if not keep_metalness:
                r = 0
        out.append((r, g, b))
    img = Image.new("RGB", (w, h))
    img.putdata(out)
    return img


def boost_color(color, mask, amount):
    out = []
    for p, m in zip(pixels(color), mask):
        if m and amount > 0:
            mx = max(p)
            if mx == 0:
                out.append(p)
                continue
            f = 1.0 + amount
            lifted = tuple(min(255, int(c * f)) for c in p)
            sat = 1.0 + amount * 0.5
            avg = sum(lifted) / 3.0
            out.append(tuple(max(0, min(255, int(avg + (c - avg) * sat))) for c in lifted))
        else:
            out.append(p)
    img = Image.new("RGB", color.size)
    img.putdata(out)
    return img


def texture_set(name, mer_name):
    return {
        "format_version": "1.16.100",
        "minecraft:texture_set": {
            "color": name,
            "metalness_emissive_roughness": mer_name,
        },
    }


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="Build Emissive Glowing Ores by ALNStudios")
    ap.add_argument("--vanilla", required=True, help="path to Mojang bedrock-samples resource_pack folder (contains textures/blocks)")
    ap.add_argument("--pack", default=str(Path(__file__).resolve().parent.parent / "resource_pack"))
    ap.add_argument("--dist", default=str(Path(__file__).resolve().parent.parent / "dist"))
    ap.add_argument("--glow", type=int, default=255, help="emissive value for ore speckles, 0-255")
    ap.add_argument("--outline", type=int, default=255, help="emissive value for the 1 px block outline, 0 disables it")
    ap.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD, help="RGB distance from the stone palette that counts as ore")
    ap.add_argument("--debris-percentile", type=float, default=90, help="ancient debris: brightest pixels above this percentile glow")
    ap.add_argument("--keep-metalness", action="store_true", help="keep vanilla metalness on glowing pixels")
    ap.add_argument("--classic-boost", type=float, default=0.0, help="brighten ore speckles in the color texture, 0.0 off, 0.3 typical")
    ap.add_argument("--no-package", action="store_true", help="write MER and texture sets only")
    a = ap.parse_args()

    vroot = Path(a.vanilla) / "textures" / "blocks"
    pack = Path(a.pack)
    if not vroot.is_dir():
        sys.exit(f"missing {vroot}")
    for v in (a.glow, a.outline):
        if not 0 <= v <= 255:
            sys.exit("glow and outline must be 0-255")

    bases = {}
    for k, f in BASES.items():
        p = vroot / f
        if not p.is_file():
            sys.exit(f"missing base texture {p}")
        bases[k] = palette(load_rgb(p))

    stage = Path(a.dist) / "_stage"
    if stage.exists():
        shutil.rmtree(stage)
    shutil.copytree(pack, stage, ignore=shutil.ignore_patterns("textures"))

    report = []
    for name, sub, base, thr in ORES:
        cpath = vroot / rel(sub, name, ".png")
        if not cpath.is_file():
            sys.exit(f"missing vanilla color texture {cpath}")
        color = load_rgb(cpath)
        mpath = vroot / rel(sub, name, "_mers.tga")
        vm = Image.open(mpath).convert("RGBA") if mpath.is_file() else None
        mask = speckle_mask(color, bases[base] if base else None, thr if thr is not None else a.threshold, a.debris_percentile)
        mer = build_mer(color, mask, vm, a.glow, a.outline, a.keep_metalness)
        mer_name = f"{name}_mer"
        out_mer = pack / "textures" / "blocks" / rel(sub, mer_name, ".png")
        out_mer.parent.mkdir(parents=True, exist_ok=True)
        mer.save(out_mer, optimize=True)
        write_json(pack / "textures" / "blocks" / rel(sub, name, ".texture_set.json"), texture_set(name, mer_name))
        report.append((name, sum(mask)))
        if not a.no_package:
            st = stage / "textures" / "blocks"
            (st / sub).mkdir(parents=True, exist_ok=True)
            boost_color(color, mask, a.classic_boost).save(st / rel(sub, name, ".png"), optimize=True)
            shutil.copy2(out_mer, st / rel(sub, mer_name, ".png"))
            shutil.copy2(pack / "textures" / "blocks" / rel(sub, name, ".texture_set.json"), st / rel(sub, name, ".texture_set.json"))

    for name, n in report:
        print(f"{name:26} glow px {n:3}")

    if a.no_package:
        shutil.rmtree(stage)
        return

    for name, sub, _, _ in ORES:
        ts = json.loads((stage / "textures" / "blocks" / rel(sub, name, ".texture_set.json")).read_text())
        d = ts["minecraft:texture_set"]
        for key in ("color", "metalness_emissive_roughness"):
            f = stage / "textures" / "blocks" / (f"{sub}/" if sub else "") / f"{d[key]}.png"
            if not f.is_file():
                sys.exit(f"texture set {name} references missing {f}")
        c = Image.open(stage / "textures" / "blocks" / rel(sub, name, ".png"))
        m = Image.open(stage / "textures" / "blocks" / rel(sub, name + "_mer", ".png"))
        if c.size != m.size:
            sys.exit(f"{name}: color and MER sizes differ")

    out = Path(a.dist) / f"{PACK_NAME} (V{VERSION}).mcpack"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(stage.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(stage).as_posix())
    shutil.rmtree(stage)
    print(f"built {out}")


if __name__ == "__main__":
    main()
