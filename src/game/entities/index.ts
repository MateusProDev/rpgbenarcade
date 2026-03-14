/**
 * Game Entities — Domain model barrel export
 *
 * Entities are pure data structures (interfaces/types).
 * All entity definitions live in src/types/.
 * This module re-exports them for convenience and adds
 * factory helpers for creating default instances.
 */

export type {
  Player,
} from '../../types/player';

export type {
  City,
  MapCoordinate,
} from '../../types/city';

export type {
  BuildingInstance,
  BuildingDefinition,
  BuildingLevelDefinition,
  BuildingType,
} from '../../types/buildings';

export type {
  TroopDefinition,
  TroopCount,
  TroopType,
  Army,
  TrainingQueue,
} from '../../types/troops';

export type {
  Battle,
  BattleRequest,
  BattleResult,
  BattleReport,
  BattleStatus,
} from '../../types/battle';

export type {
  Alliance,
  AllianceMember,
  AllianceRole,
} from '../../types/alliance';

export type {
  ResourceType,
  ResourceAmount,
  ResourceStorage,
} from '../../types/resources';

export type {
  WorldMap,
  MapTile,
  TileType,
} from '../../types/map';

export { createDefaultResources, createDefaultCity } from './factories';
