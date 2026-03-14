/** Building-related types */

import type { ResourceAmount } from './resources';

export type BuildingType =
  | 'castle'
  | 'house'
  | 'farm'
  | 'lumbermill'
  | 'quarry'
  | 'ironmine'
  | 'barracks'
  | 'stable'
  | 'market'
  | 'warehouse'
  | 'wall'
  | 'tower';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  description: string;
  maxLevel: number;
  /** GLB model filename per level tier */
  modelKey: string;
  levels: BuildingLevelDefinition[];
}

export interface BuildingLevelDefinition {
  level: number;
  cost: ResourceAmount;
  buildTimeSeconds: number;
  /** What this level produces or provides */
  production?: Partial<ResourceAmount>;
  storageBonus?: Partial<ResourceAmount>;
  /** Required castle level to build this level */
  requiredCastleLevel: number;
}

export interface BuildingInstance {
  id: string;
  type: BuildingType;
  level: number;
  /** Slot position in the village grid */
  slotIndex: number;
  /** null if not upgrading */
  upgradeStartedAt: number | null;
  upgradeFinishAt: number | null;
}
