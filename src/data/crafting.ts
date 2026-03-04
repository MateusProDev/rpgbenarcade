// ============================================
// Crafting System — recipes, stations, crafting logic
// ============================================
import type { ItemSlot, ItemRarity } from '@/store/types';

export type CraftingStation = 'anvil' | 'alchemy' | 'workbench' | 'enchanting';

export interface CraftingRecipe {
  id: string;
  name: string;
  icon: string;
  station: CraftingStation;
  levelReq: number;
  ingredients: { itemId: string; quantity: number }[];
  result: { itemId: string; quantity: number };
  craftTime: number; // seconds
  xpReward: number;
}

export interface CraftingStationDef {
  id: CraftingStation;
  name: string;
  icon: string;
  description: string;
  npcId?: string; // associated NPC
}

/* ---- Stations ---- */
export const CRAFTING_STATIONS: Record<CraftingStation, CraftingStationDef> = {
  anvil: {
    id: 'anvil',
    name: 'Forja do Ferreiro',
    icon: '⚒️',
    description: 'Forje armas e armaduras com metais e materiais.',
    npcId: 'blacksmith_drake',
  },
  alchemy: {
    id: 'alchemy',
    name: 'Mesa de Alquimia',
    icon: '⚗️',
    description: 'Crie poções e elixires com ervas e ingredientes.',
    npcId: 'alchemist_luna',
  },
  workbench: {
    id: 'workbench',
    name: 'Bancada de Trabalho',
    icon: '🔨',
    description: 'Crie ferramentas, arcos e itens utilitários.',
    npcId: 'carpenter_oak',
  },
  enchanting: {
    id: 'enchanting',
    name: 'Mesa de Encantamentos',
    icon: '✨',
    description: 'Encante equipamentos com cristais e essências.',
    npcId: 'enchanter_mira',
  },
};

/* ---- Recipes ---- */
export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  /* ---- Tools ---- */
  basic_axe: {
    id: 'basic_axe',
    name: 'Machado Básico',
    icon: '🪓',
    station: 'workbench',
    levelReq: 1,
    ingredients: [
      { itemId: 'wood_log', quantity: 5 },
      { itemId: 'stone', quantity: 3 },
    ],
    result: { itemId: 'tool_axe', quantity: 1 },
    craftTime: 3,
    xpReward: 15,
  },
  basic_pickaxe: {
    id: 'basic_pickaxe',
    name: 'Picareta Básica',
    icon: '⛏️',
    station: 'workbench',
    levelReq: 1,
    ingredients: [
      { itemId: 'wood_log', quantity: 5 },
      { itemId: 'stone', quantity: 5 },
    ],
    result: { itemId: 'tool_pickaxe', quantity: 1 },
    craftTime: 3,
    xpReward: 15,
  },
  iron_axe: {
    id: 'iron_axe',
    name: 'Machado de Ferro',
    icon: '🪓',
    station: 'anvil',
    levelReq: 3,
    ingredients: [
      { itemId: 'wood_log', quantity: 3 },
      { itemId: 'iron_ore', quantity: 4 },
    ],
    result: { itemId: 'tool_iron_axe', quantity: 1 },
    craftTime: 5,
    xpReward: 30,
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Picareta de Ferro',
    icon: '⛏️',
    station: 'anvil',
    levelReq: 3,
    ingredients: [
      { itemId: 'wood_log', quantity: 3 },
      { itemId: 'iron_ore', quantity: 5 },
    ],
    result: { itemId: 'tool_iron_pickaxe', quantity: 1 },
    craftTime: 5,
    xpReward: 30,
  },

  /* ---- Weapons ---- */
  craft_sword_iron: {
    id: 'craft_sword_iron',
    name: 'Espada de Ferro',
    icon: '⚔️',
    station: 'anvil',
    levelReq: 2,
    ingredients: [
      { itemId: 'iron_ore', quantity: 5 },
      { itemId: 'wood_log', quantity: 2 },
    ],
    result: { itemId: 'sword_iron', quantity: 1 },
    craftTime: 5,
    xpReward: 25,
  },
  craft_sword_steel: {
    id: 'craft_sword_steel',
    name: 'Espada de Aço',
    icon: '⚔️',
    station: 'anvil',
    levelReq: 5,
    ingredients: [
      { itemId: 'iron_ore', quantity: 10 },
      { itemId: 'dark_wood', quantity: 3 },
      { itemId: 'flint', quantity: 2 },
    ],
    result: { itemId: 'sword_steel', quantity: 1 },
    craftTime: 8,
    xpReward: 50,
  },
  craft_bow: {
    id: 'craft_bow',
    name: 'Arco Curto',
    icon: '🏹',
    station: 'workbench',
    levelReq: 2,
    ingredients: [
      { itemId: 'wood_log', quantity: 6 },
      { itemId: 'spider_silk', quantity: 2 },
    ],
    result: { itemId: 'bow_short', quantity: 1 },
    craftTime: 4,
    xpReward: 20,
  },
  craft_staff: {
    id: 'craft_staff',
    name: 'Cajado Arcano',
    icon: '🪄',
    station: 'enchanting',
    levelReq: 6,
    ingredients: [
      { itemId: 'dark_wood', quantity: 5 },
      { itemId: 'crystal_shard', quantity: 3 },
      { itemId: 'shadow_essence', quantity: 2 },
    ],
    result: { itemId: 'staff_arcane', quantity: 1 },
    craftTime: 10,
    xpReward: 80,
  },
  craft_dagger: {
    id: 'craft_dagger',
    name: 'Adaga Sombria',
    icon: '🗡️',
    station: 'anvil',
    levelReq: 8,
    ingredients: [
      { itemId: 'iron_ore', quantity: 6 },
      { itemId: 'shadow_essence', quantity: 3 },
      { itemId: 'dark_crystal', quantity: 1 },
    ],
    result: { itemId: 'dagger_shadow', quantity: 1 },
    craftTime: 8,
    xpReward: 60,
  },

  /* ---- Armor ---- */
  craft_leather_armor: {
    id: 'craft_leather_armor',
    name: 'Armadura de Couro',
    icon: '🛡️',
    station: 'workbench',
    levelReq: 3,
    ingredients: [
      { itemId: 'leather_scrap', quantity: 8 },
      { itemId: 'spider_silk', quantity: 2 },
    ],
    result: { itemId: 'armor_leather', quantity: 1 },
    craftTime: 6,
    xpReward: 35,
  },
  craft_plate_armor: {
    id: 'craft_plate_armor',
    name: 'Armadura de Placas',
    icon: '🛡️',
    station: 'anvil',
    levelReq: 8,
    ingredients: [
      { itemId: 'iron_ore', quantity: 15 },
      { itemId: 'leather_scrap', quantity: 5 },
      { itemId: 'dark_crystal', quantity: 1 },
    ],
    result: { itemId: 'armor_plate', quantity: 1 },
    craftTime: 12,
    xpReward: 80,
  },
  craft_mage_robe: {
    id: 'craft_mage_robe',
    name: 'Manto do Mago',
    icon: '👘',
    station: 'enchanting',
    levelReq: 4,
    ingredients: [
      { itemId: 'spider_silk', quantity: 6 },
      { itemId: 'herb_blue', quantity: 3 },
      { itemId: 'crystal_shard', quantity: 1 },
    ],
    result: { itemId: 'robe_mage', quantity: 1 },
    craftTime: 8,
    xpReward: 45,
  },

  /* ---- Potions ---- */
  craft_hp_potion_small: {
    id: 'craft_hp_potion_small',
    name: 'Poção de Vida (P)',
    icon: '🧪',
    station: 'alchemy',
    levelReq: 1,
    ingredients: [
      { itemId: 'herb_green', quantity: 3 },
      { itemId: 'berries', quantity: 2 },
    ],
    result: { itemId: 'potion_hp_small', quantity: 2 },
    craftTime: 2,
    xpReward: 8,
  },
  craft_hp_potion_medium: {
    id: 'craft_hp_potion_medium',
    name: 'Poção de Vida (M)',
    icon: '🧪',
    station: 'alchemy',
    levelReq: 5,
    ingredients: [
      { itemId: 'herb_green', quantity: 5 },
      { itemId: 'herb_dark', quantity: 2 },
      { itemId: 'slime_gel', quantity: 3 },
    ],
    result: { itemId: 'potion_hp_medium', quantity: 2 },
    craftTime: 4,
    xpReward: 20,
  },
  craft_mp_potion_small: {
    id: 'craft_mp_potion_small',
    name: 'Poção de Mana (P)',
    icon: '💧',
    station: 'alchemy',
    levelReq: 1,
    ingredients: [
      { itemId: 'herb_blue', quantity: 3 },
      { itemId: 'berries', quantity: 1 },
    ],
    result: { itemId: 'potion_mp_small', quantity: 2 },
    craftTime: 2,
    xpReward: 8,
  },
  craft_mp_potion_medium: {
    id: 'craft_mp_potion_medium',
    name: 'Poção de Mana (M)',
    icon: '💧',
    station: 'alchemy',
    levelReq: 5,
    ingredients: [
      { itemId: 'herb_blue', quantity: 5 },
      { itemId: 'herb_dark', quantity: 2 },
      { itemId: 'crystal_shard', quantity: 1 },
    ],
    result: { itemId: 'potion_mp_medium', quantity: 2 },
    craftTime: 4,
    xpReward: 20,
  },

  /* ---- Enchanting ---- */
  enchant_ring_crit: {
    id: 'enchant_ring_crit',
    name: 'Anel do Predador',
    icon: '💍',
    station: 'enchanting',
    levelReq: 6,
    ingredients: [
      { itemId: 'iron_ore', quantity: 3 },
      { itemId: 'crystal_shard', quantity: 3 },
      { itemId: 'shadow_essence', quantity: 2 },
    ],
    result: { itemId: 'ring_crit', quantity: 1 },
    craftTime: 10,
    xpReward: 70,
  },
  enchant_amulet_life: {
    id: 'enchant_amulet_life',
    name: 'Amuleto da Vitalidade',
    icon: '📿',
    station: 'enchanting',
    levelReq: 4,
    ingredients: [
      { itemId: 'herb_green', quantity: 5 },
      { itemId: 'crystal_shard', quantity: 2 },
      { itemId: 'tree_sap', quantity: 3 },
    ],
    result: { itemId: 'amulet_life', quantity: 1 },
    craftTime: 8,
    xpReward: 50,
  },

  /* ---- Utility ---- */
  craft_torch: {
    id: 'craft_torch',
    name: 'Tocha',
    icon: '🔥',
    station: 'workbench',
    levelReq: 1,
    ingredients: [
      { itemId: 'wood_log', quantity: 2 },
      { itemId: 'pine_resin', quantity: 1 },
    ],
    result: { itemId: 'torch', quantity: 3 },
    craftTime: 1,
    xpReward: 5,
  },
  craft_bandage: {
    id: 'craft_bandage',
    name: 'Bandagem',
    icon: '🩹',
    station: 'workbench',
    levelReq: 1,
    ingredients: [
      { itemId: 'spider_silk', quantity: 2 },
      { itemId: 'herb_green', quantity: 1 },
    ],
    result: { itemId: 'bandage', quantity: 3 },
    craftTime: 2,
    xpReward: 6,
  },
};

/** Get recipes available at a given station */
export function getRecipesForStation(station: CraftingStation): CraftingRecipe[] {
  return Object.values(CRAFTING_RECIPES).filter((r) => r.station === station);
}

/** Check if player has enough materials */
export function canCraft(
  recipe: CraftingRecipe,
  inventory: { templateId: string; quantity: number }[],
): boolean {
  for (const ing of recipe.ingredients) {
    const owned = inventory
      .filter((i) => i.templateId === ing.itemId)
      .reduce((sum, i) => sum + i.quantity, 0);
    if (owned < ing.quantity) return false;
  }
  return true;
}
