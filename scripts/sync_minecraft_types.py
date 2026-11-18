#!/usr/bin/env python3
"""
Syncs official Minecraft Bedrock Script API TypeScript definition (.d.ts) files
from npm (@minecraft/server, @minecraft/server-ui, @minecraft/server-admin, @minecraft/server-net)
into reference/typescript-definitions/.
"""
import os
import sys
import json
import tarfile
import tempfile
import urllib.request
from pathlib import Path

PACKAGES = [
    "@minecraft/server",
    "@minecraft/server-ui",
    "@minecraft/server-admin",
    "@minecraft/server-net"
]

def fetch_package_info(pkg_name):
    url = f"https://registry.npmjs.org/{pkg_name}/latest"
    req = urllib.request.Request(url, headers={"User-Agent": "MCPE-Curseforges-Sync"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def sync_definitions(out_dir):
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    summary = []

    for pkg in PACKAGES:
        short_name = pkg.replace("@minecraft/", "")
        info = fetch_package_info(pkg)
        version = info.get("version", "unknown")
        tarball_url = info.get("dist", {}).get("tarball")
        if not tarball_url:
            print(f"Warning: No tarball URL found for {pkg}")
            continue

        target_pkg_dir = out_path / short_name
        target_pkg_dir.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory() as tmpdir:
            tgz_path = os.path.join(tmpdir, "package.tgz")
            urllib.request.urlretrieve(tarball_url, tgz_path)
            with tarfile.open(tgz_path, "r:gz") as tar:
                for member in tar.getmembers():
                    if member.name.endswith(".d.ts"):
                        base_dts = os.path.basename(member.name)
                        extracted = tar.extractfile(member)
                        if extracted:
                            dts_dest = target_pkg_dir / f"{short_name}.d.ts" if base_dts == "index.d.ts" else target_pkg_dir / base_dts
                            with open(dts_dest, "wb") as f_out:
                                f_out.write(extracted.read())

        meta_file = target_pkg_dir / "info.json"
        with open(meta_file, "w") as f_meta:
            json.dump({"name": pkg, "version": version, "tarball": tarball_url}, f_meta, indent=2)

        summary.append(f"- **{pkg}**: `v{version}`")
        print(f"Synced {pkg} (v{version}) -> {target_pkg_dir}")

    zip_file = out_path / "minecraft-bedrock-types.zip"
    import zipfile
    with zipfile.ZipFile(zip_file, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(out_path):
            for f in files:
                if f.endswith(".zip"):
                    continue
                fp = os.path.join(root, f)
                z.write(fp, os.path.relpath(fp, out_path))
    print(f"Packaged types zip -> {zip_file}")

    readme_path = out_path / "README.md"
    with open(readme_path, "w") as f_readme:
        f_readme.write("# Minecraft Bedrock Script API TypeScript Definitions\n\n")
        f_readme.write("Official TypeScript definition files synced from `@minecraft/*` on npm.\n\n")
        f_readme.write("## Synced Packages\n\n")
        f_readme.write("\n".join(summary) + "\n")

    print(f"All definitions synced to {out_path}")

if __name__ == "__main__":
    out_directory = sys.argv[1] if len(sys.argv) > 1 else "reference/typescript-definitions"
    sync_definitions(out_directory)
