import type { Castle, BattleResult, TroopType } from '../types';
import { TROOPS } from '../modules/troops/troopConfig';

type TroopCounts = Partial<Record<TroopType, number>>;

function totalPower(troops: TroopCounts): { attack: number; hp: number } {
  let attack = 0;
  let hp     = 0;
  for (const [type, count] of Object.entries(troops) as [TroopType, number][]) {
    attack += TROOPS[type].attack * count;
    hp     += TROOPS[type].hp    * count;
  }
  return { attack, hp };
}

/**
 * Resolve uma batalha simples entre atacante e defensor.
 * Modelo: cada lado perde (ataque_inimigo / hp_proprio) × count tropas.
 */
export function resolveBattle(
  attackerTroops: TroopCounts,
  defenderTroops: TroopCounts,
  defenderCastle: Castle,
): BattleResult {
  const atk = totalPower(attackerTroops);
  const def = totalPower(defenderTroops);

  // Bônus de defesa do castelo: +5% de HP por nível
  const castleBonus = 1 + defenderCastle.level * 0.05;
  const defHpFinal  = def.hp * castleBonus;

  // Taxa de baixas
  const atkLossRate = def.attack / (atk.hp  + 1);
  const defLossRate = atk.attack / (defHpFinal + 1);

  const attackerLoss: TroopCounts = {};
  const defenderLoss: TroopCounts = {};

  for (const [type, count] of Object.entries(attackerTroops) as [TroopType, number][]) {
    attackerLoss[type] = Math.min(count, Math.ceil(count * atkLossRate));
  }
  for (const [type, count] of Object.entries(defenderTroops) as [TroopType, number][]) {
    defenderLoss[type] = Math.min(count, Math.ceil(count * defLossRate));
  }

  // Atacante ganhou se as baixas do defensor são >= suas tropas
  const defTotalLost  = (Object.values(defenderLoss) as number[]).reduce((a, b) => a + b, 0);
  const defTotal      = (Object.values(defenderTroops) as number[]).reduce((a, b) => a + b, 0);
  const attackerWon   = defTotalLost >= defTotal;

  // Saque: 20% dos recursos se venceu
  const resourcesLooted = attackerWon
    ? {
        food:  Math.floor(defenderCastle.resources.food  * 0.2),
        wood:  Math.floor(defenderCastle.resources.wood  * 0.2),
        stone: Math.floor(defenderCastle.resources.stone * 0.2),
        iron:  Math.floor(defenderCastle.resources.iron  * 0.2),
      }
    : {};

  return {
    attackerLoss,
    defenderLoss,
    attackerWon,
    resourcesLooted,
    timestamp: Date.now(),
  };
}
