# Adaptive Morphing Multi-Tool

A single custom tool that changes its displayed role after mining or attacking.

## Features

- One inventory item for axe, pickaxe, shovel, shears, and sword roles.
- Recognizes common block-name patterns after a block is broken.
- Switches to a sword role after hitting an entity.
- Brief flame-particle feedback with a throttled action-bar message.
- Behavior and resource packs are separated for Bedrock packaging.

## Current Prototype Notes

The role label and feedback adapt after the action; this prototype does not yet replace the underlying item model or guarantee vanilla tool-specific drops, mining speeds, or combat damage for every block and entity. Bedrock's block-break event fires after the block is broken, so it cannot change the tool before that same block's mining calculation.

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
