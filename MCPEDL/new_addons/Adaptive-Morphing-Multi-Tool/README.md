# Adaptive Morphing Multi-Tool

Adaptive tool variants for Minecraft Bedrock by AllensCreations. The tool changes its role after a block is broken or an entity is hit.

## Features

- Five roles: axe, pickaxe, shovel, sword, and shears.
- Six material tiers: wood, copper, iron, gold, diamond, and netherite.
- Custom pixel-art icons for each tool role.
- Tier-specific durability settings.
- Durability damage carries over when the tool changes roles.
- Compatible enchantments are applied to the new role. Enchantments incompatible with the current role are stored and retried when a later role supports them.
- Custom names, lore, adventure-mode Can Destroy/Can Place On restrictions, and item dynamic properties are carried across morphs where the API permits.
- Vanilla tool and material-tier tags improve compatibility with blocks and systems that check tool tags.
- Sword, axe, and shovel melee damage is configured by material tier.
- Expanded block-family detection for common wood, stone, soil, and shearable blocks.
- Tier give-functions are included in the behavior pack.
- Action-bar and particle feedback when the role changes.

## Prototype Limitations

Role changes happen after the triggering action. A block is broken before the script can react, and the sword role is selected after an entity is hit. As a result, the first block break or attack may use the previous role's behavior. Tool tags can improve compatibility with tag-aware blocks, but they do not guarantee correct drops for every vanilla or add-on block. Stored incompatible enchantments are metadata until a compatible role can accept them. Mining speed, sword damage, enchantment restoration, and drops still need in-game testing on the target Bedrock version.

## Attribution

- Creator: AllensCreations
- All rights reserved for AllensCreations.
- Videos and streams may feature this add-on with credit to AllensCreations.
- Do not re-upload or redistribute this pack as your own. Link to the official repository instead.

© AllensCreations
