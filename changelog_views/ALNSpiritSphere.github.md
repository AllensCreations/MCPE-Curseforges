# Changelog — ALN:SpiritSphere

## [10.0.0] - 2026-11-27 - Clear View

### Improved & Balanced
- **Lighter particles**: All particle sprites are about 40 percent smaller and fewer particles are drawn, so the effects no longer cover the screen.
- **Clear view**: The charging sphere now floats 3.2 blocks ahead instead of 2.4, and the long energy arms from your shoulders are removed. The energy hands stay, with fewer fingers.
- **Density setting**: A single FX_DENSITY value in the elements script (0.6 now, 1 for the full effect) controls how many of the charge, orb and impact particles are drawn.

<details>
<summary><b>9.0.x</b> (1 release)</summary>

### [9.0.0] - 2026-11-27 - Element Particles

#### Added
- **Element particles**: Each of the ten spheres now has its own particle shapes and motion, 20 new particle designs in total, used for the charge rings, the core, the orb sparks and the impact burst.
- **Crosshair sphere**: The charging sphere now sits at the center of your crosshair and the orb launches from that point.

#### Improved & Balanced
- **Energy arms**: The energy arms from your shoulders now use more points so they read as a line reaching the sphere.

</details>

<details>
<summary><b>8.0.x</b> (1 release)</summary>

### [8.0.0] - 2026-11-27 - Icon Projectile

#### Added
- **Icon projectile**: The flying orb is now drawn as the sphere's own icon texture instead of the generic glowing blob.

#### Improved & Balanced
- **No gravity**: Orbs are no longer pulled down. Quick releases fly straight, and Blaze Solar and Terra Quake fly straight while Frost Nova now glides in a gentle wave.
- **Unlimited range**: Orbs keep flying until they hit something, with a 5 minute safety limit so stray orbs do not pile up.

</details>

<details>
<summary><b>7.0.x</b> (1 release)</summary>

### [7.0.0] - 2026-11-26 - Flight Paths and Energy Hands

#### Added
- **Flight paths**: Each of the ten spheres now flies its own path, from a spiral and a zigzag to arcs, homing, a wobble, a side curve and a speed-up.
- **Energy hands**: Glowing particle hands and arms now appear on both sides of the sphere while you charge, so it looks held in two hands.

#### Improved & Balanced
- **Sphere position**: The charging sphere and the launch point now sit in front of your chest instead of beside your right hand.
- **Chrono Stasis speed**: The orb now starts at about 40 percent of its old speed and speeds up in flight.

</details>

<details>
<summary><b>6.0.x</b> (1 release)</summary>

### [6.0.0] - 2026-11-25 - Ten Spheres

#### Added
- **Five new spheres**: Players can craft Terra Quake, Toxic Bloom, Gravity Warp, Life Bloom and Chrono Stasis spheres, each with its own recipe, color, icon and impact effect.
- **New sounds**: Each new sphere has its own charge, burst, launch and impact sound, 20 more in total.
- **Cooldown**: Each sphere now has a 3 second cooldown after a shot, and the action bar shows the time left.
- **Sweet spot**: Releasing between 50 and 62 ticks gives full power and a 25 percent larger blast.

#### Improved & Balanced
- **32x32 textures**: All sphere icons and the orb texture are redrawn at 32x32 with shading and an element detail on each.
- **Overcharge**: Holding past the sweet spot now weakens the shot over 3 seconds down to 40 percent power, with the sphere shrinking and the charge tone falling in pitch.
- **Action bar**: The charge display now shows the current power percentage.

</details>

<details>
<summary><b>5.0.x</b> (1 release)</summary>

### [5.0.0] - 2026-11-24 - Element Sounds

#### Added
- **Custom element sounds**: Each of the five spheres now has its own charge, burst, launch and impact sound, 20 sounds in total.

#### Improved & Balanced
- **Shared sounds removed**: The old shared pulse, launch and explosion sounds are replaced by the per-element sounds, including the Void Singularity landing pulse.

</details>

<details>
<summary><b>4.0.x</b> (1 release)</summary>

### [4.0.0] - 2026-11-24 - Inward Pull Particles

#### Added
- **Inward pull particles**: Particles now stream inward toward your hand while charging and toward the orb in flight for every element.
- **Void Singularity pull**: The hover phase shows a wide inward stream across its 10 block range and a tighter collapse stream in the last second.

</details>

<details>
<summary><b>3.0.x</b> (1 release)</summary>

### [3.0.0] - 2026-11-24 - Void Singularity Rework

#### Added
- **Void Singularity hold**: The orb now stops where it lands, hovers for 5 seconds, pulls all mobs within 10 blocks into its core, then explodes with a larger blast.

#### Fixed
- **Recipes**: The six sphere recipes now use the object form of the unlock entry.
- **Spirit Orb model**: The orb now uses the entity_alphatest material instead of entity_alpha.

</details>

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [2.0.0] - 2026-11-24 - Element Spheres

#### Added
- **Five Spirit Spheres**: Players can craft Aero Vortex, Blaze Solar, Frost Nova, Storm Surge and Void Singularity spheres, each with its own icon and recipe.
- **Bow zoom**: The view zooms in through the three charge phases and eases back on release.
- **Charge sound**: A tone rises in pitch while the sphere charges.

#### Improved & Balanced
- **Element choice**: Each element is now its own item, so sneak-switching is gone and the Spirit Focus is removed.

</details>

<details>
<summary><b>1.0.x</b> (1 release)</summary>

### [1.0.0] - 2026-11-24 - First Release

#### Added
- **Spirit Focus**: Players can craft a chargeable focus item with two recipes, one using a Wind Charge and one using a Feather.
- **Charge phases**: Players see a loose ring, a compressed core and a burst into a glowing sphere with a sonic pulse while charging.
- **Spirit Orb**: Releasing fires an orb whose speed and blast size grow with the hold time, with an overcharge bonus at 70 ticks.
- **Five elements**: Players can sneak and use the focus to switch between Aero Vortex, Blaze Solar, Frost Nova, Storm Surge and Void Singularity.

</details>
