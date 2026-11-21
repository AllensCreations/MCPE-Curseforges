# MCicons reference (Minecraft item and block icons)

`mcicons-2.1.1.tgz` is the unchanged release file from https://github.com/iMumd/mcicons (v2.1.1, `@imumd/mcicons`).
`scripts/sync_mcicons.py` downloads it (workflow: Build Changed Packs & Sync Catalogs) and checks its SHA-256. Do not edit by hand.

- Use these icons for Minecraft items and blocks in recipe diagrams, README and listing images (INSTRUCTIONS.md 1.5).
- Inside the file: `package/dist/icons/minecraft_<id>.png` (64x64 RGBA; `minecraft:diamond_sword` is `minecraft_diamond_sword.png`), `package/dist/catalog.json`, `package/ASSET-NOTICE.md`, `package/LICENSE`.
- In code: `scripts/lib/mcicons.py` (`icon_image`, `has_icon`) reads the icons straight from the file.
- Minecraft artwork belongs to Mojang Studios / Microsoft. Read `ASSET-NOTICE.md` inside the file before reuse.
