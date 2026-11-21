#!/usr/bin/env python3
"""
Bundles Bedrock reference materials into a unified FLAT zip distribution:
reference/bedrock-samples/bedrock-reference-pack-<version>.zip

Rules:
1. ONLY 3 files total in the zip (all at root, no subdirectories):
       server.txt       (@minecraft/server definitions)
       server-ui.txt    (@minecraft/server-ui definitions)
       server-admin.txt (@minecraft/server-admin definitions)
2. Bedrock samples content goes into MCPEDL/AI Review/bedrock-samples.txt (not in the zip).
3. The extracted uncompressed payload is <= 30 MB.
4. Zip is named bedrock-reference-pack-<MC_VERSION>.zip using real MC version from _meta.
5. Strictly en_US only for any language text.
"""
import os
import sys
import gzip
import json
import zipfile
from pathlib import Path

MAX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024  # 30 MB


def get_mc_version(gz_sample: Path) -> str:
    """Read min_engine_version from the gzipped samples JSON → version string."""
    if not gz_sample.is_file():
        return "unknown"
    with gzip.open(gz_sample, "rt", encoding="utf-8") as f:
        data = json.load(f)
    ver = data.get("_meta", {}).get("min_engine_version", [])
    if ver:
        return ".".join(str(v) for v in ver)
    return "unknown"


def build_ai_review(repo_root: Path, gz_sample: Path, mc_version: str):
    """Write MCPEDL/AI Review/bedrock-samples.txt with en_US content from the samples JSON."""
    ai_dir = repo_root / "MCPEDL" / "AI Review"
    ai_dir.mkdir(parents=True, exist_ok=True)
    out_file = ai_dir / "bedrock-samples.txt"

    if not gz_sample.is_file():
        print(f"WARNING: {gz_sample} not found, skipping MCPEDL/AI Review/bedrock-samples.txt")
        return

    with gzip.open(gz_sample, "rt", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("_meta", {})
    counts = meta.get("counts", {})
    source = meta.get("source", "")
    commit = meta.get("commit", "")

    # Build a human-readable summary for AI review
    lines = [
        f"# Minecraft Bedrock Samples Reference — v{mc_version}",
        "",
        f"Source: {source}",
        f"Commit: {commit}",
        f"Engine version: {mc_version}",
        "",
        "## Section Counts",
        "",
    ]
    for k, v in counts.items():
        lines.append(f"- {k}: {v}")

    # en_US text strings
    texts = data.get("resource_pack", {}).get("texts", {})
    en_us = texts.get("en_US", {})
    if en_us:
        lines += ["", "## en_US Language Strings", ""]
        for key, val in en_us.items():
            lines.append(f"{key}={val}")

    # Behavior pack: entities, items, blocks (key lists for AI context)
    bp = data.get("behavior_pack", {})
    for section in ("entities", "items", "blocks", "recipes"):
        section_data = bp.get(section, {})
        if section_data:
            lines += ["", f"## behavior_pack/{section} (identifiers)", ""]
            for identifier in sorted(section_data.keys()):
                lines.append(f"- {identifier}")

    out_file.write_text("\n".join(lines), encoding="utf-8")
    size_kb = out_file.stat().st_size / 1024
    print(f"MCPEDL/AI Review/bedrock-samples.txt written: {size_kb:.1f} KB")


def create_bundle(repo_root: Path):
    ref_dir = repo_root / "reference"
    bedrock_dir = ref_dir / "bedrock-samples"
    types_dir = ref_dir / "typescript-definitions"

    gz_sample = bedrock_dir / "bedrock-samples.min.json.gz"
    mc_version = get_mc_version(gz_sample)
    print(f"Minecraft version: {mc_version}")

    # 1. Write bedrock samples to MCPEDL/AI Review/bedrock-samples.txt
    build_ai_review(repo_root, gz_sample, mc_version)

    # 2. Build the 3-file flat zip
    zip_name = f"bedrock-reference-pack-{mc_version}.zip"
    out_zip = bedrock_dir / zip_name

    # Remove old zips with different version names or unversioned
    old_unversioned = bedrock_dir / "bedrock-reference-pack.zip"
    if old_unversioned.is_file():
        old_unversioned.unlink()
        print(f"Removed old zip: {old_unversioned.name}")
    for old in bedrock_dir.glob("bedrock-reference-pack-*.zip"):
        if old.name != zip_name:
            old.unlink()
            print(f"Removed old zip: {old.name}")

    out_zip.parent.mkdir(parents=True, exist_ok=True)
    print(f"Packaging 3-file flat reference bundle: {out_zip}")
    total_uncompressed = 0

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for mod in ("server", "server-ui", "server-admin"):
            txt_file = types_dir / mod / f"{mod}.d.ts"
            if txt_file.is_file():
                txt_bytes = txt_file.read_bytes()
                z.writestr(f"{mod}.txt", txt_bytes)
                total_uncompressed += len(txt_bytes)
                print(f"  Added {mod}.txt ({len(txt_bytes)/1024:.1f} KB)")
            else:
                print(f"  WARNING: {txt_file} not found, skipping")

    extracted_mb = total_uncompressed / (1024 * 1024)
    compressed_mb = os.path.getsize(out_zip) / (1024 * 1024)
    print(f"Archive created: {out_zip}")
    print(f"  Extracted size: {extracted_mb:.2f} MB (Limit: 30.00 MB)")
    print(f"  Compressed size: {compressed_mb:.2f} MB")

    if total_uncompressed > MAX_UNCOMPRESSED_BYTES:
        raise ValueError(f"Extracted payload ({extracted_mb:.2f} MB) exceeds 30 MB limit!")


if __name__ == "__main__":
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    create_bundle(root)
