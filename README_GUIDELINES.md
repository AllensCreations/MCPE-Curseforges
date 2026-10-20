# Commercial Product Description and Changelog Guidelines

This document provides strict rules, writing guidelines, and templates for `README.md`, `DESCRIPTION.md`, and `CHANGELOG.md` across **MCPE-Curseforges**. Individual add-on README.md files are download-focused landing pages; DESCRIPTION.md is the full player-facing product page. All published content must be clean, commercially presentable, and factual.

---

## Part 1: README.md and DESCRIPTION.md Guidelines

### 1. Strictly Forbidden (Zero Developer Clutter)

#### Mandatory File Separation: Download README vs. Product Description

- For every individual add-on folder, `README.md` is a **download-focused landing page**. Include the add-on name/version, direct downloadable `.mcaddon`/`.mcpack` link (or official download catalog if no direct file is available), package format, short generic import instructions, and a link to `DESCRIPTION.md`.
- Keep detailed product content in `DESCRIPTION.md`. Do not duplicate feature lists, recipes, detailed usage, compatibility claims, creator profile links, SEO keywords, or changelog content in README.
- Put all customer-facing product information in `DESCRIPTION.md`. Preserve existing verified content when moving it out of README.md; do not discard features or important usage/compatibility notes.
- New add-ons must have both files: a short download-only README.md and a detailed DESCRIPTION.md written in polished, factual, player-facing language.
- This restriction applies to individual project README files, not root/category download catalogs whose purpose is listing downloads. Other project categories should follow the user's latest explicit direction when they are updated.


#### Customer-Facing Product Language — Mandatory

Write every DESCRIPTION.md and changelog as polished, player/customer-facing content. The reader should understand the in-game experience, not see implementation details. Individual add-on README.md files focus on release/download details, basic import steps, and a link to DESCRIPTION.md.

- Use familiar Minecraft display names, never internal item identifiers such as `minecraft:diamond`, `minecraft:iron_pickaxe`, `minecraft:totem_of_undying`, or similar namespace-prefixed, underscore-separated IDs. Write “Diamond,” “Iron Pickaxe,” and “Totem of Undying” instead.
- Apply the same rule to block, mob, effect, enchantment, and other Minecraft names: use readable in-game names in public prose, headings, captions, recipes, and changelog entries.
- Do not put raw source identifiers, variable/function names, event names, JSON keys/components, API module names, file paths, tick intervals, code snippets, stack traces, commit hashes, or build-pipeline details in player-facing documentation.
- Explain what the player does, what happens in-game, what requirements apply, and what the practical benefit is. Do not explain the internal code path.
- Keep technical identifiers in the actual implementation files where Minecraft requires them. This rule changes public wording, not valid code, recipe identifiers, or resource paths.
- Exceptions are allowed only when the user explicitly requests technical documentation or a specific technical detail is essential for the reader. Explain it in plain language wherever possible.
- Keep the tone commercial and professional, but factual: no hype, clickbait, filler, or unsupported promises.

README files are player showcase pages. They must NEVER contain internal developer artifacts, code jargon, or ephemeral version labels:
- **Version information:** The in-game add-on title in each pack manifest must always use `Add-on Name (vX.Y.Z)` and match the release version. Put `by AllensCreations` in the manifest description, not in the title. README headings for add-ons should also include the verified version when maintained as part of a release; do not add redundant version badges or unverified values. Never allow duplicate suffixes such as `(v1.2.0) (v1.2.1)`.
- **Creator profile links:** Include both official creator profiles in the published project DESCRIPTION.md description or creator/attribution section, never in the download-only project README: [CurseForge](https://www.curseforge.com/members/allenscreations/projects) and [MCPEDL](https://mcpedl.com/user/allenscreations/). Keep links out of the short in-game manifest description.
- ❌ **No Script API References**: Never mention `Script API` or `@minecraft/server` in badges, text, or tables. Use player-facing terms like "modern Minecraft Bedrock mechanics".
- ❌ **No Code Blocks**: Do not include markdown code blocks (` ```javascript `, ` ```json `, ` ```text `).
- ❌ **No Markdown Tables in Project READMEs**: Do not use Markdown tables (`| ... | ... |`) in individual project READMEs. Tables break on mobile screens by forcing horizontal overflow and awkward scrolling. Use clean mobile card sections (`### [Feature / Item Name]` with bullet points) instead.
- ❌ **No Developer Internal Keywords**: Never mention `Beta APIs`, `manifest.json`, event handlers (`entityHitBlock`, `entityHurt`), or tick timing logic (`staggered 10-tick interval`).
- ❌ **No Dev Shorthand**: Avoid "BP" and "RP". Use "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- ❌ **No Code Configuration Tutorials**: Never instruct players to edit JavaScript files. Present configurable behaviors as clean card highlights or in-game commands/tags.

### 2. Commercial Showcase & Mobile-First Writing Style
- **Mobile-First Card Layout**: Highlight features, interactions, equipment stats, and recipes in concise Markdown cards with clear headings (`### [Feature Name]`) and clean bullet points (`- **Description**: ...` or `- **What Happens**: ...`). This renders smoothly on mobile phones, tablets, and desktop displays without horizontal clipping.
- **Focus on Player Benefits**: Emphasize ease of use, survival convenience, exciting immersion, and multiplayer fun.
- **Short & Punchy Sections**: Keep paragraphs under 3-4 sentences. Use bullet points and clean mobile cards instead of dense text walls.
- **Evidence-based benefits:** Describe performance, multiplayer, durability, enchantment, and compatibility behavior only when confirmed by source inspection or tests. Do not use blanket claims such as "zero lag," "smooth on all devices," "Realms compatible," or "preserves all enchantments" without specific evidence. Prefer precise descriptions of what was actually verified.

### 3. Formatting, External Readability & SEO
To ensure the markdown renders identically on external platforms (MCPEDL, CurseForge, web portals, mobile apps), apply product-page rules to DESCRIPTION.md and download-link rules to individual README.md files:
1. **Controlled Images in Add-on Documentation**:
   Individual add-on `README.md` files must not embed images. Add-on `DESCRIPTION.md` files may include item sprites and crafting recipe diagrams only, using verified absolute raw GitHub URLs. Do not include promotional banners, general screenshots, or unrelated artwork. Crafting diagrams must follow the source-based workflow in `INSTRUCTIONS.md`. Recipe generators must map every ingredient ID to a verified texture path in the current Mojang Bedrock Samples checkout (including explicit aliases when IDs and filenames differ), fail rather than use incorrect substitute icons, and be registered in the workflow's push path filters, generation steps, and staged-output list. Do not claim diagrams are published until the workflow succeeds and the referenced PNGs exist.
2. **Navigation & Download Links**:
   For individual add-on README.md files, use a verified direct package URL when available (or the official download catalog), plus a link to the matching DESCRIPTION.md. Keep source navigation and detailed product links in DESCRIPTION.md. Use verified full GitHub URLs for published links so they work outside GitHub. Relative links remain appropriate for internal repository documentation when useful:
   ```
   https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>
   https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>
   ```
3. **Bottom Search & Discovery Keywords (SEO) — Grounded in the Add-on's DESCRIPTION.md**:
   Every individual project `DESCRIPTION.md` should end with a tailored SEO section, with attribution/copyright immediately before it. Do not force SEO into directory catalogs or generic repository documentation. **Do NOT use generic placeholder keywords alone.**
   - **Use the Add-on's DESCRIPTION.md as the Basis**: Extract terms directly from the pack's actual features, mechanics, mob types, item names, commands, and gameplay benefits described across its cards and overview.
   - **Structure**: Include high-intent player search phrases that directly match what the specific add-on offers.
   - **Formula**:
     1. General Bedrock anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`).
     2. Specific feature anchors extracted from the README (e.g. for Mining Helmet: `dynamic lighting add-on`, `wearable lantern Bedrock`, `cave light mod MCPE`; for Monster Companions: `tame hostile mobs`, `pet creeper add-on`, `rideable spider Bedrock`).
     3. Gameplay keywords (e.g. `survival QoL`, `no experimental features add-on`, `achievement friendly MCPE`).

   ```markdown
   ---

   ## Search & Discovery Keywords

   Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [Core Feature 1 from DESCRIPTION.md], [Core Feature 2 from DESCRIPTION.md], [Item/Mob Name from DESCRIPTION.md], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
   ```

### 4. Standard Project README.md Template

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

If the direct release file is not available yet, use the appropriate official download catalog in the download line. README.md is for download and basic import information; put full product information in DESCRIPTION.md.

### 5. Standard Project DESCRIPTION.md Template

```markdown
# [Add-on Name] (vX.Y.Z) — [Clear, factual subtitle]

**By AllensCreations**

[Concise customer-facing summary.]

## Overview

[Verified description of the in-game experience.]

## Key Features

[Player-focused feature cards using normal Minecraft display names, never internal identifiers.]

## How to Use

[Verified player actions, requirements, crafting, and in-game behavior.]

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version]
- Experimental features: [verified status]
- Achievements: [verified status; do not promise without evidence]

## Creator and Permissions

[Creator profiles, credit, and redistribution terms.]

## Search & Discovery Keywords

[Relevant terms grounded in the actual features.]
```

---

## Part 2: CHANGELOG.md Guidelines

CHANGELOG files communicate updates directly to players and community users. They must also be written in a **promotional, player-facing voice** without internal developer clutter:

### 1. Structure & Conventions
- Maintain entries in reverse-chronological order (newest release at the top).
- Follow Semantic Versioning: `## [X.Y.Z] - YYYY-MM-DD`.
- Organize under clear, descriptive headings:
  - `### Added` — New gameplay features, items, creatures, or mechanics.
  - `### Improved & Balanced` — Refinements, performance boosts, or tuning.
  - `### Fixed` — Bug fixes described in terms of in-game experience (not line numbers or stack traces).

### 2. Player-First Language in Changelogs
- **No links in changelogs — mandatory:** Never add hyperlinks, raw URLs, Markdown links, linked project names, badges, or link references anywhere in `CHANGELOG.md`. Keep changelogs focused on player-visible changes only. README link requirements do not apply to changelogs.
- **No changelog boilerplate:** Do not add introductory prose stating that notable changes will be documented, or paragraphs explaining Keep a Changelog or Semantic Versioning. Do not include links to those standards. After the changelog title, go directly to the dated release entries (an optional horizontal rule is allowed).
- ✅ **DO explain player impact**:
  - *"Decorative leaf protection: Custom player-placed hedges and bushes are now safely ignored by the tree capitator."*
  - *"Smooth dynamic lighting: Equipping or holding torches now illuminates dark caverns with zero stutter."*
- ❌ **DON'T include developer internals**:
  - Do NOT cite function names like `executeTreeCapitator()`, `permutation.getState("persistent_bit")`, or `world.afterEvents`.
  - Do NOT paste JSON diffs, TypeScript types, or AST changes.
  - Do NOT reference commit hashes or CI pipeline steps.

### 3. Standard CHANGELOG.md Template

```markdown
# Changelog — [Add-on Name]

---

## [1.0.0] - YYYY-MM-DD

### Added
- **[Feature Title]**: [Clear, exciting summary of the newly added gameplay feature and how players use it].

### Improved & Balanced
- **[Enhancement Title]**: [Player-friendly description of performance tuning, balance changes, or visual upgrades].

### Fixed
- **[Fix Title]**: [Description of what in-game bug or glitch was resolved].
```


## Official Minecraft Reference Assets — Required

- Always reference the official Mojang Bedrock Samples repository for vanilla Bedrock textures, item/block names and identifiers, recipes, entity definitions, components, and format conventions. Inspect the actual checked-out files rather than guessing paths from memory.
- Before generating crafting diagrams, inventory all recipes and resolve every vanilla ingredient against the current Samples texture files and, when useful, official texture atlas/index metadata. IDs often differ from texture filenames; verify explicit mappings.
- Resolve all ingredient textures before rendering, and surface unresolved items together where practical. Do not use unrelated placeholder textures or silently substitute another item. Custom result/ingredient textures must come from the add-on's actual resource pack.
- Recipe images are not complete until the generator succeeds, outputs are committed, and the published image references resolve.
