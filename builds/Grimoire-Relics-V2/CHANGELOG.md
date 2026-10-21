# Changelog — Grimoire Relics V2

## [1.0.1] - 2026-10-15

### Added
- **3D Hip-Holstered Grimoire Model & Attachment Engine**:
  - Full 3D modeled spellbook (`geometry.grimoire_hip`) slung dynamically onto the player's belt/hip using Bedrock attachables (`minecraft:attachable`).
  - Realistic leather strap holster, textured binding spine, thick parchment page bulk, and golden clasp buckle.
  - Custom 3D texture maps generated for all 20 tomes under `textures/models/*_model.png`.
- **Dynamic Hip Sway & Walking Animation**:
  - Subtle breathing idle movement coupled with natural walking stride momentum (`animation.grimoire.hip_idle`) that sways rhythmically as the player walks or runs.
- **Creative Inventory Book Grouping**:
  - All 20 Grimoires are now organized into `itemGroup.name.book` under the `equipment` creative category, grouping them alongside vanilla enchanted books.
- **Dedicated Pack Icons**:
  - Custom 32×32 pixel art pack icons for both Behavior Pack (`BP`) and Resource Pack (`RP`) featuring an illuminated grimoire, glowing arcane core, and the signature `AC` (AllensCreations) monogram.
- **16×16 HD Pixel Art Texture Pack**:
  - Upgraded all 20 tome item textures from basic 12×12 squares to detailed 16×16 HD pixel art textures.
  - Regenerated all 14 crafting recipe preview diagrams and composite sheet to showcase the new textures.

### Changed
- **Particle Aura Retuning**:
  - Softened the particle aura from 4 high-frequency spinning particles every 8 ticks down to **1 subtle, ambient sparkle every 20 ticks (1.0s)** orbiting gently around the player.
- **Anvil Repair Ratio**:
  - Fine-tuned vanilla Book (`minecraft:book`) anvil repairs to a strict **1:1 ratio** (1 durability point restored per book).

### Fixed
- **Void Phantom Emergency Rescue**:
  - Fixed void rescue activation triggers in the Overworld, The End, and the Nether.
  - Added an emergency `entityHurt` interceptor for `"void"` damage cause to prevent bypasses during high fall speeds.
  - Teleportation now reliably lands above surface terrain or End platform (`100, 49, 0`), applies Slow Falling, heals 20 HP, and plays travel audio.

---

## [1.0.0] - 2026-10-15

### Initial Release: The Ancient Grimoires

Initial public release of **Grimoire Relics V2**, an RPG-style magical offhand companion system for Minecraft Bedrock Edition (v1.21.0+) powered by `@minecraft/server` gameplay system. Fully achievement-friendly with zero experimental toggles required.

### Added
- **20 Magical Offhand Relics**:
  - **Infernal Phoenix**: Permanent Fire Resistance + offensive & defensive 5-second fire ignitions.
  - **Abyssal Tide**: Permanent Water Breathing + underwater Night Vision + Dolphin's Grace swimming.
  - **Zephyr Wind**: Speed II, Jump Boost I, auto Slow Falling plunge, and full fall damage immunity.
  - **Necrotic Lich**: Melee strikes inflict Wither II for 3 seconds.
  - **Mountain Titan**: Resistance II, Slowness I, and full knockback neutralization.
  - **Blood Vampire**: Life Leech healing 1 full heart (2 HP) per melee hit.
  - **Lunar Eclipse**: Nocturnal Invisibility + Strength I during Overworld nighttime.
  - **Solar Dawn**: Saturation + Regeneration I during open Overworld daylight.
  - **Verdant Druid**: Poison immunity + passive fertilization of crops and saplings within 3 blocks.
  - **Frost Weaver**: Frost Walker II water freezing underfoot + powder snow freezing immunity.
  - **Stormcaller**: Speed III outdoors in rain/thunder + 15% retaliatory lightning strike against melee attackers.
  - **Deep Delver**: Permanent Haste II + automated dynamic light block projection under Y=55 in the dark.
  - **Void Phantom**: Emergency surface and The End spawn platform (`100, 49, 0`) void rescue with Slow Falling.
  - **Iron Golem**: 4 Absorption hearts every 30s + melee launch knockback.
  - **Venom Hydra**: Poison and Wither immunity + melee Poison II infliction.
  - **Cursed Alchemist**: Infinite duration preservation and refreshing of all active beneficial potion effects.
  - **Radiant Seraph**: Permanent Regeneration II + Blindness and Nausea immunity.
  - **Arcane Scholar**: Triples all experience gained from mob drops, mining, and orbs.
  - **Mirror Trickster**: 25% evasive damage negation with a 3-block backward blink through smoke.
  - **Cataclysm Dragon**: Strength II, Resistance I, and complete immunity to explosions and dragon breath.
- **Tome Durability & Maintenance System**:
  - Each relic features **100 Max Durability** (`minecraft:durability`).
  - **Event-Only Wear**: Passive stat buffs do not consume durability. Durability is deducted only when active abilities, combat procs, or emergency rescues trigger.
  - **Enchanting & Mending**: Compatible with Enchanting Tables and Anvils (`minecraft:enchantable`), supporting **Mending**, **Efficiency**, and **Unbreaking**.
  - **Anvil Repairing**: Repairable by combining matching tomes or using vanilla **Books** (`minecraft:book`) at a strict 1:1 ratio (1 durability restored per book) via `minecraft:repairable`.
  - **Shatter Audio & Particles**: Plays authentic item breaking sound, spawns break particles, and notifies the player on shatter.
- **World Chest Loot Generation**:
  - 6 tomes are designated as uncraftable **Ancient Relics** obtainable only through rare exploration chests:
    - Ancient Cities: *Void Phantom* & *Mirror Trickster* (replaces enchanted golden apple rolls).
    - Bastion Remnants: *Infernal Phoenix* & *Necrotic Lich* (replaces enchanted golden apple rolls).
    - End Cities: *Cataclysm Dragon*.
    - Dungeon Monster Rooms: *Blood Vampire* (replaces enchanted golden apple rolls).
  - Additional dungeon distribution for *Deep Delver*, *Arcane Scholar*, *Cursed Alchemist*, and *Abyssal Tide*.
  - **Relic Antiquity Wear**: Looted tomes generate with realistic ancient wear, spawning with 15% to 70% used durability (`set_damage`).
- **Authentic Crafting System**:
  - 14 craftable tomes surrounding a central Book in a shaped Crafting Table grid.
  - Generated pixel-art crafting recipe diagrams using vanilla Bedrock sample item textures.
- **Particle & Aura Engine**:
  - Staggered 8-tick orbiting 4-point halo particle engine matching each tome's elemental identity.
