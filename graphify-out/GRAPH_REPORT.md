# MCPE-Curseforges Architectural Knowledge Graph Report

- **Total Entities (Nodes):** 331
- **Total Relationships (Edges):** 397
- **Scope:** Root repository, build/release tools, script addons, behaviors, and resource packs.

## Core God Nodes (Architectural Hubs)
1. **Repo:MCPE-Curseforges** — Root coordination hub connecting tooling and packs.
2. **Category:Addons** — Core Bedrock addons collection.
3. **Category:Script** — Standalone GameTest/Bedrock Server script packages.
4. **Script:manifest_tools.py** — Master manifest validator and single-version (`vX`) engine.
5. **Script:auto_bump_and_build.py** — Build automation and package release orchestrator.
6. **Script:apply_update.py** — Update patch engine executing atomic spec operations.

## Key Subsystems
- **Automated Tooling Suite (`scripts/`):** 68 maintenance, sync, and release orchestrator scripts.
- **Project Catalog (`MCPEDL/`):** 62 verified Minecraft Bedrock projects with single-version `vX` headers.
- **Script Pack Architecture:** Behavior Pack scripts hooking `@minecraft/server` and `@minecraft/server-ui`.
