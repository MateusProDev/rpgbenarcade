// ============================================
// TileMap — renders zone ground as colored tiles
// ============================================
import { Container, Graphics } from 'pixi.js';
import type { ZoneDefinition } from '@/store/types';

/** Simple color-based tile renderer (no sprite sheets required) */
export class TileMap {
  private parent: Container;
  private gfx: Graphics | null = null;

  // Tile color palette
  private readonly TILE_COLORS: Record<string, { ground: number; blocked: number; accent: number }> = {
    town:    { ground: 0x2a3a2a, blocked: 0x4a4a3a, accent: 0x3a5a3a },
    field:   { ground: 0x2a4a20, blocked: 0x4a4a30, accent: 0x3a6a30 },
    dungeon: { ground: 0x1a1a2a, blocked: 0x3a2a3a, accent: 0x2a2a4a },
    pvp:     { ground: 0x2a1a1a, blocked: 0x4a2a2a, accent: 0x3a1a2a },
    boss:    { ground: 0x1a0a1a, blocked: 0x3a1a2a, accent: 0x2a0a3a },
  };

  constructor(parent: Container) {
    this.parent = parent;
  }

  build(zone: ZoneDefinition): void {
    this.clear();
    const g = new Graphics();
    const { width, height, tileSize, collisionMap, type } = zone;
    const colors = this.TILE_COLORS[type] || this.TILE_COLORS.field;

    for (let ty = 0; ty < height; ty++) {
      for (let tx = 0; tx < width; tx++) {
        const idx = ty * width + tx;
        const blocked = collisionMap[idx] === 1;
        const px = tx * tileSize;
        const py = ty * tileSize;

        // Base tile
        const baseColor = blocked ? colors.blocked : colors.ground;
        // Add slight variation
        const variation = ((tx * 7 + ty * 13) % 5) * 0x010101;
        const finalColor = baseColor + variation;

        g.rect(px, py, tileSize, tileSize);
        g.fill(finalColor);

        // Grid lines (very subtle)
        g.rect(px, py, tileSize, 1);
        g.fill({ color: 0x000000, alpha: 0.08 });
        g.rect(px, py, 1, tileSize);
        g.fill({ color: 0x000000, alpha: 0.08 });
      }
    }

    // Draw portals as glowing areas
    for (const portal of zone.portals) {
      g.rect(
        portal.position.x * tileSize,
        portal.position.y * tileSize,
        portal.size.x * tileSize,
        portal.size.y * tileSize,
      );
      g.fill({ color: 0x44aaff, alpha: 0.25 });

      // Portal border glow
      g.rect(
        portal.position.x * tileSize,
        portal.position.y * tileSize,
        portal.size.x * tileSize,
        portal.size.y * tileSize,
      );
      g.stroke({ color: 0x44aaff, width: 2, alpha: 0.5 });
    }

    // Zone boundary
    g.rect(0, 0, width * tileSize, height * tileSize);
    g.stroke({ color: 0xffffff, width: 2, alpha: 0.1 });

    this.gfx = g;
    this.parent.addChild(g);
  }

  clear(): void {
    if (this.gfx) {
      this.parent.removeChild(this.gfx);
      this.gfx.destroy();
      this.gfx = null;
    }
  }
}
