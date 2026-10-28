# Trivia Vault: The Locked World (v1.0.9)

## Overview
Trivia Vault: The Locked World is a survival trivia challenge by AllensCreations.

In Survival, attempting to break a locked block type opens a four-choice trivia question.
Questions mix internet culture, geography, science, everyday knowledge, and Minecraft.
The correct answer's position is shuffled for every question.

## Features
- Five sample questions in this fast preview build.
- Four answer choices with randomized answer placement.
- Correctly answering permanently unlocks that block type across the world.
- The unlock is stored as a world dynamic property and is intended to persist after restarting.
- Correct answers award a rarity-weighted random reward.
- Wrong answers trigger randomized survival penalties.
- Three hint-only lifelines are available per run; they do not remove answer choices.
- The AllensCreations Controller opens the Start and How to play options.
- Creative mode bypasses the block-break trivia check.

## How to Start
1. Import the project package into Minecraft Bedrock.
2. Enable the Behavior Pack and Resource Pack in a test world.
3. Use the Controller as the host or an operator to open the game menu.
4. Select Start and play in Survival mode.

## Controls and Rules
Attempt to break a block in Survival to open a trivia question.
Select one of the four answers.
A correct answer unlocks that entire block type, not just one coordinate.
Wrong answers trigger a random penalty, which may include damage, hostile mobs, or losing an item.
Use a lifeline before answering when you need a hint.
The run ends when the player dies; use the Controller to start another run.

## Compatibility
Achievement status: Unknown / needs confirmation.
Experiments: No experiment requirement detected in the inspected files; follow any in-game prompt required to enable script execution.
Source created, not tested in game.

## Verification Notes
The JavaScript files were syntax-checked for this preview package.
The package structure was checked locally, but the repository's current build_payload.py pipeline was not run.
This package has five sample questions for faster review and is not the full question bank.
