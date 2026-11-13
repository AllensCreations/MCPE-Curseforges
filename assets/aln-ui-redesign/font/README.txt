ALN UI Redesign - Pixelify Sans font (menu-only glyph page F0)

For any pack with a menu, form, HUD or screen that follows the ALN UI Redesign skin:
1. Copy glyph_F0.png into <pack>/resource_pack/font/ (copy, never link).
2. Copy pixelify.js into <pack>/behavior_pack/scripts/lib/.
3. Wrap menu strings: form.title(pixelify("...")), form.button(pixelify("...")).
   Spaces stay normal. Color codes (section sign + letter) stay outside pixelify().
4. Bump the Resource Pack version with manifest_tools.py --set.

Covers plain ASCII letters, digits, punctuation only. Vanilla font is untouched elsewhere.
Page F0 (U+F000-U+F0FF) is assumed unused by Minecraft; not tested in game.
Font: Pixelify Sans, SIL OFL 1.1 (see PixelifySans-OFL.txt). Keep that file with any pack that ships the glyphs.
