/**
 * ResourceSystem — calculates passive resource production
 * using timestamp-based offline progression.
 *
 * All calculations are pure functions. No side effects.
 */

import type { ResourceStorage, ResourceAmount, ResourceType } from '../../types/resources';
import type { City } from '../../types/city';
import { BUILDING_DEFINITIONS } from '../config/buildings.config';

const RESOURCE_KEYS: ResourceType[] = ['wood', 'stone', 'iron', 'food', 'gold'];

export const ResourceSystem = {
  /**
   * Calculates current resource amounts based on elapsed time since last tick.
   * Clamps to capacity. Pure function — returns a new ResourceStorage.
   */
  calculateResources(storage: ResourceStorage, now: number = Date.now()): ResourceStorage {
    const elapsedMs = Math.max(0, now - storage.lastCalculatedAt);
    const elapsedHours = elapsedMs / 3_600_000;

    const current = { ...storage.current };
    for (const key of RESOURCE_KEYS) {
      const produced = storage.production[key] * elapsedHours;
      current[key] = Math.min(current[key] + produced, storage.capacity[key]);
    }

    return {
      ...storage,
      current,
      lastCalculatedAt: now,
    };
  },

  /**
   * Computes total production rates from all buildings in a city.
   */
  computeProductionRates(city: City): ResourceAmount {
    const rates: ResourceAmount = { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };

    for (const building of city.buildings) {
      const def = BUILDING_DEFINITIONS[building.type];
      if (!def) continue;
      const levelDef = def.levels.find((l) => l.level === building.level);
      if (!levelDef?.production) continue;

      for (const key of RESOURCE_KEYS) {
        rates[key] += levelDef.production[key] ?? 0;
      }
    }

    return rates;
  },

  /**
   * Computes total storage capacity from base + warehouse bonuses.
   */
  computeStorageCapacity(city: City): ResourceAmount {
    // Base capacity
    const cap: ResourceAmount = { wood: 5000, stone: 5000, iron: 2000, food: 5000, gold: 2000 };

    for (const building of city.buildings) {
      const def = BUILDING_DEFINITIONS[building.type];
      if (!def) continue;
      const levelDef = def.levels.find((l) => l.level === building.level);
      if (!levelDef?.storageBonus) continue;

      for (const key of RESOURCE_KEYS) {
        cap[key] += levelDef.storageBonus[key] ?? 0;
      }
    }

    return cap;
  },

  /**
   * Checks if player can afford a given resource cost.
   */
  canAfford(current: ResourceAmount, cost: ResourceAmount): boolean {
    return RESOURCE_KEYS.every((key) => current[key] >= cost[key]);
  },

  /**
   * Subtracts cost from current resources. Returns new ResourceAmount.
   * Caller must check canAfford first.
   */
  subtractResources(current: ResourceAmount, cost: ResourceAmount): ResourceAmount {
    const result = { ...current };
    for (const key of RESOURCE_KEYS) {
      result[key] = Math.max(0, result[key] - cost[key]);
    }
    return result;
  },

  /**
   * Adds resources (e.g. from loot). Clamps to capacity.
   */
  addResources(current: ResourceAmount, addition: ResourceAmount, capacity: ResourceAmount): ResourceAmount {
    const result = { ...current };
    for (const key of RESOURCE_KEYS) {
      result[key] = Math.min(result[key] + addition[key], capacity[key]);
    }
    return result;
  },
};
