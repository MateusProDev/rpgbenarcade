/**
 * BattleSystem — combat simulation logic.
 *
 * IMPORTANT: In production, battle resolution MUST run server-side.
 * This module provides the pure calculation functions that both
 * client (for preview) and server (for authoritative results) can use.
 */

import type { TroopCount } from '../../types/troops';
import type { ResourceAmount } from '../../types/resources';
import type { BattleResult } from '../../types/battle';
import { TROOP_DEFINITIONS } from '../config/troops.config';
import { TroopSystem } from './TroopSystem';

export const BattleSystem = {
  /**
   * Resolves a battle between attacker and defender armies.
   * Returns the authoritative BattleResult.
   */
  resolve(
    attackerTroops: TroopCount[],
    defenderTroops: TroopCount[],
    defenderResources: ResourceAmount,
    wallLevel: number = 0,
  ): BattleResult {
    const attackerArmy = TroopSystem.computeArmy(attackerTroops);
    const defenderArmy = TroopSystem.computeArmy(defenderTroops);

    // Wall bonus: +5% defense per wall level
    const wallBonus = 1 + wallLevel * 0.05;
    const effectiveDefense = defenderArmy.totalDefense * wallBonus;

    const attackPower = attackerArmy.totalAttack;
    const defensePower = effectiveDefense;

    const attackerWins = attackPower > defensePower;

    // Loss ratio calculation
    const ratio = attackerWins
      ? defensePower / Math.max(attackPower, 1)
      : attackPower / Math.max(defensePower, 1);

    const attackerLossRatio = attackerWins ? ratio * 0.5 : 0.8 + Math.random() * 0.2;
    const defenderLossRatio = attackerWins ? 0.8 + Math.random() * 0.2 : ratio * 0.5;

    const attackerLosses = this._applyLosses(attackerTroops, attackerLossRatio);
    const defenderLosses = this._applyLosses(defenderTroops, defenderLossRatio);

    // Resources stolen (only if attacker wins)
    let resourcesStolen: ResourceAmount = { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };
    if (attackerWins) {
      resourcesStolen = this._calculateLoot(attackerTroops, attackerLosses, defenderResources);
    }

    return {
      winner: attackerWins ? 'attacker' : 'defender',
      attackerLosses,
      defenderLosses,
      resourcesStolen,
    };
  },

  /**
   * Calculates troop losses given a loss ratio.
   * @internal
   */
  _applyLosses(troops: TroopCount[], lossRatio: number): TroopCount[] {
    return troops
      .map((tc) => ({
        type: tc.type,
        count: Math.floor(tc.count * lossRatio),
      }))
      .filter((tc) => tc.count > 0);
  },

  /**
   * Calculates resources stolen based on surviving troops' carry capacity.
   * @internal
   */
  _calculateLoot(
    originalTroops: TroopCount[],
    losses: TroopCount[],
    defenderResources: ResourceAmount,
  ): ResourceAmount {
    // Compute surviving troops
    const lossMap = new Map(losses.map((l) => [l.type, l.count]));
    let totalCarry = 0;

    for (const tc of originalTroops) {
      const lost = lossMap.get(tc.type) ?? 0;
      const surviving = tc.count - lost;
      const def = TROOP_DEFINITIONS[tc.type];
      if (def) totalCarry += surviving * def.carryCapacity;
    }

    // Distribute loot evenly across resource types
    const resourceKeys = ['wood', 'stone', 'iron', 'food', 'gold'] as const;
    const available = resourceKeys.reduce((sum, k) => sum + defenderResources[k], 0);
    const maxLoot = Math.min(totalCarry, available);
    const perResource = Math.floor(maxLoot / resourceKeys.length);

    const loot: ResourceAmount = { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };
    for (const key of resourceKeys) {
      loot[key] = Math.min(perResource, defenderResources[key]);
    }

    return loot;
  },
};
