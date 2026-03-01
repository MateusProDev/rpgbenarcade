// ========================
// Item Database
// ========================
import type { Item } from "../../types";

export const ITEMS: Record<string, Item> = {
  // === Weapons ===
  rusty_sword: {
    id: "rusty_sword",
    name: "Espada Enferrujada",
    description: "Uma velha espada com sinais de ferrugem.",
    type: "weapon",
    rarity: "common",
    level: 1,
    equipSlot: "weapon",
    attributeBonus: { strength: 2 },
    damage: 5,
    icon: "🗡️",
    price: 10,
  },
  iron_sword: {
    id: "iron_sword",
    name: "Espada de Ferro",
    description: "Espada forjada em ferro sólido.",
    type: "weapon",
    rarity: "common",
    level: 5,
    equipSlot: "weapon",
    attributeBonus: { strength: 5 },
    damage: 12,
    icon: "⚔️",
    price: 50,
  },
  steel_sword: {
    id: "steel_sword",
    name: "Espada de Aço",
    description: "Lâmina afiada de aço temperado.",
    type: "weapon",
    rarity: "rare",
    level: 10,
    equipSlot: "weapon",
    attributeBonus: { strength: 8, dexterity: 2 },
    damage: 22,
    icon: "⚔️",
    price: 150,
  },
  shadow_blade: {
    id: "shadow_blade",
    name: "Lâmina Sombria",
    description: "Forjada nas trevas, emana uma aura maligna.",
    type: "weapon",
    rarity: "epic",
    level: 15,
    equipSlot: "weapon",
    attributeBonus: { strength: 12, dexterity: 5 },
    damage: 35,
    icon: "🖤",
    price: 500,
  },
  excalibur: {
    id: "excalibur",
    name: "Excalibur",
    description: "A lendária espada dos reis. Irradia poder divino.",
    type: "weapon",
    rarity: "legendary",
    level: 20,
    equipSlot: "weapon",
    attributeBonus: { strength: 20, vitality: 10 },
    damage: 55,
    icon: "👑",
    price: 2000,
  },
  wooden_bow: {
    id: "wooden_bow",
    name: "Arco de Madeira",
    description: "Arco simples feito de carvalho.",
    type: "weapon",
    rarity: "common",
    level: 1,
    equipSlot: "weapon",
    attributeBonus: { dexterity: 2 },
    damage: 4,
    icon: "🏹",
    price: 10,
  },
  hunter_bow: {
    id: "hunter_bow",
    name: "Arco do Caçador",
    description: "Arco preciso usado por caçadores experientes.",
    type: "weapon",
    rarity: "rare",
    level: 10,
    equipSlot: "weapon",
    attributeBonus: { dexterity: 8 },
    damage: 20,
    icon: "🏹",
    price: 150,
  },
  apprentice_staff: {
    id: "apprentice_staff",
    name: "Cajado do Aprendiz",
    description: "Cajado básico para iniciantes na magia.",
    type: "weapon",
    rarity: "common",
    level: 1,
    equipSlot: "weapon",
    attributeBonus: { intelligence: 3 },
    damage: 3,
    icon: "🪄",
    price: 10,
  },
  arcane_staff: {
    id: "arcane_staff",
    name: "Cajado Arcano",
    description: "Cajado imbuído com energia arcana pura.",
    type: "weapon",
    rarity: "rare",
    level: 10,
    equipSlot: "weapon",
    attributeBonus: { intelligence: 10 },
    damage: 15,
    icon: "🔮",
    price: 160,
  },
  void_staff: {
    id: "void_staff",
    name: "Cajado do Vazio",
    description: "Canaliza o poder do abismo.",
    type: "weapon",
    rarity: "epic",
    level: 15,
    equipSlot: "weapon",
    attributeBonus: { intelligence: 15, vitality: 3 },
    damage: 30,
    icon: "🌀",
    price: 500,
  },
  iron_lance: {
    id: "iron_lance",
    name: "Lança de Ferro",
    description: "Lança robusta para combate defensivo.",
    type: "weapon",
    rarity: "common",
    level: 1,
    equipSlot: "weapon",
    attributeBonus: { strength: 2, vitality: 1 },
    damage: 5,
    icon: "🔱",
    price: 10,
  },
  guardian_lance: {
    id: "guardian_lance",
    name: "Lança do Guardião",
    description: "Lança consagrada dos protetores do reino.",
    type: "weapon",
    rarity: "epic",
    level: 15,
    equipSlot: "weapon",
    attributeBonus: { strength: 8, vitality: 10 },
    damage: 25,
    icon: "🔱",
    price: 450,
  },

  // === Armor ===
  cloth_armor: {
    id: "cloth_armor",
    name: "Armadura de Pano",
    description: "Proteção básica de tecido.",
    type: "armor",
    rarity: "common",
    level: 1,
    equipSlot: "body",
    defense: 3,
    attributeBonus: { vitality: 1 },
    icon: "👕",
    price: 8,
  },
  leather_armor: {
    id: "leather_armor",
    name: "Armadura de Couro",
    description: "Armadura leve feita de couro curtido.",
    type: "armor",
    rarity: "common",
    level: 5,
    equipSlot: "body",
    defense: 8,
    attributeBonus: { vitality: 3, dexterity: 1 },
    icon: "🦺",
    price: 40,
  },
  chainmail: {
    id: "chainmail",
    name: "Cota de Malha",
    description: "Malha de anéis de metal entrelaçados.",
    type: "armor",
    rarity: "rare",
    level: 10,
    equipSlot: "body",
    defense: 15,
    attributeBonus: { vitality: 5, strength: 2 },
    icon: "🛡️",
    price: 120,
  },
  plate_armor: {
    id: "plate_armor",
    name: "Armadura de Placas",
    description: "Pesada armadura de placas de aço.",
    type: "armor",
    rarity: "epic",
    level: 15,
    equipSlot: "body",
    defense: 25,
    attributeBonus: { vitality: 10, strength: 3 },
    icon: "🏰",
    price: 400,
  },
  dragon_armor: {
    id: "dragon_armor",
    name: "Armadura Dracônica",
    description: "Forjada com escamas de dragão ancestral.",
    type: "armor",
    rarity: "legendary",
    level: 20,
    equipSlot: "body",
    defense: 40,
    attributeBonus: { vitality: 15, strength: 8, intelligence: 5 },
    icon: "🐉",
    price: 1800,
  },
  iron_helm: {
    id: "iron_helm",
    name: "Elmo de Ferro",
    description: "Proteção básica para a cabeça.",
    type: "armor",
    rarity: "common",
    level: 3,
    equipSlot: "head",
    defense: 4,
    attributeBonus: { vitality: 2 },
    icon: "⛑️",
    price: 25,
  },
  leather_boots: {
    id: "leather_boots",
    name: "Botas de Couro",
    description: "Botas leves que melhoram a mobilidade.",
    type: "armor",
    rarity: "common",
    level: 3,
    equipSlot: "legs",
    defense: 3,
    attributeBonus: { dexterity: 2 },
    icon: "👢",
    price: 20,
  },
  ring_of_power: {
    id: "ring_of_power",
    name: "Anel do Poder",
    description: "Um anel misterioso que amplifica habilidades.",
    type: "accessory",
    rarity: "rare",
    level: 8,
    equipSlot: "accessory",
    attributeBonus: { strength: 3, intelligence: 3 },
    icon: "💍",
    price: 200,
  },

  // === Consumables ===
  health_potion: {
    id: "health_potion",
    name: "Poção de Vida",
    description: "Restaura 50 HP.",
    type: "consumable",
    rarity: "common",
    level: 1,
    icon: "❤️",
    price: 15,
  },
  mana_potion: {
    id: "mana_potion",
    name: "Poção de Mana",
    description: "Restaura 40 Mana.",
    type: "consumable",
    rarity: "common",
    level: 1,
    icon: "💙",
    price: 15,
  },
  greater_health_potion: {
    id: "greater_health_potion",
    name: "Poção de Vida Superior",
    description: "Restaura 120 HP.",
    type: "consumable",
    rarity: "rare",
    level: 8,
    icon: "❤️‍🔥",
    price: 50,
  },
  elixir_of_strength: {
    id: "elixir_of_strength",
    name: "Elixir de Força",
    description: "Aumenta força temporariamente.",
    type: "consumable",
    rarity: "rare",
    level: 5,
    icon: "💪",
    price: 40,
  },
};

export function getItem(id: string): Item | undefined {
  return ITEMS[id];
}

export function getItemsByType(type: Item["type"]): Item[] {
  return Object.values(ITEMS).filter((i) => i.type === type);
}

export function getItemsByRarity(rarity: Item["rarity"]): Item[] {
  return Object.values(ITEMS).filter((i) => i.rarity === rarity);
}

export function generateLoot(enemyLevel: number): Item[] {
  const loot: Item[] = [];
  const allItems = Object.values(ITEMS);
  const eligible = allItems.filter((i) => i.level <= enemyLevel + 3);

  // ALWAYS drop at least one item
  const weights = { common: 55, rare: 28, epic: 13, legendary: 4 };
  const roll = Math.random() * 100;
  let rarity: Item["rarity"] = "common";
  if (roll < weights.legendary) rarity = "legendary";
  else if (roll < weights.legendary + weights.epic) rarity = "epic";
  else if (roll < weights.legendary + weights.epic + weights.rare) rarity = "rare";

  const rarityItems = eligible.filter((i) => i.rarity === rarity);
  if (rarityItems.length > 0) {
    loot.push(rarityItems[Math.floor(Math.random() * rarityItems.length)]);
  } else {
    // Fallback: always give a health potion
    loot.push(ITEMS.health_potion);
  }

  // Additional drops
  if (Math.random() < 0.35) {
    loot.push(ITEMS.health_potion);
  }
  if (Math.random() < 0.25) {
    loot.push(ITEMS.mana_potion);
  }

  // Extra equipment chance for higher enemies
  if (enemyLevel >= 3 && Math.random() < 0.25) {
    const extraRoll = Math.random() * 100;
    let extraRarity: Item["rarity"] = "common";
    if (extraRoll < 5) extraRarity = "legendary";
    else if (extraRoll < 18) extraRarity = "epic";
    else if (extraRoll < 45) extraRarity = "rare";

    const extraItems = eligible.filter((i) => i.rarity === extraRarity && i.type !== "consumable");
    if (extraItems.length > 0) {
      loot.push(extraItems[Math.floor(Math.random() * extraItems.length)]);
    }
  }

  return loot;
}
