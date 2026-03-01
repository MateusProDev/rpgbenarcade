// ========================
// Combat System
// ========================
import type { Attributes, ScalingType } from "../../types";

/**
 * Calculate final damage output considering all factors
 */
export function computeDamage(
  baseDamage: number,
  scaling: ScalingType,
  attackerAttributes: Attributes,
  attackerLevel: number,
  defenderAttributes: Attributes,
  defenderLevel: number,
  isCritical: boolean = false
): { damage: number; isCritical: boolean } {
  // Base scaling
  const scalingValue = attackerAttributes[scaling];
  let damage = baseDamage + scalingValue * 1.5 + attackerLevel * 0.8;

  // Defense reduction
  const defense = defenderAttributes.vitality * 0.8 + defenderAttributes.strength * 0.2 + defenderLevel * 0.3;
  damage -= defense * 0.4;

  // Critical hit
  const critChance = attackerAttributes.dexterity * 0.01 + 0.05;
  const crit = isCritical || Math.random() < critChance;
  if (crit) {
    damage *= 1.5;
  }

  // Variance
  damage *= 0.9 + Math.random() * 0.2;

  return {
    damage: Math.max(1, Math.floor(damage)),
    isCritical: crit,
  };
}

/**
 * Calculate XP needed for next level
 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate max HP from attributes and level
 */
export function maxHpFromStats(vitality: number, level: number): number {
  return 100 + vitality * 10 + level * 5;
}

/**
 * Calculate max Mana from attributes and level
 */
export function maxManaFromStats(intelligence: number, level: number): number {
  return 50 + intelligence * 8 + level * 3;
}

/**
 * Check if a skill is off cooldown
 */
export function isSkillReady(
  skillId: string,
  cooldowns: Record<string, number>
): boolean {
  const endTime = cooldowns[skillId] || 0;
  return Date.now() >= endTime;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getRemainingCooldown(
  skillId: string,
  cooldowns: Record<string, number>
): number {
  const endTime = cooldowns[skillId] || 0;
  return Math.max(0, (endTime - Date.now()) / 1000);
}

/**
 * Calculate PvP rating change (ELO-like)
 */
export function calculateRatingChange(
  winnerRating: number,
  loserRating: number
): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return Math.round(K * (1 - expected));
}
