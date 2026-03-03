// ============================================
// Zone Definitions — all playable maps
// ============================================
import type { ZoneDefinition } from '@/store/types';

/** Generate a collision map with walls around border and random obstacles */
function generateCollisionMap(w: number, h: number, density = 0.08, seed = 0): number[] {
  const map: number[] = new Array(w * h).fill(0);

  // Borders
  for (let x = 0; x < w; x++) {
    map[x] = 1;                      // top
    map[(h - 1) * w + x] = 1;       // bottom
  }
  for (let y = 0; y < h; y++) {
    map[y * w] = 1;                  // left
    map[y * w + (w - 1)] = 1;       // right
  }

  // Pseudo-random obstacles
  let r = seed || 42;
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      r = (r * 1103515245 + 12345) & 0x7fffffff;
      if ((r % 1000) / 1000 < density) {
        map[y * w + x] = 1;
      }
    }
  }

  // Clear spawn area (center 5x5)
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      map[(cy + dy) * w + (cx + dx)] = 0;
    }
  }

  return map;
}

const TILE = 32;

export const ZONES: Record<string, ZoneDefinition> = {
  town: {
    id: 'town',
    name: 'Vila Inicial',
    type: 'town',
    width: 50,
    height: 40,
    tileSize: TILE,
    spawnPoint: { x: 50 * TILE / 2, y: 40 * TILE / 2 },
    portals: [
      {
        position: { x: 48, y: 18 },
        size: { x: 2, y: 4 },
        targetZone: 'plains',
        targetPosition: { x: 2 * TILE, y: 20 * TILE },
        label: 'Planícies',
      },
      {
        position: { x: 24, y: 0 },
        size: { x: 3, y: 1 },
        targetZone: 'dungeon_entrance',
        targetPosition: { x: 15 * TILE, y: 28 * TILE },
        label: 'Masmorra',
      },
    ],
    npcs: ['merchant_anna', 'guard_captain'],
    bgColor: 0x2a3a2a,
    pvpEnabled: false,
    levelReq: 1,
    collisionMap: generateCollisionMap(50, 40, 0.04, 1),
  },

  plains: {
    id: 'plains',
    name: 'Planícies Verdejantes',
    type: 'field',
    width: 80,
    height: 60,
    tileSize: TILE,
    spawnPoint: { x: 3 * TILE, y: 30 * TILE },
    portals: [
      {
        position: { x: 0, y: 18 },
        size: { x: 1, y: 4 },
        targetZone: 'town',
        targetPosition: { x: 47 * TILE, y: 20 * TILE },
        label: 'Vila',
      },
      {
        position: { x: 78, y: 28 },
        size: { x: 2, y: 4 },
        targetZone: 'dark_forest',
        targetPosition: { x: 2 * TILE, y: 20 * TILE },
        label: 'Floresta Sombria',
      },
      {
        position: { x: 38, y: 0 },
        size: { x: 3, y: 1 },
        targetZone: 'pvp_arena',
        targetPosition: { x: 25 * TILE, y: 48 * TILE },
        label: 'Arena PvP',
      },
    ],
    npcs: ['wolf_alpha', 'slime_green', 'slime_blue'],
    bgColor: 0x2a4a20,
    pvpEnabled: false,
    levelReq: 1,
    collisionMap: generateCollisionMap(80, 60, 0.06, 2),
  },

  dark_forest: {
    id: 'dark_forest',
    name: 'Floresta Sombria',
    type: 'field',
    width: 70,
    height: 70,
    tileSize: TILE,
    spawnPoint: { x: 3 * TILE, y: 35 * TILE },
    portals: [
      {
        position: { x: 0, y: 18 },
        size: { x: 1, y: 4 },
        targetZone: 'plains',
        targetPosition: { x: 77 * TILE, y: 30 * TILE },
        label: 'Planícies',
      },
      {
        position: { x: 34, y: 0 },
        size: { x: 2, y: 1 },
        targetZone: 'boss_lair',
        targetPosition: { x: 15 * TILE, y: 28 * TILE },
        label: 'Covil do Boss',
      },
    ],
    npcs: ['dark_wolf', 'forest_spider', 'bandit'],
    bgColor: 0x1a2a1a,
    pvpEnabled: true,
    levelReq: 5,
    collisionMap: generateCollisionMap(70, 70, 0.10, 3),
  },

  dungeon_entrance: {
    id: 'dungeon_entrance',
    name: 'Masmorra — Entrada',
    type: 'dungeon',
    width: 40,
    height: 30,
    tileSize: TILE,
    spawnPoint: { x: 20 * TILE, y: 28 * TILE },
    portals: [
      {
        position: { x: 18, y: 29 },
        size: { x: 4, y: 1 },
        targetZone: 'town',
        targetPosition: { x: 25 * TILE, y: 3 * TILE },
        label: 'Vila',
      },
      {
        position: { x: 18, y: 0 },
        size: { x: 4, y: 1 },
        targetZone: 'dungeon_depths',
        targetPosition: { x: 15 * TILE, y: 28 * TILE },
        label: 'Profundezas',
      },
    ],
    npcs: ['skeleton', 'skeleton_archer'],
    bgColor: 0x1a1a2a,
    pvpEnabled: false,
    levelReq: 3,
    collisionMap: generateCollisionMap(40, 30, 0.12, 4),
  },

  dungeon_depths: {
    id: 'dungeon_depths',
    name: 'Masmorra — Profundezas',
    type: 'dungeon',
    width: 50,
    height: 40,
    tileSize: TILE,
    spawnPoint: { x: 15 * TILE, y: 38 * TILE },
    portals: [
      {
        position: { x: 13, y: 39 },
        size: { x: 4, y: 1 },
        targetZone: 'dungeon_entrance',
        targetPosition: { x: 20 * TILE, y: 2 * TILE },
        label: 'Entrada',
      },
    ],
    npcs: ['dark_mage', 'stone_golem'],
    bgColor: 0x0a0a1a,
    pvpEnabled: false,
    levelReq: 8,
    collisionMap: generateCollisionMap(50, 40, 0.14, 5),
  },

  pvp_arena: {
    id: 'pvp_arena',
    name: 'Arena de Combate',
    type: 'pvp',
    width: 50,
    height: 50,
    tileSize: TILE,
    spawnPoint: { x: 25 * TILE, y: 25 * TILE },
    portals: [
      {
        position: { x: 23, y: 49 },
        size: { x: 4, y: 1 },
        targetZone: 'plains',
        targetPosition: { x: 39 * TILE, y: 3 * TILE },
        label: 'Planícies',
      },
    ],
    npcs: [],
    bgColor: 0x2a1a1a,
    pvpEnabled: true,
    levelReq: 5,
    collisionMap: generateCollisionMap(50, 50, 0.03, 6),
  },

  boss_lair: {
    id: 'boss_lair',
    name: 'Covil do Dragão',
    type: 'boss',
    width: 40,
    height: 30,
    tileSize: TILE,
    spawnPoint: { x: 20 * TILE, y: 28 * TILE },
    portals: [
      {
        position: { x: 14, y: 29 },
        size: { x: 4, y: 1 },
        targetZone: 'dark_forest',
        targetPosition: { x: 35 * TILE, y: 3 * TILE },
        label: 'Floresta',
      },
    ],
    npcs: ['dragon_boss'],
    bgColor: 0x1a0a1a,
    pvpEnabled: false,
    levelReq: 12,
    collisionMap: generateCollisionMap(40, 30, 0.05, 7),
  },
};
