import type { Castle, Resources, BuildingType } from '../../types';
import { BUILDINGS } from '../buildings/buildingConfig';

const RESOURCE_KEYS: (keyof Resources)[] = ['food', 'wood', 'stone', 'iron'];

/** Calcula recursos gerados desde o último tick e atualiza o castelo */
export function tickResources(castle: Castle): {
  updated: Castle;
  gained: Resources;
} {
  const now       = Date.now();
  const elapsed   = (now - castle.lastResourceTick) / 3_600_000; // horas
  const gained: Resources = { food: 0, wood: 0, stone: 0, iron: 0 };

  // Capacidade máxima do armazém
  const warehouse = castle.buildings.warehouse;
  const warehouseConfig = BUILDINGS.warehouse;
  const capacity = warehouseConfig.productionPerLevel!(warehouse.level);

  for (const bType of Object.keys(castle.buildings) as BuildingType[]) {
    const building = castle.buildings[bType];
    const config   = BUILDINGS[bType];
    if (!config.productionPerLevel) continue;

    const production = config.productionPerLevel(building.level);
    for (const res of RESOURCE_KEYS) {
      if (production[res]) {
        gained[res] += Math.floor(production[res]! * elapsed);
      }
    }
  }

  // Aplica capacidade máxima
  const newResources: Resources = { ...castle.resources };
  for (const res of RESOURCE_KEYS) {
    const cap = capacity[res] ?? Infinity;
    newResources[res] = Math.min(newResources[res] + gained[res], cap);
  }

  return {
    updated: { ...castle, resources: newResources, lastResourceTick: now },
    gained,
  };
}

/** Desconta recursos de um castelo; retorna null se insuficiente */
export function deductResources(
  resources: Resources,
  cost: Resources,
): Resources | null {
  const result: Resources = { ...resources };
  for (const res of RESOURCE_KEYS) {
    if (result[res] < cost[res]) return null;
    result[res] -= cost[res];
  }
  return result;
}

/** Soma recursos de coleta ao castelo respeitando capacidade */
export function addResources(
  resources: Resources,
  gained: Partial<Resources>,
  capacity: Partial<Resources>,
): Resources {
  const result: Resources = { ...resources };
  for (const res of RESOURCE_KEYS) {
    const cap = capacity[res] ?? Infinity;
    result[res] = Math.min(result[res] + (gained[res] ?? 0), cap);
  }
  return result;
}
