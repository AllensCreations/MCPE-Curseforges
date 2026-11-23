export const LOBBY = { x: 0, y: 65, z: 0 };
export const PILLAR_TOP_Y = 64;
export const ONE_BLOCK_Y = 64;
export const SPAWN_Y = 65;
export const GRID_STEP = 2000;
export const LEDGER_ID = "aln:pirate_ledger";
export const STARTER_LEDGER = true;

export const PROP = {
  SLOT: "aln:slot",
  TRAIT: "aln:trait",
  BREAKS: "aln:breaks",
  SLOTS: "aln:slots",
  GLOBAL: "aln:global_breaks",
  LOBBY_BUILT: "aln:lobby_built",
  LISTING_IDS: "aln:ledger_ids",
  LISTING_SEQ: "aln:ledger_seq",
  LISTING_PREFIX: "aln:listing_",
  PAYOUT_PREFIX: "aln:payout_",
};

export const BONUS_CHANCE = 0.3;
export const MAX_LISTINGS_PER_PLAYER = 8;
export const MAX_LISTINGS_TOTAL = 250;
export const MAX_TRADE_AMOUNT = 2304;
export const PAGE_SIZE = 6;
export const WELCOME_RETRY_LIMIT = 12;

export const TITLE = "§6§lALN:MultiIslandOneBlock";
export const WELCOME_BODY =
  "§eWelcome to the Multi-Island OneBlock Grid!\n\n§c⚠ Warning: Selecting your island spot is permanent and cannot be undone.\n\n§7Each player gets a private island separated by 2,000 blocks with unique resource affinities to encourage global trading.";

export const RULES_BODY = [
  "§eHow the grid works",
  "§7- Every player claims one private island. Islands sit 2,000 blocks apart in a square grid around the lobby.",
  "§7- Your island spot is permanent once you press Start.",
  "",
  "§eOneBlock phases",
  "§7- All islands share the same phase. Every OneBlock broken on any island moves the whole world closer to the next phase.",
  "",
  "§eIsland Richness",
  "§7- Each island has one Richness trait that boosts its block mix and adds bonus drops. No island has everything, so trade.",
  "",
  "§eGlobal Pirate Ledger",
  "§7- Right-click the ledger anywhere to list items, browse offers and collect earnings from other islands.",
  "§7- Listed items are held safely until they sell or you cancel the listing.",
].join("\n");
