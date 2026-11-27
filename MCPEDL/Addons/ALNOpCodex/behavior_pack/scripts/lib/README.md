# Script notes

- main.js: registers the item use listener after the world loads, and registers the /aln:alnop command. Depends on lib/op_menu_ui.js.
- lib/op_menu_ui.js: exports openRootMenu. Root, gear and about forms.
- lib/op_item_distributor.js: exports deliverKit. Places a one-block structure holding a chest, waits up to about two seconds for it, breaks the chest with a command, moves the dropped shulker box to the player, removes the dropped chest and leaves air.

The three structure files are built by structure_sources/make_structures.py.

Custom item: aln:op_book, crafted with the recipe in recipes/op_book.json. Structures: aln:god_tools, aln:god_armor, aln:god_supplies. Script events: none. World keys: none.

Known limits: not tested in game. Level 255 and combined protections are written into the structure data and the game may lower or remove them. Every player can use the book.
