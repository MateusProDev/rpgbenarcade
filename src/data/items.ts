// ============================================
// Item Definitions — equipment, consumables, materials
// ============================================
import type { ItemTemplate } from '@/store/types';

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  /* ---- Consumables ---- */
  potion_hp_small: {
    id: 'potion_hp_small', name: 'Poção de Vida (P)', description: 'Restaura 30 HP.',
    rarity: 'common', slot: 'consumable', icon: '🧪', dropRate: 0.4, levelReq: 1, price: 10,
    stats: { hp: 30 },
  },
  potion_hp_medium: {
    id: 'potion_hp_medium', name: 'Poção de Vida (M)', description: 'Restaura 80 HP.',
    rarity: 'uncommon', slot: 'consumable', icon: '🧪', dropRate: 0.2, levelReq: 5, price: 30,
    stats: { hp: 80 },
  },
  potion_mp_small: {
    id: 'potion_mp_small', name: 'Poção de Mana (P)', description: 'Restaura 25 Mana.',
    rarity: 'common', slot: 'consumable', icon: '💧', dropRate: 0.35, levelReq: 1, price: 12,
    stats: { mana: 25 },
  },
  potion_mp_medium: {
    id: 'potion_mp_medium', name: 'Poção de Mana (M)', description: 'Restaura 60 Mana.',
    rarity: 'uncommon', slot: 'consumable', icon: '💧', dropRate: 0.15, levelReq: 5, price: 35,
    stats: { mana: 60 },
  },

  /* ---- Weapons ---- */
  sword_iron: {
    id: 'sword_iron', name: 'Espada de Ferro', description: 'Uma espada básica porém confiável.',
    rarity: 'common', slot: 'weapon', icon: '⚔️', dropRate: 0.05, levelReq: 1, price: 50,
    stats: { attack: 5 },
  },
  sword_steel: {
    id: 'sword_steel', name: 'Espada de Aço', description: 'Lâmina afiada de aço forjado.',
    rarity: 'uncommon', slot: 'weapon', icon: '⚔️', dropRate: 0.03, levelReq: 5, price: 150,
    stats: { attack: 10, critRate: 0.02 },
  },
  sword_dragon: {
    id: 'sword_dragon', name: 'Espada do Dragão', description: 'Forjada com escamas de dragão ancião.',
    rarity: 'legendary', slot: 'weapon', icon: '🗡️', dropRate: 0.01, levelReq: 12, price: 2000,
    stats: { attack: 25, critRate: 0.08, critDamage: 0.3 },
  },
  staff_arcane: {
    id: 'staff_arcane', name: 'Cajado Arcano', description: 'Canaliza energia mágica pura.',
    rarity: 'rare', slot: 'weapon', icon: '🪄', dropRate: 0.02, levelReq: 6, price: 300,
    stats: { attack: 15, mana: 30, maxMana: 30 },
  },
  bow_short: {
    id: 'bow_short', name: 'Arco Curto', description: 'Arco leve e rápido.',
    rarity: 'common', slot: 'weapon', icon: '🏹', dropRate: 0.04, levelReq: 2, price: 60,
    stats: { attack: 6, speed: 10 },
  },
  dagger_shadow: {
    id: 'dagger_shadow', name: 'Adaga Sombria', description: 'Lâmina imbuída de escuridão.',
    rarity: 'rare', slot: 'weapon', icon: '🗡️', dropRate: 0.02, levelReq: 8, price: 350,
    stats: { attack: 12, critRate: 0.1, speed: 15 },
  },

  /* ---- Armor ---- */
  armor_leather: {
    id: 'armor_leather', name: 'Armadura de Couro', description: 'Proteção leve mas eficaz.',
    rarity: 'common', slot: 'armor', icon: '🛡️', dropRate: 0.06, levelReq: 3, price: 80,
    stats: { defense: 5, hp: 15, maxHp: 15 },
  },
  armor_plate: {
    id: 'armor_plate', name: 'Armadura de Placas', description: 'Pesada mas resistente.',
    rarity: 'rare', slot: 'armor', icon: '🛡️', dropRate: 0.02, levelReq: 8, price: 400,
    stats: { defense: 14, hp: 40, maxHp: 40, speed: -10 },
  },
  armor_dragon: {
    id: 'armor_dragon', name: 'Armadura Draconiana', description: 'Escamas de dragão forjadas em armadura.',
    rarity: 'legendary', slot: 'armor', icon: '🛡️', dropRate: 0.01, levelReq: 12, price: 2500,
    stats: { defense: 20, hp: 80, maxHp: 80, attack: 5 },
  },
  robe_mage: {
    id: 'robe_mage', name: 'Manto do Mago', description: 'Tecido encantado que amplifica magia.',
    rarity: 'uncommon', slot: 'armor', icon: '👘', dropRate: 0.04, levelReq: 4, price: 120,
    stats: { defense: 3, mana: 40, maxMana: 40 },
  },

  /* ---- Helmets ---- */
  helmet_iron: {
    id: 'helmet_iron', name: 'Elmo de Ferro', description: 'Proteção básica para a cabeça.',
    rarity: 'common', slot: 'helmet', icon: '⛑️', dropRate: 0.05, levelReq: 2, price: 40,
    stats: { defense: 3, hp: 10, maxHp: 10 },
  },

  /* ---- Boots ---- */
  boots_swift: {
    id: 'boots_swift', name: 'Botas da Agilidade', description: 'Aumenta velocidade de movimento.',
    rarity: 'uncommon', slot: 'boots', icon: '👢', dropRate: 0.04, levelReq: 3, price: 90,
    stats: { speed: 20, defense: 2 },
  },

  /* ---- Accessories ---- */
  ring_crit: {
    id: 'ring_crit', name: 'Anel do Predador', description: 'Aumenta chance de crítico.',
    rarity: 'rare', slot: 'accessory', icon: '💍', dropRate: 0.02, levelReq: 6, price: 250,
    stats: { critRate: 0.08, critDamage: 0.2 },
  },
  amulet_life: {
    id: 'amulet_life', name: 'Amuleto da Vitalidade', description: 'Aumenta HP máximo.',
    rarity: 'uncommon', slot: 'accessory', icon: '📿', dropRate: 0.03, levelReq: 4, price: 150,
    stats: { hp: 30, maxHp: 30 },
  },

  /* ---- Materials ---- */
  slime_gel: {
    id: 'slime_gel', name: 'Gel de Slime', description: 'Material viscoso de slime.',
    rarity: 'common', slot: 'consumable', icon: '🟢', dropRate: 0.6, levelReq: 1, price: 3,
  },
  wolf_fang: {
    id: 'wolf_fang', name: 'Presa de Lobo', description: 'Dente afiado de lobo.',
    rarity: 'common', slot: 'consumable', icon: '🦷', dropRate: 0.3, levelReq: 1, price: 8,
  },
  leather_scrap: {
    id: 'leather_scrap', name: 'Couro Bruto', description: 'Couro não tratado.',
    rarity: 'common', slot: 'consumable', icon: '🟤', dropRate: 0.5, levelReq: 1, price: 5,
  },
  shadow_essence: {
    id: 'shadow_essence', name: 'Essência Sombria', description: 'Energia escura cristalizada.',
    rarity: 'rare', slot: 'consumable', icon: '🖤', dropRate: 0.25, levelReq: 5, price: 50,
  },
  spider_silk: {
    id: 'spider_silk', name: 'Seda de Aranha', description: 'Fio extremamente resistente.',
    rarity: 'uncommon', slot: 'consumable', icon: '🕸️', dropRate: 0.5, levelReq: 5, price: 15,
  },
  bone_fragment: {
    id: 'bone_fragment', name: 'Fragmento de Osso', description: 'Osso frágil de esqueleto.',
    rarity: 'common', slot: 'consumable', icon: '🦴', dropRate: 0.6, levelReq: 1, price: 4,
  },
  dark_crystal: {
    id: 'dark_crystal', name: 'Cristal Sombrio', description: 'Cristal imbuído de magia negra.',
    rarity: 'epic', slot: 'consumable', icon: '💎', dropRate: 0.2, levelReq: 8, price: 100,
  },
  stone_heart: {
    id: 'stone_heart', name: 'Coração de Pedra', description: 'Núcleo de um golem.',
    rarity: 'epic', slot: 'consumable', icon: '💜', dropRate: 0.15, levelReq: 8, price: 120,
  },
  dragon_scale: {
    id: 'dragon_scale', name: 'Escama de Dragão', description: 'Material lendário de dragão.',
    rarity: 'legendary', slot: 'consumable', icon: '🐉', dropRate: 0.3, levelReq: 12, price: 500,
  },
  dragon_fang: {
    id: 'dragon_fang', name: 'Presa de Dragão', description: 'Presa ardente do dragão ancião.',
    rarity: 'legendary', slot: 'consumable', icon: '🔥', dropRate: 0.2, levelReq: 12, price: 600,
  },
  gold_coin: {
    id: 'gold_coin', name: 'Moedas de Ouro', description: 'Moedas reluzentes.',
    rarity: 'common', slot: 'consumable', icon: '🪙', dropRate: 1, levelReq: 1, price: 1,
  },
};
