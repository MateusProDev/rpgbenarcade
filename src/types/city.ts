/** City (village/castle) types */

import type { BuildingInstance } from './buildings';
import type { ResourceStorage } from './resources';
import type { TroopCount, TrainingQueue } from './troops';

export interface City {
  id: string;
  playerId: string;
  worldId: string;
  name: string;
  /** Castle (main building) level — drives unlock progression */
  castleLevel: number;
  /** Position on the world map */
  position: MapCoordinate;
  buildings: BuildingInstance[];
  resources: ResourceStorage;
  garrison: TroopCount[];
  trainingQueue: TrainingQueue[];
  createdAt: number;
}

export interface MapCoordinate {
  x: number;
  y: number;
}
