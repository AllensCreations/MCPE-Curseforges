# Changelog — ALN Pointer

## [v20] - 2026-11-21 - Cleanup and Fixes

### Fixed
- **Menu Version**: The menu title and About screen showed v16. They now show the real pack version.
- **Locked On Text**: The Locked on message now only updates when the target changes or about every second and a half, so it no longer flickers or hides other action bar messages.
- **Aim Circle Timeout**: The aim circle is refreshed every 30 minutes so it no longer disappears after an hour of holding a bow.

### Changed
- **Description**: The page now matches the menus: Combat Settings with its groups, Quick Presets, the Tuning screen, and the Aura, Always Critical and Target Highlight cards.

### Removed
- **Unused Files**: The 10 old circle particle files from before the screen circle were deleted. Nothing in the add-on used them.

<details>
<summary><b>19.0.x</b> (1 release)</summary>

### [v19] - 2026-11-20 - Aimbot Mob Types

#### Added
- **Aimbot Mob Types**: Bow Aimbot now has four On or Off choices under it: hostile mobs, neutral mobs, passive mobs and players. Hostile mobs and players stay on by default. Tamed pets are never targeted.

#### Fixed
- **Elder Guardian**: Arrows now aim at the middle of the body instead of the head point, so big mobs such as the Elder Guardian are no longer overshot.
- **Underwater Targets**: Arrows aimed at a target in water no longer add the extra lift for gravity, since arrows fly differently in water.

</details>

<details>
<summary><b>18.0.x</b> (1 release)</summary>

### [v18] - 2026-11-20 - Grouped Menu and Immortal

#### Added
- **Quick Presets**: A new button in the Combat Menu turns on a whole set of toggles at once: PVP, Safe or All off. Your slider values stay the same.

#### Changed
- **Combat Settings**: Toggles and sliders now live in one form grouped by line. Aura has its range, damage, targets and options under it, Bow Aimbot has range, zoom and the aim circle under it, and Auto Totem and Infinite Totem sit together.
- **Immortal**: Never Die is now Immortal. It keeps you at 1 heart instead of half a heart, shows no totem effect, and also blocks one-hit kills, the void and the kill command where the game lets the add-on cancel them. If you fall into the void you are moved back to the last ground you stood on.
- **Tuning**: Tuning now holds Your game FOV setting as an exact list of values from 30 to 110. Nothing saves unless Confirm changes is on, so a stray touch cannot change it.

</details>

<details>
<summary><b>17.0.x</b> (1 release)</summary>

### [v17] - 2026-11-20 - Circle Zoom

#### Changed
- **Aim Circle**: The circle is now sized by a zoom setting instead of degrees. It is centered on your crosshair and its size no longer depends on your screen size or GUI scale.
- **Bow Aimbot**: It now only locks onto a mob or player that is inside the circle, and picks the one closest to the center. The Locked on marker uses the same circle.
- **Tuning**: The Bow Aimbot angle slider is replaced by Aim circle zoom (50 to 300 percent) and a new Your game FOV setting slider (30 to 110) that matches the circle to your in-game field of view.

</details>

<details>
<summary><b>16.0.x</b> (1 release)</summary>

### [v16] - 2026-11-19 - Circle Size Matches Degrees

#### Changed
- **Aim Circle**: The on-screen circle size is now exactly proportional to the Bow Aimbot angle. Each degree adds 1.6 pixels, so 25 degrees is the 40 by 40 size, 5 degrees is 8, 50 degrees is 80, and doubling the angle doubles the circle.

</details>

<details>
<summary><b>15.0.x</b> (1 release)</summary>

### [v15] - 2026-11-19 - Circle Size By Degrees

#### Changed
- **Aim Circle**: The on-screen circle is now sized by the Bow Aimbot angle. At the default 25 degrees it is shown at the 40 by 40 picture's own size, and other angles are scaled from that in proportion to the angle, from 8 pixels at 5 degrees up to 102 pixels at 50 degrees.

</details>

<details>
<summary><b>14.0.x</b> (1 release)</summary>

### [v14] - 2026-11-19 - One Circle Picture

#### Changed
- **Aim Circle**: The screen circle now uses one 16 by 16 picture, resource_pack/textures/particle/aln_circle.png, and the game stretches it to the size that matches the Bow Aimbot angle. The 10 separate aln_circle_4 to aln_circle_13 pictures are no longer used.

</details>

<details>
<summary><b>13.0.x</b> (1 release)</summary>

### [v13] - 2026-11-19 - Crosshair Circle On Screen

#### Changed
- **Aim Circle**: The circle is now drawn on the screen at your crosshair instead of in the world, so it stays exactly on the crosshair and does not lag when you turn. It uses the same 10 circle pictures, aln_circle_4.png to aln_circle_13.png, chosen by the Bow Aimbot angle. This adds a resource pack file, ui/hud_screen.json, and it uses the screen title while you hold a bow with Target Highlight on.

</details>

<details>
<summary><b>12.0.x</b> (1 release)</summary>

### [v12] - 2026-11-19 - Aim Circle Pictures

#### Changed
- **Aim Circle**: The circle around your crosshair is now a picture instead of flame dots. There are 10 circle pictures, 4 by 4 up to 13 by 13 pixels, one for each Bow Aimbot angle from 5 to 50 degrees. They are the files aln_circle_4.png to aln_circle_13.png in resource_pack/textures/particle.
- **Smooth Following**: The target picture and the aim circle now refresh every tick instead of 4 times a second, so they follow the target and your crosshair without flickering.
- **Bow Aimbot Angle**: The angle slider in Tuning now goes up to 50 degrees.

</details>

<details>
<summary><b>11.0.x</b> (1 release)</summary>

### [v11] - 2026-11-19 - Parry Text Removed

#### Changed
- **Parry Effect**: Blocking a hit with Shield Always Active no longer shows "Parried!" on the action bar. The sparks, the shield sound and the push on a melee attacker stay.

</details>

<details>
<summary><b>10.0.x</b> (1 release)</summary>

### [v10] - 2026-11-19 - Shield Parry Effect

#### Added
- **Parry Effect**: Every hit that Shield Always Active blocks now shows sparks in front of you, plays the shield sound, shows "Parried!" on the action bar and pushes a melee attacker back.

</details>

<details>
<summary><b>9.0.x</b> (1 release)</summary>

### [v9] - 2026-11-19 - Target Image and Line Of Sight

#### Added
- **Target Picture**: Target Highlight now shows a small picture above the target Bow Aimbot picks, only visible to you. The picture is the file resource_pack/textures/particle/aln_target.png, a 16 by 16 image.
- **Aim Circle**: Target Highlight also draws a circle of flame dots around your crosshair that shows the Bow Aimbot aim range. A new Tuning choice switches it on or off.

#### Changed
- **Line Of Sight**: Bow Aimbot now ignores mobs and players that are hidden behind blocks, and picks the one closest to your crosshair among those you can see.

</details>

<details>
<summary><b>8.0.x</b> (1 release)</summary>

### [v8] - 2026-11-19 - Water Clutch Cleanup

#### Fixed
- **Water Cleanup**: Always Water Clutch now removes its water as soon as you land, including the water that spread sideways from it, instead of leaving it behind. It still removes the water after about 2 seconds at most.

</details>

<details>
<summary><b>7.0.x</b> (1 release)</summary>

### [v7] - 2026-11-19 - Gear and Dummy

#### Added
- **Keep Gear On Death**: Your items, armor and off hand are set aside when you die and given back when you respawn, for you only and without changing the world rules.
- **No Knockback**: Cancels the push you get from melee hits.
- **Target Highlight**: Shows particles above the target Bow Aimbot picks and names it on the action bar while you hold a bow.
- **Practice Dummy**: A new Combat Menu button that spawns a harmless zombie 3 blocks in front of you for testing, for 2 minutes.
- **Knockback Slider**: A Tuning slider that makes the knockback you deal weaker or stronger, from 0 to 200 percent.
- **Aura Options**: Tuning choices for Aura Mode to hit mobs and players, mobs only or players only, and to turn you to face the target with a hit sound.
- **Totem Pop Effect**: Never Die now shows the totem particles and plays the totem sound when it saves you from a deadly hit.

#### Changed
- **Combat Toggles**: The toggles screen now has 13 switches, and the Combat Menu has a Practice Dummy button before Back.

</details>

<details>
<summary><b>6.0.x</b> (1 release)</summary>

### [v6] - 2026-11-19 - Never Die

#### Added
- **Never Die**: A new toggle that keeps you at half a heart instead of dying, even from a one-hit explosion such as a creeper. The void and the kill command still work. The combat toggles screen now has 10 switches.

#### Fixed
- **Totem After A Pop**: Auto Totem and Infinite Totem no longer ignore deadly hits that land within a quarter second after a totem pops, such as the second damage of an explosion.

</details>

<details>
<summary><b>5.0.x</b> (1 release)</summary>

### [v5] - 2026-11-19 - Friends and Tuning

#### Added
- **Friends**: Pick online players as friends in the new Combat Menu. Aura Mode and Bow Aimbot skip your friends, and the list is kept when they go offline.
- **Tuning**: Six sliders change Aura range, Aura damage, Aura targets, Bow Aimbot range, Bow Aimbot angle and Always Critical damage. The starting values match the old fixed numbers, and a reset switch restores them.
- **Auto Golden Apple**: Eats a golden apple from your inventory for you when your health is 4 hearts or less, with a 20 second wait between apples.
- **Damage Display**: Shows the damage of each hit you land on the action bar.
- **Quick Toggle**: Sneak while using the Combat Helper to switch all your toggles off, and do it again to bring them back.
- **Starter Item Setting**: A pack choice between No Starter Item (default) and Give Starter Item, which gives each player a Combat Helper the first time they join.

#### Changed
- **Combat Menu**: The first main menu button is now Combat Menu, which opens Combat Toggles, Friends and Tuning. The combat toggles screen now has 9 switches.
- **Starter Item**: The Combat Helper is no longer given automatically on first join. Turn on Give Starter Item in the pack settings to get the old behavior.

</details>

<details>
<summary><b>4.0.x</b> (1 release)</summary>

### [v4] - 2026-11-19 - New Name

#### Changed
- **New Name**: The add-on is now called Combat Helper. The item, its menus, the pack titles and the description all use the new name. The item still uses the cursor look, and your existing item, saved toggles and worlds keep working.

</details>

<details>
<summary><b>3.0.x</b> (1 release)</summary>

### [v3] - 2026-11-19 - Wool Recipe

#### Added
- **Wool Recipe**: The ALN Pointer can now be crafted from 7 wool of any color in a cursor shape: the top row, the left and middle squares of the middle row, and the left and right squares of the bottom row. The recipe is unlocked from the start.

#### Fixed
- **Menu Version**: The menu title now shows the same version as the pack.
- **Totem Exclusions**: Auto Totem and Infinite Totem now skip the kill command and script-set deaths, which a totem cannot stop in vanilla Minecraft, instead of reacting to them.

</details>

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [v2] - 2026-11-16 - First Release

#### Added
- **ALN Pointer**: A cursor-shaped item that opens the ALNStudios menu. You get one the first time you join a world, and it is in the Equipment tab of the Creative inventory.
- **Combat Toggles Menu**: A screen with 7 switches and a short explanation under each. Apply saves them for you and closes the menu, and each player keeps their own settings.
- **Auto Totem**: Moves a Totem of Undying from your inventory into your off hand before a hit that would kill you.
- **Infinite Totem**: Puts a new Totem of Undying in your off hand before a deadly hit when you have none left.
- **Aura Mode**: Hits up to 3 nearby hostile mobs and players within 4 blocks for 5 damage every half second.
- **Always Critical**: Every melee hit deals 1.5 times damage and shows the critical hit sparks.
- **Bow Aimbot**: Arrows from a bow or crossbow steer toward the target nearest your crosshair within 48 blocks.
- **Always Water Clutch**: Places water where you land after a fall of 3 blocks or more, then removes it after about 2 seconds.
- **Shield Always Active**: Blocks melee hits and arrows from the front whenever you carry a shield.

</details>
