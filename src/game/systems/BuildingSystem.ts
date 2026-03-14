/**
 * BuildingSystem — handles construction and upgrade logic.
 * Pure functions, no side effects.
 */

import type { BuildingInstance, BuildingType } from '../../types/buildings';
import type { City } from '../../types/city';
import type { ResourceAmount } from '../../types/resources';
import { BUILDING_DEFINITIONS } from '../config/buildings.config';
import { GAME_CONSTANTS } from '../config/constants';
import { getUnlockedBuildings } from '../config/progression.config';
import { ResourceSystem } from './ResourceSystem';

export const BuildingSystem = {
  /**
   * Checks if a building can be constructed in the city.
   */
  canBuild(city: City, buildingType: BuildingType): { ok: boolean; reason?: string } {
    const def = BUILDING_DEFINITIONS[buildingType];
    if (!def) return { ok: false, reason: 'Edifício desconhecido.' };

    // Check castle level unlock
    const unlocked = getUnlockedBuildings(city.castleLevel);
    if (!unlocked.includes(buildingType)) {
      return { ok: false, reason: 'Nível do castelo insuficiente.' };
    }

    // Check building slots
    const usedSlots = city.buildings.length;
    if (usedSlots >= GAME_CONSTANTS.MAX_BUILDING_SLOTS) {
      return { ok: false, reason: 'Sem espaço para construir.' };
    }

    // Check cost for level 1
    const levelDef = def.levels[0];
    if (!levelDef) return { ok: false, reason: 'Definição de nível não encontrada.' };

    if (!ResourceSystem.canAfford(city.resources.current, levelDef.cost)) {
      return { ok: false, reason: 'Recursos insuficientes.' };
    }

    return { ok: true };
  },

  /**
   * Checks if a building can be upgraded.
   */
  canUpgrade(city: City, buildingId: string): { ok: boolean; reason?: string; cost?: ResourceAmount; buildTime?: number } {
    const building = city.buildings.find((b) => b.id === buildingId);
    if (!building) return { ok: false, reason: 'Edifício não encontrado.' };

    if (building.upgradeStartedAt !== null) {
      return { ok: false, reason: 'Já em construção.' };
    }

    const def = BUILDING_DEFINITIONS[building.type];
    if (!def) return { ok: false, reason: 'Definição não encontrada.' };

    const nextLevel = building.level + 1;
    if (nextLevel > def.maxLevel) {
      return { ok: false, reason: 'Nível máximo atingido.' };
    }

    const levelDef = def.levels.find((l) => l.level === nextLevel);
    if (!levelDef) return { ok: false, reason: 'Definição de nível faltando.' };

    if (levelDef.requiredCastleLevel > city.castleLevel) {
      return { ok: false, reason: `Requer Castelo nível ${levelDef.requiredCastleLevel}.` };
    }

    if (!ResourceSystem.canAfford(city.resources.current, levelDef.cost)) {
      return { ok: false, reason: 'Recursos insuficientes.' };
    }

    return { ok: true, cost: levelDef.cost, buildTime: levelDef.buildTimeSeconds };
  },

  /**
   * Starts a building upgrade. Returns updated city data.
   */
  startUpgrade(city: City, buildingId: string, now: number = Date.now()): City | null {
    const check = this.canUpgrade(city, buildingId);
    if (!check.ok || !check.cost || !check.buildTime) return null;

    const buildings = city.buildings.map((b) => {
      if (b.id !== buildingId) return b;
      return {
        ...b,
        upgradeStartedAt: now,
        upgradeFinishAt: now + check.buildTime! * 1000,
      };
    });

    return {
      ...city,
      buildings,
      resources: {
        ...city.resources,
        current: ResourceSystem.subtractResources(city.resources.current, check.cost),
      },
    };
  },

  /**
   * Resolves completed upgrades based on current time.
   */
  resolveCompletedUpgrades(city: City, now: number = Date.now()): City {
    let changed = false;
    const buildings = city.buildings.map((b) => {
      if (b.upgradeFinishAt === null || now < b.upgradeFinishAt) return b;
      changed = true;
      return {
        ...b,
        level: b.level + 1,
        upgradeStartedAt: null,
        upgradeFinishAt: null,
      };
    });

    if (!changed) return city;
    return { ...city, buildings };
  },

  /**
   * Creates a new building instance.
   */
  createBuilding(type: BuildingType, slotIndex: number): BuildingInstance {
    return {
      id: crypto.randomUUID(),
      type,
      level: 1,
      slotIndex,
      upgradeStartedAt: null,
      upgradeFinishAt: null,
    };
  },
};
