/**
 * TroopSystem — handles troop training and army management.
 * Pure functions, no side effects.
 */

import type { TroopType, TroopCount, Army, TrainingQueue } from '../../types/troops';
import type { City } from '../../types/city';
import { TROOP_DEFINITIONS } from '../config/troops.config';
import { GAME_CONSTANTS } from '../config/constants';
import { ResourceSystem } from './ResourceSystem';

export const TroopSystem = {
  /**
   * Checks if a troop type can be trained in the city.
   */
  canTrain(city: City, troopType: TroopType, amount: number): { ok: boolean; reason?: string } {
    const def = TROOP_DEFINITIONS[troopType];
    if (!def) return { ok: false, reason: 'Tipo de tropa desconhecido.' };

    // Check required building
    const requiredBuilding = city.buildings.find(
      (b) => b.type === def.requiredBuildingType && b.level >= def.requiredBuildingLevel,
    );
    if (!requiredBuilding) {
      return { ok: false, reason: `Requer ${def.requiredBuildingType} nível ${def.requiredBuildingLevel}.` };
    }

    // Check queue limit
    if (city.trainingQueue.length >= GAME_CONSTANTS.MAX_TRAINING_QUEUE) {
      return { ok: false, reason: 'Fila de treinamento cheia.' };
    }

    // Check cost * amount
    const totalCost = {
      wood: def.cost.wood * amount,
      stone: def.cost.stone * amount,
      iron: def.cost.iron * amount,
      food: def.cost.food * amount,
      gold: def.cost.gold * amount,
    };

    if (!ResourceSystem.canAfford(city.resources.current, totalCost)) {
      return { ok: false, reason: 'Recursos insuficientes.' };
    }

    return { ok: true };
  },

  /**
   * Starts troop training. Returns updated city.
   */
  startTraining(city: City, troopType: TroopType, amount: number, now: number = Date.now()): City | null {
    const check = this.canTrain(city, troopType, amount);
    if (!check.ok) return null;

    const def = TROOP_DEFINITIONS[troopType];
    const totalCost = {
      wood: def.cost.wood * amount,
      stone: def.cost.stone * amount,
      iron: def.cost.iron * amount,
      food: def.cost.food * amount,
      gold: def.cost.gold * amount,
    };

    const totalTimeMs = def.trainTimeSeconds * amount * 1000;

    const queueEntry: TrainingQueue = {
      troopType,
      amount,
      startedAt: now,
      finishAt: now + totalTimeMs,
    };

    return {
      ...city,
      resources: {
        ...city.resources,
        current: ResourceSystem.subtractResources(city.resources.current, totalCost),
      },
      trainingQueue: [...city.trainingQueue, queueEntry],
    };
  },

  /**
   * Resolves completed training queues and adds troops to garrison.
   */
  resolveCompletedTraining(city: City, now: number = Date.now()): City {
    const completed: TrainingQueue[] = [];
    const remaining: TrainingQueue[] = [];

    for (const entry of city.trainingQueue) {
      if (now >= entry.finishAt) {
        completed.push(entry);
      } else {
        remaining.push(entry);
      }
    }

    if (completed.length === 0) return city;

    const garrison = [...city.garrison];
    for (const entry of completed) {
      const existing = garrison.find((t) => t.type === entry.troopType);
      if (existing) {
        existing.count += entry.amount;
      } else {
        garrison.push({ type: entry.troopType, count: entry.amount });
      }
    }

    return {
      ...city,
      garrison,
      trainingQueue: remaining,
    };
  },

  /**
   * Computes army stats from a list of troop counts.
   */
  computeArmy(troops: TroopCount[]): Army {
    let totalAttack = 0;
    let totalDefense = 0;

    for (const tc of troops) {
      const def = TROOP_DEFINITIONS[tc.type];
      if (!def) continue;
      totalAttack += def.attack * tc.count;
      totalDefense += def.defense * tc.count;
    }

    return { troops, totalAttack, totalDefense };
  },

  /**
   * Removes troops from garrison for an attack march.
   */
  detachTroops(garrison: TroopCount[], toSend: TroopCount[]): TroopCount[] | null {
    const result = garrison.map((g) => ({ ...g }));

    for (const send of toSend) {
      const slot = result.find((g) => g.type === send.type);
      if (!slot || slot.count < send.count) return null; // Not enough
      slot.count -= send.count;
    }

    return result.filter((g) => g.count > 0);
  },
};
