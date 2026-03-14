/** Game-wide constants */

export const GAME_CONSTANTS = {
  /** Max buildings per city (excluding castle) */
  MAX_BUILDING_SLOTS: 20,
  /** Resource tick interval used for server-side calculation */
  RESOURCE_TICK_INTERVAL_MS: 60_000,
  /** Base march speed (tiles per minute) */
  BASE_MARCH_SPEED: 2,
  /** Maximum troop queue size */
  MAX_TRAINING_QUEUE: 5,
  /** Initial castle level for new players */
  INITIAL_CASTLE_LEVEL: 1,
  /** Maximum castle level */
  MAX_CASTLE_LEVEL: 20,
  /** World map dimensions */
  WORLD_MAP_SIZE: 100,
} as const;
