# Script notes

- main.js: registers the item use listener after the world loads and gives each player one OP book. Depends on lib/op_menu_ui.js.
- lib/op_menu_ui.js: exports openRootMenu. Root, gear and about forms.
- lib/op_item_distributor.js: exports deliverKit. Places a one-block structure holding a chest, moves the filled shulker box to the player, then restores air.

Custom item: aln:op_book. Structures: aln:god_tools, aln:god_armor. Script events: none. World keys: aln:op_book_given_<player id>.

Known limits: not tested in game. Level 255 and combined protections are written into the structure data and the game may lower or remove them. Every player can use the book.
