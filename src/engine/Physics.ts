// ============================================
// Physics — simple AABB collision, ray helpers
// ============================================
import type { Vec2 } from '@/store/types';

export interface AABB {
  x: number; y: number;
  w: number; h: number;
}

/** Check AABB overlap */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Distance between two points */
export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Normalize vector */
export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/** Lerp between two values */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Lerp vec2 */
export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Clamp value */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Check tile-based collision. Returns true if the tile at worldPos is blocked.
 * collisionMap: flat 1D array, 0 = passable, 1 = blocked
 */
export function isTileBlocked(
  worldX: number,
  worldY: number,
  tileSize: number,
  mapWidth: number,
  collisionMap: number[],
): boolean {
  const tx = Math.floor(worldX / tileSize);
  const ty = Math.floor(worldY / tileSize);
  if (tx < 0 || ty < 0 || tx >= mapWidth) return true;
  const idx = ty * mapWidth + tx;
  if (idx < 0 || idx >= collisionMap.length) return true;
  return collisionMap[idx] === 1;
}

/** Resolve movement against tile collision (slide) */
export function resolveMovement(
  pos: Vec2,
  velocity: Vec2,
  bodySize: number,
  tileSize: number,
  mapWidth: number,
  collisionMap: number[],
): Vec2 {
  const half = bodySize / 2;
  let newX = pos.x + velocity.x;
  let newY = pos.y + velocity.y;

  // Check X axis
  if (velocity.x !== 0) {
    const checkX = velocity.x > 0 ? newX + half : newX - half;
    if (
      isTileBlocked(checkX, pos.y - half + 1, tileSize, mapWidth, collisionMap) ||
      isTileBlocked(checkX, pos.y + half - 1, tileSize, mapWidth, collisionMap)
    ) {
      newX = pos.x;
    }
  }

  // Check Y axis
  if (velocity.y !== 0) {
    const checkY = velocity.y > 0 ? newY + half : newY - half;
    if (
      isTileBlocked(newX - half + 1, checkY, tileSize, mapWidth, collisionMap) ||
      isTileBlocked(newX + half - 1, checkY, tileSize, mapWidth, collisionMap)
    ) {
      newY = pos.y;
    }
  }

  return { x: newX, y: newY };
}
