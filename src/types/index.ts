// ─── Recursos ────────────────────────────────────────────────────────────────
export interface Resources {
  food:  number;
  wood:  number;
  stone: number;
  iron:  number;
}

// ─── Edifícios ───────────────────────────────────────────────────────────────
export type BuildingType =
  | 'sawmill'
  | 'quarry'
  | 'ironMine'
  | 'farm'
  | 'barracks'
  | 'academy'
  | 'warehouse';

export interface Building {
  type:        BuildingType;
  level:       number;
  upgrading:   boolean;
  upgradeEnds: number | null; // timestamp ms
}

export interface BuildingConfig {
  name:        string;
  description: string;
  icon:        string;
  maxLevel:    number;
  costPerLevel:    (level: number) => Resources;
  timePerLevel:    (level: number) => number; // seconds
  productionPerLevel?: (level: number) => Partial<Resources>; // per hour
}

// ─── Castelo ─────────────────────────────────────────────────────────────────
export interface Castle {
  id:        string;
  playerId:  string;
  worldId:   string;
  level:     number;
  mapX:      number;
  mapY:      number;
  buildings: Record<BuildingType, Building>;
  resources: Resources;
  lastResourceTick: number; // timestamp ms
}

// ─── Tropas ──────────────────────────────────────────────────────────────────
export type TroopType = 'infantry' | 'archer' | 'cavalry';

export interface Troop {
  type:     TroopType;
  count:    number;
  training: boolean;
  trainEnds: number | null;
}

export interface TroopConfig {
  name:    string;
  attack:  number;
  hp:      number;
  speed:   number;
  cost:    Resources;
  trainTime: number; // seconds per unit
}

// ─── Jogador ─────────────────────────────────────────────────────────────────
export interface Player {
  uid:         string;
  displayName: string;
  photoURL:    string;
  worldId:     string;
  castleId:    string;
  allianceId:  string | null;
  vip:         boolean;
  vipLevel:    number;
  joinedAt:    number;
}

// ─── Aliança ─────────────────────────────────────────────────────────────────
export interface Alliance {
  id:          string;
  worldId:     string;
  name:        string;
  tag:         string; // [TAG]
  leaderId:    string;
  members:     string[]; // player uids
  bases:       string[]; // base ids controlled
  controlsCastle: boolean;
  createdAt:   number;
}

// ─── Mundo ───────────────────────────────────────────────────────────────────
export interface World {
  id:          string;
  name:        string;
  playerCount: number;
  maxPlayers:  number;
  createdAt:   number;
  active:      boolean;
}

// ─── Mapa ────────────────────────────────────────────────────────────────────
export type TileType =
  | 'grass'
  | 'forest'
  | 'mountain'
  | 'water'
  | 'resource'
  | 'base'
  | 'castle_central'
  | 'player_castle';

export interface MapTile {
  x:       number;
  y:       number;
  type:    TileType;
  level:   number; // 1-10, 10 = center
  ownerId: string | null;
  resourceType?: keyof Resources;
  resourceAmount?: number;
}

// ─── Marcha ──────────────────────────────────────────────────────────────────
export type MarchType = 'gather' | 'attack' | 'reinforce';

export interface March {
  id:        string;
  playerId:  string;
  worldId:   string;
  type:      MarchType;
  troops:    Partial<Record<TroopType, number>>;
  fromX:     number;
  fromY:     number;
  toX:       number;
  toY:       number;
  startTime: number;
  arriveTime: number;
  returning: boolean;
}

// ─── Batalha ─────────────────────────────────────────────────────────────────
export interface BattleResult {
  attackerLoss: Partial<Record<TroopType, number>>;
  defenderLoss: Partial<Record<TroopType, number>>;
  attackerWon:  boolean;
  resourcesLooted: Partial<Resources>;
  timestamp:    number;
}

// ─── Requisitos de upgrade ───────────────────────────────────────────────────
export interface CastleUpgradeRequirement {
  castleLevel: number;
  buildings:   Partial<Record<BuildingType, number>>;
  resources:   Resources;
  time:        number; // seconds
}
