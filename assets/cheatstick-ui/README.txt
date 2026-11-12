Cheatstick UI components
========================
Made by the Cheatstick UI Designer. All sizes are Minecraft GUI pixels (1 unit = 1 game pixel). Every PNG below is drawn at its true size.
Put the textures folder in the Resource Pack. design.json holds every value; preview_reference.png shows the intended result (4x zoom).

textures/ui/cheatstick/panel.png        8x8  nine-slice 3  (menu panel: fill, opacity 0.96, border 2, corners notched)
textures/ui/cheatstick/button.png       4x4  nine-slice 1  (normal button)
textures/ui/cheatstick/button_hover.png 4x4  nine-slice 1  (hover or highlighted button)
textures/ui/cheatstick/button_pressed.png 4x4  nine-slice 1  (pressed button)
textures/ui/cheatstick/title_bar.png    4x18  (flat bar, stretch across the panel width)
textures/ui/cheatstick/backdrop.png     1x1  (black at 0.5 opacity, stretch over the whole screen behind the menu)
Each .json next to a texture is its nine-slice description.

Layout (GUI pixels): panel width 190, padding 8, max height 210, title bar height 18, button height 20, gap between buttons 4, text under the title uses size 8.
Text: title name #ffaa00 + version #aaaaaa (center), body #b8bcc6, button text #ffffff (center), sizes 8/8/8. Use the Minecraft font; the preview font is only a stand-in.
Button icon slot: no. Raised bevel: yes (already drawn into the button textures).
Menus and their buttons are listed under 'screens' in design.json.