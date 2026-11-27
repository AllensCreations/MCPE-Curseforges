# Script library notes

- `../main.js`: entry file. Imports `lib/snake_ai.js` and calls `registerSnakeAI()`.
- `snake_ai.js`: exports `registerSnakeAI()`. Subscribes to `world.afterEvents.entityHitEntity` and `world.afterEvents.entityDie` and dispatches to the handlers below.
- `anaconda_constrict.js`: exports `onAnacondaHit`. When `aln:titan_anaconda` hits a non-snake entity it starts a latch: slowness plus 2 damage every second for up to 5 seconds, dropped when the target or snake is gone or farther than 4.5 blocks. The interval runs only while a latch exists.
- `python_digestion.js`: exports `onPythonHit` and `onPreyDeath`. When `aln:gluttonous_python` kills a small prey mob it triggers event `aln:swell` on the python. The entity JSON then sets variant 1 (belly swells on the client), movement 0 and a 60 second timer that fires `aln:digest_end`.
- `constants.js`: snake ids, prey list, latch tuning. No dependencies.
- `util.js`: `isLive` and `distanceBetween` helpers. No dependencies.

Custom ids used: `aln:forest_viper`, `aln:titan_anaconda`, `aln:desert_racer`, `aln:gluttonous_python`, `aln:coral_snake`; events `aln:swell`, `aln:digest_end`.

Handled in entity JSON only (no script): Forest Viper poison on hit, Desert Racer speed, Coral Snake spawning and glow.

Known limits: `EntityDieAfterEvent.damageSource`, `Entity.triggerEvent`, `Entity.applyDamage` and `Entity.isValid` are not verified against retrieved docs; the python also tracks its own hits as a fallback. Not tested in game.
