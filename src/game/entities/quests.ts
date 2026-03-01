// ========================
// Quest Database
// ========================
import type { Quest } from "../../types";

export const QUESTS: Record<string, Quest> = {
  first_blood: {
    id: "first_blood",
    name: "Primeiro Sangue",
    description: "Derrote 3 Slimes nos campos próximos à vila.",
    type: "kill",
    target: "slime",
    amount: 3,
    xpReward: 30,
    goldReward: 15,
    requiredLevel: 1,
  },
  wolf_hunt: {
    id: "wolf_hunt",
    name: "Caça aos Lobos",
    description: "Os lobos ameaçam os viajantes. Elimine 5 deles.",
    type: "kill",
    target: "wolf",
    amount: 5,
    xpReward: 60,
    goldReward: 30,
    requiredLevel: 3,
  },
  skeleton_menace: {
    id: "skeleton_menace",
    name: "Ameaça Esquelética",
    description: "Esqueletos emergem das masmorras. Destrua 5.",
    type: "kill",
    target: "skeleton",
    amount: 5,
    xpReward: 75,
    goldReward: 40,
    requiredLevel: 5,
  },
  explore_forest: {
    id: "explore_forest",
    name: "Desbravando a Floresta",
    description: "Explore a floresta sombria ao norte da vila.",
    type: "explore",
    target: "forest",
    amount: 1,
    xpReward: 40,
    goldReward: 20,
    requiredLevel: 2,
  },
  bandit_camp: {
    id: "bandit_camp",
    name: "Acampamento de Bandidos",
    description: "Limpe o acampamento de bandidos nos campos.",
    type: "kill",
    target: "bandit",
    amount: 4,
    xpReward: 100,
    goldReward: 60,
    requiredLevel: 7,
  },
  orc_invasion: {
    id: "orc_invasion",
    name: "Invasão Orc",
    description: "Orcs atacam os arredores! Elimine 3 Orcs Guerreiros.",
    type: "kill",
    target: "orc",
    amount: 3,
    xpReward: 150,
    goldReward: 80,
    requiredLevel: 10,
  },
  dark_knight_challenge: {
    id: "dark_knight_challenge",
    name: "Desafio do Cavaleiro Negro",
    description: "Enfrente e derrote o temido Cavaleiro Negro na masmorra.",
    type: "kill",
    target: "dark_knight",
    amount: 1,
    xpReward: 200,
    goldReward: 120,
    itemReward: "ring_of_power",
    requiredLevel: 12,
  },
  dragon_slayer: {
    id: "dragon_slayer",
    name: "Caçador de Dragões",
    description: "Derrote o Dragão Ancestral nas profundezas da masmorra.",
    type: "kill",
    target: "dragon",
    amount: 1,
    xpReward: 500,
    goldReward: 300,
    itemReward: "dragon_armor",
    requiredLevel: 18,
  },
  talk_blacksmith: {
    id: "talk_blacksmith",
    name: "O Ferreiro",
    description: "Converse com o ferreiro da vila sobre uma nova arma.",
    type: "talk",
    target: "blacksmith",
    amount: 1,
    xpReward: 15,
    goldReward: 0,
    requiredLevel: 1,
  },
  arena_champion: {
    id: "arena_champion",
    name: "Campeão da Arena",
    description: "Vença 3 batalhas PvP na arena.",
    type: "kill",
    target: "pvp_win",
    amount: 3,
    xpReward: 200,
    goldReward: 100,
    requiredLevel: 10,
  },
};

export function getAvailableQuests(playerLevel: number): Quest[] {
  return Object.values(QUESTS).filter((q) => q.requiredLevel <= playerLevel);
}

export function getQuest(id: string): Quest | undefined {
  return QUESTS[id];
}
