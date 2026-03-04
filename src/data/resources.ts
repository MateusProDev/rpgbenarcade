// ============================================
// Resource Nodes — trees, rocks, herbs, ores
// Harvestable objects placed in zones
// ============================================
import type { Vec2 } from '@/store/types';

export type ResourceType = 'tree' | 'rock' | 'herb' | 'ore' | 'bush';

export interface ResourceNodeDef {
  id: string;
  name: string;
  type: ResourceType;
  icon: string;
  hp: number;           // hits to harvest
  respawnTime: number;  // seconds
  levelReq: number;
  loot: { itemId: string; minQty: number; maxQty: number; chance: number }[];
  xpReward: number;
  toolRequired?: string; // 'axe' | 'pickaxe' | 'none'
}

export interface ResourceNodeInstance {
  defId: string;
  position: Vec2;
}

/* ---- Resource Definitions ---- */
export const RESOURCE_DEFS: Record<string, ResourceNodeDef> = {
  // Trees
  oak_tree: {
    id: 'oak_tree',
    name: 'Carvalho',
    type: 'tree',
    icon: '🌳',
    hp: 5,
    respawnTime: 60,
    levelReq: 1,
    loot: [
      { itemId: 'wood_log', minQty: 2, maxQty: 5, chance: 1.0 },
      { itemId: 'tree_sap', minQty: 1, maxQty: 1, chance: 0.2 },
    ],
    xpReward: 8,
    toolRequired: 'axe',
  },
  pine_tree: {
    id: 'pine_tree',
    name: 'Pinheiro',
    type: 'tree',
    icon: '🌲',
    hp: 4,
    respawnTime: 50,
    levelReq: 1,
    loot: [
      { itemId: 'wood_log', minQty: 1, maxQty: 3, chance: 1.0 },
      { itemId: 'pine_resin', minQty: 1, maxQty: 2, chance: 0.3 },
    ],
    xpReward: 6,
    toolRequired: 'axe',
  },
  dark_tree: {
    id: 'dark_tree',
    name: 'Árvore Sombria',
    type: 'tree',
    icon: '🌳',
    hp: 8,
    respawnTime: 120,
    levelReq: 5,
    loot: [
      { itemId: 'dark_wood', minQty: 2, maxQty: 4, chance: 1.0 },
      { itemId: 'shadow_essence', minQty: 1, maxQty: 1, chance: 0.15 },
    ],
    xpReward: 20,
    toolRequired: 'axe',
  },

  // Rocks
  stone_deposit: {
    id: 'stone_deposit',
    name: 'Depósito de Pedra',
    type: 'rock',
    icon: '🪨',
    hp: 6,
    respawnTime: 90,
    levelReq: 1,
    loot: [
      { itemId: 'stone', minQty: 2, maxQty: 5, chance: 1.0 },
      { itemId: 'flint', minQty: 1, maxQty: 1, chance: 0.25 },
    ],
    xpReward: 10,
    toolRequired: 'pickaxe',
  },
  iron_vein: {
    id: 'iron_vein',
    name: 'Veio de Ferro',
    type: 'ore',
    icon: '⛏️',
    hp: 8,
    respawnTime: 120,
    levelReq: 3,
    loot: [
      { itemId: 'iron_ore', minQty: 1, maxQty: 3, chance: 1.0 },
      { itemId: 'stone', minQty: 1, maxQty: 2, chance: 0.5 },
    ],
    xpReward: 18,
    toolRequired: 'pickaxe',
  },
  crystal_vein: {
    id: 'crystal_vein',
    name: 'Veio de Cristal',
    type: 'ore',
    icon: '💎',
    hp: 12,
    respawnTime: 180,
    levelReq: 8,
    loot: [
      { itemId: 'crystal_shard', minQty: 1, maxQty: 2, chance: 1.0 },
      { itemId: 'dark_crystal', minQty: 1, maxQty: 1, chance: 0.1 },
    ],
    xpReward: 35,
    toolRequired: 'pickaxe',
  },

  // Herbs
  healing_herb: {
    id: 'healing_herb',
    name: 'Erva Curativa',
    type: 'herb',
    icon: '🌿',
    hp: 1,
    respawnTime: 45,
    levelReq: 1,
    loot: [
      { itemId: 'herb_green', minQty: 1, maxQty: 3, chance: 1.0 },
    ],
    xpReward: 5,
  },
  mana_flower: {
    id: 'mana_flower',
    name: 'Flor de Mana',
    type: 'herb',
    icon: '🌸',
    hp: 1,
    respawnTime: 60,
    levelReq: 3,
    loot: [
      { itemId: 'herb_blue', minQty: 1, maxQty: 2, chance: 1.0 },
    ],
    xpReward: 8,
  },
  shadow_mushroom: {
    id: 'shadow_mushroom',
    name: 'Cogumelo Sombrio',
    type: 'herb',
    icon: '🍄',
    hp: 1,
    respawnTime: 90,
    levelReq: 5,
    loot: [
      { itemId: 'herb_dark', minQty: 1, maxQty: 2, chance: 1.0 },
      { itemId: 'shadow_essence', minQty: 1, maxQty: 1, chance: 0.1 },
    ],
    xpReward: 15,
  },

  // Bushes
  berry_bush: {
    id: 'berry_bush',
    name: 'Arbusto de Frutas',
    type: 'bush',
    icon: '🫐',
    hp: 1,
    respawnTime: 30,
    levelReq: 1,
    loot: [
      { itemId: 'berries', minQty: 1, maxQty: 4, chance: 1.0 },
    ],
    xpReward: 3,
  },
};

/* ---- Zone resource placements ---- */
export const ZONE_RESOURCES: Record<string, ResourceNodeInstance[]> = {
  town: [
    { defId: 'oak_tree', position: { x: 320, y: 280 } },
    { defId: 'oak_tree', position: { x: 480, y: 200 } },
    { defId: 'oak_tree', position: { x: 180, y: 500 } },
    { defId: 'pine_tree', position: { x: 600, y: 350 } },
    { defId: 'stone_deposit', position: { x: 350, y: 700 } },
    { defId: 'stone_deposit', position: { x: 900, y: 400 } },
    { defId: 'healing_herb', position: { x: 420, y: 480 } },
    { defId: 'healing_herb', position: { x: 250, y: 350 } },
    { defId: 'healing_herb', position: { x: 680, y: 260 } },
    { defId: 'berry_bush', position: { x: 550, y: 500 } },
    { defId: 'berry_bush', position: { x: 150, y: 680 } },
    { defId: 'berry_bush', position: { x: 820, y: 550 } },
  ],
  plains: [
    { defId: 'oak_tree', position: { x: 400, y: 400 } },
    { defId: 'oak_tree', position: { x: 800, y: 300 } },
    { defId: 'oak_tree', position: { x: 1200, y: 600 } },
    { defId: 'oak_tree', position: { x: 1600, y: 400 } },
    { defId: 'pine_tree', position: { x: 600, y: 800 } },
    { defId: 'pine_tree', position: { x: 1000, y: 1200 } },
    { defId: 'pine_tree', position: { x: 1800, y: 1000 } },
    { defId: 'stone_deposit', position: { x: 500, y: 1000 } },
    { defId: 'stone_deposit', position: { x: 1400, y: 800 } },
    { defId: 'iron_vein', position: { x: 2000, y: 600 } },
    { defId: 'iron_vein', position: { x: 1600, y: 1400 } },
    { defId: 'healing_herb', position: { x: 300, y: 500 } },
    { defId: 'healing_herb', position: { x: 900, y: 700 } },
    { defId: 'healing_herb', position: { x: 1500, y: 1100 } },
    { defId: 'mana_flower', position: { x: 700, y: 1100 } },
    { defId: 'mana_flower', position: { x: 1300, y: 500 } },
    { defId: 'berry_bush', position: { x: 200, y: 700 } },
    { defId: 'berry_bush', position: { x: 1100, y: 900 } },
  ],
  dark_forest: [
    { defId: 'dark_tree', position: { x: 400, y: 500 } },
    { defId: 'dark_tree', position: { x: 800, y: 800 } },
    { defId: 'dark_tree', position: { x: 1200, y: 600 } },
    { defId: 'dark_tree', position: { x: 1600, y: 1200 } },
    { defId: 'dark_tree', position: { x: 600, y: 1400 } },
    { defId: 'pine_tree', position: { x: 300, y: 900 } },
    { defId: 'stone_deposit', position: { x: 1000, y: 1000 } },
    { defId: 'iron_vein', position: { x: 1400, y: 1400 } },
    { defId: 'crystal_vein', position: { x: 1800, y: 800 } },
    { defId: 'shadow_mushroom', position: { x: 500, y: 1100 } },
    { defId: 'shadow_mushroom', position: { x: 900, y: 700 } },
    { defId: 'shadow_mushroom', position: { x: 1500, y: 1000 } },
    { defId: 'mana_flower', position: { x: 700, y: 600 } },
    { defId: 'mana_flower', position: { x: 1100, y: 1300 } },
  ],
  dungeon_entrance: [
    { defId: 'iron_vein', position: { x: 300, y: 500 } },
    { defId: 'iron_vein', position: { x: 700, y: 300 } },
    { defId: 'crystal_vein', position: { x: 500, y: 700 } },
    { defId: 'shadow_mushroom', position: { x: 400, y: 600 } },
  ],
  dungeon_depths: [
    { defId: 'crystal_vein', position: { x: 400, y: 500 } },
    { defId: 'crystal_vein', position: { x: 800, y: 800 } },
    { defId: 'crystal_vein', position: { x: 1200, y: 400 } },
    { defId: 'iron_vein', position: { x: 600, y: 600 } },
    { defId: 'shadow_mushroom', position: { x: 300, y: 700 } },
    { defId: 'shadow_mushroom', position: { x: 900, y: 500 } },
  ],
};
