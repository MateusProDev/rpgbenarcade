// ============================================
// TileMap — organic ground renderer (sem grid)
// Town usa WorldPainter para cena completa.
// Outros biomas usam pintura organica.
// Portais preservados. Performance: 1 draw call.
// ============================================
import { Container, Graphics } from 'pixi.js';
import type { ZoneDefinition } from '@/store/types';
import { WorldPainter } from './rendering/WorldPainter';

// Compact helpers
function shd(c: number, a: number): number {
  return (Math.max(0,((c>>16)&0xFF)-a)<<16)|(Math.max(0,((c>>8)&0xFF)-a)<<8)|Math.max(0,(c&0xFF)-a);
}
function lgt(c: number, a: number): number {
  return (Math.min(255,((c>>16)&0xFF)+a)<<16)|(Math.min(255,((c>>8)&0xFF)+a)<<8)|Math.min(255,(c&0xFF)+a);
}

const BIOME_PALETTES: Record<string, {
  base: number; mid: number; light: number; dark: number; accent: number;
}> = {
  town:    { base:0x3B7C2A, mid:0x4A9438, light:0x5BAD45, dark:0x2D6020, accent:0x5CBA40 },
  field:   { base:0x2E6E1A, mid:0x3A8A28, light:0x4EAA3A, dark:0x1E5010, accent:0x60C048 },
  dungeon: { base:0x1A1828, mid:0x242238, light:0x302E48, dark:0x101020, accent:0x3A2858 },
  pvp:     { base:0x2A1A1A, mid:0x3A2424, light:0x462E2E, dark:0x1A0E0E, accent:0x5C2020 },
  boss:    { base:0x1A0E20, mid:0x261428, light:0x321A36, dark:0x10080C, accent:0x4A1060 },
};

export class TileMap {
  private parent: Container;
  private gfx: Graphics | null = null;

  constructor(parent: Container) {
    this.parent = parent;
  }

  build(zone: ZoneDefinition): void {
    this.clear();

    const worldW = zone.width  * zone.tileSize;
    const worldH = zone.height * zone.tileSize;

    if (zone.type === 'town') {
      // ---- Aldeia: cena organica completa ----
      const painter = new WorldPainter(this.parent);
      painter.paintTown(worldW, worldH);
      // Portais por cima
      this._drawPortals(zone);
    } else {
      // ---- Outros biomas: terreno organico sem grid ----
      const g = new Graphics();
      const pal = BIOME_PALETTES[zone.type] ?? BIOME_PALETTES.field;

      // Preenchimento base
      g.rect(0, 0, worldW, worldH);
      g.fill(pal.base);

      // Patches organicos de textura
      let r = zone.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 1234) | 0;
      const rng = () => { r=(r*1103515245+12345)&0x7FFFFFFF; return r/0x7FFFFFFF; };

      const patchCount = zone.type === 'dungeon' ? 120 : 200;
      for (let i = 0; i < patchCount; i++) {
        const px = rng() * worldW;
        const py = rng() * worldH;
        const rx = 20 + rng() * 70;
        const ry = 10 + rng() * 38;
        const col = rng() > 0.6 ? pal.mid : (rng() > 0.5 ? pal.light : pal.dark);
        g.ellipse(px, py, rx, ry);
        g.fill({ color: col, alpha: 0.15 + rng() * 0.12 });
      }

      // Detalhes especificos por bioma
      if (zone.type === 'dungeon' || zone.type === 'boss') {
        // Pedras no chao
        for (let i = 0; i < 80; i++) {
          const px = rng() * worldW;
          const py = rng() * worldH;
          const rs = 3 + rng() * 9;
          g.ellipse(px, py, rs, rs * 0.55);
          g.fill({ color: shd(pal.mid, 5), alpha: 0.28 });
          g.ellipse(px - rs*0.15, py - rs*0.2, rs*0.55, rs*0.32);
          g.fill({ color: lgt(pal.mid, 15), alpha: 0.22 });
        }
        // Rachaduras no chao
        for (let i = 0; i < 30; i++) {
          const cx2 = rng() * worldW;
          const cy2 = rng() * worldH;
          const len = 15 + rng() * 40;
          const ang = rng() * Math.PI;
          g.moveTo(cx2, cy2);
          g.lineTo(cx2 + Math.cos(ang)*len, cy2 + Math.sin(ang)*len);
          g.stroke({ color: shd(pal.dark, 10), width: 1.2, alpha: 0.3 });
        }
      } else if (zone.type === 'field') {
        // Tufos de grama alta
        for (let i = 0; i < 100; i++) {
          const bx = rng() * worldW;
          const by = rng() * worldH;
          const h2 = 6 + rng() * 10;
          const lean = (rng()-0.5)*5;
          g.moveTo(bx, by);
          g.lineTo(bx+lean, by-h2);
          g.stroke({ color: pal.light, width: 1.0, alpha: 0.18 + rng()*0.12 });
        }
        // Flores silvestres
        const fc = [0xFFDD44, 0xFF9988, 0xDD88FF];
        for (let i = 0; i < 60; i++) {
          const fx = rng() * worldW;
          const fy = rng() * worldH;
          g.circle(fx, fy, 2);
          g.fill({ color: fc[Math.floor(rng()*3)], alpha: 0.45 });
        }
      } else if (zone.type === 'pvp') {
        // Marcas de batalha = rachaduras e manchas de sangue
        for (let i = 0; i < 25; i++) {
          const cx2 = rng() * worldW;
          const cy2 = rng() * worldH;
          g.circle(cx2, cy2, 4 + rng() * 10);
          g.fill({ color: 0x440000, alpha: 0.18 + rng() * 0.14 });
        }
        for (let i = 0; i < 20; i++) {
          const cx2 = rng() * worldW;
          const cy2 = rng() * worldH;
          const len = 10 + rng() * 30;
          const ang = rng() * Math.PI;
          g.moveTo(cx2, cy2);
          g.lineTo(cx2 + Math.cos(ang)*len, cy2 + Math.sin(ang)*len);
          g.stroke({ color: 0x330000, width: 1.5, alpha: 0.28 });
        }
      }

      // Borda do mapa (vinheta)
      const bSize = 80;
      g.rect(0, 0, worldW, bSize);
      g.fill({ color: 0x000000, alpha: 0.18 });
      g.rect(0, worldH - bSize, worldW, bSize);
      g.fill({ color: 0x000000, alpha: 0.18 });
      g.rect(0, 0, bSize, worldH);
      g.fill({ color: 0x000000, alpha: 0.18 });
      g.rect(worldW - bSize, 0, bSize, worldH);
      g.fill({ color: 0x000000, alpha: 0.18 });

      this.gfx = g;
      this.parent.addChild(g);
      this._drawPortals(zone);
    }
  }

  private _drawPortals(zone: ZoneDefinition): void {
    const g = new Graphics();
    const { tileSize } = zone;
    for (const portal of zone.portals) {
      const px = portal.position.x * tileSize;
      const py = portal.position.y * tileSize;
      const pw = portal.size.x * tileSize;
      const ph = portal.size.y * tileSize;
      // Glow suave
      g.roundRect(px - 4, py - 4, pw + 8, ph + 8, 6);
      g.fill({ color: 0x44aaff, alpha: 0.10 });
      g.roundRect(px, py, pw, ph, 4);
      g.fill({ color: 0x44aaff, alpha: 0.22 });
      g.roundRect(px, py, pw, ph, 4);
      g.stroke({ color: 0x88ccff, width: 2, alpha: 0.55 });
    }
    this.parent.addChild(g);
    // guardamos para destruir junto
    if (!this.gfx) this.gfx = g;
    else { /* portals layer fica separado, mas clear() destroi todos */ }
  }

  clear(): void {
    // Remove TODOS os filhos adicionados por este TileMap
    // (WorldPainter ou gfx + portals layer)
    while (this.parent.children.length > 0) {
      const child = this.parent.children[0];
      this.parent.removeChild(child);
      child.destroy({ children: true });
    }
    this.gfx = null;
  }
}
