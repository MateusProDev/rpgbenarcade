// ============================================
// WorldPainter — organic terrain for town zone
// Zero tile-grid. One static Graphics layer.
// Montanha + cachoeira + praia + naufragio +
// caminhos de terra + aldeia medieval.
// Desenhado UMA vez no init (sem custo por frame).
// ============================================
import { Container, Graphics } from 'pixi.js';

// ---- compact color helpers ----
function shd(c: number, a: number): number {
  return (Math.max(0,((c>>16)&0xFF)-a)<<16)|(Math.max(0,((c>>8)&0xFF)-a)<<8)|Math.max(0,(c&0xFF)-a);
}
function lgt(c: number, a: number): number {
  return (Math.min(255,((c>>16)&0xFF)+a)<<16)|(Math.min(255,((c>>8)&0xFF)+a)<<8)|Math.min(255,(c&0xFF)+a);
}

// ---- Paleta ----
const C = {
  grassBase:   0x3B7C2A,
  grassMid:    0x4A9438,
  grassLight:  0x5BAD45,
  grassDark:   0x2D6020,
  dirtPath:    0xA07840,
  dirtDark:    0x7A5828,
  dirtLight:   0xC09458,
  sand:        0xD4B468,
  sandWet:     0xB89A50,
  sandDark:    0xA08040,
  sea:         0x1B4FA0,
  seaMid:      0x2868CC,
  seaLight:    0x4090E0,
  seaFoam:     0xC8E8FF,
  stone:       0x8C8470,
  stoneLight:  0xB0AA98,
  stoneDark:   0x5A5648,
  mountain:    0x7E7868,
  mountainLt:  0xA0988A,
  mountainDk:  0x5C5648,
  snowCap:     0xF0EEE8,
  wood:        0x6A4822,
  woodDark:    0x3E2A10,
  woodLight:   0x9A7040,
  water:       0x3A7EC8,
  waterLight:  0x70B0F0,
};

export class WorldPainter {
  private parent: Container;

  constructor(parent: Container) {
    this.parent = parent;
  }

  /** Paint the town zone. W=1600 H=1280 (50×40 tiles @32px) */
  paintTown(worldW: number, worldH: number): void {
    const g = new Graphics();

    // ---- 1. Grama base ----
    g.rect(0, 0, worldW, worldH);
    g.fill(C.grassBase);

    // ---- 2. Variacao organica da grama ----
    this._grassTexture(g, worldW, worldH);

    // ---- 3. Praia + mar ----
    this._beach(g, worldW, worldH);

    // ---- 4. Montanha superior direita ----
    this._mountain(g, worldW, worldH);

    // ---- 5. Cachoeira ----
    this._waterfall(g, worldW, worldH);

    // ---- 6. Caminhos de terra ----
    this._paths(g, worldW, worldH);

    // ---- 7. Praca da aldeia + poco ----
    this._villageSquare(g, worldW, worldH);

    // ---- 7b. Tendas medievais dos ambulantes ----
    this._vendorTents(g, worldW, worldH);

    // ---- 8. Naufragio na praia ----
    this._shipwreck(g, worldW, worldH);

    // ---- 9. Pedras espalhadas (deco) ----
    this._scatterRocks(g, worldW, worldH);

    // ---- 10. Flores e grama alta (deco) ----
    this._grassDetails(g, worldW, worldH);

    this.parent.addChildAt(g, 0);
  }

  // =========================================================
  // GRAMA COM TEXTURA ORGANICA
  // =========================================================
  private _grassTexture(g: Graphics, w: number, h: number): void {
    const grassH = h * 0.74; // so area de grama, sem praia
    let r = 98765;
    const rng = () => { r=(r*1103515245+12345)&0x7FFFFFFF; return r/0x7FFFFFFF; };

    // Patches claros e escuros irregulares
    for (let i = 0; i < 260; i++) {
      const px = rng() * w;
      const py = rng() * grassH;
      if (py > grassH * 0.92) continue;
      const rx = 18 + rng() * 55;
      const ry = 9  + rng() * 30;
      const col = rng() > 0.55 ? C.grassMid : (rng() > 0.4 ? C.grassLight : C.grassDark);
      g.ellipse(px, py, rx, ry);
      g.fill({ color: col, alpha: 0.18 + rng() * 0.14 });
    }

    // Tufos de grama alta (linhas finas ascendentes)
    for (let i = 0; i < 120; i++) {
      const bx = rng() * w;
      const by = rng() * grassH;
      if (by > grassH * 0.9) continue;
      const h2 = 6 + rng() * 10;
      const lean = (rng() - 0.5) * 4;
      g.moveTo(bx, by);
      g.lineTo(bx + lean, by - h2);
      g.stroke({ color: C.grassLight, width: 1.0, alpha: 0.2 + rng() * 0.15 });
    }
  }

  // =========================================================
  // PRAIA E MAR
  // =========================================================
  private _beach(g: Graphics, w: number, h: number): void {
    const bY  = h * 0.72;  // inicio da areia
    const swY = h * 0.88;  // linha d'agua
    const e1Y = swY - 18;  // beira molhada

    // Areia seca (forma organica)
    g.moveTo(0, bY - 25);
    g.bezierCurveTo(w*0.18, bY - 42, w*0.38, bY - 18, w*0.58, bY - 32);
    g.bezierCurveTo(w*0.74, bY - 44, w*0.88, bY - 22, w,       bY - 35);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill(C.sand);

    // Areia molhada (faixa proxima ao mar)
    g.moveTo(0, e1Y);
    g.bezierCurveTo(w*0.28, e1Y - 12, w*0.55, e1Y + 8, w*0.78, e1Y - 6);
    g.bezierCurveTo(w*0.9, e1Y - 12, w, e1Y + 4, w, e1Y + 16);
    g.bezierCurveTo(w*0.88, e1Y + 22, w*0.55, e1Y + 18, w*0.28, e1Y + 24);
    g.bezierCurveTo(0, e1Y + 28, 0, e1Y + 16, 0, e1Y);
    g.closePath();
    g.fill(C.sandWet);

    // Mar principal
    g.moveTo(0, swY);
    g.bezierCurveTo(w*0.22, swY + 12, w*0.48, swY - 5, w*0.72, swY + 8);
    g.bezierCurveTo(w*0.88, swY + 14, w, swY + 3, w, swY);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill(C.sea);

    // Camada intermediaria (profundidade)
    g.moveTo(0, swY + 18);
    g.bezierCurveTo(w*0.25, swY + 10, w*0.5, swY + 28, w*0.75, swY + 15);
    g.bezierCurveTo(w*0.9, swY + 8, w, swY + 20, w, swY + 28);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill(shd(C.sea, 18));

    // Ondas (linhas bezier)
    for (let i = 0; i < 5; i++) {
      const wy = swY + 22 + i * 22;
      g.moveTo(0, wy);
      g.bezierCurveTo(w*0.18, wy - 9, w*0.42, wy + 7, w*0.64, wy - 5);
      g.bezierCurveTo(w*0.8, wy - 12, w*0.94, wy + 5, w, wy - 3);
      g.stroke({ color: C.seaLight, width: 1.8, alpha: 0.28 + i * 0.04 });
    }

    // Espuma na orla
    for (let i = 0; i < 12; i++) {
      const fx = (i / 12) * w + 18;
      const fy = swY + 4 + Math.sin(i * 1.2) * 6;
      g.circle(fx, fy, 5 + (i % 4) * 2.5);
      g.fill({ color: 0xFFFFFF, alpha: 0.09 });
    }
    g.moveTo(w*0.08, swY + 2);
    g.bezierCurveTo(w*0.3, swY - 6, w*0.55, swY + 4, w*0.82, swY - 2);
    g.stroke({ color: 0xFFFFFF, width: 2.5, alpha: 0.22 });

    // Marcas na areia (conchas / pegadas)
    const shellOf = [0.15, 0.28, 0.45, 0.62, 0.76, 0.88];
    for (const fx of shellOf) {
      const sx = w * fx;
      const sy = bY + (h - bY) * 0.3 + Math.sin(fx * 8) * 18;
      g.circle(sx, sy, 2.5);
      g.fill({ color: 0xEED090, alpha: 0.5 });
      g.circle(sx + 8, sy + 5, 1.8);
      g.fill({ color: 0xEED090, alpha: 0.4 });
    }
  }

  // =========================================================
  // MONTANHA SUPERIOR DIREITA
  // =========================================================
  private _mountain(g: Graphics, w: number, h: number): void {
    const mx  = w * 0.62;   // borda esquerda da montanha
    const peakX = w * 0.82; // pico X
    const peakY = 28;       // pico Y

    // Massa principal
    g.moveTo(mx, h * 0.56);
    g.bezierCurveTo(mx - 60, h * 0.36, mx + 40, 110, peakX - 30, peakY + 28);
    g.bezierCurveTo(peakX - 10, peakY + 8, peakX + 10, peakY + 8, peakX + 30, peakY + 28);
    g.bezierCurveTo(w - 10, 100, w, h * 0.30, w, h * 0.50);
    g.lineTo(w, h * 0.56);
    g.closePath();
    g.fill(C.mountain);

    // Face dianteira iluminada
    g.moveTo(mx + 30, h * 0.56);
    g.bezierCurveTo(mx + 10, h * 0.40, mx + 70, h * 0.20, peakX, peakY + 35);
    g.bezierCurveTo(peakX + 28, h * 0.18, w - 30, h * 0.28, w - 20, h * 0.48);
    g.lineTo(w, h * 0.56);
    g.closePath();
    g.fill(C.mountainLt);

    // Face sombra esquerda
    g.moveTo(mx, h * 0.56);
    g.bezierCurveTo(mx + 5, h * 0.44, mx + 25, h * 0.30, mx + 55, h * 0.22);
    g.bezierCurveTo(mx + 35, h * 0.25, mx + 20, h * 0.36, mx + 8, h * 0.56);
    g.closePath();
    g.fill({ color: C.mountainDk, alpha: 0.55 });

    // Calhas/estrias de pedra
    for (let i = 0; i < 7; i++) {
      const lx = mx + 35 + i * 55;
      const ly = h * 0.30 + i * 20;
      g.moveTo(lx, ly);
      g.bezierCurveTo(lx + 15, ly - 18, lx + 40, ly + 12, lx + 70, ly - 8);
      g.stroke({ color: C.stoneDark, width: 1.5, alpha: 0.22 + i * 0.04 });
    }

    // Neve no pico
    g.moveTo(peakX - 55, peakY + 78);
    g.bezierCurveTo(peakX - 30, peakY + 28, peakX - 12, peakY + 5, peakX, peakY);
    g.bezierCurveTo(peakX + 12, peakY + 5, peakX + 32, peakY + 28, peakX + 55, peakY + 78);
    g.closePath();
    g.fill({ color: C.snowCap, alpha: 0.88 });
    // Brilho nevado
    g.moveTo(peakX - 18, peakY + 55);
    g.bezierCurveTo(peakX - 8, peakY + 22, peakX + 2, peakY + 10, peakX + 8, peakY + 16);
    g.stroke({ color: 0xFFFFFF, width: 2.5, alpha: 0.55 });
    // Sombra lateral neve
    g.moveTo(peakX + 30, peakY + 65);
    g.bezierCurveTo(peakX + 20, peakY + 45, peakX + 10, peakY + 35, peakX + 4, peakY + 5);
    g.stroke({ color: shd(C.snowCap, 30), width: 2, alpha: 0.35 });

    // Caminho para colher pedra (zigue-zague na face da montanha)
    this._mountainPath(g, mx, peakX, h);

    // Pedregulhos na base
    this._mountainBaseRocks(g, mx, h);
  }

  private _mountainPath(g: Graphics, mx: number, _peakX: number, h: number): void {
    // Trilha de terra batida subindo a montanha
    const p0x = mx - 15, p0y = h * 0.575;
    const p1x = mx + 50, p1y = h * 0.42;
    const p2x = mx + 95, p2y = h * 0.30;

    // Borda esquerda do caminho
    g.moveTo(p0x - 10, p0y);
    g.bezierCurveTo(p0x - 5, h * 0.51, p1x - 10, h * 0.46, p1x - 10, p1y);
    g.bezierCurveTo(p1x - 8, h * 0.38, p2x - 10, h * 0.32, p2x - 8, p2y);
    // Borda direita
    g.lineTo(p2x + 8, p2y);
    g.bezierCurveTo(p2x + 10, h * 0.32, p1x + 12, h * 0.38, p1x + 10, p1y);
    g.bezierCurveTo(p1x + 8, h * 0.46, p0x + 12, h * 0.51, p0x + 10, p0y);
    g.closePath();
    g.fill(C.dirtPath);

    // Degraus de pedra no caminho
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const sx = p0x + (p2x - p0x) * t;
      const sy = p0y + (p2y - p0y) * t;
      g.moveTo(sx - 9, sy);
      g.lineTo(sx + 9, sy);
      g.stroke({ color: C.dirtDark, width: 1.8, alpha: 0.35 });
    }

    // Rochas laterais do caminho
    const rPos = [[p1x - 20, p1y - 12], [p1x + 22, p1y - 8], [p0x + 5, p0y - 18]];
    for (const [rx, ry] of rPos) {
      g.moveTo(rx - 8, ry + 5);
      g.bezierCurveTo(rx - 9, ry - 3, rx - 3, ry - 8, rx + 4, ry - 6);
      g.bezierCurveTo(rx + 9, ry - 4, rx + 9, ry + 4, rx + 7, ry + 5);
      g.closePath();
      g.fill(C.stone);
      g.ellipse(rx - 1, ry - 4, 4, 2);
      g.fill({ color: C.stoneLight, alpha: 0.6 });
    }
  }

  private _mountainBaseRocks(g: Graphics, mx: number, h: number): void {
    const baseY = h * 0.56;
    const positions: [number, number, number][] = [
      [mx - 50, baseY - 8,  12],
      [mx - 22, baseY - 4,   9],
      [mx + 15, baseY - 10, 14],
      [mx + 55, baseY + 2,   8],
      [mx - 75, baseY - 2,  10],
    ];
    for (const [px, py, rs] of positions) {
      // Sombra
      g.ellipse(px + 2, py + rs * 0.55, rs * 1.1, rs * 0.38);
      g.fill({ color: 0x000000, alpha: 0.22 });
      // Volume da pedra
      g.moveTo(px - rs, py + rs * 0.4);
      g.bezierCurveTo(px - rs * 1.1, py - rs * 0.3, px - rs * 0.3, py - rs, px + rs * 0.2, py - rs * 0.9);
      g.bezierCurveTo(px + rs * 0.9, py - rs * 0.7, px + rs * 1.1, py, px + rs, py + rs * 0.4);
      g.closePath();
      g.fill(C.stone);
      // Face superior (mais clara)
      g.moveTo(px - rs * 0.5, py - rs * 0.6);
      g.bezierCurveTo(px, py - rs * 1.05, px + rs * 0.5, py - rs * 0.75, px + rs * 0.7, py - rs * 0.35);
      g.bezierCurveTo(px + rs * 0.1, py - rs * 0.2, px - rs * 0.4, py - rs * 0.3, px - rs * 0.5, py - rs * 0.6);
      g.closePath();
      g.fill({ color: C.stoneLight, alpha: 0.72 });
      // Rachadura decorativa
      g.moveTo(px - rs * 0.1, py - rs * 0.7);
      g.lineTo(px + rs * 0.3, py + rs * 0.1);
      g.stroke({ color: C.stoneDark, width: 1.0, alpha: 0.45 });
    }
  }

  // =========================================================
  // CACHOEIRA
  // =========================================================
  private _waterfall(g: Graphics, w: number, h: number): void {
    const wx  = w * 0.635; // posicao X do fluxo
    const wyT = h * 0.26;  // topo
    const wyB = h * 0.545; // base (piscina)

    // Canal de agua descendo
    g.moveTo(wx - 6, wyT);
    g.bezierCurveTo(wx - 9, h * 0.38, wx - 4, h * 0.46, wx - 7, wyB);
    g.lineTo(wx + 7,  wyB);
    g.bezierCurveTo(wx + 6, h * 0.46, wx + 11, h * 0.38, wx + 8, wyT);
    g.closePath();
    g.fill({ color: C.water, alpha: 0.9 });

    // Highlight central (brilho fluente)
    g.moveTo(wx - 1, wyT + 15);
    g.bezierCurveTo(wx + 0, h * 0.37, wx - 2, h * 0.45, wx - 1, wyB - 15);
    g.stroke({ color: C.waterLight, width: 2.5, alpha: 0.65 });
    g.moveTo(wx - 3, wyT + 30);
    g.bezierCurveTo(wx - 2, h * 0.40, wx - 3, h * 0.47, wx - 2, wyB - 25);
    g.stroke({ color: 0xFFFFFF, width: 1.0, alpha: 0.3 });

    // Piscina na base (nebulo/mist)
    g.ellipse(wx, wyB + 10, 36, 14);
    g.fill({ color: C.water, alpha: 0.45 });
    g.ellipse(wx, wyB + 12, 55, 20);
    g.fill({ color: C.waterLight, alpha: 0.18 });

    // Espuma de impacto
    for (let i = -4; i <= 4; i++) {
      g.circle(wx + i * 7, wyB + 6 + Math.abs(i) * 1.5, 3.5 + Math.abs(i) * 0.8);
      g.fill({ color: 0xFFFFFF, alpha: Math.max(0.05, 0.22 - Math.abs(i) * 0.04) });
    }

    // Pedras na beira da piscina
    const poolRocks: [number,number][] = [[-38, wyB+8],[-22,wyB+16],[28,wyB+10],[40,wyB+18]];
    for (const [ox, oy] of poolRocks) {
      g.moveTo(wx+ox-7, oy+4);
      g.bezierCurveTo(wx+ox-8, oy-4, wx+ox-2, oy-8, wx+ox+4, oy-6);
      g.bezierCurveTo(wx+ox+8, oy-4, wx+ox+7, oy+3, wx+ox+6, oy+4);
      g.closePath();
      g.fill(C.stone);
      g.ellipse(wx+ox, oy-3, 4, 2);
      g.fill({ color: C.stoneLight, alpha: 0.5 });
    }
  }

  // =========================================================
  // CAMINHOS DE TERRA
  // =========================================================
  private _paths(g: Graphics, w: number, h: number): void {
    const bY  = h * 0.74;   // onde a estrada encontra a praia
    const cX  = w * 0.44;   // centro X da aldeia
    const vY  = h * 0.45;   // centro Y da aldeia

    // ---- Estrada principal (praia -> aldeia) ----
    // Borda esquerda
    g.moveTo(cX - 16, bY);
    g.bezierCurveTo(cX - 20, h * 0.63, cX + 8, h * 0.56, cX + 4, vY + 20);
    // Borda direita
    g.lineTo(cX + 20, vY + 20);
    g.bezierCurveTo(cX + 22, h * 0.56, cX + 10, h * 0.63, cX + 14, bY);
    g.closePath();
    g.fill(C.dirtPath);

    // Orlagem da estrada (mais escura)
    g.moveTo(cX - 16, bY);
    g.bezierCurveTo(cX - 20, h * 0.63, cX + 8, h * 0.56, cX + 4, vY + 20);
    g.stroke({ color: C.dirtDark, width: 2, alpha: 0.5 });
    g.moveTo(cX + 14, bY);
    g.bezierCurveTo(cX + 22, h * 0.56, cX + 10, h * 0.63, cX + 20, vY + 20);
    g.stroke({ color: C.dirtDark, width: 2, alpha: 0.5 });

    // Rodeiras (trilhas de carrocas)
    g.moveTo(cX - 5, bY - 5);
    g.bezierCurveTo(cX - 4, h * 0.62, cX + 14, h * 0.57, cX + 11, vY + 22);
    g.stroke({ color: C.dirtDark, width: 1.2, alpha: 0.32 });
    g.moveTo(cX + 3, bY - 5);
    g.bezierCurveTo(cX + 6, h * 0.62, cX + 18, h * 0.57, cX + 17, vY + 22);
    g.stroke({ color: C.dirtDark, width: 1.2, alpha: 0.28 });

    // ---- Caminho transversal (mercado) ----
    const mY = h * 0.44;
    g.moveTo(w * 0.12, mY - 14);
    g.bezierCurveTo(w*0.26, mY - 22, w*0.38, mY - 8, w*0.52, mY - 12);
    g.bezierCurveTo(w*0.64, mY - 18, w*0.74, mY - 4, w*0.82, mY - 14);
    g.lineTo(w*0.82, mY + 14);
    g.bezierCurveTo(w*0.74, mY + 4, w*0.64, mY + 18, w*0.52, mY + 12);
    g.bezierCurveTo(w*0.38, mY + 8, w*0.26, mY + 22, w*0.12, mY + 14);
    g.closePath();
    g.fill(C.dirtPath);

    // Pedras embutidas nos caminhos
    const stoneSpots: [number, number][] = [
      [cX + 0, vY + 50],
      [cX + 8, vY + 90],
      [cX + 3, vY + 130],
      [w*0.32, mY + 2],
      [w*0.55, mY - 5],
    ];
    for (const [sx, sy] of stoneSpots) {
      g.roundRect(sx - 6, sy - 3, 12, 6, 2);
      g.fill({ color: C.stone, alpha: 0.45 });
    }
  }

  // =========================================================
  // PRACA DA ALDEIA + POCO
  // =========================================================
  private _villageSquare(g: Graphics, w: number, h: number): void {
    const cx = w * 0.43;
    const cy = h * 0.43;

    // Clearing mais clara
    g.ellipse(cx, cy, 240, 160);
    g.fill({ color: C.grassMid, alpha: 0.22 });

    // Calcamento central de pedra (circulo empedrado)
    g.circle(cx, cy - 18, 48);
    g.fill({ color: lgt(C.stone, 10), alpha: 0.55 });
    // Juntas das pedras (padrao radial)
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      g.moveTo(cx, cy - 18);
      g.lineTo(cx + Math.cos(a) * 46, cy - 18 + Math.sin(a) * 46);
      g.stroke({ color: C.stoneDark, width: 1, alpha: 0.3 });
    }
    for (let r = 16; r <= 44; r += 14) {
      g.circle(cx, cy - 18, r);
      g.stroke({ color: C.stoneDark, width: 1, alpha: 0.22 });
    }

    // Poco (borda de pedra)
    g.circle(cx, cy - 18, 16);
    g.fill(shd(C.stone, 15));
    g.circle(cx, cy - 18, 12);
    g.fill(0x162233);
    g.ellipse(cx + 2, cy - 14, 8, 5);
    g.fill({ color: C.water, alpha: 0.65 });
    // Borda do poco (pedras talhadas)
    g.circle(cx, cy - 18, 16);
    g.stroke({ color: C.stoneLight, width: 2.5, alpha: 0.7 });
    // Madeira transversal do poco
    g.moveTo(cx - 16, cy - 22);
    g.lineTo(cx + 16, cy - 22);
    g.stroke({ color: C.wood, width: 4 });
    g.circle(cx, cy - 22, 2.5);
    g.fill(C.woodDark);

    // Postes de entrada do vilarejo (2 postes com chama)
    for (const px of [cx - 90, cx + 90]) {
      // Poste
      g.roundRect(px - 4, cy - 60, 8, 50, 2);
      g.fill(C.wood);
      // Tocha topo
      g.roundRect(px - 5, cy - 68, 10, 10, 3);
      g.fill(C.woodDark);
      // Chama (glow)
      g.circle(px, cy - 72, 10);
      g.fill({ color: 0xFF8800, alpha: 0.18 });
      g.circle(px, cy - 72, 6);
      g.fill({ color: 0xFFAA44, alpha: 0.3 });
      g.circle(px, cy - 73, 3);
      g.fill({ color: 0xFFDD88, alpha: 0.65 });
    }
  }

  // =========================================================
  // NAUFRAGIO
  // =========================================================
  private _shipwreck(g: Graphics, w: number, h: number): void {
    const wx = w * 0.28;
    const wy = h * 0.895;

    // Sombra sob o casco
    g.ellipse(wx + 5, wy + 18, 65, 14);
    g.fill({ color: 0x000000, alpha: 0.28 });

    // Casco principal (meio enterrado na areia)
    g.moveTo(wx - 55, wy + 14);
    g.bezierCurveTo(wx - 68, wy - 8, wx - 52, wy - 38, wx - 5, wy - 42);
    g.bezierCurveTo(wx + 38, wy - 44, wx + 60, wy - 12, wx + 52, wy + 14);
    g.closePath();
    g.fill(C.wood);

    // Interior do casco (cavidade escura)
    g.moveTo(wx - 40, wy + 14);
    g.bezierCurveTo(wx - 52, wy, wx - 40, wy - 22, wx - 5, wy - 26);
    g.bezierCurveTo(wx + 28, wy - 28, wx + 42, wy - 5, wx + 38, wy + 14);
    g.closePath();
    g.fill({ color: 0x1A0E05, alpha: 0.88 });

    // Pranchamento do casco (linhas horizontais)
    for (let i = -3; i <= 4; i++) {
      const lx = wx + i * 12;
      g.moveTo(lx - 2, wy - 38);
      g.lineTo(lx - 4, wy + 14);
      g.stroke({ color: C.woodDark, width: 1.2, alpha: 0.4 });
    }
    // Reforcos laterais do casco
    g.moveTo(wx - 55, wy + 14);
    g.bezierCurveTo(wx - 68, wy - 8, wx - 52, wy - 38, wx - 5, wy - 42);
    g.stroke({ color: shd(C.wood, 25), width: 2.5, alpha: 0.55 });

    // Mastro quebrado
    g.moveTo(wx - 12, wy - 40);
    g.lineTo(wx - 20, wy - 108);
    g.stroke({ color: C.woodDark, width: 6 });
    // Mastro inclinado (secao inferior)
    g.moveTo(wx - 20, wy - 108);
    g.lineTo(wx - 30, wy - 82);
    g.stroke({ color: C.woodDark, width: 4, alpha: 0.7 });
    // Prego/noze
    g.circle(wx - 20, wy - 108, 4);
    g.fill(0x3A3020);

    // Vela rasgada
    g.moveTo(wx - 20, wy - 108);
    g.bezierCurveTo(wx + 18, wy - 98, wx + 34, wy - 72, wx + 22, wy - 60);
    g.lineTo(wx - 16, wy - 62);
    g.closePath();
    g.fill({ color: 0xCCBB99, alpha: 0.52 });
    // Detalhe costura da vela
    g.moveTo(wx - 14, wy - 62);
    g.lineTo(wx + 20, wy - 60);
    g.stroke({ color: 0xBBAA88, width: 1.2, alpha: 0.4 });
    // Rasgoes na vela
    g.moveTo(wx + 22, wy - 60);
    g.lineTo(wx + 38, wy - 78);
    g.stroke({ color: 0xBBAA88, width: 1.5, alpha: 0.35 });
    g.moveTo(wx + 12, wy - 58);
    g.lineTo(wx + 26, wy - 76);
    g.stroke({ color: 0xBBAA88, width: 1, alpha: 0.25 });

    // Cordas penduradas
    g.moveTo(wx - 18, wy - 100);
    g.bezierCurveTo(wx - 5, wy - 88, wx + 14, wy - 64, wx + 5, wy - 48);
    g.stroke({ color: 0x8A6840, width: 1.8, alpha: 0.58 });
    g.moveTo(wx - 16, wy - 95);
    g.bezierCurveTo(wx - 8, wy - 78, wx + 2, wy - 52, wx - 4, wy - 42);
    g.stroke({ color: 0x7A5830, width: 1.2, alpha: 0.45 });

    // Areia empilhada ao redor do casco
    g.moveTo(wx - 68, wy + 14);
    g.bezierCurveTo(wx - 48, wy + 30, wx + 42, wy + 30, wx + 60, wy + 14);
    g.lineTo(wx + 60, wy + 24);
    g.bezierCurveTo(wx + 42, wy + 36, wx - 48, wy + 36, wx - 68, wy + 24);
    g.closePath();
    g.fill({ color: lgt(C.sand, 12), alpha: 0.75 });

    // Algas/cracas no casco
    const algae: [number, number][] = [
      [wx - 40, wy - 6], [wx - 20, wy - 2],
      [wx + 10, wy - 8], [wx + 28, wy - 4],
    ];
    for (const [ax, ay] of algae) {
      g.circle(ax, ay, 3.5);
      g.fill({ color: 0x3D6624, alpha: 0.65 });
    }
  }

  // =========================================================
  // PEDRAS ESPALHADAS (decorativas no mapa)
  // =========================================================
  private _scatterRocks(g: Graphics, w: number, h: number): void {
    const grassH = h * 0.72;
    let r = 445566;
    const rng = () => { r=(r*1103515245+12345)&0x7FFFFFFF; return r/0x7FFFFFFF; };

    for (let i = 0; i < 35; i++) {
      const px = rng() * w;
      const py = rng() * grassH;
      // evitar area central da aldeia e montanha
      if (px > w * 0.30 && px < w * 0.62 && py > h * 0.32 && py < h * 0.58) continue;
      if (px > w * 0.60 && py < h * 0.60) continue;
      const rs = 3 + rng() * 7;
      g.ellipse(px + 2, py + rs * 0.5, rs * 1.1, rs * 0.4);
      g.fill({ color: 0x000000, alpha: 0.15 });
      g.moveTo(px - rs, py + rs * 0.35);
      g.bezierCurveTo(px - rs * 1.05, py - rs * 0.22, px - rs * 0.28, py - rs, px + rs * 0.18, py - rs * 0.88);
      g.bezierCurveTo(px + rs * 0.88, py - rs * 0.65, px + rs, py, px + rs, py + rs * 0.35);
      g.closePath();
      g.fill(C.stone);
      g.ellipse(px - rs * 0.1, py - rs * 0.45, rs * 0.55, rs * 0.32);
      g.fill({ color: C.stoneLight, alpha: 0.52 });
    }
  }

  // =========================================================
  // DETALHES DE GRAMA ALTA + FLORES
  // =========================================================
  private _grassDetails(g: Graphics, w: number, h: number): void {
    const grassH = h * 0.72;
    let r = 778899;
    const rng = () => { r=(r*1103515245+12345)&0x7FFFFFFF; return r/0x7FFFFFFF; };
    const flowerColors = [0xFFDD44, 0xFF8888, 0xDD88FF, 0x88CCFF, 0xFF9944];

    for (let i = 0; i < 90; i++) {
      const px = rng() * w;
      const py = rng() * grassH;
      if (py > grassH * 0.92) continue;
      // evitar caminhos e montanha (aproximado)
      if (px > w * 0.59) continue;

      if (rng() > 0.55) {
        // Tufo de grama
        for (let b = 0; b < 3; b++) {
          const bx = px + (rng() - 0.5) * 8;
          const blen = 5 + rng() * 8;
          const lean = (rng() - 0.5) * 5;
          g.moveTo(bx, py);
          g.lineTo(bx + lean, py - blen);
          g.stroke({ color: C.grassLight, width: 1.2, alpha: 0.25 });
        }
      } else {
        // Flor
        const fc = flowerColors[Math.floor(rng() * flowerColors.length)];
        g.circle(px, py, 2.2);
        g.fill({ color: fc, alpha: 0.55 });
        g.circle(px, py, 1.0);
        g.fill({ color: 0xFFFFDD, alpha: 0.5 });
      }
    }
  }

  // =========================================================
  // TENDAS MEDIEVAIS DOS AMBULANTES (3D isometrico)
  // Posicoes espelham os NPCs do jogo (worldW=1600, worldH=1280)
  // =========================================================
  private _vendorTents(g: Graphics, _w: number, _h: number): void {

    // ---- Anna — Mercadora (tenda vermelha/ocre) ----
    this._drawMerchantStall(g, 750, 600, 0xA03010, 0xCC4422, 0xF0C060, 'merchant');

    // ---- Drake — Ferreiro (bancada de pedra/metal) ----
    this._drawBlacksmithStall(g, 680, 700);

    // ---- Capitao Rael — Posto de guarda (arco de pedra) ----
    this._drawGuardPost(g, 865, 615);
  }

  /** Tenda de mercador: madeira + toldo de pano, mercadorias na mesa */
  private _drawMerchantStall(
    g: Graphics, cx: number, cy: number,
    awningDk: number, awningLt: number, accent: number,
    _type: string,
  ): void {
    const sW = 78;   // largura
    const sD = 40;   // profundidade (ilusao 3D)

    // Sombra no chao
    g.ellipse(cx + 6, cy + 46, sW * 0.62, 14);
    g.fill({ color: 0x000000, alpha: 0.22 });

    // ---- Base da bancada: 3 faces (isometrico) ----
    const tY = cy + 10;  // Y do topo da bancada
    const bH = 22;       // altura da bancada

    // Face frontal
    g.moveTo(cx - sW/2, tY + bH);
    g.lineTo(cx - sW/2, tY);
    g.lineTo(cx + sW/2, tY);
    g.lineTo(cx + sW/2, tY + bH);
    g.closePath();
    g.fill(0x5A3A18);
    // Face superior (topo da bancada)
    g.moveTo(cx - sW/2, tY);
    g.bezierCurveTo(cx - sW/2 + 8, tY - sD * 0.5, cx + sW/2 + 8, tY - sD * 0.5, cx + sW/2, tY);
    g.lineTo(cx - sW/2, tY);
    g.fill(lgt(0x5A3A18, 22));
    // Face lateral direita
    g.moveTo(cx + sW/2, tY);
    g.bezierCurveTo(cx + sW/2 + 8, tY - sD * 0.5, cx + sW/2 + 10, tY - sD * 0.5 + bH, cx + sW/2, tY + bH);
    g.fill(shd(0x5A3A18, 15));
    // Listras de madeira
    for (let i = 0; i < 4; i++) {
      const lx = cx - sW/2 + 8 + i * (sW - 16) / 3;
      g.moveTo(lx, tY); g.lineTo(lx, tY + bH);
      g.stroke({ color: shd(0x5A3A18, 30), width: 1, alpha: 0.4 });
    }

    // ---- Toldo (awning) ---- 3 faces
    const aY  = cy - 38;  // Y base do toldo (frente)
    const aHt = 18;       // altura do toldo
    const overH = 14;     // quanto avanca pra frente

    // Face frontal do toldo (inclinado, mais baixo na frente)
    g.moveTo(cx - sW/2 - 8, aY);
    g.lineTo(cx - sW/2 - 8, aY + aHt);
    g.lineTo(cx + sW/2 + 8, aY + aHt);
    g.lineTo(cx + sW/2 + 8, aY);
    g.fill(awningDk);
    // Franja do toldo (beira dentilhada)
    for (let fi = 0; fi <= 10; fi++) {
      const fx = cx - sW/2 - 8 + fi * (sW + 16) / 10;
      g.moveTo(fx, aY + aHt);
      g.lineTo(fx + (sW + 16) / 20, aY + aHt + overH);
      g.lineTo(fx + (sW + 16) / 10, aY + aHt);
      g.fill(awningLt);
    }
    // Listras decorativas no toldo
    for (let si = 0; si < 5; si++) {
      const sx = cx - sW/2 + si * sW / 4;
      g.moveTo(sx, aY); g.lineTo(sx, aY + aHt);
      g.stroke({ color: accent, width: 2.5, alpha: 0.3 });
    }
    // Topo do toldo (face superior)
    g.moveTo(cx - sW/2 - 8, aY);
    g.bezierCurveTo(cx - sW/2, aY - sD * 0.45, cx + sW/2, aY - sD * 0.45, cx + sW/2 + 8, aY);
    g.lineTo(cx - sW/2 - 8, aY);
    g.fill(lgt(awningDk, 20));

    // ---- Postes de sustentacao ----
    for (const px of [cx - sW/2 + 5, cx + sW/2 - 5]) {
      g.roundRect(px - 4, aY - 2, 8, aY - tY + 50, 2);
      g.fill(C.wood);
      g.roundRect(px - 3, aY - 2, 3, aY - tY + 50, 1);
      g.fill({ color: lgt(C.wood, 20), alpha: 0.5 });
      // base do poste (pedra)
      g.ellipse(px, tY - 2, 7, 4);
      g.fill(C.stone);
    }

    // ---- Mercadorias na bancada ----
    // Varios itens coloridos sobre o balcao
    const goods: [number, number, number, number][] = [
      [cx - 26, tY - 8,  7, 0xCC4444],  // pocao vermelha
      [cx - 10, tY - 10, 8, 0x4488CC],  // pocao azul
      [cx +  4, tY - 7,  6, 0xCCAA22],  // bolsa dourada
      [cx + 18, tY - 9,  5, 0x882255],  // frasco roxo
    ];
    for (const [gx, gy, gr, gc] of goods) {
      // Sombra do item
      g.ellipse(gx + 1, gy + gr + 2, gr * 0.9, gr * 0.3);
      g.fill({ color: 0x000000, alpha: 0.2 });
      // Item (bolota/frasco)
      g.circle(gx, gy, gr);
      g.fill(gc);
      // Tampa/rolha
      g.roundRect(gx - 2, gy - gr - 3, 4, 4, 1);
      g.fill(shd(gc, 40));
      // Reflexo
      g.circle(gx - gr * 0.35, gy - gr * 0.35, gr * 0.3);
      g.fill({ color: 0xFFFFFF, alpha: 0.28 });
    }

    // Estandarte com nome (tecido pendurado)
    g.moveTo(cx - 22, aY - 1);
    g.lineTo(cx - 22, aY + 28);
    g.lineTo(cx + 22, aY + 28);
    g.lineTo(cx + 22, aY - 1);
    g.fill({ color: awningLt, alpha: 0.88 });
    g.moveTo(cx - 22, aY - 1); g.lineTo(cx + 22, aY - 1);
    g.stroke({ color: accent, width: 2 });
    g.moveTo(cx - 22, aY + 28); g.lineTo(cx + 22, aY + 28);
    g.stroke({ color: accent, width: 2 });
  }

  /** Bancada do ferreiro: pedra pesada + metal, bigorna simbolica */
  private _drawBlacksmithStall(g: Graphics, cx: number, cy: number): void {
    const sW = 70;
    const sD = 36;

    // Sombra
    g.ellipse(cx + 5, cy + 44, sW * 0.6, 13);
    g.fill({ color: 0x000000, alpha: 0.28 });

    // Parede de pedra atras (fundo da tenda)
    const wY = cy - 30;
    g.moveTo(cx - sW/2 + 8, wY);
    g.bezierCurveTo(cx - sW/2, wY - sD * 0.4, cx + sW/2, wY - sD * 0.4, cx + sW/2 - 8, wY);
    g.lineTo(cx + sW/2 - 8, wY + 55);
    g.lineTo(cx - sW/2 + 8, wY + 55);
    g.closePath();
    g.fill(0x6E6058);
    // Tijolos de pedra
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const bx = cx - sW/2 + 12 + col * (sW - 20) / 4;
        const by = wY + 5 + row * 12;
        g.roundRect(bx - 6, by - 4, 13, 9, 1.5);
        g.stroke({ color: shd(0x6E6058, 20), width: 0.8, alpha: 0.4 });
      }
    }

    // Telhado de madeira (3 faces)
    const rY = wY - 18;
    // Frente
    g.moveTo(cx - sW/2 - 5, rY + 18);
    g.lineTo(cx - sW/2, rY);
    g.lineTo(cx + sW/2, rY);
    g.lineTo(cx + sW/2 + 5, rY + 18);
    g.fill(0x4A3010);
    // Superior
    g.moveTo(cx - sW/2, rY);
    g.bezierCurveTo(cx - sW/2 + 8, rY - sD * 0.4, cx + sW/2 + 8, rY - sD * 0.4, cx + sW/2, rY);
    g.lineTo(cx - sW/2, rY);
    g.fill(lgt(0x4A3010, 18));
    // Vigas do telhado
    for (let vi = -1; vi <= 1; vi++) {
      const vx = cx + vi * sW / 3;
      g.moveTo(vx - 3, rY); g.lineTo(vx - 2.5, rY + 18);
      g.stroke({ color: shd(0x4A3010, 22), width: 3, alpha: 0.55 });
    }

    // Bancada de trabalho (pedra pesada)
    const tY = cy + 10;
    const bH = 20;
    g.moveTo(cx - sW/2, tY + bH);
    g.lineTo(cx - sW/2, tY);
    g.lineTo(cx + sW/2, tY);
    g.lineTo(cx + sW/2, tY + bH);
    g.fill(0x8A8070);
    // Topo
    g.moveTo(cx - sW/2, tY);
    g.bezierCurveTo(cx - sW/2 + 8, tY - sD * 0.4, cx + sW/2 + 8, tY - sD * 0.4, cx + sW/2, tY);
    g.lineTo(cx - sW/2, tY);
    g.fill(lgt(0x8A8070, 18));

    // Bigorna simbolica
    const anX = cx + 12, anY = tY - 6;
    g.moveTo(anX - 14, anY + 14); g.lineTo(anX - 10, anY + 14);
    g.lineTo(anX - 8, anY); g.lineTo(anX + 8, anY);
    g.lineTo(anX + 10, anY + 14); g.lineTo(anX + 14, anY + 14);
    g.lineTo(anX + 16, anY + 10); g.lineTo(anX - 16, anY + 10);
    g.closePath(); g.fill(0x484850);
    g.ellipse(anX, anY + 2, 8, 3); g.fill(lgt(0x484850, 20));
    // Martelo
    const mX = cx - 20, mY = tY - 4;
    g.roundRect(mX - 3, mY - 12, 6, 14, 1); g.fill(C.woodDark);
    g.roundRect(mX - 8, mY - 20, 16, 9, 2); g.fill(0x707078);
    g.ellipse(mX - 4, mY - 18, 5, 2.5); g.fill(lgt(0x707078, 22));

    // Chamas da forja (fundo)
    const fX = cx - sW/2 + 18, fY = wY + 32;
    g.circle(fX, fY, 12); g.fill({ color: 0xFF6600, alpha: 0.18 });
    g.circle(fX, fY, 7);  g.fill({ color: 0xFF9900, alpha: 0.28 });
    g.circle(fX, fY - 2, 4); g.fill({ color: 0xFFCC44, alpha: 0.45 });
  }

  /** Posto do guarda: arco de pedra com tocha */
  private _drawGuardPost(g: Graphics, cx: number, cy: number): void {

    // Sombra
    g.ellipse(cx, cy + 50, 44, 12); g.fill({ color: 0x000000, alpha: 0.22 });

    // Dois pilares de pedra
    for (const px of [cx - 28, cx + 28]) {
      // Base do pilar
      g.roundRect(px - 9, cy + 10, 18, 40, 2); g.fill(0x7A7060);
      // Detalhe de silharia
      for (let row = 0; row < 4; row++) {
        g.roundRect(px - 8, cy + 12 + row * 10, 16, 8, 1);
        g.stroke({ color: shd(0x7A7060, 20), width: 0.8, alpha: 0.4 });
      }
      // Capitel
      g.roundRect(px - 11, cy + 7, 22, 6, 3); g.fill(lgt(0x7A7060, 12));
      g.ellipse(px, cy + 7, 12, 4); g.fill(lgt(0x7A7060, 22));
      // Tocha no topo do pilar
      g.roundRect(px - 3, cy - 10, 6, 20, 2); g.fill(C.wood);
      g.roundRect(px - 4, cy - 14, 8, 8, 2);  g.fill(C.woodDark);
      // Chama
      g.circle(px, cy - 18, 9); g.fill({ color: 0xFF8800, alpha: 0.18 });
      g.circle(px, cy - 18, 5); g.fill({ color: 0xFFAA44, alpha: 0.32 });
      g.circle(px, cy - 20, 3); g.fill({ color: 0xFFEE88, alpha: 0.65 });
      // aurea da chama
      g.circle(px, cy - 18, 16); g.fill({ color: 0xFF8800, alpha: 0.08 });
    }

    // Arco de pedra ligando os pilares (perspectiva isometrica)
    const archY = cy + 8;
    g.moveTo(cx - 28 + 9, archY);
    g.bezierCurveTo(cx - 28, archY - 40, cx + 28, archY - 40, cx + 28 - 9, archY);
    g.stroke({ color: 0x6A6250, width: 10 });
    // Aresta superior do arco
    g.moveTo(cx - 28 + 10, archY);
    g.bezierCurveTo(cx - 26, archY - 38, cx + 26, archY - 38, cx + 28 - 10, archY);
    g.stroke({ color: lgt(0x6A6250, 18), width: 2.5, alpha: 0.5 });
    // Pedras do arco (juntas)
    for (let ai = 0; ai <= 5; ai++) {
      const t = ai / 5;
      const ax = cx + (Math.cos(Math.PI - t * Math.PI) * 28);
      const ay = archY - 40 + Math.sin(t * Math.PI) * 40 - 4;
      g.circle(ax, ay, 1.5); g.fill({ color: shd(0x6A6250, 20), alpha: 0.55 });
    }

    // Placa do posto (madeira)
    g.roundRect(cx - 24, archY - 48, 48, 16, 3); g.fill(C.woodDark);
    g.roundRect(cx - 22, archY - 46, 44, 12, 2);
    g.stroke({ color: lgt(C.woodDark, 20), width: 1, alpha: 0.5 });
  }
}
