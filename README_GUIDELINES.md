# README, DESCRIPTION, and CHANGELOG Guidelines

All documentation rules, player-facing writing, creator links, attribution, and templates. This file is part of the repository instructions: `INSTRUCTIONS.md` still applies in full, wins on any conflict, and its accuracy rules (never invent facts, never claim untested results) govern everything written here.

---

## 1. File Roles

| File | Purpose |
| :--- | :--- |
| Add-on `README.md` | Download landing page: name, verified version, direct `.mcaddon`/`.mcpack` link (or catalog link), package format, short generic import steps, link to `DESCRIPTION.md`. |
| Add-on `DESCRIPTION.md` | Full customer-facing product page: overview, features, usage, recipes, compatibility, achievement/experiment status, creator links, attribution, search keywords. |
| `CHANGELOG.md` | Concise, player-visible changes only. |
| Root and category catalogs | Project lists with version, source, and download links. May use compact tables. |

- A project README contains no features, recipes, compatibility claims, images, creator bios, keywords, or changelog text.
- A new add-on gets both files: a download-only README and a DESCRIPTION starter.
- When updating an older add-on, move verified README content into `DESCRIPTION.md` before replacing the README. Never lose verified information or duplicate full descriptions across both.
- Catalogs are the download source of truth:
  - Existing Add-ons: `MCPEDL/addons/README.md#available-add-ons`
  - New Add-ons: `MCPEDL/new_addons/README.md#available-add-ons`
  - Maps: `MCPEDL/maps/README.md#available-maps`
  - Scripts & Challenges: `MCPEDL/script/README.md#available-scripts`
  - Master builds: `builds/README.md#available-pack-and-map-builds`

## 2. Player-Facing Writing

Applies to every public README, DESCRIPTION, CHANGELOG, and catalog entry. Write for players, not developers.

- Lead with the player experience: what players can do, how it behaves in-game, what they need.
- Use in-game display names ("Diamond", "Totem of Undying"), never identifiers such as `minecraft:diamond`. Same for blocks, mobs, enchantments, and effects. Identifiers stay in implementation files and are not changed for appearance.
- Exclude source terminology: file names, function/event/API/module names, JSON components, config keys, tick intervals, code snippets, stack traces, commit hashes, and build details.
- Never mention `Script API` or `@minecraft/server`; use phrasing such as "modern Minecraft Bedrock mechanics".
- Describe mechanics, not code ("The ability activates when you use the relic").
- No "BP" or "RP". Write "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- No code blocks and no instructions to edit JavaScript or JSON. Present configurable behavior as in-game options, commands, or tags.
- Tone: polished and factual. No hype, clickbait, rhetorical questions, filler, or emojis.
- Include exact values, recipes, and requirements only when verified from source or tests.
- Do not claim "zero lag", universal multiplayer or Realms compatibility, achievement preservation, or "no experimental features" without evidence for that exact claim.
- Technical detail is allowed only when the user asks for technical documentation; otherwise translate requirements into plain player language.

## 3. Layout and Platform Formatting

- Documentation must render cleanly on GitHub, CurseForge, MCPEDL, and Planet Minecraft.
- No Markdown tables in project READMEs or DESCRIPTIONs; they overflow on mobile. Use `### Feature Name` cards with short bullets (`- **What Happens**: ...`). Catalogs may use tables.
- Paragraphs of 3-4 sentences at most. Avoid LaTeX notation; use `->` or a Unicode arrow.
- No redundant version badges. Never allow duplicate suffixes such as `(v1.2.0) (v1.2.1)`.
- Never copy a legacy MCPEDL description to CurseForge unchanged; the platforms use different backends, so adjust in CurseForge's `</>` editor.
- Use relative paths for links between repository files. Use full URLs in published pages:
  - `https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>`
  - `https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>`
- If HTML image sizing is needed, use relative widths and omit fixed height.
- Collapsible spoilers (CurseForge `</>` editor): `<h2>Spoiler Title</h2><div class="spoiler">content</div>`. Preview on the target platform first and do not promise cross-platform behavior.
- Images: READMEs have none. DESCRIPTIONs may include only item sprites and crafting recipe diagrams, and only when requested or required by the project (see "Recipe Images and Item Sprites" in `INSTRUCTIONS.md`).

## 4. Creator Profile Links and Attribution

Both belong in `DESCRIPTION.md` only, never in a project README, changelog, or manifest description.

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

Put the profile links in the Creator and Permissions section. Put this block immediately before the final Search & Discovery Keywords section:

```markdown
## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
```

## 5. Search & Discovery Keywords

Every add-on `DESCRIPTION.md` ends with a keyword section built from its real features, not generic filler: general anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`), feature anchors from the description, and gameplay anchors (such as `survival QoL`, `achievement friendly MCPE`) only if verified.

```markdown
---

## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [feature 1], [feature 2], [item or mob name], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
```

## 6. Templates

**Project README.md**

```markdown
# [Add-on Name] (vX.Y.Z)

Download the current release of **[Add-on Name]** for Minecraft Bedrock Edition.

## Download

- **Version:** X.Y.Z
- **Package format:** `.mcaddon`
- **Direct download:** [Download [Add-on Name] (.mcaddon)](verified-direct-download-link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Add-on Information

For gameplay features, usage details, recipes, compatibility notes, and other project information, read the [full description](verified-DESCRIPTION-link).
```

Use a verified direct package URL when one exists; otherwise link the official catalog.

**Project DESCRIPTION.md**

```markdown
# [Add-on Name] (vX.Y.Z) — [Clear, factual subtitle]

**By AllensCreations**

[Concise customer-facing summary.]

## Overview

[Verified description of the in-game experience.]

## Key Features

### [Feature Name]
- **What Happens**: [Player-facing behavior, using normal Minecraft names.]

## How to Use

[Verified player actions, requirements, crafting, and in-game behavior.]

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version]
- Experimental features: [verified status]
- Achievements: [verified status; do not promise without evidence]

## Creator and Permissions

[CurseForge and MCPEDL profile links.]

## Guidelines and Attribution

[Attribution block.]

---

## Search & Discovery Keywords

[Keywords.]
```

**CHANGELOG.md**

- Newest release first, with headings `## [X.Y.Z] - YYYY-MM-DD`. Group entries under `### Added`, `### Improved & Balanced`, and `### Fixed` (bugs described by in-game experience).
- No hyperlinks, raw URLs, linked names, or badges anywhere.
- No boilerplate: after `# Changelog — [Add-on Name]`, go straight to release entries (an optional `---` is fine). No intro sentence and no mention of Keep a Changelog or Semantic Versioning.
- Explain player impact, for example "Decorative leaf protection: Hedges and bushes you place are now ignored by the tree capitator." No function names, event names, JSON or type diffs, commit hashes, or CI steps. No unverified benefits.

```markdown
# Changelog — [Add-on Name]

---

## [1.0.0] - YYYY-MM-DD

### Added
- **[Feature Title]**: [Clear summary of the new gameplay feature and how players use it].

### Improved & Balanced
- **[Enhancement Title]**: [Player-friendly description of tuning, balance, or visual changes].

### Fixed
- **[Fix Title]**: [What in-game bug or glitch was resolved].
```
