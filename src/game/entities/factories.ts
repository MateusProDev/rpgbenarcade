/** Factory helpers for creating default entity instances */

import type { ResourceStorage, ResourceAmount } from '../../types/resources';
import type { City } from '../../types/city';

export function createEmptyResourceAmount(): ResourceAmount {
  return { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };
}

export function createDefaultResources(): ResourceStorage {
  return {
    current: { wood: 500, stone: 500, iron: 200, food: 500, gold: 100 },
    capacity: { wood: 5000, stone: 5000, iron: 2000, food: 5000, gold: 2000 },
    production: { wood: 100, stone: 80, iron: 30, food: 120, gold: 10 },
    lastCalculatedAt: Date.now(),
  };
}

export function createDefaultCity(
  playerId: string,
  worldId: string,
  x: number,
  y: number,
): Omit<City, 'id'> {
  return {
    playerId,
    worldId,
    name: 'New Village',
    castleLevel: 1,
    position: { x, y },
    buildings: [
      {
        id: crypto.randomUUID(),
        type: 'castle',
        level: 1,
        slotIndex: 0,
        upgradeStartedAt: null,
        upgradeFinishAt: null,
      },
    ],
    resources: createDefaultResources(),
    garrison: [],
    trainingQueue: [],
    createdAt: Date.now(),
  };
}
