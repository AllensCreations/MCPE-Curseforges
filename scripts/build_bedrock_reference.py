#!/usr/bin/env python3
"""Turn a checkout of Mojang/bedrock-samples into ONE minimal JSON reference for add-on work.

  python3 scripts/build_bedrock_reference.py --src <bedrock-samples clone> [--out reference/bedrock-samples]

Writes (only when the content changed, so a run with no upstream change commits nothing):
  <out>/bedrock-samples.min.json   every vanilla behavior_pack + resource_pack JSON file, minified, in one object
  <out>/README.md                  where the data came from (commit, version), section counts, how to look things up

Shape of bedrock-samples.min.json:
  {"_meta": {...source commit, min engine version, counts, unparsed files...},
   "behavior_pack":  {"entities": {"zombie": {...}}, "items": {...}, "blocks": {...}, "recipes": {...},
                      "loot_tables": {"chests/x": {...}}, "spawn_rules": {...}, "trading": {...}, "biomes": {...}, ...},
   "resource_pack":  {"entity": {...}, "animations": {...}, "render_controllers": {...}, "attachables": {...},
                      "particles": {...}, "sounds": {...}, "textures": {"item_texture": {...}, "terrain_texture": {...}},
                      "blocks": {...}, "texts": {"en_US": {"key": "value"}}}}
Keys are the file path inside the section without the .json extension.
Vanilla files contain // comments and trailing commas: they are cleaned with a string-aware stripper.
A file that still cannot be parsed is listed in _meta.unparsed and never stops the run.
"""
import argparse
import json
import re
import sys
from pathlib import Path

# Folders (inside behavior_pack/ and resource_pack/) and single files worth keeping.
# Binary assets (png, ogg, fsb, tga, mcstructure, nbt) are never read.
SKIP_KEYS = {"$schema"}  # pure noise for reference purposes


def strip_jsonc(text: str) -> str:
    """Remove // and /* */ comments and trailing commas without touching string contents."""
    out, i, n = [], 0, len(text)
    in_str = False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if c == '"':
                in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True
            out.append(c)
            i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
        elif c == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            i = n if end == -1 else end + 2
        else:
            out.append(c)
            i += 1
    cleaned = "".join(out)
    # trailing commas before } or ] (outside strings is enough here: strings holding ",}" are rare and
    # the regex below only runs on text where comments are already gone)
    return re.sub(r",(\s*[}\]])", r"\1", cleaned)


def load_json(path: Path):
    raw = path.read_text(encoding="utf-8-sig", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return json.loads(strip_jsonc(raw))


def prune(value):
    if isinstance(value, dict):
        return {k: prune(v) for k, v in value.items() if k not in SKIP_KEYS}
    if isinstance(value, list):
        return [prune(v) for v in value]
    return value


def parse_lang(path: Path) -> dict:
    result = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("##") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        val = val.split("\t#")[0].rstrip()
        result[key.strip()] = val
    return result


def collect_pack(pack_dir: Path, unparsed: list, label: str) -> dict:
    section = {}
    if not pack_dir.is_dir():
        return section
    for path in sorted(pack_dir.rglob("*"), key=lambda p: p.as_posix().lower()):
        if not path.is_file():
            continue
        rel = path.relative_to(pack_dir)
        parts = rel.parts
        if path.suffix.lower() == ".lang":
            if parts[0] == "texts":
                section.setdefault("texts", {})[path.stem] = parse_lang(path)
            continue
        if path.suffix.lower() != ".json":
            continue
        try:
            data = prune(load_json(path))
        except (json.JSONDecodeError, ValueError) as err:
            unparsed.append(f"{label}/{rel.as_posix()}: {str(err)[:80]}")
            continue
        if len(parts) == 1:  # blocks.json, sounds.json, manifest.json at the pack root
            section.setdefault("_root", {})[path.stem] = data
        else:
            sub = section.setdefault(parts[0], {})
            sub["/".join(parts[1:])[: -len(".json")]] = data
    return section


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", required=True, help="bedrock-samples checkout")
    ap.add_argument("--out", default="reference/bedrock-samples")
    ap.add_argument("--sha", default="", help="upstream commit (default: read from the checkout's git data)")
    args = ap.parse_args()

    src, out = Path(args.src), Path(args.out)
    if not (src / "behavior_pack").is_dir():
        print(f"::error::{src}/behavior_pack not found: is --src a bedrock-samples checkout?", file=sys.stderr)
        return 1

    sha = args.sha
    if not sha:
        import subprocess
        sha = subprocess.run(["git", "-C", str(src), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()

    unparsed: list = []
    bp = collect_pack(src / "behavior_pack", unparsed, "behavior_pack")
    rp = collect_pack(src / "resource_pack", unparsed, "resource_pack")

    # textures/item_texture + terrain_texture are the useful texture maps; keep them as "textures"
    min_engine = (bp.get("_root", {}).get("manifest", {}).get("header", {}) or {}).get("min_engine_version")
    counts = {
        f"{pack}.{name}": len(items)
        for pack, sec in (("behavior_pack", bp), ("resource_pack", rp))
        for name, items in sorted(sec.items())
    }
    meta = {
        "source": "https://github.com/Mojang/bedrock-samples",
        "commit": sha,
        "min_engine_version": min_engine,
        "counts": counts,
        "unparsed": sorted(unparsed),
    }
    doc = {"_meta": meta, "behavior_pack": bp, "resource_pack": rp}
    payload = json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"

    lines = [
        "# Bedrock Samples Reference",
        "",
        "Generated by `scripts/build_bedrock_reference.py` (workflow: Sync Bedrock Samples Reference). Do not edit by hand.",
        "",
        f"- Source: https://github.com/Mojang/bedrock-samples (commit `{sha[:12] or 'unknown'}`)",
        f"- Minimum engine version in the samples: `{'.'.join(map(str, min_engine)) if min_engine else 'unknown'}`",
        f"- Size: {len(payload.encode('utf-8')) / 1e6:.2f} MB, one file: `bedrock-samples.min.json`",
        "- Look up: `jq '.behavior_pack.entities.zombie' bedrock-samples.min.json`",
        "- Keys are the file path inside the section without `.json` (e.g. `loot_tables[\"chests/ancient_city\"]`).",
        "",
        "## Sections",
        "",
    ] + [f"- `{k}`: {v} files" for k, v in counts.items()]
    if unparsed:
        lines += ["", "## Not parsed", ""] + [f"- `{u}`" for u in sorted(unparsed)]
    readme = "\n".join(lines) + "\n"

    out.mkdir(parents=True, exist_ok=True)
    changed = False
    for name, text in (("bedrock-samples.min.json", payload), ("README.md", readme)):
        target = out / name
        if not target.exists() or target.read_text(encoding="utf-8") != text:
            target.write_text(text, encoding="utf-8")
            changed = True
    print(f"{'Updated' if changed else 'Unchanged'}: {out}/bedrock-samples.min.json "
          f"({len(payload) / 1e6:.2f} MB, {sum(counts.values())} files, {len(unparsed)} unparsed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
