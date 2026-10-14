---
name: mcpe-curseforges-readme
description: >-
  Enforce consistent, technically accurate, maintainable, and GitHub-compatible
  README.md documentation across all Minecraft Bedrock add-ons, resource packs,
  behavior packs, minigames, and world maps in the MCPE-Curseforges repository.
---

# MCPE-Curseforges README Documentation Standard

## 1. Purpose and Scope

This standard defines the mandatory documentation requirements for every `README.md` created or maintained within the `MCPE-Curseforges` repository.

Its purpose is to ensure that all projects have consistent formatting, verifiable technical information, useful installation instructions, properly attributed assets, and documentation that accurately reflects the actual implementation.

These rules apply to:

- Minecraft Bedrock behavior packs.
- Minecraft Bedrock resource packs.
- Combined add-ons (`.mcaddon`).
- Individual packs (`.mcpack`).
- Custom items, equipment, tools, weapons, and blocks.
- Minigames, gameplay systems, and scripted mechanics.
- Custom world maps, survival challenges, and adventure maps.
- Utilities, templates, and developer tools for Minecraft Bedrock.

**Core principle:** Documentation must describe the actual project, not an idealized or assumed implementation.

When a requirement does not apply to a project, omit the corresponding section or explicitly mark it as not applicable when necessary. Never invent features or technical specifications merely to satisfy the template.

---

## 2. Mandatory Writing Rules

### 2.1. No Emojis

Do not use emojis in documentation.

This prohibition applies to:

- Titles and headings.
- Paragraphs and lists.
- Tables and table cells.
- Installation instructions.
- Badges and labels.
- Image captions and section descriptions.

Use standard Markdown formatting and descriptive text instead.

### 2.2. No Marketing Filler or AI-Generated Clichés

Write in a direct, technical, factual, and informative style.

Do not use:

- Clickbait titles or rhetorical questions.
- Artificial urgency or exaggerated promises.
- Generic promotional introductions.
- Repetitive summaries that provide no additional information.
- Unsupported superlatives such as "best," "ultimate," or "revolutionary."
- Generic AI-style phrases such as "Take your gameplay to the next level."
- Empty claims such as "seamless experience," "next-generation gameplay," or "perfectly optimized."
- Unnecessary statements about how exciting, amazing, or innovative a project is.

Avoid introductory filler such as:

"Tired of the same old Minecraft experience?"

Instead, describe the implementation directly.

Example:

"This behavior pack adds craftable mining equipment with configurable durability, custom textures, and data-driven item definitions."

Every paragraph must communicate useful information about the project.

### 2.3. Technical Accuracy and Evidence

Never fabricate technical details.

Verify documentation against the actual project files whenever they are available.

Relevant evidence includes:

- `manifest.json`.
- Item, block, entity, and recipe JSON files.
- JavaScript or TypeScript source files.
- Script API imports and API versions.
- Texture and model assets.
- Animation and render-controller definitions.
- World configuration and map files.
- Release archives and existing project documentation.
- Actual test results and reproducible testing procedures.

Do not invent or assume:

- Minecraft version compatibility.
- Script API versions or dependencies.
- Item identifiers.
- Recipe patterns or crafting yields.
- Durability values, damage values, or armor points.
- Texture paths or model filenames.
- Supported platforms.
- Experimental requirements.
- Performance measurements.
- Test results or successful installation claims.

If a value cannot be verified, omit it or identify it explicitly as unverified.

Do not present an assumption as a confirmed technical fact.

### 2.4. No Unsupported Performance Claims

Do not claim that a pack has:

- Zero lag.
- Zero performance impact.
- Zero residue.
- Perfect compatibility.
- No bugs.
- Guaranteed stability.

These claims require evidence and may not be universally achievable.

Instead, document the actual implementation.

For example:

- "The script removes temporary entities when the associated effect ends."
- "The scheduled task stops when the player leaves the affected area."
- "The pack does not create persistent entities during normal operation."
- "Performance has not been benchmarked across multiple devices."

Only describe cleanup behavior that the code actually implements.

### 2.5. No Unnecessary Content

Do not add sections simply because they appear in the standard template.

Avoid:

- Empty feature lists.
- Repeated descriptions.
- Placeholder tables in published documentation.
- Duplicate installation instructions.
- Irrelevant technical specifications.
- Unused command references.
- Unsupported compatibility badges.
- Empty image sections.

A shorter, accurate README is preferable to a longer README filled with irrelevant information.

### 2.6. Language and Terminology

Use clear English and standard Minecraft Bedrock terminology.

Follow these conventions:

- Use `behavior pack`, `resource pack`, `add-on`, and `world template` appropriately.
- Use inline code formatting for identifiers, filenames, paths, commands, and API names.
- Use fenced code blocks for commands, configuration examples, and longer code snippets.
- Use consistent capitalization for product names and technical terms.
- Use sentence case for ordinary headings.
- Use exact identifier spelling and capitalization from the source files.

### 2.7. No Internal Publisher or Distribution Checklists

Never include publisher checklists, developer account prerequisites, or internal platform distribution instructions in customer- or player-facing documentation.

Prohibited in README.md:
- Creator account connection reminders (e.g., "Connected your Curseforge Account").
- Platform prerequisite checklists (e.g., "MCPEDL and CurseForge Distribution Checklist").
- Internal image title or tagging instructions (e.g., "Your project has an image with the title MCPEDL").
- Dashboard or platform toggle requirements (e.g., "third party sharing option enabled", "files are approved").
- Any internal deployment, synchronization, or submission tasks intended for creators rather than players.

README files are designed exclusively for end-users, players, and server operators. All internal publishing checklists and store upload procedures must remain completely outside player-facing documents.

---

## 3. Markdown and Asset Rules

### 3.1. Standard Markdown Only

Use GitHub-compatible Markdown.

Prefer:

- Headings.
- Unordered and ordered lists.
- Tables.
- Fenced code blocks.
- Relative Markdown links.
- Standard Markdown images.
- Supported GitHub badge images.

Do not use raw HTML or CSS to construct:

- Crafting grids.
- Feature tables.
- Installation layouts.
- Custom interface mockups.
- Decorative page layouts.

Avoid unnecessary HTML used solely to control alignment, spacing, or appearance.

Standard Markdown must remain readable in both GitHub's rendered view and the raw source.

### 3.2. Relative Image Paths

All repository-owned images must use repository-relative paths.

Examples:

`![Mining Helmet](assets/mining-helmet.png)`

`![Crafting Recipe](assets/recipe-mining-helmet.png)`

`![World Preview](screenshots/world-preview.jpg)`

Never use `raw.githubusercontent.com` URLs for repository-owned images.

Do not use absolute local filesystem paths or machine-specific locations.

Do not invent image paths. Confirm that referenced files exist in the repository.

When a file is located in another directory, calculate its path relative to the README that references it.

For example, a README at:

`addons/Mining-Helmet/README.md`

can reference an image in:

`addons/Mining-Helmet/assets/helmet.png`

using:

`![Helmet Texture](assets/helmet.png)`

### 3.3. Image Requirements

Use images when they provide useful visual information.

Recommended assets include:

- `banner.png` or `banner.jpg`: Main project banner.
- `screenshots/`: Gameplay screenshots and world previews.
- `assets/`: Item previews, texture previews, and supporting graphics.
- `recipes/`: Pre-rendered crafting recipe images.

These filenames are conventions, not mandatory names. Existing repository naming conventions take precedence unless a deliberate reorganization is requested.

Do not generate fake gameplay screenshots or present concept art as a screenshot of the actual project.

Do not label an illustration as an in-game screenshot.

If an image is unavailable, omit the image rather than referencing a nonexistent file.

### 3.4. Crafting Recipe Images

Never use raw HTML or CSS to construct crafting recipe grids.

Crafting recipes must be represented by standalone PNG images when visual recipe documentation is needed.

Example:

`![Crafting Recipe: Mining Helmet](recipes/recipe-mining-helmet.png)`

The image should reproduce the familiar Minecraft crafting interface, including:

- Correct ingredient arrangement.
- Empty slots where applicable.
- Output item.
- Output quantity when relevant.
- Consistent slot dimensions.
- Clear item icons.
- Readable rendering at the intended display size.

The image must accurately represent the recipe defined in the actual project files.

Do not fabricate recipe arrangements from item names alone.

Each image must have an accompanying textual description for accessibility and users who cannot view images.

### 3.5. Image Accessibility

Use descriptive alt text for every informative image.

Good:

`![Mining Helmet equipped on a player in a dark cave](screenshots/mining-helmet-cave.png)`

Avoid:

`![Image](image1.png)`

Decorative images should not be used when they contribute no meaningful information.

---

## 4. README Structure

Every project README must follow the structure below where applicable.

Sections may be omitted when they are irrelevant to the project.

Do not force a world map to include crafting recipes or require a resource pack to document nonexistent custom items.

### 4.1. Header and Project Banner

Start with a descriptive H1 heading.

Recommended format:

`# <Project Name> - <Functional Descriptor> for Minecraft Bedrock`

Example:

`# Mining Helmet Add-on - Custom Mining Equipment for Minecraft Bedrock`

The heading must identify the project and its primary function without clickbait.

If a suitable banner exists, place it directly below the heading.

Example:

`![Mining Helmet Add-on Banner](banner.png)`

Do not create a banner solely to satisfy the template.

#### Compatibility and Release Badges

Use badges only when their values can be verified.

Relevant badges may communicate:

- Minecraft Bedrock compatibility.
- Current release version.
- Project format.
- License, when applicable.
- Build or validation status, when supported by actual automation.

Example:

`Minecraft Bedrock: Verified Version Range`

`Release: 1.0.0`

`.mcaddon`

Do not create fake status badges or imply that a project has passed automated testing when no such test exists.

Badges are optional when they would duplicate information or create unnecessary clutter.

#### Creator and Description

Identify the creator and summarize the project's purpose.

Use this format:

Creator: AllensCreations  
Description: <One-sentence factual description of the project's functionality>

The description must be concise, specific, technically accurate, and a maximum of 256 characters (strictly enforced across README summaries and manifest metadata).

Do not include unsupported compatibility or performance claims.

### 4.2. Overview

Explain the project in a short, informative section.

Include the following when relevant:

- The problem the project addresses or the gameplay mechanic it introduces.
- Its primary functionality.
- The major components or systems.
- How players interact with the functionality.
- Whether the project uses data-driven definitions, scripts, custom assets, or a combination of these.

For scripted packs, document the actual APIs and execution model.

For data-driven packs, describe the relevant item, block, entity, or recipe systems.

For world maps, explain the world concept, starting conditions, objectives, progression, and any important map-specific mechanics.

Do not claim that a pack uses the Script API unless its implementation confirms this.

### 4.3. Features and Specifications

List implemented features using concise bullet points.

Each feature must describe observable functionality or a verifiable technical capability.

Example:

- Adds a custom mining helmet.
- Defines a dedicated item identifier in the behavior pack.
- Uses a custom texture supplied by the resource pack.
- Provides a shaped crafting recipe.
- Supports repair using a specified material, if implemented.

Do not list planned features as existing features.

Clearly separate implemented functionality from planned work if future development needs to be documented.

#### Specification Tables

Use tables when comparing multiple items, tiers, mechanics, or configuration values.

Example:

| Item | Attribute | Value | Description |
| :--- | :--- | :--- | :--- |
| Mining Helmet | Durability | Verified value | Maximum durability defined by the implementation |
| Mining Helmet | Repair Material | Verified item | Material accepted by the repair system |

Use the following fields only when applicable:

- Item or feature.
- Identifier.
- Damage or power.
- Durability.
- Range.
- Duration.
- Cooldown.
- Resource cost.
- Equipment slot.
- Repair material.
- Enchantment support.
- Command syntax.
- Configuration options.

Use Minecraft's actual terminology and measurement units.

Do not mix unverified gameplay values with confirmed implementation details.

If the source does not define a value, do not invent one.

### 4.4. Item, Block, Entity, and Texture Specifications

Include this section only when the project contains relevant custom assets or definitions.

Embed an actual preview when available.

Example:

`![Mining Helmet Texture Preview](assets/mining-helmet.png)`

Use a specification table where it provides useful information.

| Property | Value |
| :--- | :--- |
| Display Name | Mining Helmet |
| Identifier | `custom:mining_helmet` |
| Definition File | Verified relative path |
| Texture File | Verified relative path |
| Model File | Verified relative path or Not Applicable |
| Equipment Slot | Verified slot or Not Applicable |
| Repair Material | Verified material or Not Applicable |
| Enchantability | Verified value or Not Applicable |

The example identifier above is illustrative and must not be copied into actual documentation unless it matches the project.

#### Technical Verification

Before documenting an identifier or asset path, verify it against the relevant source file.

Distinguish between:

- Resource identifiers.
- Texture identifiers.
- File paths.
- Display names.
- Model identifiers.
- Runtime API identifiers.

Do not treat these as interchangeable.

Only document model dimensions, native resolutions, geometry, and rendering properties when they are known and relevant.

For example, a 16x16 texture is not a universal requirement for every Minecraft Bedrock asset.

### 4.5. Crafting Recipes

Include this section when the project provides crafting recipes or when recipe documentation is necessary to use the project.

For each documented recipe, include:

1. Recipe name.
2. Recipe image, when available.
3. Ingredient arrangement.
4. Required ingredients and quantities.
5. Output item and quantity.
6. Any special crafting requirements.

Example:

`![Crafting Recipe: Mining Helmet](recipes/recipe-mining-helmet.png)`

**Ingredients**

- Ingredient A: Verified quantity.
- Ingredient B: Verified quantity.
- Ingredient C: Verified quantity.

**Result:** Mining Helmet x1

**Pattern:** Describe the ingredient arrangement using plain text.

All ingredients, arrangements, and output quantities must match the actual recipe definition.

For shaped recipes, describe the grid row by row when this improves clarity.

For shapeless recipes, state that ingredient placement is unrestricted when that behavior is confirmed by the recipe definition.

If the project does not include crafting recipes, omit this section.

### 4.6. Installation and Configuration

Provide instructions appropriate to the actual project format.

Possible formats include:

- `.mcaddon`
- `.mcpack`
- `.mcworld`
- Manually installed behavior packs.
- Manually installed resource packs.
- Scripted projects with additional dependencies.

Do not assume that every project requires Experimental Features or Beta APIs.

#### Installation Instructions

Write numbered steps in the correct order.

A typical `.mcaddon` installation guide may include:

1. Download the release file from the project's designated release location.
2. Open the file using Minecraft, or use the platform's supported import procedure.
3. Wait for Minecraft to finish importing the pack.
4. Open the target world settings or create a world, depending on the project.
5. Activate the required behavior and resource packs.
6. Configure any project-specific settings.
7. Enter the world and verify that the documented functionality works.

Adjust these instructions to match the actual distribution format and supported platform.

Do not present platform-specific instructions as universal.

#### Dependencies and Experimental Features

List only requirements verified by the project.

Example:

| Requirement | Status | Purpose |
| :--- | :--- | :--- |
| Behavior Pack | Required | Provides custom gameplay logic |
| Resource Pack | Required | Supplies custom textures |
| Script API | Required | Used by implemented scripts |
| Experimental Features | Conditional | Required only when the implementation depends on them |

Replace these illustrative values with the actual project requirements.

When an API or experimental toggle is required, provide its exact name where it can be verified.

Do not instruct users to enable every available experimental feature without a technical reason.

### 4.7. Controls, Commands, and Gameplay Instructions

Include this section when the project introduces player-facing controls, commands, objectives, or special mechanics.

Document:

- Available commands.
- Command syntax and arguments.
- Required permissions.
- Default key or control mappings, when applicable.
- Objectives and progression.
- Reset behavior.
- Multiplayer behavior.
- Known restrictions.

Place commands in fenced code blocks or inline code.

Do not invent commands or imply that an unsupported command exists.

For maps and minigames, explain how to begin playing, what the objective is, and how progression or completion works.

Keep player instructions separate from developer implementation details when doing so improves readability.

### 4.8. Compatibility and Known Limitations

Document the project's known compatibility boundaries.

Include relevant information about:

- Tested Minecraft Bedrock versions.
- Required dependencies.
- Platform-specific restrictions.
- Multiplayer limitations.
- Experimental API requirements.
- Known conflicts with other packs.
- Features that are incomplete or unsupported.

Distinguish tested compatibility from expected compatibility.

Example:

"Tested on Minecraft Bedrock version <verified version>. Other versions have not been verified."

Never claim universal compatibility based on testing a single version.

If compatibility testing has not been performed, state that clearly rather than inventing a supported version range.

### 4.9. Development and Testing

Include this section for developer-oriented projects, scripted packs, or repositories intended for contributions.

Document relevant development information, such as:

- Repository structure.
- Required tools.
- Dependencies.
- Build or packaging commands.
- Validation procedures.
- Test environments.
- Reproducible issues.
- Known limitations.

Only include commands that exist and have been verified.

Clearly distinguish between:

- Static validation.
- Successful packaging.
- Successful import.
- In-game testing.
- Multiplayer testing.
- Performance benchmarking.

These activities are not equivalent.

Never claim that a project has been tested unless evidence supports that statement.

For simple standalone maps or packs, this section may be omitted.

### 4.10. Credits, Permissions, and Attribution

Identify the creator and any third-party contributions.

Use:

Creator: AllensCreations

When relevant, credit:

- Original authors.
- Texture and model creators.
- Sound designers.
- Libraries and dependencies.
- External resources.
- Contributors and testers.

Follow the applicable licenses and permission requirements for third-party assets.

Do not claim ownership of material that belongs to someone else.

#### Redistribution Policy

State the project's actual redistribution terms.

If the project is distributed under a custom permission policy, describe the restrictions clearly.

Possible restrictions include:

- Reuploading the original project without permission.
- Redistributing modified versions without permission.
- Repackaging the project for another distribution platform.
- Bypassing the designated download or distribution process.
- Removing or misrepresenting creator attribution.

Do not assume that a README statement overrides an applicable license, grants ownership over third-party assets, or supersedes platform rules.

If the project has a formal license, include the appropriate license file and link to it using a relative path.

If no formal license exists, do not invent one.

### 4.11. Copyright Footer

Use the following footer when it accurately reflects the project's rights and permissions:

`© All rights reserved for AllensCreations.`

Place it at the bottom of the README after the applicable credits and attribution sections.

Where third-party assets are included, preserve their required notices and applicable license terms.

---

## 5. Project-Type Adaptation

The standard must adapt to the actual project.

### 5.1. Add-ons and Custom Equipment

Prioritize:

- Features.
- Item and block specifications.
- Identifiers.
- Textures and models.
- Crafting recipes.
- Repair behavior.
- Enchantments.
- Dependencies.
- Installation.
- Compatibility.

### 5.2. Scripted Behavior Packs

Prioritize:

- Implemented gameplay mechanics.
- Script API dependencies.
- Manifest configuration.
- Event handling.
- Entity and player interactions.
- Scheduling and cleanup behavior.
- Commands and permissions.
- Performance considerations.
- Known limitations.
- Testing procedures.

Do not document internal implementation details that do not help users or developers understand or operate the pack.

### 5.3. Resource Packs

Prioritize:

- Visual changes.
- Included assets.
- Texture and model information.
- Supported Minecraft versions.
- Required dependencies.
- Installation and activation.
- Known rendering limitations.
- Asset attribution.

Do not include irrelevant behavior-pack instructions.

### 5.4. World Maps and Survival Challenges

Prioritize:

- World concept.
- Starting conditions.
- Objectives.
- Progression mechanics.
- Available islands, structures, or areas.
- Multiplayer support, if verified.
- Required settings.
- Installation.
- Compatibility.
- Known map limitations.

Do not require item specification tables or crafting recipe images unless they are relevant to the map.

### 5.5. Minigames

Prioritize:

- Game objective.
- Player count and supported modes.
- Starting instructions.
- Controls.
- Rules.
- Scoring and progression.
- Win and loss conditions.
- Reset behavior.
- Multiplayer requirements.
- Compatibility and limitations.

Only include player counts, mechanics, and modes that are actually implemented or verified.

---

## 6. Repository Integrity and Maintenance

### 6.1. Preserve Existing Project Information

When updating an existing README:

- Preserve verified technical details.
- Retain relevant project-specific information.
- Preserve valid relative links.
- Keep existing asset paths unless a deliberate change is required.
- Maintain compatibility with the repository's actual structure.
- Remove outdated information only when it has been identified as outdated.

Do not rewrite a working README from scratch when a targeted correction is sufficient.

### 6.2. Verify File References

Before completing a README update, check:

- Every referenced image exists.
- Every referenced local document exists.
- Every documented identifier matches the implementation.
- Every command is supported.
- Every recipe matches its definition.
- Every dependency is necessary and correctly identified.
- Every badge reports accurate information.
- Every compatibility claim has a defensible basis.

Do not silently create references to files that have not been created.

### 6.3. Preserve Existing Repository Conventions

Follow the repository's established naming, directory, and formatting conventions.

Do not reorganize unrelated directories or rename assets solely to make the README match an example.

If a proposed change requires moving or renaming files, update all affected references and explain the change when appropriate.

### 6.4. No Unrequested Code Changes

When the task is documentation-only:

- Do not modify gameplay scripts.
- Do not modify item definitions.
- Do not change recipes.
- Do not change manifests.
- Do not rename project assets.
- Do not alter world data.

Modify implementation files only when explicitly requested or when the task specifically requires fixing the underlying implementation.

Documentation must describe the implementation rather than silently changing it.

---

## 7. Mandatory Documentation Workflow

When creating or updating a README:

1. Inspect the target project's existing README, directory structure, manifests, source files, configuration files, and relevant assets.
2. Identify the project type and determine which documentation sections apply.
3. Verify technical claims against the implementation and available test evidence.
4. Draft the README using this standard while preserving valid project-specific information.
5. Validate relative links, image paths, identifiers, recipes, commands, dependencies, and compatibility statements.
6. Review the final document for fabricated details, redundant content, unsupported claims, and formatting violations.
7. Modify only the requested documentation files unless additional changes are explicitly authorized.

If repository access is unavailable, do not pretend to have inspected the files. Clearly identify information that requires verification.

If essential information is missing, omit it or mark it as unverified instead of inventing an answer.

Report validation limitations honestly. A completed README does not imply that the add-on has been built, imported, or tested in Minecraft.

---

## 8. Final Validation Checklist

Before publishing or completing a README, verify the following.

### Writing and Formatting

- [ ] No emojis.
- [ ] No clickbait or generic marketing filler.
- [ ] No fabricated technical details.
- [ ] No unnecessary sections.
- [ ] Standard Markdown formatting.
- [ ] Consistent terminology and capitalization.
- [ ] Clear separation between confirmed facts and unverified information.

### Assets and Links

- [ ] All repository-owned images use relative paths.
- [ ] No `raw.githubusercontent.com` image links.
- [ ] All referenced files exist.
- [ ] Images have meaningful alt text.
- [ ] Crafting recipes use standalone images when required.
- [ ] Image descriptions accurately represent the referenced assets.

### Technical Accuracy

- [ ] Identifiers match the actual project files.
- [ ] Specifications match the implementation.
- [ ] Recipes and output quantities are verified.
- [ ] Dependencies and experimental requirements are accurate.
- [ ] Commands are supported.
- [ ] Compatibility claims are supported by available evidence.
- [ ] Performance claims are specific and defensible.
- [ ] Testing statements accurately describe the tests performed.

### Project Integrity

- [ ] Existing project information is preserved where appropriate.
- [ ] Project-type requirements are respected.
- [ ] No unrelated implementation files were modified.
- [ ] No internal publisher checklists, creator account requirements, or distribution prerequisite notes.
- [ ] Attribution and redistribution terms are accurate.
- [ ] The copyright footer is included when applicable.

A README is ready for publication only when its statements are accurate, its links are valid, and its structure helps the intended audience understand, install, use, or maintain the project.

---

## 9. Final Enforcement Principle

**Accuracy takes priority over completeness, and usefulness takes priority over length.**

Do not invent information to fill a section. Do not claim that a feature exists because the template mentions it. Do not claim that a project has been tested because its documentation looks complete.

Every README must reflect the actual project, its verified behavior, its dependencies, its limitations, and its distribution requirements.

The objective is consistent, professional, maintainable documentation across MCPE-Curseforges without sacrificing technical accuracy or project-specific flexibility.
