/** World map types */

export type TileType = 'plains' | 'forest' | 'mountain' | 'water' | 'occupied';

export interface WorldMap {
  id: string;
  name: string;
  width: number;
  height: number;
  active: boolean;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
}

export interface MapTile {
  id: string;
  worldId: string;
  x: number;
  y: number;
  type: TileType;
  occupiedBy: string | null;
  cityId: string | null;
}
