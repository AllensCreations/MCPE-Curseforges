#!/usr/bin/env python3
"""Build a named .mcworld from the repository's complete OneBlock world template.

The template is extracted once from assets/oneblock-template.mcworld (or
assets/Void_For_Workv2.mcworld) into assets/oneblock-template/. Each build
copies that template to a temporary staging directory, changes only the world
name metadata, and packages every world file including the complete LevelDB
database. The source template is never modified.
"""

import argparse
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"
TEMPLATE_DIR = ASSETS_DIR / "oneblock-template"
SOURCE_ARCHIVE_CANDIDATES = (
    ASSETS_DIR / "oneblock-template.mcworld",
    ASSETS_DIR / "Void_For_Workv2.mcworld",
)


def sanitize_filename(name: str) -> str:
    """Convert a world display name into a safe output filename."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip().rstrip(".")
    return cleaned or "MCPE_World"


def patch_level_dat(raw_bytes: bytes, new_name: str) -> bytes:
    """Replace the Bedrock LevelName string and update its payload length."""
    if len(raw_bytes) < 8:
        raise ValueError("level.dat is too short to be a valid Bedrock level file.")

    name_bytes = new_name.encode("utf-8")
    if len(name_bytes) > 65535:
        raise ValueError("World name is too long for Bedrock level metadata.")

    tag_prefix = b"\x08\x09\x00LevelName"
    idx = raw_bytes.find(tag_prefix, 8)
    if idx == -1:
        raise ValueError("Could not find the LevelName string tag in level.dat.")

    value_length_index = idx + len(tag_prefix)
    if value_length_index + 2 > len(raw_bytes):
        raise ValueError("level.dat contains a truncated LevelName string tag.")

    old_length = int.from_bytes(raw_bytes[value_length_index:value_length_index + 2], "little")
    value_start = value_length_index + 2
    value_end = value_start + old_length
    if value_end > len(raw_bytes):
        raise ValueError("level.dat contains a truncated LevelName value.")

    new_payload = (
        raw_bytes[8:value_length_index]
        + len(name_bytes).to_bytes(2, "little")
        + name_bytes
        + raw_bytes[value_end:]
    )
    return raw_bytes[:4] + len(new_payload).to_bytes(4, "little") + new_payload


def _safe_extract_archive(archive_path: Path, destination: Path) -> None:
    """Extract a .mcworld while rejecting paths that escape the destination."""
    destination_resolved = destination.resolve()
    with zipfile.ZipFile(archive_path, "r") as archive:
        for entry in archive.infolist():
            target = (destination / entry.filename).resolve()
            if target != destination_resolved and destination_resolved not in target.parents:
                raise ValueError(f"Unsafe path in world archive: {entry.filename}")
        archive.extractall(destination)


def ensure_template() -> Path:
    """Return the extracted template, extracting the source archive once if needed."""
    if (TEMPLATE_DIR / "level.dat").is_file() and (TEMPLATE_DIR / "db").is_dir():
        return TEMPLATE_DIR

    source_archive = next((p for p in SOURCE_ARCHIVE_CANDIDATES if p.is_file()), None)
    if source_archive is None:
        candidates = ", ".join(str(p.relative_to(BASE_DIR)) for p in SOURCE_ARCHIVE_CANDIDATES)
        raise FileNotFoundError(
            "The OneBlock world template is missing. Add the supplied Void_For_Workv2.mcworld "
            f"as one of: {candidates}, then run this builder again. The archive is extracted "
            "once into assets/oneblock-template/ and reused for future builds."
        )

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="oneblock-template-") as temp_dir:
        extracted = Path(temp_dir) / "world"
        extracted.mkdir()
        _safe_extract_archive(source_archive, extracted)
        if not (extracted / "level.dat").is_file() or not (extracted / "db").is_dir():
            raise ValueError(
                f"{source_archive.name} is missing level.dat or the world db/ directory; "
                "it cannot be used as a complete Bedrock world template."
            )
        if TEMPLATE_DIR.exists():
            shutil.rmtree(TEMPLATE_DIR)
        shutil.copytree(extracted, TEMPLATE_DIR)

    return TEMPLATE_DIR


def build_mcworld(world_name: str, output_dir: str | None = None) -> str:
    """Build a complete .mcworld package from an untouched copy of the template."""
    template_dir = ensure_template()
    safe_name = sanitize_filename(world_name)
    output_path = Path(output_dir) if output_dir else BASE_DIR / "builds" / safe_name
    output_path.mkdir(parents=True, exist_ok=True)
    archive_path = output_path / f"{safe_name}.mcworld"

    with tempfile.TemporaryDirectory(prefix="oneblock-build-") as temp_dir:
        staged_world = Path(temp_dir) / "world"
        shutil.copytree(template_dir, staged_world)

        for metadata_name in ("level.dat", "level.dat_old"):
            metadata_path = staged_world / metadata_name
            if metadata_path.is_file():
                metadata_path.write_bytes(patch_level_dat(metadata_path.read_bytes(), world_name))

        (staged_world / "levelname.txt").write_text(world_name, encoding="utf-8")

        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(staged_world.rglob("*")):
                relative = path.relative_to(staged_world).as_posix()
                if path.is_dir():
                    # Keep empty pack directories represented in the archive.
                    archive.writestr(relative.rstrip("/") + "/", "")
                elif path.is_file():
                    archive.write(path, relative)

    with zipfile.ZipFile(archive_path, "r") as archive:
        names = set(archive.namelist())
        if "level.dat" not in names or "levelname.txt" not in names or not any(
            name.startswith("db/") for name in names
        ):
            archive_path.unlink(missing_ok=True)
            raise RuntimeError("Generated archive failed the complete-world structure check.")

    print(f"Successfully generated MCPE World: {archive_path}")
    print(f"World Name: {world_name}")
    print(f"Archive Size: {archive_path.stat().st_size} bytes")
    return str(archive_path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a complete Minecraft Bedrock .mcworld from the OneBlock world template"
    )
    parser.add_argument("--name", "-n", required=True, help="Name of the Minecraft Bedrock world")
    parser.add_argument("--output-dir", "-o", default=None, help="Directory for the generated .mcworld")
    args = parser.parse_args()
    build_mcworld(args.name, args.output_dir)


if __name__ == "__main__":
    main()
