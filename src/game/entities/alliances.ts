// ========================
// Alliance System — Conflict Zone Dominance
// 4 alliances compete for 4 corner bases + 1 central fortress
// ========================
import type { AllianceId, AllianceData, ConflictStructure } from "../../types";

// === Alliance Definitions ===
export const ALLIANCES: Record<AllianceId, AllianceData> = {
  red: {
    id: "red",
    name: "Ordem da Chama",
    color: 0xcc2222,
    cssColor: "#cc2222",
    icon: "🔥",
    controlledStructures: [],
  },
  blue: {
    id: "blue",
    name: "Pacto do Gelo",
    color: 0x2255cc,
    cssColor: "#2255cc",
    icon: "❄️",
    controlledStructures: [],
  },
  green: {
    id: "green",
    name: "Sentinelas da Natureza",
    color: 0x22aa44,
    cssColor: "#22aa44",
    icon: "🌿",
    controlledStructures: [],
  },
  purple: {
    id: "purple",
    name: "Círculo Sombrio",
    color: 0x8833cc,
    cssColor: "#8833cc",
    icon: "🔮",
    controlledStructures: [],
  },
};

// === Map dimensions ===
export const CZ_MAP_SIZE = 19200;
export const CZ_CENTER = CZ_MAP_SIZE / 2;
export const CZ_BASE_OFFSET = 1600;

// === Conflict Structures: 4 corner bases + 1 central fortress ===
export const CONFLICT_STRUCTURES: ConflictStructure[] = [
  {
    id: "base_nw",
    name: "Fortaleza Noroeste",
    x: CZ_BASE_OFFSET,
    y: CZ_BASE_OFFSET,
    type: "base",
    owner: "red",
    guardElite: "elite_guardian",
    hp: 10000,
    maxHp: 10000,
  },
  {
    id: "base_ne",
    name: "Fortaleza Nordeste",
    x: CZ_MAP_SIZE - CZ_BASE_OFFSET,
    y: CZ_BASE_OFFSET,
    type: "base",
    owner: "blue",
    guardElite: "elite_guardian",
    hp: 10000,
    maxHp: 10000,
  },
  {
    id: "base_sw",
    name: "Fortaleza Sudoeste",
    x: CZ_BASE_OFFSET,
    y: CZ_MAP_SIZE - CZ_BASE_OFFSET,
    type: "base",
    owner: "green",
    guardElite: "elite_guardian",
    hp: 10000,
    maxHp: 10000,
  },
  {
    id: "base_se",
    name: "Fortaleza Sudeste",
    x: CZ_MAP_SIZE - CZ_BASE_OFFSET,
    y: CZ_MAP_SIZE - CZ_BASE_OFFSET,
    type: "base",
    owner: "purple",
    guardElite: "elite_guardian",
    hp: 10000,
    maxHp: 10000,
  },
  {
    id: "central_fortress",
    name: "Cidadela das Sombras",
    x: CZ_CENTER,
    y: CZ_CENTER,
    type: "fortress",
    owner: null,
    guardElite: "world_boss",
    hp: 50000,
    maxHp: 50000,
  },
];

// === Portal positions (near each base) ===
export const CZ_PORTALS = [
  { id: "portal_nw", x: CZ_BASE_OFFSET + 400, y: CZ_BASE_OFFSET + 400, owner: "red" as AllianceId },
  { id: "portal_ne", x: CZ_MAP_SIZE - CZ_BASE_OFFSET - 400, y: CZ_BASE_OFFSET + 400, owner: "blue" as AllianceId },
  { id: "portal_sw", x: CZ_BASE_OFFSET + 400, y: CZ_MAP_SIZE - CZ_BASE_OFFSET - 400, owner: "green" as AllianceId },
  { id: "portal_se", x: CZ_MAP_SIZE - CZ_BASE_OFFSET - 400, y: CZ_MAP_SIZE - CZ_BASE_OFFSET - 400, owner: "purple" as AllianceId },
];

// === Dungeon entrances ===
export const CZ_DUNGEONS = [
  {
    id: "dungeon_red",
    name: "Masmorra Sangrenta",
    x: CZ_CENTER - 3200,
    y: CZ_CENTER - 2400,
    type: "pvp" as const,
    glowColor: 0xff4422,
    description: "Zona PvP forçada — brilho vermelho quente",
  },
  {
    id: "dungeon_black",
    name: "Abismo do Vazio",
    x: CZ_CENTER + 3200,
    y: CZ_CENTER + 2400,
    type: "full_loot" as const,
    glowColor: 0x6633aa,
    description: "Zona PvP full loot — névoa escura azul-roxa",
  },
];

// === River path control points (bezier-like) ===
export const CZ_RIVERS = [
  // Main river flowing NW → SE
  [
    { x: 800, y: 4800 },
    { x: 3200, y: 6400 },
    { x: 6400, y: 7200 },
    { x: 9600, y: 8000 },
    { x: 12800, y: 9600 },
    { x: 16000, y: 12800 },
    { x: 18400, y: 16000 },
  ],
  // Tributary from NE flowing south
  [
    { x: 14400, y: 800 },
    { x: 13600, y: 3200 },
    { x: 12000, y: 5600 },
    { x: 10400, y: 7600 },
    { x: 9600, y: 8000 },
  ],
];

// === Road waypoints (connecting bases → center) ===
export const CZ_ROADS = [
  // NW base → center
  { from: { x: CZ_BASE_OFFSET, y: CZ_BASE_OFFSET }, to: { x: CZ_CENTER, y: CZ_CENTER } },
  // NE base → center
  { from: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_BASE_OFFSET }, to: { x: CZ_CENTER, y: CZ_CENTER } },
  // SW base → center
  { from: { x: CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET }, to: { x: CZ_CENTER, y: CZ_CENTER } },
  // SE base → center
  { from: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET }, to: { x: CZ_CENTER, y: CZ_CENTER } },
  // NW ↔ NE (top road)
  { from: { x: CZ_BASE_OFFSET, y: CZ_BASE_OFFSET }, to: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_BASE_OFFSET } },
  // SW ↔ SE (bottom road)
  { from: { x: CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET }, to: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET } },
  // NW ↔ SW (left road)
  { from: { x: CZ_BASE_OFFSET, y: CZ_BASE_OFFSET }, to: { x: CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET } },
  // NE ↔ SE (right road)
  { from: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_BASE_OFFSET }, to: { x: CZ_MAP_SIZE - CZ_BASE_OFFSET, y: CZ_MAP_SIZE - CZ_BASE_OFFSET } },
];

// === Utility functions ===

export function getAlliance(id: AllianceId): AllianceData {
  return ALLIANCES[id];
}

export function getAllianceColor(id: AllianceId | null): number {
  if (!id) return 0x666666;
  return ALLIANCES[id].color;
}

export function getAllianceCssColor(id: AllianceId | null): string {
  if (!id) return "#666666";
  return ALLIANCES[id].cssColor;
}

/**
 * Check if one alliance dominates ALL 5 structures
 */
export function checkFullDominance(structures: ConflictStructure[]): AllianceId | null {
  if (structures.length === 0) return null;
  const firstOwner = structures[0].owner;
  if (!firstOwner) return null;
  for (const s of structures) {
    if (s.owner !== firstOwner) return null;
  }
  return firstOwner;
}

/**
 * Count how many structures each alliance controls
 */
export function getAllianceScores(structures: ConflictStructure[]): Record<AllianceId, number> {
  const scores: Record<AllianceId, number> = { red: 0, blue: 0, green: 0, purple: 0 };
  for (const s of structures) {
    if (s.owner) scores[s.owner]++;
  }
  return scores;
}

/**
 * Get the alliance with the most structures (or null if tie)
 */
export function getDominantAlliance(structures: ConflictStructure[]): AllianceId | null {
  const scores = getAllianceScores(structures);
  let max = 0;
  let dominant: AllianceId | null = null;
  let tied = false;
  for (const [id, score] of Object.entries(scores)) {
    if (score > max) {
      max = score;
      dominant = id as AllianceId;
      tied = false;
    } else if (score === max && score > 0) {
      tied = true;
    }
  }
  return tied ? null : dominant;
}
