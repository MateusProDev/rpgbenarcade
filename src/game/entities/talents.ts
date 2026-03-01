// ========================
// Talent Tree
// ========================
import type { Talent, ClassType } from "../../types";

export const TALENT_TREES: Record<ClassType, Talent[]> = {
  mage: [
    {
      id: "mage_t1_mana",
      name: "Reserva Arcana",
      description: "+20 Mana máxima",
      requiredLevel: 3,
      effect: { type: "stat_bonus", stat: "intelligence", value: 3 },
    },
    {
      id: "mage_t2_damage",
      name: "Poder Concentrado",
      description: "Aumenta dano mágico em 10%",
      requiredLevel: 6,
      prerequisiteId: "mage_t1_mana",
      effect: { type: "skill_upgrade", skillId: "fireball", value: 10 },
    },
    {
      id: "mage_t3_aoe",
      name: "Explosão Ampliada",
      description: "Aumenta área de efeito das skills",
      requiredLevel: 9,
      prerequisiteId: "mage_t2_damage",
      effect: { type: "passive", value: 20 },
    },
    {
      id: "mage_t4_battlemage",
      name: "Caminho do Mago de Batalha",
      description: "Desbloqueia a classe Mago de Batalha",
      requiredLevel: 15,
      prerequisiteId: "mage_t3_aoe",
      effect: { type: "unlock_class", classUnlock: "battlemage" },
    },
    {
      id: "mage_t4_archmage",
      name: "Caminho do Arquimago",
      description: "Desbloqueia a classe Arquimago",
      requiredLevel: 15,
      prerequisiteId: "mage_t3_aoe",
      effect: { type: "unlock_class", classUnlock: "archmage" },
    },
  ],
  archer: [
    {
      id: "archer_t1_crit",
      name: "Olho de Águia",
      description: "+15% chance de crítico",
      requiredLevel: 3,
      effect: { type: "stat_bonus", stat: "dexterity", value: 3 },
    },
    {
      id: "archer_t2_speed",
      name: "Pés Ligeiros",
      description: "Aumenta velocidade de movimento",
      requiredLevel: 6,
      prerequisiteId: "archer_t1_crit",
      effect: { type: "passive", value: 15 },
    },
    {
      id: "archer_t3_multishot",
      name: "Tiro Múltiplo",
      description: "Ataques básicos disparam flechas extras",
      requiredLevel: 9,
      prerequisiteId: "archer_t2_speed",
      effect: { type: "skill_upgrade", skillId: "power_shot", value: 15 },
    },
    {
      id: "archer_t4_assassin",
      name: "Caminho do Assassino",
      description: "Desbloqueia a classe Assassino",
      requiredLevel: 15,
      prerequisiteId: "archer_t3_multishot",
      effect: { type: "unlock_class", classUnlock: "assassin" },
    },
    {
      id: "archer_t4_ranger",
      name: "Caminho do Patrulheiro",
      description: "Desbloqueia a classe Patrulheiro",
      requiredLevel: 15,
      prerequisiteId: "archer_t3_multishot",
      effect: { type: "unlock_class", classUnlock: "ranger" },
    },
  ],
  swordsman: [
    {
      id: "sword_t1_str",
      name: "Força Bruta",
      description: "+3 Força",
      requiredLevel: 3,
      effect: { type: "stat_bonus", stat: "strength", value: 3 },
    },
    {
      id: "sword_t2_parry",
      name: "Contra-Ataque",
      description: "Chance de contra-atacar ao ser atingido",
      requiredLevel: 6,
      prerequisiteId: "sword_t1_str",
      effect: { type: "passive", value: 10 },
    },
    {
      id: "sword_t3_combo",
      name: "Mestre das Combos",
      description: "Ataques consecutivos causam mais dano",
      requiredLevel: 9,
      prerequisiteId: "sword_t2_parry",
      effect: { type: "skill_upgrade", skillId: "slash", value: 20 },
    },
    {
      id: "sword_t4_knight",
      name: "Caminho do Cavaleiro",
      description: "Desbloqueia a classe Cavaleiro",
      requiredLevel: 15,
      prerequisiteId: "sword_t3_combo",
      effect: { type: "unlock_class", classUnlock: "knight" },
    },
    {
      id: "sword_t4_berserker",
      name: "Caminho do Berserker",
      description: "Desbloqueia a classe Berserker",
      requiredLevel: 15,
      prerequisiteId: "sword_t3_combo",
      effect: { type: "unlock_class", classUnlock: "berserker" },
    },
  ],
  lancer: [
    {
      id: "lancer_t1_vit",
      name: "Constituição Robusta",
      description: "+3 Vitalidade",
      requiredLevel: 3,
      effect: { type: "stat_bonus", stat: "vitality", value: 3 },
    },
    {
      id: "lancer_t2_block",
      name: "Escudo Inabalável",
      description: "Aumenta chance de bloqueio",
      requiredLevel: 6,
      prerequisiteId: "lancer_t1_vit",
      effect: { type: "passive", value: 15 },
    },
    {
      id: "lancer_t3_taunt",
      name: "Provocação",
      description: "Atrai inimigos para si, protegendo aliados",
      requiredLevel: 9,
      prerequisiteId: "lancer_t2_block",
      effect: { type: "skill_upgrade", skillId: "shield_bash", value: 10 },
    },
    {
      id: "lancer_t4_guardian",
      name: "Caminho do Guardião",
      description: "Desbloqueia a classe Guardião",
      requiredLevel: 15,
      prerequisiteId: "lancer_t3_taunt",
      effect: { type: "unlock_class", classUnlock: "guardian" },
    },
    {
      id: "lancer_t4_paladin",
      name: "Caminho do Paladino",
      description: "Desbloqueia a classe Paladino",
      requiredLevel: 15,
      prerequisiteId: "lancer_t3_taunt",
      effect: { type: "unlock_class", classUnlock: "paladin" },
    },
  ],
};

export function getTalentTree(classType: ClassType): Talent[] {
  return TALENT_TREES[classType];
}

export function canUnlockTalent(
  talent: Talent,
  playerLevel: number,
  unlockedTalents: string[]
): boolean {
  if (playerLevel < talent.requiredLevel) return false;
  if (talent.prerequisiteId && !unlockedTalents.includes(talent.prerequisiteId)) return false;
  return true;
}
