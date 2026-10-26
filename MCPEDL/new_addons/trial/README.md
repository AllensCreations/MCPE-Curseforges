# Mob Chaos: Behavioral Roulette

An unpredictable add-on for Minecraft Bedrock. Mobs near you get their behaviors scrambled with traits stolen from other creatures, and eerie glitch warnings flash on screen before each change. by AllensCreations

## Install
Add the behavior pack to your world. No resource pack is needed.

## Status
- Achievement status: Unknown / needs confirmation
- No experiment requirement detected in the inspected files.
- Script module: @minecraft/server 2.10.0, the latest stable listed in the official Creator documentation when checked on 2026-10-26. The game version that first shipped 2.10.0 was not confirmed, so min_engine_version 1.26.50 is an inference.
- Source created, not tested in game.

## Notes
- Mutations are kept in memory, so every nearby mob is re-rolled when the world loads and again at random intervals (default 120 seconds).
- Controls: /scriptevent mobchaos:reshuffle, mobchaos:warnings on|off, mobchaos:blocks on|off, mobchaos:interval <seconds>, mobchaos:status
- Unverified assumptions: arrow damage from the volley trait, sound event names, and chase movement feel need in-game testing.
