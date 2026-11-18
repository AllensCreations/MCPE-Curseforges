#!/usr/bin/env python3
"""
Bundles Bedrock reference materials into a unified zip distribution:
reference/bedrock-samples/bedrock-reference-pack.zip

Rules:
1. ONLY .d.ts files and .json files are included (no .gz, no .md, etc.).
2. The entire extracted (uncompressed) payload MUST be <= 30 MB.
   - Bedrock samples text files are stripped of duplicate localized texts (retains en_US),
     reducing samples uncompressed size from ~38.6 MB down to ~9.8 MB.
   - Official Mojang JSON schemas are included (~1.88 MB).
   - TypeScript definitions (.d.ts + info.json) are included (~0.89 MB).
   - Total extracted size: ~12.6 MB (well under the 30 MB limit).
"""
import os
import sys
import gzip
import json
import zipfile
from pathlib import Path

MAX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024  # 30 MB

def create_bundle(repo_root: Path):
    ref_dir = repo_root / "reference"
    bedrock_dir = ref_dir / "bedrock-samples"
    types_dir = ref_dir / "typescript-definitions"

    out_zip = bedrock_dir / "bedrock-reference-pack.zip"
    out_zip.parent.mkdir(parents=True, exist_ok=True)

    print(f"Packaging reference bundle: {out_zip}")
    total_uncompressed = 0

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        # 1. Bedrock samples JSON (filter duplicate translation files to stay under 30MB)
        gz_sample = bedrock_dir / "bedrock-samples.min.json.gz"
        if gz_sample.is_file():
            with gzip.open(gz_sample, "rt", encoding="utf-8") as f:
                data = json.load(f)

            if "texts" in data.get("resource_pack", {}):
                en_us = data["resource_pack"]["texts"].get("en_US", {})
                data["resource_pack"]["texts"] = {"en_US": en_us}

            samples_json_bytes = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            z.writestr("bedrock-samples/bedrock-samples.json", samples_json_bytes)
            total_uncompressed += len(samples_json_bytes)

        # 2. Add json_schemas if present (only .json files)
        schemas_dir = bedrock_dir / "json_schemas"
        if schemas_dir.is_dir():
            for root, _, files in os.walk(schemas_dir):
                for f in files:
                    if f.endswith(".json"):
                        fp = os.path.join(root, f)
                        sz = os.path.getsize(fp)
                        rel = os.path.relpath(fp, bedrock_dir)
                        z.write(fp, f"bedrock-samples/{rel}")
                        total_uncompressed += sz

        # 3. Add typescript-definitions (.d.ts renamed to .txt, and .json only)
        if types_dir.is_dir():
            for root, _, files in os.walk(types_dir):
                for f in files:
                    fp = os.path.join(root, f)
                    rel = os.path.relpath(fp, types_dir)
                    if f.endswith(".d.ts"):
                        # Rename .d.ts to .txt inside the zip
                        rel_dest = rel[:-5] + ".txt"
                        sz = os.path.getsize(fp)
                        z.write(fp, f"typescript-definitions/{rel_dest}")
                        total_uncompressed += sz
                    elif f.endswith(".json"):
                        sz = os.path.getsize(fp)
                        z.write(fp, f"typescript-definitions/{rel}")
                        total_uncompressed += sz

    # Verify extracted size
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
