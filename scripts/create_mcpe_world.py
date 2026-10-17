#!/usr/bin/env python3
"""
Create MCPE World (.mcworld) from Reference level.dat
Takes a world name, patches assets/oneblock-assets/level.dat, and packages
a valid Minecraft Bedrock .mcworld file.
"""

import os
import sys
import argparse
import re
import zipfile
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENCE_LEVEL_DAT = os.path.join(BASE_DIR, "assets", "oneblock-assets", "level.dat")


def sanitize_filename(name: str) -> str:
    """Converts a display name into a clean, safe filename."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned if cleaned else "MCPE_World"


def patch_level_dat(raw_bytes: bytes, new_name: str) -> bytes:
    """
    Patches LevelName inside Bedrock level.dat NBT data and updates the length header.
    Bedrock level.dat structure:
      bytes 0-3: Header version (int32 little endian)
      bytes 4-7: Payload length (int32 little endian)
      bytes 8+:  Little-endian NBT root compound
    """
    name_bytes = new_name.encode("utf-8")
    tag_prefix = b"\t\x00LevelName"  # Type 8 (string tag), name length 9, "LevelName"
    idx = raw_bytes.find(tag_prefix)
    if idx == -1:
        return raw_bytes

    val_len_idx = idx + len(tag_prefix)
    old_len = int.from_bytes(raw_bytes[val_len_idx : val_len_idx + 2], "little")
    val_start = val_len_idx + 2
    val_end = val_start + old_len

    new_len_bytes = len(name_bytes).to_bytes(2, "little")
    new_payload = raw_bytes[8:val_len_idx] + new_len_bytes + name_bytes + raw_bytes[val_end:]
    new_header = raw_bytes[:4] + len(new_payload).to_bytes(4, "little")
    return new_header + new_payload


def build_mcworld(world_name: str, output_dir: str = None) -> str:
    """Builds a .mcworld package containing level.dat, level.dat_old, and levelname.txt."""
    if not os.path.exists(REFERENCE_LEVEL_DAT):
        raise FileNotFoundError(f"Reference level.dat not found at: {REFERENCE_LEVEL_DAT}")

    safe_name = sanitize_filename(world_name)
    if not output_dir:
        output_dir = os.path.join(BASE_DIR, "builds", safe_name)

    os.makedirs(output_dir, exist_ok=True)
    output_mcworld_path = os.path.join(output_dir, f"{safe_name}.mcworld")

    with open(REFERENCE_LEVEL_DAT, "rb") as f:
        orig_bytes = f.read()

    patched_bytes = patch_level_dat(orig_bytes, world_name)

    # Build ZIP archive (.mcworld is a zip with world files at the root)
    with zipfile.ZipFile(output_mcworld_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("level.dat", patched_bytes)
        zf.writestr("level.dat_old", patched_bytes)
        zf.writestr("levelname.txt", world_name.encode("utf-8"))

    print(f"Successfully generated MCPE World: {output_mcworld_path}")
    print(f"World Name: {world_name}")
    print(f"Archive Size: {os.path.getsize(output_mcworld_path)} bytes")
    return output_mcworld_path


def main():
    parser = argparse.ArgumentParser(description="Create MCPE World from level.dat reference")
    parser.add_argument("--name", "-n", required=True, help="Name of the Minecraft Bedrock world")
    parser.add_argument("--output-dir", "-o", default=None, help="Directory to save the generated .mcworld")
    args = parser.parse_args()

    build_mcworld(args.name, args.output_dir)


if __name__ == "__main__":
    main()
