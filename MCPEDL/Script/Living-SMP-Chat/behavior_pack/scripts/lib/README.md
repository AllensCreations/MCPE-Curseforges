# Living SMP Chat: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/chat_director.js` | 265 | (no header comment) |
| `scripts/chat_generator.js` | 222 | (no header comment) |
| `scripts/chat_lines_extra.js` | 349 | (no header comment) |
| `scripts/main.js` | 137 | (no header comment) |
| `scripts/mode.js` | 3 | (no header comment) |
| `scripts/smp_roster.js` | 130 | (no header comment) |
| `scripts/smp_voices.js` | 86 | (no header comment) |

## Imports

- `@minecraft/server` (in `chat_director.js`, `main.js`, `smp_roster.js`)
- `./chat_director.js` (in `main.js`)
- `./chat_generator.js` (in `chat_director.js`, `main.js`)
- `./chat_lines_extra.js` (in `chat_director.js`, `chat_generator.js`)
- `./mode.js` (in `chat_director.js`, `main.js`)
- `./smp_roster.js` (in `chat_director.js`, `main.js`)
- `./smp_voices.js` (in `chat_director.js`, `chat_generator.js`)

## Events

- `world.afterEvents.chatSend`
- `world.afterEvents.entityDie`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`

## Custom ids

- `alnstudios:living_smp_online` (`smp_roster.js`)
- plus 7 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
