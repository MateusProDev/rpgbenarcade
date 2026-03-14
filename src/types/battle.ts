/** Battle-related types */

import type { TroopCount } from './troops';
import type { ResourceAmount } from './resources';

export type BattleStatus = 'marching' | 'resolved' | 'returning';

export interface BattleRequest {
  attackerCityId: string;
  defenderCityId: string;
  troops: TroopCount[];
}

export interface Battle {
  id: string;
  attackerPlayerId: string;
  defenderPlayerId: string;
  attackerCityId: string;
  defenderCityId: string;
  status: BattleStatus;
  /** Troops sent by attacker */
  attackerTroops: TroopCount[];
  /** Garrison defending */
  defenderTroops: TroopCount[];
  /** Filled after resolution */
  result: BattleResult | null;
  marchStartedAt: number;
  marchArrivalAt: number;
  resolvedAt: number | null;
}

export interface BattleResult {
  winner: 'attacker' | 'defender';
  attackerLosses: TroopCount[];
  defenderLosses: TroopCount[];
  resourcesStolen: ResourceAmount;
}

export interface BattleReport {
  id: string;
  battleId: string;
  playerId: string;
  isAttacker: boolean;
  result: BattleResult;
  timestamp: number;
  read: boolean;
}
