#!/usr/bin/env python3
"""
Decompresses reference/bedrock-samples/bedrock-samples.min.json.gz into individual
clean JSON and lang files inside a target directory (defaults to reference/bedrock-samples/decompressed/).

Usage:
  python3 scripts/decompress_bedrock_samples.py [--src path/to/min.json.gz] [--out path/to/out_dir]
"""
import argparse
import gzip
import json
import sys
from pathlib import Path

def decompress_samples(gz_path: Path, out_dir: Path):
    if not gz_path.is_file():
        print(f"Error: {gz_path} not found", file=sys.stderr)
        return 1

    print(f"Reading and decompressing {gz_path}...")
    with gzip.open(gz_path, "rt", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("_meta", {})
    print(f"Source commit: {meta.get('commit', 'unknown')}")
    print(f"Min engine version: {meta.get('min_engine_version', 'unknown')}")

    out_dir.mkdir(parents=True, exist_ok=True)

    file_count = 0
    for pack_name in ("behavior_pack", "resource_pack"):
        pack_data = data.get(pack_name, {})
        for section, items in pack_data.items():
            if not isinstance(items, dict):
                continue
            for rel_path, content in items.items():
                if section == "_root":
                    dest_file = out_dir / pack_name / f"{rel_path}.json"
                elif section == "texts":
                    dest_file = out_dir / pack_name / "texts" / f"{rel_path}.lang"
                else:
                    dest_file = out_dir / pack_name / section / f"{rel_path}.json"

                dest_file.parent.mkdir(parents=True, exist_ok=True)

                if section == "texts" and isinstance(content, dict):
                    lines = [f"{k}={v}" for k, v in content.items()]
                    dest_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
                else:
                    dest_file.write_text(json.dumps(content, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

                file_count += 1

    print(f"Successfully extracted {file_count} files into {out_dir}")
    return 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--src", default="reference/bedrock-samples/bedrock-samples.min.json.gz")
    parser.add_argument("--out", default="reference/bedrock-samples/decompressed")
    args = parser.parse_args()
    sys.exit(decompress_samples(Path(args.src), Path(args.out)))
