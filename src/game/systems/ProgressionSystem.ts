/**
 * ProgressionSystem — castle level progression and unlock logic.
 */

import type { City } from '../../types/city';
import { CASTLE_PROGRESSION, getUnlockedBuildings, getProgressionForLevel } from '../config/progression.config';

export const ProgressionSystem = {
  /**
   * Returns the max building slots available for the city's castle level.
   */
  getMaxBuildingSlots(castleLevel: number): number {
    // Find the highest progression entry <= castleLevel
    let maxSlots = 5;
    for (const entry of CASTLE_PROGRESSION) {
      if (entry.level <= castleLevel) {
        maxSlots = entry.maxBuildingSlots;
      }
    }
    return maxSlots;
  },

  /**
   * Returns building types currently unlocked for the city.
   */
  getAvailableBuildings(city: City): string[] {
    return getUnlockedBuildings(city.castleLevel);
  },

  /**
   * Gets progression description for a given castle level.
   */
  getLevelDescription(level: number): string {
    const entry = getProgressionForLevel(level);
    return entry?.description ?? '';
  },

  /**
   * Checks if upgrading to the next castle level is possible.
   */
  canUpgradeCastle(city: City): boolean {
    const castleBuilding = city.buildings.find((b) => b.type === 'castle');
    if (!castleBuilding) return false;
    if (castleBuilding.upgradeStartedAt !== null) return false;
    return true;
  },
};
