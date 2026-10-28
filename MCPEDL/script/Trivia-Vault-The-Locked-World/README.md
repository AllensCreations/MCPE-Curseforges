# Trivia Vault: The Locked World (v1.0.2)

## Overview
Trivia Vault: The Locked World is a survival trivia challenge by AllensCreations.

Each Survival block break attempt on a locked block type opens a randomized Minecraft question.
Choose one of four possible answers to unlock that block type and earn a random reward.
A correct answer grants the reward immediately and unlocks every block of that type for the rest of the run.
A wrong answer triggers a randomized penalty.
Penalties include losing a hotbar item, an anvil hazard, hostile mobs, and status effects.
The question bank contains 500 entries across crafting, mobs, blocks, exploration, and game history.
The reward pool contains 50 entries with rare materials, equipment, and experience rewards.
The penalty pool contains 50 entries, including the requested creeper and anvil hazards.

## Features
- Four-choice Minecraft trivia through an in-game form.
- Random questions from a bank of 500 entries.
- 50 reward entries and 50 penalty entries.
- Three lifelines per run to remove wrong answers or receive a cryptic hint.
- Occasional 2x experience multiplier for 60 seconds.
- Survival-focused gameplay controlled by the AllensCreations Controller.
- A run ends when the player dies; use the Controller to begin another run.

## How to Start
1. Import the behavior and resource packs into Minecraft Bedrock.
2. Activate both packs in a test world with cheats enabled if you need the provided admin functions.
3. Give the host/operator the Controller item using the project's normal setup, then use it.
4. Select **Start** and play in Survival mode.

## Controls and Rules
Attempt to break any block in Survival to open the trivia form.
Select the correct answer to unlock that block type; every block of the same type can then be broken freely until the run ends.
Wrong answers trigger a randomized penalty, so keep valuable items protected.
Use a lifeline when available; each run begins with three.
Creative mode bypasses the block-break quiz so the world can be inspected safely.
The Controller's **How to play** page repeats the main rules in-game.

## Compatibility
Targeted against the stable Creator documentation checked on 2026-10-27: Minecraft Bedrock 26.52.
Unknown / needs confirmation — achievements must be checked in the target world and game version.
No experiment requirement detected in the inspected files; enable any setting Minecraft requests for script execution.
Source created, not tested in game.

## Verification Notes
The package is structurally checked and its JavaScript files are syntax-checked before import.
The checker does not prove that the script loads or every mechanic behaves as expected in Minecraft.
The question bank uses multiple phrasings for the same underlying fact to reach 500 unique entries; verify individual facts and balance during in-game playtesting.

## Creator
By AllensCreations.
