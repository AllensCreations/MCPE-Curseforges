/**
 * Oneblock_Progression.js
 * Pure Data Pool Foundation for OneBlock Maps, Add-ons, and Minigames.
 * 
 * ARCHITECTURE PRINCIPLE:
 * - This file ONLY holds the DATA POOLS (Blocks, Chest Loot, Mobs, Phase Milestones & Themes).
 * - Pack-specific gameplay logic, spawn mechanics, triggers, chest roll rates, custom events,
 *   cooldowns, and island systems belong inside the individual pack's scripts.
 * - Packs import or read from this progression pool without mutating the shared definitions.
 */

/**
 * @typedef {Object} BlockPoolEntry
 * @property {string} id - Minecraft block identifier (e.g. "minecraft:grass_block")
 * @property {number} weight - Relative probability weight in the pool
 * @property {Record<string, any>} [states] - Optional block state permutations
 */

/**
 * @typedef {Object} ChestPoolEntry
 * @property {string} id - Minecraft item identifier (e.g. "minecraft:oak_sapling")
 * @property {number} min - Minimum stack count
 * @property {number} max - Maximum stack count
 * @property {number} weight - Relative weight in the pool
 */

/**
 * @typedef {Object} MobPoolEntry
 * @property {string} id - Entity identifier (e.g. "minecraft:cow")
 * @property {number} weight - Relative spawn weight in the pool
 */

/**
 * @typedef {Object} PhaseDataPool
 * @property {number} phase - Phase index (1-based)
 * @property {string} name - Phase title
 * @property {string} description - Lore / theme description
 * @property {number} blocksRequired - Base block break milestone to finish phase
 * @property {string} bedrockReplacement - Safe fallback block when breaking
 * @property {BlockPoolEntry[]} blocks - Block pool
 * @property {ChestPoolEntry[]} chests - Chest item loot pool
 * @property {MobPoolEntry[]} mobs - Entity spawn pool
 */

/**
 * Foundation Phase Pools
 * @type {PhaseDataPool[]}
 */
export const ONEBLOCK_PROGRESSION_POOLS = [
  {
    phase: 1,
    name: "Plains & Early Roots",
    description: "The humble beginnings of survival. Gather wood, dirt, and early agricultural supplies.",
    blocksRequired: 150,
    bedrockReplacement: "minecraft:grass_block",
    blocks: [
      { id: "minecraft:grass_block", weight: 35 },
      { id: "minecraft:dirt", weight: 30 },
      { id: "minecraft:oak_log", weight: 20 },
      { id: "minecraft:oak_leaves", weight: 10 },
      { id: "minecraft:clay", weight: 5 }
    ],
    chests: [
      { id: "minecraft:oak_sapling", min: 1, max: 3, weight: 25 },
      { id: "minecraft:wheat_seeds", min: 2, max: 6, weight: 25 },
      { id: "minecraft:apple", min: 1, max: 4, weight: 20 },
      { id: "minecraft:bone", min: 1, max: 3, weight: 15 },
      { id: "minecraft:water_bucket", min: 1, max: 1, weight: 15 }
    ],
    mobs: [
      { id: "minecraft:chicken", weight: 35 },
      { id: "minecraft:pig", weight: 30 },
      { id: "minecraft:sheep", weight: 25 },
      { id: "minecraft:cow", weight: 10 }
    ]
  },
  {
    phase: 2,
    name: "Underground Cavern",
    description: "Dig deep into stone layers, uncovering coal, raw iron, and subterranean minerals.",
    blocksRequired: 250,
    bedrockReplacement: "minecraft:stone",
    blocks: [
      { id: "minecraft:stone", weight: 35 },
      { id: "minecraft:cobblestone", weight: 25 },
      { id: "minecraft:gravel", weight: 15 },
      { id: "minecraft:coal_ore", weight: 12 },
      { id: "minecraft:iron_ore", weight: 8 },
      { id: "minecraft:copper_ore", weight: 5 }
    ],
    chests: [
      { id: "minecraft:torch", min: 4, max: 12, weight: 30 },
      { id: "minecraft:iron_nugget", min: 3, max: 8, weight: 25 },
      { id: "minecraft:raw_iron", min: 1, max: 3, weight: 20 },
      { id: "minecraft:bread", min: 2, max: 5, weight: 15 },
      { id: "minecraft:string", min: 1, max: 3, weight: 10 }
    ],
    mobs: [
      { id: "minecraft:bat", weight: 30 },
      { id: "minecraft:spider", weight: 35 },
      { id: "minecraft:zombie", weight: 35 }
    ]
  },
  {
    phase: 3,
    name: "Lush & Jungle Depths",
    description: "Rich green vegetation, mossy aquifers, and rare jungle materials.",
    blocksRequired: 350,
    bedrockReplacement: "minecraft:moss_block",
    blocks: [
      { id: "minecraft:moss_block", weight: 25 },
      { id: "minecraft:jungle_log", weight: 20 },
      { id: "minecraft:jungle_leaves", weight: 10 },
      { id: "minecraft:mud", weight: 15 },
      { id: "minecraft:bamboo", weight: 10 },
      { id: "minecraft:gold_ore", weight: 10 },
      { id: "minecraft:lapis_ore", weight: 10 }
    ],
    chests: [
      { id: "minecraft:bamboo", min: 2, max: 5, weight: 25 },
      { id: "minecraft:melon_seeds", min: 1, max: 3, weight: 20 },
      { id: "minecraft:cocoa_beans", min: 2, max: 4, weight: 20 },
      { id: "minecraft:azalea", min: 1, max: 2, weight: 15 },
      { id: "minecraft:golden_apple", min: 1, max: 1, weight: 10 },
      { id: "minecraft:lava_bucket", min: 1, max: 1, weight: 10 }
    ],
    mobs: [
      { id: "minecraft:ocelot", weight: 30 },
      { id: "minecraft:parrot", weight: 30 },
      { id: "minecraft:panda", weight: 20 },
      { id: "minecraft:skeleton", weight: 20 }
    ]
  },
  {
    phase: 4,
    name: "Nether Incursion",
    description: "Volcanic heat and otherworldly stone from the depths of the Nether.",
    blocksRequired: 450,
    bedrockReplacement: "minecraft:netherrack",
    blocks: [
      { id: "minecraft:netherrack", weight: 40 },
      { id: "minecraft:soul_sand", weight: 15 },
      { id: "minecraft:soul_soil", weight: 10 },
      { id: "minecraft:nether_quartz_ore", weight: 15 },
      { id: "minecraft:nether_gold_ore", weight: 10 },
      { id: "minecraft:blackstone", weight: 7 },
      { id: "minecraft:magma_block", weight: 3 }
    ],
    chests: [
      { id: "minecraft:nether_wart", min: 1, max: 4, weight: 25 },
      { id: "minecraft:blaze_powder", min: 1, max: 2, weight: 20 },
      { id: "minecraft:glowstone_dust", min: 2, max: 6, weight: 20 },
      { id: "minecraft:quartz", min: 2, max: 5, weight: 20 },
      { id: "minecraft:ghast_tear", min: 1, max: 1, weight: 15 }
    ],
    mobs: [
      { id: "minecraft:zombified_piglin", weight: 40 },
      { id: "minecraft:piglin", weight: 30 },
      { id: "minecraft:magma_cube", weight: 20 },
      { id: "minecraft:blaze", weight: 10 }
    ]
  },
  {
    phase: 5,
    name: "The End & Void Horizon",
    description: "The dimension beyond the stars. Ancient purpur, end stone, and deep void treasures.",
    blocksRequired: 600,
    bedrockReplacement: "minecraft:end_stone",
    blocks: [
      { id: "minecraft:end_stone", weight: 40 },
      { id: "minecraft:purpur_block", weight: 20 },
      { id: "minecraft:purpur_pillar", weight: 10 },
      { id: "minecraft:obsidian", weight: 15 },
      { id: "minecraft:crying_obsidian", weight: 10 },
      { id: "minecraft:diamond_ore", weight: 5 }
    ],
    chests: [
      { id: "minecraft:chorus_fruit", min: 2, max: 6, weight: 25 },
      { id: "minecraft:chorus_flower", min: 1, max: 2, weight: 20 },
      { id: "minecraft:ender_pearl", min: 1, max: 3, weight: 25 },
      { id: "minecraft:diamond", min: 1, max: 2, weight: 15 },
      { id: "minecraft:shulker_shell", min: 1, max: 2, weight: 15 }
    ],
    mobs: [
      { id: "minecraft:enderman", weight: 50 },
      { id: "minecraft:endermite", weight: 40 },
      { id: "minecraft:shulker", weight: 10 }
    ]
  }
];

// Alias for backward compatibility
export const ONEBLOCK_PROGRESSION = ONEBLOCK_PROGRESSION_POOLS;

/**
 * Pure Data Pool Accessor
 * Only provides sampling and lookup against the pools.
 * Pack rules (spawn rates, mechanics) are implemented by the pack.
 */
export class OneblockPoolProvider {
  /**
   * @param {PhaseDataPool[]} [pools]
   */
  constructor(pools = ONEBLOCK_PROGRESSION_POOLS) {
    this.pools = pools;
  }

  /**
   * Get phase data pool by 1-based number
   * @param {number} phaseNumber 
   * @returns {PhaseDataPool}
   */
  getPhasePool(phaseNumber) {
    const clampedIndex = Math.max(1, Math.min(phaseNumber, this.pools.length)) - 1;
    return this.pools[clampedIndex];
  }

  /**
   * Calculate milestone phase from broken block count
   * @param {number} totalBreaks 
   * @returns {{ phase: PhaseDataPool, phaseIndex: number, phaseBreaks: number, isLastPhase: boolean }}
   */
  getPhaseFromBreaks(totalBreaks) {
    let accumulated = 0;
    for (let i = 0; i < this.pools.length; i++) {
      const p = this.pools[i];
      if (totalBreaks < accumulated + p.blocksRequired) {
        return {
          phase: p,
          phaseIndex: i + 1,
          phaseBreaks: totalBreaks - accumulated,
          isLastPhase: false
        };
      }
      accumulated += p.blocksRequired;
    }
    const last = this.pools[this.pools.length - 1];
    return {
      phase: last,
      phaseIndex: this.pools.length,
      phaseBreaks: totalBreaks - accumulated,
      isLastPhase: true
    };
  }

  /**
   * Pick random item from a weighted pool
   * @template {{ weight: number }} T
   * @param {T[]} pool 
   * @returns {T}
   */
  static sampleWeighted(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of pool) {
      if (rand < item.weight) return item;
      rand -= item.weight;
    }
    return pool[pool.length - 1];
  }

  /** Sample a block from a phase pool */
  sampleBlock(phaseNumber) {
    return OneblockPoolProvider.sampleWeighted(this.getPhasePool(phaseNumber).blocks);
  }

  /** Sample a chest item from a phase pool */
  sampleChestItem(phaseNumber) {
    return OneblockPoolProvider.sampleWeighted(this.getPhasePool(phaseNumber).chests);
  }

  /** Sample a mob from a phase pool */
  sampleMob(phaseNumber) {
    return OneblockPoolProvider.sampleWeighted(this.getPhasePool(phaseNumber).mobs);
  }
}

// Backward-compatible alias
export const OneBlockProgressionManager = OneblockPoolProvider;
