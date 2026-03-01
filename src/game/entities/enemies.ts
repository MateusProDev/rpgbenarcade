// ========================
// Enemy Configurations
// ========================
import type { EnemyConfig, EnemyType } from "../../types";

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  slime: {
    type: "slime",
    name: "Slime",
    hp: 30,
    damage: 5,
    defense: 1,
    speed: 30,
    xpReward: 10,
    goldReward: 3,
    aggroRange: 100,
    lootTable: [
      { itemId: "health_potion", chance: 0.2 },
    ],
  },
  wolf: {
    type: "wolf",
    name: "Lobo Selvagem",
    hp: 50,
    damage: 10,
    defense: 3,
    speed: 60,
    xpReward: 20,
    goldReward: 5,
    aggroRange: 150,
    lootTable: [
      { itemId: "leather_armor", chance: 0.05 },
      { itemId: "health_potion", chance: 0.15 },
    ],
  },
  skeleton: {
    type: "skeleton",
    name: "Esqueleto",
    hp: 60,
    damage: 12,
    defense: 5,
    speed: 40,
    xpReward: 25,
    goldReward: 8,
    aggroRange: 120,
    lootTable: [
      { itemId: "rusty_sword", chance: 0.1 },
      { itemId: "iron_helm", chance: 0.05 },
      { itemId: "health_potion", chance: 0.15 },
    ],
  },
  goblin: {
    type: "goblin",
    name: "Goblin",
    hp: 45,
    damage: 14,
    defense: 4,
    speed: 55,
    xpReward: 22,
    goldReward: 12,
    aggroRange: 130,
    lootTable: [
      { itemId: "leather_boots", chance: 0.08 },
      { itemId: "mana_potion", chance: 0.12 },
    ],
  },
  bandit: {
    type: "bandit",
    name: "Bandido",
    hp: 80,
    damage: 18,
    defense: 8,
    speed: 45,
    xpReward: 35,
    goldReward: 20,
    aggroRange: 140,
    lootTable: [
      { itemId: "iron_sword", chance: 0.08 },
      { itemId: "leather_armor", chance: 0.06 },
      { itemId: "health_potion", chance: 0.2 },
    ],
  },
  orc: {
    type: "orc",
    name: "Orc Guerreiro",
    hp: 120,
    damage: 22,
    defense: 12,
    speed: 35,
    xpReward: 50,
    goldReward: 25,
    aggroRange: 160,
    lootTable: [
      { itemId: "chainmail", chance: 0.06 },
      { itemId: "steel_sword", chance: 0.04 },
      { itemId: "greater_health_potion", chance: 0.1 },
    ],
  },
  dark_knight: {
    type: "dark_knight",
    name: "Cavaleiro Negro",
    hp: 200,
    damage: 30,
    defense: 20,
    speed: 40,
    xpReward: 80,
    goldReward: 50,
    aggroRange: 180,
    lootTable: [
      { itemId: "shadow_blade", chance: 0.05 },
      { itemId: "plate_armor", chance: 0.04 },
      { itemId: "ring_of_power", chance: 0.03 },
      { itemId: "greater_health_potion", chance: 0.15 },
    ],
  },
  dragon: {
    type: "dragon",
    name: "Dragão Ancestral",
    hp: 500,
    damage: 50,
    defense: 35,
    speed: 50,
    xpReward: 200,
    goldReward: 150,
    aggroRange: 250,
    lootTable: [
      { itemId: "excalibur", chance: 0.02 },
      { itemId: "dragon_armor", chance: 0.03 },
      { itemId: "greater_health_potion", chance: 0.3 },
    ],
  },
};

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_CONFIGS[type];
}
