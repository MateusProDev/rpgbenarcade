// ============================================
// Shared Type Definitions — MMORPG Core Types
// ============================================

// ---- Geometry ----
export interface Vec2 {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

// ---- Player ----
export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
}

export interface PlayerData {
  uid: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  stats: PlayerStats;
  className: PlayerClass;
  zone: string;
  position: Vec2;
  direction: Direction;
  inventory: InventoryItem[];
  equippedSkills: string[];
  allianceId: string | null;
  pvpRating: number;
  titles: string[];
  activeTitle: string | null;
  createdAt: number;
  updatedAt?: unknown;
}

export type PlayerClass = 'warrior' | 'mage' | 'archer' | 'assassin';

export const CLASS_BASE_STATS: Record<PlayerClass, PlayerStats> = {
  warrior:  { hp: 200, maxHp: 200, mana: 50, maxMana: 50, attack: 18, defense: 14, speed: 140, critRate: 0.05, critDamage: 1.5 },
  mage:     { hp: 100, maxHp: 100, mana: 200, maxMana: 200, attack: 25, defense: 6, speed: 120, critRate: 0.08, critDamage: 1.8 },
  archer:   { hp: 130, maxHp: 130, mana: 80, maxMana: 80, attack: 20, defense: 8, speed: 170, critRate: 0.15, critDamage: 1.6 },
  assassin: { hp: 110, maxHp: 110, mana: 60, maxMana: 60, attack: 22, defense: 7, speed: 200, critRate: 0.20, critDamage: 2.0 },
};

// ---- Inventory ----
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'consumable';

export interface InventoryItem {
  id: string;
  templateId: string;
  name: string;
  rarity: ItemRarity;
  slot: ItemSlot;
  stats?: Partial<PlayerStats>;
  quantity: number;
  equipped?: boolean;
}

export interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  slot: ItemSlot;
  stats?: Partial<PlayerStats>;
  icon: string;
  dropRate: number;
  levelReq: number;
  price: number;
}

// ---- Skills ----
export type SkillTargetType = 'enemy' | 'self' | 'area' | 'ally';
export type DamageType = 'physical' | 'magical' | 'true';

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  className: PlayerClass | 'all';
  manaCost: number;
  cooldown: number;        // seconds
  range: number;           // pixels
  areaRadius?: number;     // for AoE
  baseDamage: number;
  damageType: DamageType;
  targetType: SkillTargetType;
  castTime: number;        // seconds
  icon: string;
  effectKey: string;       // for VFX lookup
  levelReq: number;
}

// ---- NPCs & Bosses ----
export type NpcType = 'enemy' | 'friendly' | 'boss' | 'merchant';

export interface NpcDefinition {
  id: string;
  name: string;
  type: NpcType;
  level: number;
  stats: PlayerStats;
  zone: string;
  position: Vec2;
  patrolPath?: Vec2[];
  lootTable: LootEntry[];
  respawnTime: number;     // seconds
  aggroRange: number;
  skills: string[];
  spriteKey: string;
}

export interface LootEntry {
  itemId: string;
  chance: number;          // 0-1
  minQty: number;
  maxQty: number;
}

// ---- Zones / Maps ----
export type ZoneType = 'town' | 'field' | 'dungeon' | 'pvp' | 'boss';

export interface ZoneDefinition {
  id: string;
  name: string;
  type: ZoneType;
  width: number;           // in tiles
  height: number;
  tileSize: number;
  spawnPoint: Vec2;
  portals: Portal[];
  npcs: string[];          // npc definition ids
  bgColor: number;         // hex color
  pvpEnabled: boolean;
  levelReq: number;
  collisionMap: number[];  // 0 = walkable, 1 = blocked
}

export interface Portal {
  position: Vec2;
  size: Vec2;
  targetZone: string;
  targetPosition: Vec2;
  label: string;
}

// ---- Alliance / Territory ----
export interface AllianceData {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  members: AllianceMember[];
  territories: string[];
  level: number;
  createdAt: number;
  updatedAt?: unknown;
}

export interface AllianceMember {
  uid: string;
  name: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: number;
}

export interface TerritoryData {
  id: string;
  name: string;
  zone: string;
  position: Vec2;
  radius: number;
  ownerId: string | null;      // alliance id
  ownerName: string | null;
  captureProgress: number;     // 0-100
  capturingAlliance: string | null;
  bonuses: TerritoryBonus[];
  lastCaptured: number;
}

export interface TerritoryBonus {
  type: 'xp' | 'gold' | 'dropRate' | 'attack' | 'defense';
  value: number;               // percentage bonus
}

// ---- Combat ----
export interface CombatResult {
  valid: boolean;
  damage: number;
  isCrit: boolean;
  targetHp: number;
  killed: boolean;
  loot?: InventoryItem[];
  xpGained?: number;
  goldGained?: number;
}

export interface CombatEvent {
  type: 'attack' | 'skill' | 'death' | 'respawn';
  attackerId: string;
  targetId: string;
  skillId: string;
  damage?: number;
  isCrit?: boolean;
  timestamp: number;
}

// ---- Multiplayer Sync ----
export interface SyncPayload {
  x: number;
  y: number;
  direction: Direction;
  zone: string;
  animation: string;
  hp: number;
  maxHp: number;
  name: string;
  level: number;
  className: PlayerClass;
  ts: number;
}

export interface RemotePlayerState extends SyncPayload {
  uid: string;
  lastUpdate: number;
}

// ---- Chat ----
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  channel: 'global' | 'alliance' | 'local' | 'system';
  timestamp: number;
}

// ---- UI State ----
export type PanelType = 'inventory' | 'skills' | 'alliance' | 'quest' | 'shop' | 'crafting' | 'settings' | null;

export interface UIState {
  openPanel: PanelType;
  chatOpen: boolean;
  minimapExpanded: boolean;
  showDamageNumbers: boolean;
  showNames: boolean;
  screenShake: boolean;
}
