// ========================
// Class Definitions & Skills
// ========================
import type { ClassType, Skill, Attributes, AdvancedClassType } from "../../types";

export type ClassConfig = {
  type: ClassType;
  name: string;
  description: string;
  baseAttributes: Attributes;
  baseHp: number;
  baseMana: number;
  skills: Skill[];
  icon: string;
};

export type AdvancedClassConfig = {
  type: AdvancedClassType;
  name: string;
  description: string;
  baseClass: ClassType;
  requiredLevel: number;
  requiredAttributes: Partial<Attributes>;
  bonusSkills: Skill[];
};

export const CLASS_CONFIGS: Record<ClassType, ClassConfig> = {
  mage: {
    type: "mage",
    name: "Mago",
    description: "Mestre das artes arcanas. Alto dano mágico, baixa defesa.",
    baseAttributes: { strength: 3, dexterity: 4, intelligence: 10, vitality: 3 },
    baseHp: 80,
    baseMana: 120,
    icon: "🧙",
    skills: [
      {
        id: "fireball",
        name: "Bola de Fogo",
        description: "Lança uma bola de fogo que causa dano em área.",
        damage: 35,
        cooldown: 2000,
        manaCost: 20,
        range: 200,
        areaOfEffect: 60,
        scaling: "intelligence",
        icon: "🔥",
      },
      {
        id: "ice_shard",
        name: "Estilhaço de Gelo",
        description: "Dispara estilhaços de gelo que reduzem a velocidade.",
        damage: 25,
        cooldown: 1500,
        manaCost: 15,
        range: 180,
        scaling: "intelligence",
        icon: "❄️",
      },
      {
        id: "arcane_shield",
        name: "Escudo Arcano",
        description: "Cria um escudo mágico que absorve dano.",
        damage: 0,
        cooldown: 8000,
        manaCost: 30,
        range: 0,
        scaling: "intelligence",
        icon: "🛡️",
      },
    ],
  },
  archer: {
    type: "archer",
    name: "Arqueiro",
    description: "Atirador ágil e letal. Alto dano à distância com chance de crítico.",
    baseAttributes: { strength: 4, dexterity: 10, intelligence: 3, vitality: 3 },
    baseHp: 90,
    baseMana: 60,
    icon: "🏹",
    skills: [
      {
        id: "power_shot",
        name: "Tiro Poderoso",
        description: "Dispara uma flecha com dano aumentado.",
        damage: 40,
        cooldown: 2500,
        manaCost: 10,
        range: 250,
        scaling: "dexterity",
        icon: "🎯",
      },
      {
        id: "rain_of_arrows",
        name: "Chuva de Flechas",
        description: "Faz chover flechas em uma área.",
        damage: 20,
        cooldown: 5000,
        manaCost: 25,
        range: 200,
        areaOfEffect: 80,
        scaling: "dexterity",
        icon: "🌧️",
      },
      {
        id: "evasion",
        name: "Evasão",
        description: "Aumenta a velocidade e esquiva por 3 segundos.",
        damage: 0,
        cooldown: 6000,
        manaCost: 15,
        range: 0,
        scaling: "dexterity",
        icon: "💨",
      },
    ],
  },
  swordsman: {
    type: "swordsman",
    name: "Espadachim",
    description: "Guerreiro versátil e equilibrado. Ataques rápidos e defesa média.",
    baseAttributes: { strength: 8, dexterity: 6, intelligence: 3, vitality: 5 },
    baseHp: 110,
    baseMana: 40,
    icon: "🗡️",
    skills: [
      {
        id: "slash",
        name: "Corte Giratório",
        description: "Ataque giratório que atinge inimigos próximos.",
        damage: 30,
        cooldown: 1800,
        manaCost: 10,
        range: 60,
        areaOfEffect: 50,
        scaling: "strength",
        icon: "⚔️",
      },
      {
        id: "charge",
        name: "Investida",
        description: "Avança rapidamente e atinge o alvo.",
        damage: 35,
        cooldown: 4000,
        manaCost: 15,
        range: 150,
        scaling: "strength",
        icon: "🏃",
      },
      {
        id: "battle_cry",
        name: "Grito de Guerra",
        description: "Aumenta dano por 5 segundos.",
        damage: 0,
        cooldown: 10000,
        manaCost: 20,
        range: 0,
        scaling: "strength",
        icon: "📢",
      },
    ],
  },
  lancer: {
    type: "lancer",
    name: "Lanceiro",
    description: "Tank com alta defesa e controle de área. Protege os aliados.",
    baseAttributes: { strength: 6, dexterity: 3, intelligence: 3, vitality: 10 },
    baseHp: 140,
    baseMana: 30,
    icon: "🛡️",
    skills: [
      {
        id: "thrust",
        name: "Estocada",
        description: "Ataque poderoso com a lança que empurra o inimigo.",
        damage: 28,
        cooldown: 2000,
        manaCost: 8,
        range: 80,
        scaling: "strength",
        icon: "🔱",
      },
      {
        id: "shield_bash",
        name: "Golpe de Escudo",
        description: "Golpeia com o escudo e atordoa.",
        damage: 15,
        cooldown: 3500,
        manaCost: 12,
        range: 50,
        scaling: "strength",
        icon: "🛡️",
      },
      {
        id: "fortify",
        name: "Fortificar",
        description: "Aumenta defesa drasticamente por 4 segundos.",
        damage: 0,
        cooldown: 8000,
        manaCost: 15,
        range: 0,
        scaling: "strength",
        icon: "🏰",
      },
    ],
  },
};

export const ADVANCED_CLASSES: AdvancedClassConfig[] = [
  {
    type: "battlemage",
    name: "Mago de Batalha",
    description: "Combinação de força arcana com combate corpo-a-corpo.",
    baseClass: "mage",
    requiredLevel: 15,
    requiredAttributes: { strength: 15, intelligence: 20 },
    bonusSkills: [
      {
        id: "arcane_blade",
        name: "Lâmina Arcana",
        description: "Invoca uma espada mágica para combate próximo.",
        damage: 50,
        cooldown: 3000,
        manaCost: 25,
        range: 70,
        scaling: "intelligence",
        icon: "⚡",
      },
    ],
  },
  {
    type: "assassin",
    name: "Assassino",
    description: "Mestre da furtividade e golpes críticos devastadores.",
    baseClass: "archer",
    requiredLevel: 15,
    requiredAttributes: { dexterity: 25 },
    bonusSkills: [
      {
        id: "shadow_strike",
        name: "Golpe Sombrio",
        description: "Ataque furtivo com dano crítico garantido.",
        damage: 70,
        cooldown: 5000,
        manaCost: 20,
        range: 60,
        scaling: "dexterity",
        icon: "🗡️",
      },
    ],
  },
  {
    type: "knight",
    name: "Cavaleiro",
    description: "Guerreiro nobre com equilíbrio perfeito entre ataque e defesa.",
    baseClass: "swordsman",
    requiredLevel: 15,
    requiredAttributes: { strength: 20, vitality: 15 },
    bonusSkills: [
      {
        id: "holy_strike",
        name: "Golpe Sagrado",
        description: "Ataque imbuido de energia divina.",
        damage: 55,
        cooldown: 4000,
        manaCost: 20,
        range: 70,
        scaling: "strength",
        icon: "✨",
      },
    ],
  },
  {
    type: "guardian",
    name: "Guardião",
    description: "Defensor supremo, quase impossível de derrubar.",
    baseClass: "lancer",
    requiredLevel: 15,
    requiredAttributes: { vitality: 25 },
    bonusSkills: [
      {
        id: "iron_wall",
        name: "Muralha de Ferro",
        description: "Torna-se imune a dano por 3 segundos.",
        damage: 0,
        cooldown: 15000,
        manaCost: 30,
        range: 0,
        scaling: "strength",
        icon: "🏯",
      },
    ],
  },
  {
    type: "archmage",
    name: "Arquimago",
    description: "Poder arcano absoluto. Devastação em área sem precedentes.",
    baseClass: "mage",
    requiredLevel: 15,
    requiredAttributes: { intelligence: 30 },
    bonusSkills: [
      {
        id: "meteor",
        name: "Meteoro",
        description: "Invoca um meteoro devastador do céu.",
        damage: 80,
        cooldown: 8000,
        manaCost: 50,
        range: 250,
        areaOfEffect: 100,
        scaling: "intelligence",
        icon: "☄️",
      },
    ],
  },
  {
    type: "ranger",
    name: "Patrulheiro",
    description: "Mestre da floresta com habilidades de sobrevivência.",
    baseClass: "archer",
    requiredLevel: 15,
    requiredAttributes: { dexterity: 20, vitality: 10 },
    bonusSkills: [
      {
        id: "nature_trap",
        name: "Armadilha Natural",
        description: "Coloca uma armadilha que prende e causa dano.",
        damage: 40,
        cooldown: 6000,
        manaCost: 15,
        range: 100,
        areaOfEffect: 40,
        scaling: "dexterity",
        icon: "🌿",
      },
    ],
  },
  {
    type: "berserker",
    name: "Berserker",
    description: "Fúria descontrolada. Quanto menos HP, mais forte.",
    baseClass: "swordsman",
    requiredLevel: 15,
    requiredAttributes: { strength: 25 },
    bonusSkills: [
      {
        id: "frenzy",
        name: "Frenesi",
        description: "Entra em frenesi, dobrando velocidade e dano por 5s.",
        damage: 0,
        cooldown: 12000,
        manaCost: 25,
        range: 0,
        scaling: "strength",
        icon: "😤",
      },
    ],
  },
  {
    type: "paladin",
    name: "Paladino",
    description: "Cavaleiro sagrado que pode curar aliados.",
    baseClass: "lancer",
    requiredLevel: 15,
    requiredAttributes: { vitality: 20, intelligence: 10 },
    bonusSkills: [
      {
        id: "divine_heal",
        name: "Cura Divina",
        description: "Cura HP dos aliados próximos.",
        damage: -40,
        cooldown: 6000,
        manaCost: 30,
        range: 100,
        areaOfEffect: 80,
        scaling: "intelligence",
        icon: "💖",
      },
    ],
  },
];

export function getClassConfig(classType: ClassType): ClassConfig {
  return CLASS_CONFIGS[classType];
}

export function getClassSkills(classType: ClassType, advancedClass?: AdvancedClassType): Skill[] {
  const base = CLASS_CONFIGS[classType].skills;
  if (!advancedClass) return base;
  const advanced = ADVANCED_CLASSES.find((c) => c.type === advancedClass);
  return advanced ? [...base, ...advanced.bonusSkills] : base;
}

export function canAdvanceClass(
  classType: ClassType,
  level: number,
  attributes: Attributes,
  targetClass: AdvancedClassType
): boolean {
  const config = ADVANCED_CLASSES.find(
    (c) => c.type === targetClass && c.baseClass === classType
  );
  if (!config) return false;
  if (level < config.requiredLevel) return false;
  for (const [attr, val] of Object.entries(config.requiredAttributes)) {
    if (attributes[attr as keyof Attributes] < (val as number)) return false;
  }
  return true;
}

export function calculateDamage(
  baseDamage: number,
  scaling: "strength" | "dexterity" | "intelligence",
  attributes: Attributes,
  level: number
): number {
  const scalingValue = attributes[scaling];
  return Math.floor(baseDamage + scalingValue * 1.5 + level * 0.5);
}

export function calculateDefense(attributes: Attributes, level: number): number {
  return Math.floor(attributes.vitality * 0.8 + attributes.strength * 0.3 + level * 0.5);
}
