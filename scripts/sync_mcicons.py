#!/usr/bin/env python3
"""Download the pinned MCicons release (iMumd/mcicons) into reference/mcicons/ as ONE file: mcicons-<version>.tgz.

  python3 scripts/sync_mcicons.py [--dest reference/mcicons] [--tgz LOCAL.tgz] [--force]

Same file as `npm install https://github.com/iMumd/mcicons/releases/download/v2.1.1/mcicons-2.1.1.tgz`. The tarball is
checked against a pinned SHA-256 and kept as it is (never unpacked into the repo); scripts/lib/mcicons.py reads the
icons (dist/icons/minecraft_<id>.png, 64x64) directly from it. A tarball that is already there with the right hash
is not downloaded again. Older mcicons-*.tgz files in the folder are removed. To move to a newer release change
MCICONS_VERSION, MCICONS_URL and MCICONS_SHA256 together.
Minecraft artwork belongs to Mojang Studios / Microsoft. The tarball carries ASSET-NOTICE.md and LICENSE: read them before reuse.
"""
import argparse
import hashlib
import sys
import urllib.request
from pathlib import Path

MCICONS_VERSION = "2.1.1"
MCICONS_URL = "https://github.com/iMumd/mcicons/releases/download/v2.1.1/mcicons-2.1.1.tgz"
MCICONS_SHA256 = "8573f7bbaa50994f74e7cab46556b4586473b88b235f178baf43546e2b9ef23a"
ROOT = Path(__file__).resolve().parent.parent
README = """# MCicons reference (Minecraft item and block icons)

`mcicons-{version}.tgz` is the unchanged release file from https://github.com/iMumd/mcicons (v{version}, `@imumd/mcicons`).
`scripts/sync_mcicons.py` downloads it (workflow: Build Changed Packs & Sync Catalogs) and checks its SHA-256. Do not edit by hand.

- Use these icons for Minecraft items and blocks in recipe diagrams, README and listing images (INSTRUCTIONS.md 1.5).
- Inside the file: `package/dist/icons/minecraft_<id>.png` (64x64 RGBA; `minecraft:diamond_sword` is `minecraft_diamond_sword.png`), `package/dist/catalog.json`, `package/ASSET-NOTICE.md`, `package/LICENSE`.
- In code: `scripts/lib/mcicons.py` (`icon_image`, `has_icon`) reads the icons straight from the file.
- Minecraft artwork belongs to Mojang Studios / Microsoft. Read `ASSET-NOTICE.md` inside the file before reuse.
"""


def sync(dest: Path, tgz: Path = None, force: bool = False, expected_sha: str = MCICONS_SHA256, version: str = MCICONS_VERSION) -> str:
    """Returns 'unchanged' or 'updated'. Raises ValueError on a hash mismatch."""
    dest = Path(dest)
    target = dest / f"mcicons-{version}.tgz"
    if not force and target.is_file() and (not expected_sha or hashlib.sha256(target.read_bytes()).hexdigest() == expected_sha):
        return "unchanged"
    data = Path(tgz).read_bytes() if tgz else urllib.request.urlopen(MCICONS_URL, timeout=120).read()
    sha = hashlib.sha256(data).hexdigest()
    if expected_sha and sha != expected_sha:
        raise ValueError(f"MCicons tarball hash {sha} does not match the pinned {expected_sha}")
    dest.mkdir(parents=True, exist_ok=True)
    for old in dest.glob("mcicons-*.tgz"):
        old.unlink()
    target.write_bytes(data)
    (dest / "README.md").write_text(README.format(version=version), encoding="utf-8")
    print(f"MCicons {version}: saved {target} ({len(data)} bytes, sha256 {sha})")
    return "updated"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dest", default=str(ROOT / "reference" / "mcicons"))
    ap.add_argument("--tgz", default="")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    try:
        r = sync(Path(a.dest), Path(a.tgz) if a.tgz else None, a.force)
    except (ValueError, OSError) as e:
        print(f"ERROR: {e}")
        return 1
    if r == "unchanged":
        print(f"MCicons {MCICONS_VERSION} already in {a.dest}; nothing to do.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
