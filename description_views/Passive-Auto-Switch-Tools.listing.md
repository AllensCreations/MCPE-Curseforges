# Listing Kit: Passive Auto-Switch Tools

Tap the Copy button on a block, then paste it into the CurseForge listing. Generated from DESCRIPTION.md: edit that, not this file.

## Package Name

```text
Passive Auto-Switch Tools
```

## Summary (83/256)

```text
Automatically selects a suitable tool or weapon when you begin mining or attacking.
```

## Description (HTML)

Paste into the CurseForge description editor in source (HTML) mode.

```html
<div><div style="border:2px solid #15803d;border-radius:18px;line-height:1.5"><br><h1 style="font-size:34px;text-align:center">Passive Auto-Switch Tools</h1><p style="color:#8a94a3;font-size:14px;text-align:center">by ALNStudios</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:14px;margin-right:14px"><div style="background-color:#dcfce7;color:#14532d;border-radius:20px;font-size:14px;line-height:2"><strong>&nbsp;&nbsp;Bedrock</strong>: 1.21+&nbsp;&nbsp;</div><div style="background-color:#dcfce7;color:#14532d;border-radius:20px;font-size:14px;line-height:2"><strong>&nbsp;&nbsp;Experimental</strong>: No&nbsp;&nbsp;</div><div style="background-color:#dcfce7;color:#14532d;border-radius:20px;font-size:14px;line-height:2"><strong>&nbsp;&nbsp;Achievements</strong>: Likely achievement-friendly&nbsp;&nbsp;</div></div><br></div>
<h2 style="font-size:17px;text-align:left"><span style="background-color:#15803d;color:#ffffff;border-radius:20px">&nbsp;&nbsp;About&nbsp;&nbsp;</span></h2>
<p>Passive Auto-Switch Tools is an survival add-on that automates tool and weapon selection in Minecraft Bedrock Edition. When you select hotbar slot 1, the add-on activates when you <strong>start to break/hit a block</strong> (avoiding annoying swaps when merely looking around), and <strong>when attacking a mob</strong> by automatically equipping your highest-tier axe or sword.</p><p>Hotbar slots 2 through 9 remain completely unmanaged, ensuring uninterrupted building, offhand usage, and consumable item management.</p>
<div class="spoiler" title="Mechanics and Operation" data-title="Mechanics and Operation"><h3 style="line-height:1.5">Mechanics and Operation</h3><h3>Hotbar Slot 1 Activation</h3><p>Automatic selection is active only while hotbar slot 1 is selected:</p><ul><li>Hotbar Slot 1: Active auto-switch slot. Striking blocks triggers tool selection; attacking mobs triggers weapon selection.</li><li>Hotbar Slots 2 through 9: Standard manual operation. the add-on does not swap items while these slots are selected.</li></ul><h3>Block-to-Tool &amp; Combat Matching</h3><ul><li><strong>Pickaxe</strong>: Stone, deepslate, ores, obsidian, terracotta, cobblestone, and metal blocks.</li><li><strong>Axe</strong>: Logs, wood, planks, fences, fence gates, chests, crafting tables, melons, and pumpkins.</li><li><strong>Shovel</strong>: Dirt, grass, sand, gravel, clay, mud, soul sand, snow, and concrete powder.</li><li><strong>Shears / Sword</strong>: Leaves, wool, cobwebs, and vines.</li><li><strong>Hoe</strong>: Hay bales, target blocks, sponges, sculk, moss, and nether wart blocks.</li><li><strong>Combat (Sword or Axe)</strong>: When attacking any mob or combat entity, automatically equips the best available sword or axe.</li></ul><h3>Tier Priority Hierarchy</h3><p>When multiple matching tools or weapons are present in inventory, the system selects the highest tier available:</p><p><strong>Netherite &gt; Diamond &gt; Iron &gt; Stone &gt; Golden / Wooden</strong></p><p>If items of equal tier exist across hotbar and main inventory, the item already present in the hotbar is given priority. For combat, swords have a slight damage preference in Bedrock, while existing axes or swords already in Slot 1 are retained.</p><h3>Item Integrity and Preservation</h3><p>The add-on aims to preserve tool details when switching items:</p><ul><li>Durability damage values remain exact.</li><li>Custom anvil names and lore strings are preserved.</li><li>Enchantments (Efficiency, Fortune, Silk Touch, Unbreaking, Mending, Sharpness, etc.) are preserved intact.</li><li>Active tool locking: If the currently held tool or weapon is already valid for the target block or combat, no redundant inventory swaps occur.</li><li>Tools switch when you begin breaking a block, not merely when you look at it.</li></ul></div>
<div class="spoiler" title="Performance &amp; Optimization" data-title="Performance &amp; Optimization"><h3 style="line-height:1.5">Performance &amp; Optimization</h3><ul><li><strong>Activation on Action</strong>: Tool selection occurs when you begin mining or attack, rather than while you simply look around.</li><li><strong>Automatic Selection</strong>: Chooses a suitable tool or weapon when you begin mining or attacking.</li></ul></div>
<div class="spoiler" title="Feature Comparison Highlights" data-title="Feature Comparison Highlights"><h3 style="line-height:1.5">Feature Comparison Highlights</h3><h3>Tool Swapping</h3><ul><li><strong>Vanilla Bedrock</strong>: Manual hotbar selection</li><li><strong>With Passive Auto-Switch Tools</strong>: Automatic tool selection upon hitting/starting to break</li></ul><h3>Combat Swapping</h3><ul><li><strong>Vanilla Bedrock</strong>: Manual weapon selection</li><li><strong>With Passive Auto-Switch Tools</strong>: Automatic switch to axe or sword when hitting mobs</li></ul><h3>Look-Around Stability</h3><ul><li><strong>Vanilla Bedrock</strong>: Static</li><li><strong>With Passive Auto-Switch Tools</strong>: No unwanted tool swaps from simply looking at blocks</li></ul><h3>Tool Wear Protection</h3><ul><li><strong>Vanilla Bedrock</strong>: Manual caution required</li><li><strong>With Passive Auto-Switch Tools</strong>: Matches optimal tool type directly</li></ul><h3>Building and Off-Hand Usage</h3><ul><li><strong>Vanilla Bedrock</strong>: Unaffected</li><li><strong>With Passive Auto-Switch Tools</strong>: Hotbar slots 2 to 9 remain completely manual</li></ul><h3>Touch Controls Usability</h3><ul><li><strong>Vanilla Bedrock</strong>: Frequent manual hotbar tapping</li><li><strong>With Passive Auto-Switch Tools</strong>: Automated selection reduces input overhead</li></ul><h3>Configuration Requirements</h3><ul><li><strong>Vanilla Bedrock</strong>: Not applicable</li><li><strong>With Passive Auto-Switch Tools</strong>: No extra command setup required</li></ul></div>
<h2 style="font-size:17px;text-align:left"><span style="background-color:#15803d;color:#ffffff;border-radius:20px">&nbsp;&nbsp;Install&nbsp;&nbsp;</span></h2>
<table style="width:100%;border:1px solid #8a94a3;border-radius:16px"><tbody><tr><td style="width:44px;text-align:center"><div style="background-color:#15803d;color:#ffffff;font-weight:bold;font-size:15px;text-align:center;border-radius:10px;width:30px;aspect-ratio:1/1;line-height:30px">1</div></td><td style="text-align:left;">Download the file from this page and open it with Minecraft.</td></tr><tr><td style="width:44px;text-align:center"><div style="background-color:#15803d;color:#ffffff;font-weight:bold;font-size:15px;text-align:center;border-radius:10px;width:30px;aspect-ratio:1/1;line-height:30px">2</div></td><td style="text-align:left;">Create or edit a world and turn on the new pack(s) in its settings.</td></tr><tr><td style="width:44px;text-align:center"><div style="background-color:#15803d;color:#ffffff;font-weight:bold;font-size:15px;text-align:center;border-radius:10px;width:30px;aspect-ratio:1/1;line-height:30px">3</div></td><td style="text-align:left;">Play. No Experimental toggles needed.</td></tr></tbody></table>
<div style="border:1px solid #8a94a3;border-radius:16px;text-align:center"><br><div style="background-color:#15803d;color:#ffffff;border-radius:20px;font-size:15px;line-height:2;display:inline-block">&nbsp;&nbsp;<strong>Found a Bug or Have a Suggestion?</strong>&nbsp;&nbsp;</div><p style="font-size:14px;">Please leave a comment on this project page! All bug reports, gameplay feedback, and pack suggestions are welcome and appreciated.</p></div>
<h2 style="font-size:17px;text-align:left"><span style="background-color:#15803d;color:#ffffff;border-radius:20px">&nbsp;&nbsp;Support&nbsp;&nbsp;</span></h2><div style="border:1px solid #8a94a3;border-radius:16px;text-align:center"><br><a href="https://ko-fi.com/alnstudios"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/ko-fi.png" alt="Support ALNStudios on Ko-fi" width="250"></a><br><br></div><p style="text-align:center"><a href="https://www.curseforge.com/members/allenscreations/projects"><strong>CurseForge</strong></a> &nbsp;|&nbsp; <a href="https://mcpedl.com/user/alnstudios/"><strong>MCPEDL</strong></a> &nbsp;|&nbsp; <a href="https://ko-fi.com/alnstudios"><strong>Ko-fi</strong></a></p>
<hr>
<p style="text-align:center;color:#8a94a3;font-size:13px"><strong>By ALNStudios</strong></p>
<div class="spoiler"><p style="font-size:13px"><strong>Permissions and credits</strong></p><ul style="font-size:13px"><li>Rights: All rights reserved for ALNStudios.</li><li>Content creators: You may feature this creation in videos and streams with credit to ALNStudios.</li><li>Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link to this page.</li><li>Unofficial community creation. Not an official Minecraft product and not approved by or associated with Mojang or Microsoft.</li></ul></div>
<p style="text-align:center;color:#8a94a3;font-size:12px">Passive Auto-Switch Tools - Automatic Tool Selection by ALNStudios Bedrock add-on, Hotbar Slot 1 Activation Minecraft Bedrock, Block Minecraft Bedrock, Tier Priority Hierarchy Minecraft Bedrock, Item Integrity and Preservation Minecraft Bedrock, Minecraft PE mod, MCPEDL add-on, CurseForge Bedrock, ALNStudios, Minecraft Bedrock add-on.</p></div>
```

## AI Image Prompts

### Reference Images

- **Logo reference**: attach your own logo. The generator uses it only for brand colors and mood. The result must be a new design, not a copy.
- **Snapshot references**: attach 1 to 4 of your in-game snapshots of this pack. The generator copies their look, not their screen layout.

### Logo Prompt

```text
Use the attached logo only as a brand reference for its color palette and overall mood. Do not copy it. Create a new, original logo with a different composition and a different main symbol. Do not just recolor, resize, crop, mirror or tweak the attached logo.
Create a clean, square (1:1) logo image for the Minecraft Bedrock add-on "Passive Auto-Switch Tools".
Base the main symbol on the pack idea above. Match the blocky look of the attached in-game snapshots. Center the logo, use a simple background, and keep it readable at small sizes.
Text: "Passive Auto-Switch Tools" and, in small letters, "ALNStudios". ALNStudios is the brand name, so always keep it and never remove or change it. Spell both exactly.
Do not add Minecraft, Mojang or Microsoft logos, watermarks, or characters from other games.
```

### Banner Prompt

```text
Create a wide (16:9) banner image for the Minecraft Bedrock add-on "Passive Auto-Switch Tools".
Use the attached in-game snapshots as scene and style references: copy their blocky look, lighting, colors and the kind of scenery they show. Make a new composition inspired by them. Do not copy the on-screen HUD, chat or hotbar.
Use the attached logo only as a brand reference for its colors and mood. Do not copy it. Put a new, original logo design in the banner, large enough to read, on the left or center.
Text: "Passive Auto-Switch Tools" and, in small letters, "by ALNStudios". ALNStudios is the brand name, so always keep it and never remove or change it. Spell both exactly.
Leave clear space around the logo. No Minecraft, Mojang or Microsoft logos, no watermarks.
```
