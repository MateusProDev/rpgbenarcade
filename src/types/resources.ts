/** Resource types used throughout the game */

export type ResourceType = 'wood' | 'stone' | 'iron' | 'food' | 'gold';

export interface ResourceAmount {
  wood: number;
  stone: number;
  iron: number;
  food: number;
  gold: number;
}

export interface ResourceStorage {
  current: ResourceAmount;
  capacity: ResourceAmount;
  /** Per-hour production rates */
  production: ResourceAmount;
  /** Timestamp of last resource calculation */
  lastCalculatedAt: number;
}
