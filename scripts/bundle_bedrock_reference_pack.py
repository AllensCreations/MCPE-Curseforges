#!/usr/bin/env python3
"""
Bundles Bedrock reference materials into a unified zip distribution:
reference/bedrock-samples/bedrock-reference-pack.zip

Contains:
- bedrock-samples.min.json.gz (all vanilla behavior and resource pack samples)
- metadata/json_schemas/ (official Bedrock JSON schemas if fetched)
- typescript-definitions/ (all .d.ts files for Script API: server, server-ui, etc.)
"""
import os
import sys
import zipfile
from pathlib import Path

def create_bundle(repo_root: Path):
    ref_dir = repo_root / "reference"
    bedrock_dir = ref_dir / "bedrock-samples"
    types_dir = ref_dir / "typescript-definitions"

    out_zip = bedrock_dir / "bedrock-reference-pack.zip"
    out_zip.parent.mkdir(parents=True, exist_ok=True)

    print(f"Creating reference bundle: {out_zip}")
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
        # 1. Add bedrock-samples files
        gz_sample = bedrock_dir / "bedrock-samples.min.json.gz"
        if gz_sample.is_file():
            z.write(gz_sample, "bedrock-samples/bedrock-samples.min.json.gz")
        readme = bedrock_dir / "README.md"
        if readme.is_file():
            z.write(readme, "bedrock-samples/README.md")

        # 2. Add json_schemas if present
        schemas_dir = bedrock_dir / "json_schemas"
        if schemas_dir.is_dir():
            for root, _, files in os.walk(schemas_dir):
                for f in files:
                    fp = os.path.join(root, f)
                    rel = os.path.relpath(fp, bedrock_dir)
                    z.write(fp, f"bedrock-samples/{rel}")

        # 3. Add typescript-definitions
        if types_dir.is_dir():
            for root, _, files in os.walk(types_dir):
                for f in files:
                    if f.endswith(".zip"):
                        continue
                    fp = os.path.join(root, f)
                    rel = os.path.relpath(fp, ref_dir)
                    z.write(fp, rel)

    print(f"Unified bundle created: {out_zip} ({os.path.getsize(out_zip)} bytes)")

if __name__ == "__main__":
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    create_bundle(root)
