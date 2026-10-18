# Minecraft Bedrock 1.26+ and Script API Compatibility

Last reviewed: 2026-10-19

## Default target

- New AllensCreations add-ons target Minecraft Bedrock **1.26+** by default.
- Treat 1.26+ as a minimum compatibility family, not a guarantee that every future 1.26.x or later release supports every API or content format unchanged.
- For each project, set `min_engine_version` to the lowest game version the implementation actually supports. Do not raise it just to match the newest game release unless the pack needs that release's features.
- Prefer stable Script API modules. Use preview/beta modules only when a requested feature genuinely requires them, and clearly note any experiment or preview requirement.

## Official compatibility references

- [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable)
- [Script API versioning](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning?view=minecraft-bedrock-stable)
- [`@minecraft/server` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable)
- [`@minecraft/server-ui` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable)
- [Latest platform version guidance](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/latestplatformversion?view=minecraft-bedrock-stable)
- [Jayly Script API references](https://jaylydev.github.io/scriptapi-docs/)

## Stable versions observed during this review

The official stable reference pages showed the following module versions when checked on 2026-10-19:

| Module | Stable version shown | Important note |
| :--- | :--- | :--- |
| `@minecraft/server` | `2.10.0` | The docs also list newer preview builds; do not use those for a stable pack by default. |
| `@minecraft/server-ui` | `2.2.0` | Check peer-dependency requirements when selecting this module alongside `@minecraft/server`. |

These are a dated reference snapshot, **not permanent defaults** and not proof that every retail 1.26+ game build supports every listed module version. Recheck the official stable pages when creating a pack or changing a dependency. Select the highest stable version supported by the actual target retail game and all dependencies used by the pack. Do not substitute a preview/RC version for a stable release.

## Achievement friendliness and experiment detection

Use this assessment for every new pack and meaningful update. It complements API version selection: a compatible Script API dependency does not by itself establish achievement compatibility or experiment requirements.

### How to classify

- Inspect the pack manifests and dependencies, stable versus preview/beta API imports, content JSON, component usage, scripts, functions, and any included world/template settings.
- Search for documented experimental features and explicit experiment requirements. Confirm any suspected requirement against current official Minecraft Creator documentation rather than relying only on a keyword match.
- Do not treat JavaScript or stable Script API usage alone as proof that experiments are required or achievements are disabled.
- If no requirement is found in the files examined, state **“No experiment requirement detected in the inspected files.”** Do not claim this proves that every world setting or future game version is safe.
- Classify achievement status as:
  - **Likely achievement-friendly:** no known disabling condition found in the inspected implementation, which uses supported stable features.
  - **Not achievement-friendly / achievements may be disabled:** a known requirement or requested setup includes cheats, experiments, preview-only features, or another documented condition that disables achievements.
  - **Unknown / needs confirmation:** source or world settings are incomplete, or platform behavior is uncertain.
- When the actual world/template settings are available, inspect experiment toggles and cheats/achievement-related settings separately. Pack files alone cannot establish the settings of an existing player world.
- Prefer a stable, non-experimental implementation when it preserves the requested behavior. Do not silently weaken the feature to avoid an experiment.
- Report the findings and evidence briefly. Never promise achievements will remain enabled unless the exact target game, pack, and world setup have been verified.

### Handoff summary

- **Achievement status:** Likely achievement-friendly / Not achievement-friendly or may disable achievements / Unknown.
- **Experiments:** None detected / Required (name the specific toggle or feature) / Unknown.
- **Evidence:** The relevant manifest, dependency, API, JSON, script, or world-setting findings.
- **Scope:** Which files/settings were inspected and whether the actual world settings were available.

## Per-pack compatibility record

For every new scripted pack, record these values in its development notes or handoff:

| Field | Record |
| :--- | :--- |
| Target Bedrock version | Exact target build, where known; otherwise 1.26+ |
| `min_engine_version` | Value in the pack manifest |
| `@minecraft/server` | Exact dependency version, or “not used” |
| `@minecraft/server-ui` | Exact dependency version, or “not used” |
| Other Script API modules | Exact versions, or “not used” |
| Preview/experimental requirement | Yes/no, with reason if yes |
| References checked | Official module/version pages and any relevant Jayly reference |
| Review date | Date the compatibility choice was checked |
| Verification status | Source created / package built / in-game tested; do not conflate these |

Do not add a separate compatibility report to player-facing READMEs unless it helps players understand a real requirement. Keep detailed records in development notes, commits, or task handoffs.

## Implementation rules for 1.26+

1. Inspect the existing manifest, entry points, imports, and pack structure before editing.
2. Confirm each API member and its availability against the chosen stable module version. Do not infer the game version from a Script API module number; they are separate version systems.
3. Prefer event-driven behavior over unnecessary per-tick polling, repeated broad entity searches, or expensive block scans.
4. Use vanilla JSON components and `.mcfunction` files where they are the simpler compatible solution. Use Script API where the feature needs it.
5. Preserve existing UUIDs, persistent identifiers, and working behavior when updating older packs. Upgrade dependencies deliberately rather than changing every old pack automatically.
6. Create the requested pack first. Do not block routine implementation on a separate validation checklist. Avoid knowingly malformed or incompatible files; resolve obvious issues during implementation and use existing build/check workflows when they are needed to produce the requested output.
7. Clearly distinguish source creation, successful packaging, automated checks, and actual in-game testing. Never claim a test or compatibility result that did not occur.
8. When a newer retail Minecraft release appears, refresh this reference after checking official documentation. Update the dated version snapshot only when the official stable pages support the change.

