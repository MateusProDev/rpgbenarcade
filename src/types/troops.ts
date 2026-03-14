/** Troop-related types */

import type { ResourceAmount } from './resources';

export type TroopType =
  | 'militia'
  | 'swordsman'
  | 'archer'
  | 'cavalry'
  | 'catapult';

export interface TroopDefinition {
  type: TroopType;
  name: string;
  description: string;
  attack: number;
  defense: number;
  speed: number;
  carryCapacity: number;
  foodUpkeep: number;
  cost: ResourceAmount;
  trainTimeSeconds: number;
  requiredBuildingType: string;
  requiredBuildingLevel: number;
}

export interface TroopCount {
  type: TroopType;
  count: number;
}

export interface Army {
  troops: TroopCount[];
  /** Total attack power (computed) */
  totalAttack: number;
  /** Total defense power (computed) */
  totalDefense: number;
}

export interface TrainingQueue {
  troopType: TroopType;
  amount: number;
  startedAt: number;
  finishAt: number;
}
