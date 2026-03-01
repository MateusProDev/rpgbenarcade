// ========================
// RPG Ben Arcade - Core Types
// ========================

// === Classes ===
export type ClassType = "mage" | "archer" | "swordsman" | "lancer";

export type AdvancedClassType =
  | "battlemage"
  | "assassin"
  | "knight"
  | "guardian"
  | "archmage"
  | "ranger"
  | "berserker"
  | "paladin";

// === Attributes ===
export type Attributes = {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
};

export type ScalingType = keyof Omit<Attributes, "vitality">;

// === Skills ===
export type Skill = {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;
  manaCost?: number;
  range: number;
  areaOfEffect?: number;
  scaling: ScalingType;
  icon: string;
};

// === Talents ===
export type Talent = {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  prerequisiteId?: string;
  effect: TalentEffect;
};

export type TalentEffect = {
  type: "stat_bonus" | "skill_upgrade" | "passive" | "unlock_class";
  stat?: keyof Attributes;
  value?: number;
  skillId?: string;
  classUnlock?: AdvancedClassType;
};

// === Items ===
export type ItemType = "weapon" | "armor" | "consumable" | "accessory";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type EquipSlot = "weapon" | "head" | "body" | "legs" | "accessory";

export type Item = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  level: number;
  equipSlot?: EquipSlot;
  attributeBonus?: Partial<Attributes>;
  damage?: number;
  defense?: number;
  icon: string;
  price: number;
};

export type InventorySlot = {
  item: Item;
  quantity: number;
};

// === Equipment ===
export type Equipment = {
  weapon?: Item;
  head?: Item;
  body?: Item;
  legs?: Item;
  accessory?: Item;
};

// === Player ===
export type PlayerData = {
  uid: string;
  name: string;
  classType: ClassType;
  advancedClass?: AdvancedClassType;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attributes: Attributes;
  attributePoints: number;
  skills: string[];
  talents: string[];
  inventory: InventorySlot[];
  equipment: Equipment;
  position: { x: number; y: number };
  currentMap: MapId;
  guildId?: string;
  title?: string;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  quests: QuestProgress[];
  lastOnline: number;
  createdAt: number;
};

// === Multiplayer ===
export type RemotePlayer = {
  uid: string;
  name: string;
  classType: ClassType;
  advancedClass?: AdvancedClassType;
  level: number;
  hp: number;
  maxHp: number;
  position: { x: number; y: number };
  currentMap: MapId;
  direction: Direction;
  isAttacking: boolean;
  lastHeartbeat: number;
  title?: string;
  guildTag?: string;
};

export type Direction = "up" | "down" | "left" | "right";

// === Maps ===
export type MapId = "village" | "forest" | "dungeon" | "fields" | "arena";

export type MapConfig = {
  id: MapId;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  spawnPoint: { x: number; y: number };
  pvpEnabled: boolean;
  enemies: EnemySpawn[];
  npcs: NpcConfig[];
  portals: Portal[];
};

export type Portal = {
  x: number;
  y: number;
  width: number;
  height: number;
  targetMap: MapId;
  targetX: number;
  targetY: number;
};

// === Enemies ===
export type EnemyType = "skeleton" | "wolf" | "goblin" | "orc" | "dragon" | "dark_knight" | "slime" | "bandit";

export type EnemySpawn = {
  type: EnemyType;
  x: number;
  y: number;
  respawnTime: number;
};

export type EnemyConfig = {
  type: EnemyType;
  name: string;
  hp: number;
  damage: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldReward: number;
  lootTable: LootEntry[];
  aggroRange: number;
};

export type LootEntry = {
  itemId: string;
  chance: number;
};

// === NPCs ===
export type NpcConfig = {
  id: string;
  name: string;
  x: number;
  y: number;
  dialogue: string[];
  shopItems?: string[];
  questId?: string;
};

// === Quests ===
export type QuestType = "kill" | "collect" | "explore" | "talk";

export type Quest = {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  target: string;
  amount: number;
  xpReward: number;
  goldReward: number;
  itemReward?: string;
  requiredLevel: number;
};

export type QuestProgress = {
  questId: string;
  progress: number;
  completed: boolean;
};

// === Guild ===
export type Guild = {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  members: string[];
  level: number;
  createdAt: number;
};

// === Chat ===
export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  channel: "global" | "guild" | "whisper";
};

// === PvP ===
export type PvpResult = {
  winnerId: string;
  loserId: string;
  ratingChange: number;
  timestamp: number;
};

// === Day/Night ===
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

// === Game Events ===
export type GameEvent =
  | { type: "PLAYER_DAMAGE"; targetId: string; damage: number; sourceId: string }
  | { type: "PLAYER_HEAL"; targetId: string; amount: number }
  | { type: "PLAYER_DEATH"; playerId: string }
  | { type: "PLAYER_RESPAWN"; playerId: string }
  | { type: "PLAYER_LEVEL_UP"; playerId: string; newLevel: number }
  | { type: "ITEM_DROP"; item: Item; x: number; y: number }
  | { type: "ENEMY_DEATH"; enemyType: EnemyType; x: number; y: number; killerId: string }
  | { type: "QUEST_COMPLETE"; playerId: string; questId: string };
