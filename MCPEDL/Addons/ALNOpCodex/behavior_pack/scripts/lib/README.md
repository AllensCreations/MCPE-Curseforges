# Script notes

- main.js: registers the item use listener after the world loads, registers the /aln:alnop command and gives an OP book to a joining player who carries none. Depends on lib/op_menu_ui.js.
- lib/op_menu_ui.js: exports openRootMenu. Root, gear and about forms.
- lib/op_item_distributor.js: exports deliverKit. Places a one-block structure holding a chest, waits up to about two seconds for it, breaks the chest with a command, moves the dropped shulker box to the player, removes the dropped chest and leaves air.

The two structure files are built by structure_sources/make_structures.py.

Custom item: aln:op_book. Structures: aln:god_tools, aln:god_armor. Script events: none. World keys: none.

Known limits: not tested in game. Level 255 and combined protections are written into the structure data and the game may lower or remove them. Every player can use the book.
