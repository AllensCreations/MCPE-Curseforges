#!/usr/bin/env python3
"""
Bundles Bedrock reference materials into a unified FLAT zip distribution:
reference/bedrock-samples/bedrock-reference-pack.zip

Rules:
1. ONLY 4 files total in the zip:
   - 3 .txt files:
       server.txt (@minecraft/server definitions)
       server-ui.txt (@minecraft/server-ui definitions)
       server-admin.txt (@minecraft/server-admin definitions)
   - 1 .json file:
       bedrock-samples.json (the combined JSON of all bedrock samples & types info)
2. All files are in the ROOT of the zip (no folder directories inside the zip).
3. The extracted uncompressed payload is <= 30 MB (around ~11.2 MB uncompressed).
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

    print(f"Packaging 4-file flat reference bundle: {out_zip}")
    total_uncompressed = 0

    # 1. Load samples JSON
    gz_sample = bedrock_dir / "bedrock-samples.min.json.gz"
    combined_json = {}
    if gz_sample.is_file():
        with gzip.open(gz_sample, "rt", encoding="utf-8") as f:
            combined_json = json.load(f)

        if "texts" in combined_json.get("resource_pack", {}):
            en_us = combined_json["resource_pack"]["texts"].get("en_US", {})
            combined_json["resource_pack"]["texts"] = {"en_US": en_us}

    # Add metadata for types into the single combined json
    types_meta = {}
    for mod in ("server", "server-ui", "server-admin"):
        info_path = types_dir / mod / "info.json"
        if info_path.is_file():
            try:
                types_meta[mod] = json.loads(info_path.read_text(encoding="utf-8"))
            except Exception:
                pass
    combined_json["_typescript_definitions"] = types_meta

    json_bytes = json.dumps(combined_json, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        # Write the 1 combined JSON file at root
        z.writestr("bedrock-samples.json", json_bytes)
        total_uncompressed += len(json_bytes)

        # Write the 3 .txt files at root
        for mod in ("server", "server-ui", "server-admin"):
            txt_file = types_dir / mod / f"{mod}.d.ts"
            if txt_file.is_file():
                txt_bytes = txt_file.read_bytes()
                z.writestr(f"{mod}.txt", txt_bytes)
                total_uncompressed += len(txt_bytes)

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
