# Emissive Glowing Ores by ALNStudios

Resource Pack for Minecraft Bedrock Edition. Ore veins and a 1-pixel block outline render emissive under Vibrant Visuals. The pack adds no light level, so mob spawning and world lighting stay vanilla.

Status: source created and structure-checked. Not tested in Minecraft.

## What is in this folder

- `resource_pack/manifest.json`: pack manifest (declares the `pbr` capability).
- `resource_pack/textures/blocks/*.texture_set.json`: 20 texture sets (8 overworld ores, 8 deepslate ores, Nether Quartz, Nether Gold, 2 Ancient Debris faces).
- `resource_pack/textures/blocks/**/*_mer.png`: 16x16 emissive maps, already generated.
- `tools/build_pack.py`: regenerates the maps and builds the `.mcpack`.

The vanilla color PNGs are not included because they are Mojang's art. The build script copies them from your own copy.

## Build the .mcpack

1. Get Mojang's vanilla reference pack: https://github.com/Mojang/bedrock-samples (folder `resource_pack`).
2. Run `python tools/build_pack.py --vanilla <path>/bedrock-samples/resource_pack` (needs Python 3 and Pillow).
3. Open `dist/Emissive Glowing Ores by ALNStudios (V1.0.0).mcpack` with Minecraft.
4. Activate the pack on your world, and turn on Vibrant Visuals in Video settings.

Options: `--glow 255` (speckle strength), `--outline 255` (outline strength, `0` removes it), `--threshold 14` (how different from the stone color a pixel must be to count as ore), `--keep-metalness`.

## MER map: exact values

The MER image is a 16x16 RGB PNG with the same name as the color texture plus `_mer` (`diamond_ore.png` -> `diamond_ore_mer.png`), saved next to it.

- Red = Metalness (0-255)
- Green = Emissive (0-255)
- Blue = Roughness (0-255)

Paint these values:

- Stone or base pixels: `R0 G0 B200`. Shaded normally, no glow.
- Ore speckle pixels: `R0 G255 B200`. Gems (diamond, emerald, lapis, quartz) can use `B100` for a shinier surface.
- Outline pixels (the 60 border pixels of the 16x16 image): `R0 G255 B200`.
- Half glow: `G128`. Use it for a softer outline.

Why `R0` on glowing pixels: metalness darkens the base color, which dulls the glow. The generated maps keep Mojang's vanilla Red and Blue values on non-glowing pixels and only change Green.

Steps in Aseprite, Photoshop or Blockbench:

1. New 16x16 image, RGB color mode, 8 bits per channel, no alpha.
2. Fill everything with `R0 G0 B200`.
3. Paint over the ore pixels in the color texture with `R0 G255 B200`. Keep the color PNG open as a reference layer and hide it before export.
4. Paint the 1-pixel border with `R0 G255 B200`.
5. Use the pencil with anti-aliasing off. No blur, no soft brush, no layer opacity below 100%.
6. Check a few pixels with the eyedropper. Colour management can shift values, so embed no color profile.
7. Export as PNG at 100% scale: Aseprite `File > Export As`; Photoshop `File > Export > Save for Web`, PNG-24, no metadata, "Convert to sRGB" off; Blockbench save the texture as PNG.

The color PNG stays the 16x16 vanilla (or your custom) texture, same name as the original. In texture-set JSON, `color` and `metalness_emissive_roughness` are image names without extension, relative to the JSON file's folder.

## blocks.json fallback

Checked against Mojang's `blocks.json` in bedrock-samples: it only uses `sound`, `sounds`, `textures`, `carried_textures`, `isotropic` and `ambient_occlusion_exponent`. No key makes a block or part of a texture glow, so this pack ships no `blocks.json`.

Without Vibrant Visuals the engine ignores the MER map. The only light-free option there is a brighter color texture: `--classic-boost 0.3` lifts the ore pixels in the color PNG. It does not make them glow in total darkness.

## Known limits

- Coal glows weakly because its pixels are nearly black and emissive uses the pixel color.
- Ancient Debris has no ore speckles, so the brightest 10% of its pixels glow.
- `min_engine_version` is `1.26.60`, copied from Mojang's current sample pack manifest. The true minimum was not verified.
