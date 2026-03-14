/**
 * GameEngine — central orchestrator that coordinates all game systems.
 *
 * The engine is the single place where systems are composed together.
 * It exposes high-level actions that UI components can call,
 * and delegates to the appropriate systems internally.
 *
 * The engine does NOT own state directly. It operates on data
 * passed in and returns updated data (pure-ish pattern).
 * Persistence is handled by the services layer.
 */

import type { City } from '../../types/city';
import type { BuildingType } from '../../types/buildings';
import type { TroopType, TroopCount } from '../../types/troops';
import type { ResourceAmount } from '../../types/resources';
import type { BattleResult } from '../../types/battle';

import { ResourceSystem } from '../systems/ResourceSystem';
import { BuildingSystem } from '../systems/BuildingSystem';
import { TroopSystem } from '../systems/TroopSystem';
import { BattleSystem } from '../systems/BattleSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';

export const GameEngine = {
  // ─── Resource Operations ───────────────────────────────────

  /** Tick resources forward to current time (offline catch-up). */
  tickResources(city: City, now?: number): City {
    const resources = ResourceSystem.calculateResources(city.resources, now);
    const production = ResourceSystem.computeProductionRates(city);
    const capacity = ResourceSystem.computeStorageCapacity(city);
    return {
      ...city,
      resources: { ...resources, production, capacity },
    };
  },

  // ─── Building Operations ───────────────────────────────────

  /** Check what buildings the player can construct. */
  getAvailableBuildings(city: City) {
    return ProgressionSystem.getAvailableBuildings(city);
  },

  /** Start constructing a new building. */
  constructBuilding(city: City, type: BuildingType, slotIndex: number, _now?: number): City | null {
    const check = BuildingSystem.canBuild(city, type);
    if (!check.ok) return null;

    const building = BuildingSystem.createBuilding(type, slotIndex);
    return {
      ...city,
      buildings: [...city.buildings, building],
    };
  },

  /** Start upgrading an existing building. */
  upgradeBuilding(city: City, buildingId: string, now?: number): City | null {
    return BuildingSystem.startUpgrade(city, buildingId, now);
  },

  /** Resolve any completed building upgrades. */
  resolveBuildings(city: City, now?: number): City {
    return BuildingSystem.resolveCompletedUpgrades(city, now);
  },

  // ─── Troop Operations ──────────────────────────────────────

  /** Start training troops. */
  trainTroops(city: City, troopType: TroopType, amount: number, now?: number): City | null {
    return TroopSystem.startTraining(city, troopType, amount, now);
  },

  /** Resolve completed training queues. */
  resolveTraining(city: City, now?: number): City {
    return TroopSystem.resolveCompletedTraining(city, now);
  },

  /** Detach troops from garrison for an attack. */
  sendAttack(city: City, troops: TroopCount[]): { updatedCity: City; sentTroops: TroopCount[] } | null {
    const remaining = TroopSystem.detachTroops(city.garrison, troops);
    if (!remaining) return null;
    return {
      updatedCity: { ...city, garrison: remaining },
      sentTroops: troops,
    };
  },

  // ─── Battle ────────────────────────────────────────────────

  /** Resolve combat (should be called server-side). */
  resolveBattle(
    attackerTroops: TroopCount[],
    defenderTroops: TroopCount[],
    defenderResources: ResourceAmount,
    wallLevel?: number,
  ): BattleResult {
    return BattleSystem.resolve(attackerTroops, defenderTroops, defenderResources, wallLevel);
  },

  // ─── Time Utilities ────────────────────────────────────────

  formatTime: TimeSystem.formatRemaining,
  marchTime: TimeSystem.calculateMarchTime,

  // ─── Full Tick ─────────────────────────────────────────────

  /**
   * Performs a full game tick: resources + building resolution + training resolution.
   * Call this when a player opens their city to catch up on offline progress.
   */
  fullTick(city: City, now: number = Date.now()): City {
    let updated = this.tickResources(city, now);
    updated = this.resolveBuildings(updated, now);
    updated = this.resolveTraining(updated, now);
    return updated;
  },
};
