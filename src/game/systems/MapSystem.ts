/**
 * MapSystem — world map logic and player location management.
 * Pure functions for tile operations and distance calculations.
 */

import type { MapTile, TileType } from '../../types/map';

export const MapSystem = {
  /**
   * Finds an unoccupied tile in a region for spawning a new city.
   */
  findSpawnTile(tiles: MapTile[]): MapTile | null {
    const candidates = tiles.filter((t) => t.type === 'plains' && !t.occupiedBy);
    if (candidates.length === 0) return null;
    // Pick a random unoccupied plains tile
    return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
  },

  /**
   * Distance between two tile coordinates.
   */
  distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  /**
   * Returns tiles within a given radius of a center point.
   */
  getTilesInRadius(tiles: MapTile[], cx: number, cy: number, radius: number): MapTile[] {
    return tiles.filter((t) => this.distance(t.x, t.y, cx, cy) <= radius);
  },

  /**
   * Returns a viewport window of tiles around a center.
   */
  getViewportTiles(
    tiles: MapTile[],
    centerX: number,
    centerY: number,
    halfWidth: number,
    halfHeight: number,
  ): MapTile[] {
    return tiles.filter(
      (t) =>
        t.x >= centerX - halfWidth &&
        t.x <= centerX + halfWidth &&
        t.y >= centerY - halfHeight &&
        t.y <= centerY + halfHeight,
    );
  },

  /**
   * Gets color for a tile type (used by 2D minimap renderers).
   */
  getTileColor(type: TileType): string {
    const colors: Record<TileType, string> = {
      plains: '#8fbc8f',
      forest: '#228b22',
      mountain: '#8b7355',
      water: '#4682b4',
      occupied: '#cd853f',
    };
    return colors[type];
  },
};
