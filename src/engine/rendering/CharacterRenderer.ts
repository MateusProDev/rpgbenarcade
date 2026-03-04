// ============================================
// Character Renderer â€” corpo humano detalhado
// Roupas simples de inÃ­cio + visual evolui com equipamentos
// ProporÃ§Ãµes realistas: cabeÃ§a, pescoÃ§o, tronco, braÃ§os articulados,
// pernas com joelho e tornozelo, rosto com traÃ§os humanos
// ============================================
import { Graphics } from 'pixi.js';
import type { PlayerClass, Direction, ItemRarity } from '@/store/types';

/* ---- Equipamentos visuais passados ao renderer ---- */
export interface EquipmentVisuals {
  armorRarity?: ItemRarity;
  helmetRarity?: ItemRarity;
  bootsRarity?: ItemRarity;
  weaponRarity?: ItemRarity;
  weaponName?: string;
  armorName?: string;
  helmetName?: string;
}

/* ---- Tier numÃ©rico por raridade (0 = sem item) ---- */
function tier(r?: ItemRarity): number {
  switch (r) {
    case 'common':    return 1;
    case 'uncommon':  return 2;
    case 'rare':      return 3;
    case 'epic':      return 4;
    case 'legendary': return 5;
    default:          return 0;
  }
}

/* ---- Paleta por classe ---- */
export const CLASS_PALETTE: Record<PlayerClass, {
  primary: number; secondary: number; accent: number;
  skin: number; hair: number; weapon: number; cape: number;
  cloth: number; pants: number;
}> = {
  warrior: {
    primary: 0x8B2222, secondary: 0xA63333, accent: 0xD4A444,
    skin: 0xF0C89A,   hair: 0x5C3A1E, weapon: 0xBBBBCC, cape: 0x6B1111,
    cloth: 0xD4C8A0,  pants: 0x7A5C3A,
  },
  mage: {
    primary: 0x2244AA, secondary: 0x3366CC, accent: 0x88CCFF,
    skin: 0xF2DEAD,   hair: 0xE8E0D4, weapon: 0x7744CC, cape: 0x1A2266,
    cloth: 0xC4C0CC,  pants: 0x8888AA,
  },
  archer: {
    primary: 0x2B6B3A, secondary: 0x3D8B4D, accent: 0xAADD66,
    skin: 0xE8C890,   hair: 0xCC8844, weapon: 0x8B6B42, cape: 0x1A4422,
    cloth: 0x7A8840,  pants: 0xBBA070,
  },
  assassin: {
    primary: 0x3A2255, secondary: 0x553377, accent: 0xCC66FF,
    skin: 0xE0C8A0,   hair: 0x1A1A2E, weapon: 0x666688, cape: 0x221133,
    cloth: 0x4A4A55,  pants: 0x2A2A35,
  },
};

/* ---- Cores de armadura por tier ---- */
function armorTorsoColor(t: number, p: typeof CLASS_PALETTE.warrior): number {
  if (t === 0) return p.cloth;
  if (t === 1) return 0x8B7355;
  if (t === 2) return 0x7A6A58;
  if (t === 3) return 0x6688AA;
  if (t === 4) return p.primary;
  return 0xCCAA44;
}
function armorPantsColor(t: number, p: typeof CLASS_PALETTE.warrior): number {
  if (t === 0) return p.pants;
  if (t === 1) return 0x6B5540;
  if (t === 2) return 0x5A5A6A;
  if (t === 3) return 0x5577AA;
  if (t === 4) return p.secondary;
  return 0xBB9933;
}
function bootsColor(t: number): number {
  if (t === 0) return 0x554433;
  if (t === 1) return 0x6B4422;
  if (t === 2) return 0x8B6644;
  if (t === 3) return 0x445566;
  if (t === 4) return 0x663388;
  return 0xCCBB44;
}
function shoulderColor(t: number, accent: number): number {
  if (t <= 1) return 0;
  if (t === 2) return 0x776655;
  if (t === 3) return 0x4466AA;
  if (t === 4) return 0x663399;
  return accent;
}

/* ===================================================================
   PERSONAGEM JOGADOR â€” corpo humano detalhado
   Coordenadas relativas ao centro (0,0):
     cabeÃ§a:    y â‰ˆ -27
     pescoÃ§o:   y â‰ˆ -18
     ombros:    y â‰ˆ -16
     cintura:   y â‰ˆ  0
     quadril:   y â‰ˆ  4
     joelho:    y â‰ˆ 12
     tornozelo: y â‰ˆ 19
     sombra:    y â‰ˆ 22
=================================================================== */
export function drawCharacterBody(
  g: Graphics,
  cls: PlayerClass,
  dir: Direction,
  frame: number = 0,
  equip: EquipmentVisuals = {},
): void {
  const p = CLASS_PALETTE[cls];
  const bob  = Math.sin(frame * 0.08) * 1.2;
  const leg1 = Math.sin(frame * 0.12) * 3.5;
  const leg2 = -leg1;
  const arm1 = Math.sin(frame * 0.12) * 3.0;
  const arm2 = -arm1;

  const tArmor  = tier(equip.armorRarity);
  const tHelm   = tier(equip.helmetRarity);
  const tBoots  = tier(equip.bootsRarity);
  const tWeapon = tier(equip.weaponRarity);

  const torsoC  = armorTorsoColor(tArmor, p);
  const pantsC  = armorPantsColor(tArmor, p);
  const bootC   = bootsColor(tBoots);
  const shoulC  = shoulderColor(tArmor, p.accent);

  // â”€â”€ SOMBRA â”€â”€
  g.ellipse(0, 22, 13, 4);
  g.fill({ color: 0x000000, alpha: 0.28 });

  // â”€â”€ CAPA (tier â‰¥ 2) â”€â”€
  if (tArmor >= 2 && dir !== 'up') {
    const capeC    = tArmor >= 5 ? 0x9933CC : p.cape;
    const capeWave = Math.sin(frame * 0.06) * 2.5;
    g.moveTo(-9, -14 + bob);
    g.bezierCurveTo(-12, 2 + bob, -8 + capeWave, 14 + bob, -3, 18 + bob);
    g.lineTo(3, 18 + bob);
    g.bezierCurveTo(8 - capeWave, 14 + bob, 12, 2 + bob, 9, -14 + bob);
    g.fill({ color: capeC, alpha: 0.82 });
    g.moveTo(-5, -8 + bob);
    g.bezierCurveTo(-6, 4 + bob, -4, 11 + bob, 0, 16 + bob);
    g.fill({ color: capeC + 0x181818, alpha: 0.2 });
  }

  // â”€â”€ PERNAS â”€â”€
  const drawLeg = (offX: number, swing: number, isBack: boolean): void => {
    const alpha  = isBack ? 0.72 : 1.0;
    const shade  = isBack ? -0x181416 : 0;
    const kneeX  = offX + swing * 0.35;
    const ankleX = offX + swing * 0.6;
    const footX  = ankleX + (offX < 0 ? -2 : 2);

    // coxa
    g.moveTo(offX - 3, 4 + bob);
    g.bezierCurveTo(offX - 4, 8 + bob, kneeX - 3, 10 + bob, kneeX - 2, 12 + bob + swing * 0.15);
    g.bezierCurveTo(kneeX + 2, 12 + bob + swing * 0.15, offX + 4, 8 + bob, offX + 3, 4 + bob);
    g.fill({ color: pantsC + shade, alpha });
    // canela
    g.moveTo(kneeX - 2, 12 + bob + swing * 0.15);
    g.bezierCurveTo(kneeX - 3, 15 + bob, ankleX - 2, 18 + bob, ankleX - 1.5, 19 + bob);
    g.bezierCurveTo(ankleX + 2, 18 + bob, kneeX + 2, 15 + bob, kneeX + 2, 12 + bob + swing * 0.15);
    g.fill({ color: pantsC + shade - 0x0A080A, alpha });
    // bota / pÃ©
    g.moveTo(ankleX - 2, 19 + bob);
    g.bezierCurveTo(ankleX - 3, 21 + bob, footX - 2, 22 + bob, footX + 5, 22 + bob);
    g.bezierCurveTo(footX + 6, 22 + bob, footX + 6, 20 + bob, ankleX + 2, 19 + bob);
    g.fill({ color: bootC, alpha });
    if (tBoots >= 3) { g.rect(ankleX - 1, 19.5 + bob, 3, 1.5); g.fill({ color: p.accent, alpha }); }
    if (tBoots >= 5) { g.ellipse(ankleX, 21 + bob, 5, 2); g.fill({ color: 0xFFDD44, alpha: 0.25 * alpha }); }
  };

  drawLeg(-5, leg2, true);
  drawLeg(5,  leg1, true);
  drawLeg(-5, leg1, false);
  drawLeg(5,  leg2, false);

  // â”€â”€ TRONCO â”€â”€
  // Quadril
  g.moveTo(-9, 2 + bob);
  g.bezierCurveTo(-10, 4 + bob, -9, 6 + bob, -7, 6 + bob);
  g.lineTo(7, 6 + bob);
  g.bezierCurveTo(9, 6 + bob, 10, 4 + bob, 9, 2 + bob);
  g.bezierCurveTo(7, 0 + bob, -7, 0 + bob, -9, 2 + bob);
  g.fill(pantsC - 0x080608);

  // Cinto
  const beltY = 0 + bob;
  g.roundRect(-8, beltY - 1.5, 16, 3.5, 1.5);
  g.fill(tArmor >= 1 ? 0x5C3A1E : 0x8B6644);
  if (tArmor >= 2) {
    g.roundRect(-3, beltY - 2, 6, 4, 1); g.fill(p.accent);
    g.roundRect(-2, beltY - 1, 4, 2, 0.5); g.fill(0x333322);
  }

  // Torso (camisa/armadura)
  g.moveTo(-9, -2 + bob);
  g.bezierCurveTo(-11, -8 + bob, -11, -14 + bob, -8, -16 + bob);
  g.lineTo(8, -16 + bob);
  g.bezierCurveTo(11, -14 + bob, 11, -8 + bob, 9, -2 + bob);
  g.bezierCurveTo(7, 0 + bob, -7, 0 + bob, -9, -2 + bob);
  g.fill(torsoC);

  // Detalhes do torso por classe
  if (cls === 'warrior') {
    if (tArmor === 0) {
      g.moveTo(0, -15 + bob); g.lineTo(0, -1 + bob);
      g.stroke({ color: 0xBBAA88, width: 0.8, alpha: 0.5 });
      g.moveTo(-4, -15 + bob); g.lineTo(0, -11 + bob); g.lineTo(4, -15 + bob);
      g.stroke({ color: 0xBBAA88, width: 1, alpha: 0.6 });
    } else if (tArmor <= 2) {
      g.moveTo(-6, -14 + bob); g.lineTo(6, -14 + bob); g.stroke({ color: 0x4A3322, width: 1.2 });
      g.moveTo(-7, -8 + bob);  g.lineTo(7, -8 + bob);  g.stroke({ color: 0x4A3322, width: 1 });
    } else {
      g.moveTo(-8, -6 + bob); g.lineTo(8, -6 + bob); g.stroke({ color: p.accent, width: 1.5, alpha: 0.7 });
      g.moveTo(0, -15 + bob); g.lineTo(0, -1 + bob);  g.stroke({ color: p.accent, width: 1.5, alpha: 0.7 });
      if (tArmor >= 3) { g.roundRect(-14, -14 + bob, 6, 8, 3); g.fill(0x888888); g.roundRect(8, -14 + bob, 6, 8, 3); g.fill(0x888888); }
    }
  } else if (cls === 'mage') {
    if (tArmor === 0) {
      g.moveTo(-5, -15 + bob); g.lineTo(0, -10 + bob); g.lineTo(5, -15 + bob);
      g.stroke({ color: 0xAAAABB, width: 1.2 });
      g.moveTo(0, -10 + bob); g.lineTo(0, -2 + bob); g.stroke({ color: 0xAAAABB, width: 0.8, alpha: 0.5 });
    } else {
      drawStar(g, 0, -9 + bob, 3, 5, tArmor >= 5 ? 0xFFDD44 : p.accent);
      g.moveTo(-8, -13 + bob); g.lineTo(-8, -2 + bob); g.stroke({ color: p.accent, width: 0.8, alpha: 0.4 });
      g.moveTo(8, -13 + bob);  g.lineTo(8, -2 + bob);  g.stroke({ color: p.accent, width: 0.8, alpha: 0.4 });
    }
  } else if (cls === 'archer') {
    if (tArmor === 0) {
      g.moveTo(-7, -14 + bob); g.lineTo(4, -1 + bob); g.stroke({ color: 0x5C3A1E, width: 1.5, alpha: 0.5 });
      g.moveTo(7, -14 + bob);  g.lineTo(-4, -1 + bob); g.stroke({ color: 0x5C3A1E, width: 1.5, alpha: 0.5 });
    } else {
      g.moveTo(-7, -14 + bob); g.lineTo(4, -1 + bob); g.stroke({ color: 0x8B6B42, width: 2 });
      g.moveTo(7, -14 + bob);  g.lineTo(-4, -1 + bob); g.stroke({ color: 0x8B6B42, width: 2 });
      if (tArmor >= 3) { g.circle(0, -8 + bob, 3); g.fill({ color: p.accent, alpha: 0.6 }); }
    }
  } else if (cls === 'assassin') {
    if (tArmor === 0) {
      g.roundRect(-6, -15 + bob, 12, 5, 2); g.fill({ color: 0x000000, alpha: 0.2 });
    } else {
      g.roundRect(-9, -15 + bob, 18, 7, 2); g.fill({ color: 0x000000, alpha: 0.25 });
      if (tArmor >= 3) {
        g.rect(-7, -3 + bob, 4, 5); g.fill(0x443355);
        g.rect(3,  -3 + bob, 4, 5); g.fill(0x443355);
      }
    }
  }

  if (tArmor >= 4) {
    g.roundRect(-9, -16 + bob, 18, 18, 3);
    g.stroke({ color: tArmor >= 5 ? 0xFFDD44 : p.accent, width: 1.2, alpha: tArmor >= 5 ? 0.7 : 0.35 });
  }

  // â”€â”€ OMBREIRAS (tier â‰¥ 2) â”€â”€
  if (tArmor >= 2 && shoulC !== 0) {
    g.ellipse(-12, -14 + bob, 5, 4); g.fill(shoulC);
    g.ellipse( 12, -14 + bob, 5, 4); g.fill(shoulC);
    g.circle(-12, -14 + bob, 1.3); g.fill(p.accent);
    g.circle( 12, -14 + bob, 1.3); g.fill(p.accent);
    if (tArmor >= 5) {
      g.ellipse(-12, -14 + bob, 7, 5); g.fill({ color: p.accent, alpha: 0.2 });
      g.ellipse( 12, -14 + bob, 7, 5); g.fill({ color: p.accent, alpha: 0.2 });
    }
  }

  // â”€â”€ BRAÃ‡OS articulados â”€â”€
  const drawArm = (side: -1 | 1, swing: number, isBack: boolean): void => {
    const alpha  = isBack ? 0.68 : 1.0;
    const shade  = isBack ? -0x181418 : 0;
    const sx     = side * 10;
    const elbX   = sx + swing * side * 0.5;
    const wristX = sx + swing * side;

    // manga / braÃ§o superior
    g.moveTo(sx - 3 * side, -15 + bob);
    g.bezierCurveTo(sx - 4 * side, -8 + bob, elbX - 3 * side, -3 + bob, elbX - 2, -4 + bob + swing * 0.1);
    g.bezierCurveTo(elbX + 2, -4 + bob + swing * 0.1, sx + 4 * side, -8 + bob, sx + 3 * side, -15 + bob);
    g.fill({ color: torsoC + shade, alpha });
    // cotovelo
    g.circle(elbX, -4 + bob + swing * 0.1, 2.5);
    g.fill({ color: torsoC + shade - 0x080608, alpha });
    // antebraÃ§o
    g.moveTo(elbX - 2, -4 + bob + swing * 0.1);
    g.bezierCurveTo(elbX - 3, 2 + bob, wristX - 2, 5 + bob, wristX - 1.5, 6 + bob + swing * 0.2);
    g.bezierCurveTo(wristX + 2, 5 + bob, elbX + 2, 2 + bob, elbX + 2, -4 + bob + swing * 0.1);
    g.fill({ color: torsoC + shade + 0x060408, alpha });
    // mÃ£o (pele)
    g.circle(wristX, 7 + bob + swing * 0.25, 2.8);
    g.fill({ color: p.skin, alpha });
    // luva em tiers altos
    if (tArmor >= 3) {
      g.roundRect(wristX - 3, 3 + bob + swing * 0.2, 6, 5, 1.5);
      g.fill({ color: tArmor >= 5 ? 0xCCBB44 : 0x778899, alpha });
    }
  };

  drawArm(-1, arm2, true);
  drawArm(1,  arm1, true);
  drawArm(-1, arm1, false);
  drawArm(1,  arm2, false);

  // â”€â”€ PESCOÃ‡O â”€â”€
  const headY = -27 + bob;
  g.moveTo(-3, -16 + bob);
  g.bezierCurveTo(-3.2, -20 + bob, -2.5, -21 + bob, 0, -21 + bob);
  g.bezierCurveTo(2.5, -21 + bob, 3.2, -20 + bob, 3, -16 + bob);
  g.fill(p.skin);

  // â”€â”€ CABEÃ‡A â”€â”€
  g.ellipse(0, headY, 9, 10);
  g.fill(p.skin);
  // queixo
  g.moveTo(-7, headY + 3);
  g.bezierCurveTo(-8, headY + 7, -5, headY + 10, 0, headY + 11);
  g.bezierCurveTo(5, headY + 10, 8, headY + 7, 7, headY + 3);
  g.fill(p.skin);
  // orelhas
  if (tHelm === 0) {
    if (dir === 'down' || dir === 'up') {
      g.ellipse(-9.5, headY + 1, 1.8, 2.5); g.fill(p.skin - 0x101010);
      g.ellipse( 9.5, headY + 1, 1.8, 2.5); g.fill(p.skin - 0x101010);
    } else if (dir === 'left') {
      g.ellipse(7, headY + 1, 1.6, 2.3); g.fill(p.skin - 0x101010);
    } else {
      g.ellipse(-7, headY + 1, 1.6, 2.3); g.fill(p.skin - 0x101010);
    }
  }

  // â”€â”€ CABELO â”€â”€
  if (tHelm === 0) drawHair(g, cls, dir, headY, frame, p);

  // â”€â”€ ROSTO â”€â”€
  if (dir !== 'up') drawFace(g, cls, dir, headY, p);
  else if (tHelm === 0) { g.arc(0, headY - 2, 9, -Math.PI, 0); g.fill(p.hair); }

  // â”€â”€ CAPACETE â”€â”€
  if (tHelm >= 1) drawHelmet(g, cls, dir, headY, tHelm, p, frame);

  // â”€â”€ ARMA â”€â”€
  drawWeaponSprite(g, cls, dir, bob, arm2, frame, p, tWeapon);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CABELO por classe
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawHair(
  g: Graphics, cls: PlayerClass, dir: Direction,
  headY: number, frame: number, p: typeof CLASS_PALETTE.warrior,
): void {
  if (cls === 'warrior') {
    g.arc(0, headY, 10, -Math.PI, 0.05); g.fill(p.hair);
    const spikes = dir === 'up' ? [-5,-3,-1,1,3,5] : [-4,-2,0,2,4];
    for (const sx of spikes) {
      const h = 11 + Math.abs(sx) * 0.5;
      g.moveTo(sx * 1.6, headY - 8); g.lineTo(sx * 1.6 + 1, headY - 8 - h);
      g.lineTo(sx * 1.6 + 2.2, headY - 8); g.fill(p.hair);
    }
    if (dir !== 'up') {
      g.moveTo(-8, headY + 4); g.bezierCurveTo(-10, headY + 8, -8, headY + 12, -5, headY + 11); g.fill(p.hair);
      g.moveTo( 8, headY + 4); g.bezierCurveTo( 10, headY + 8,  8, headY + 12,  5, headY + 11); g.fill(p.hair);
    }
  } else if (cls === 'mage') {
    g.arc(0, headY, 10, -Math.PI, 0.05); g.fill(p.hair);
    const wave = Math.sin(frame * 0.05) * 2;
    g.moveTo(-9, headY + 1);
    g.bezierCurveTo(-12, headY + 8 + wave, -11, headY + 18, -7, headY + 20);
    g.lineTo(-5, headY + 20);
    g.bezierCurveTo(-9, headY + 16, -9, headY + 8, -6, headY + 1); g.fill(p.hair);
    if (dir !== 'up') {
      g.moveTo(9, headY + 1);
      g.bezierCurveTo(12, headY + 8 + wave, 11, headY + 18, 7, headY + 20);
      g.lineTo(5, headY + 20);
      g.bezierCurveTo(9, headY + 16, 9, headY + 8, 6, headY + 1); g.fill(p.hair);
    }
    // ChapÃ©u simples (base sem equipamento)
    g.moveTo(-8, headY - 7); g.lineTo(0, headY - 22); g.lineTo(8, headY - 7); g.fill(p.cloth);
    g.moveTo(-10, headY - 6); g.lineTo(10, headY - 6); g.stroke({ color: p.accent, width: 2 });
    drawStar(g, 2, headY - 15, 2, 4, p.accent);
  } else if (cls === 'archer') {
    g.arc(0, headY, 10, -Math.PI, -0.15); g.fill(p.hair);
    g.arc(0, headY - 2, 10.5, -Math.PI * 0.85, -Math.PI * 0.15); g.stroke({ color: p.accent, width: 2 });
    const tailWave = Math.sin(frame * 0.07) * 4;
    if (dir !== 'left') {
      g.moveTo(7, headY - 4); g.bezierCurveTo(14, headY + 2, 16 + tailWave, headY + 12, 12 + tailWave, headY + 18);
      g.stroke({ color: p.hair, width: 4 });
    } else {
      g.moveTo(-7, headY - 4); g.bezierCurveTo(-14, headY + 2, -16 + tailWave, headY + 12, -12 + tailWave, headY + 18);
      g.stroke({ color: p.hair, width: 4 });
    }
  } else {
    // assassin â€” capuz
    g.arc(0, headY, 11, -Math.PI, 0.15); g.fill(p.primary);
    g.arc(0, headY + 1, 11.5, -Math.PI * 0.85, -Math.PI * 0.05); g.stroke({ color: p.secondary, width: 1.8 });
    g.arc(0, headY, 9.5, -Math.PI * 0.5, Math.PI * 0.15); g.fill({ color: 0x000000, alpha: 0.2 });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ROSTO â€” traÃ§os humanos realistas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawFace(
  g: Graphics, cls: PlayerClass, dir: Direction,
  headY: number, p: typeof CLASS_PALETTE.warrior,
): void {
  const shift = dir === 'left' ? -2.5 : dir === 'right' ? 2 : 0;

  if (cls !== 'assassin') {
    // Sobrancelhas
    g.moveTo(-5.5 + shift, headY - 5);
    g.bezierCurveTo(-3.5 + shift, headY - 5.5, -1.5 + shift, headY - 5.2, -0.5 + shift, headY - 4.8);
    g.stroke({ color: p.hair, width: 1.3 });
    g.moveTo(5.5 + shift, headY - 5);
    g.bezierCurveTo(3.5 + shift, headY - 5.5, 1.5 + shift, headY - 5.2, 0.5 + shift, headY - 4.8);
    g.stroke({ color: p.hair, width: 1.3 });

    // Olhos (esclera + Ã­ris + pupila + brilho)
    const eyeC = cls === 'warrior' ? 0x5C3A1E : cls === 'mage' ? 0x4488CC : cls === 'archer' ? 0x336633 : 0x553366;
    for (const ex of [-3.2 + shift, 3.2 + shift]) {
      g.ellipse(ex, headY - 1.5, 2.8, 2.3); g.fill(0xF8F4EE);
      g.ellipse(ex + 0.3, headY - 1.3, 1.8, 1.8); g.fill(eyeC);
      g.circle(ex + 0.5, headY - 1.2, 0.9); g.fill(0x111122);
      g.circle(ex + 0.9, headY - 1.8, 0.5); g.fill(0xFFFFFF);
    }

    // Nariz
    g.moveTo(0.5 + shift, headY + 0.5);
    g.bezierCurveTo(-1 + shift, headY + 2.5, -1.5 + shift, headY + 3.5, 0 + shift, headY + 4);
    g.stroke({ color: p.skin - 0x1A1410, width: 0.9, alpha: 0.6 });
    g.ellipse(-1 + shift, headY + 4, 0.9, 0.6); g.fill({ color: p.skin - 0x252018, alpha: 0.5 });
    g.ellipse(1.5 + shift, headY + 4, 0.9, 0.6); g.fill({ color: p.skin - 0x252018, alpha: 0.5 });

    // Boca por classe
    if (cls === 'warrior') {
      g.moveTo(-2.5 + shift, headY + 6.5); g.lineTo(2.5 + shift, headY + 6.5);
      g.stroke({ color: p.skin - 0x302820, width: 1 });
      g.moveTo(-2 + shift, headY + 5.8);
      g.bezierCurveTo(-1 + shift, headY + 5.2, 1 + shift, headY + 5.2, 2 + shift, headY + 5.8);
      g.stroke({ color: p.skin - 0x282020, width: 0.7, alpha: 0.6 });
    } else if (cls === 'mage') {
      g.moveTo(-2.5 + shift, headY + 6);
      g.bezierCurveTo(-1 + shift, headY + 7.5, 1 + shift, headY + 7.5, 2.5 + shift, headY + 6);
      g.stroke({ color: p.skin - 0x2A2015, width: 1, alpha: 0.8 });
    } else {
      g.moveTo(-2 + shift, headY + 6);
      g.bezierCurveTo(-0.5 + shift, headY + 7, 0.5 + shift, headY + 7, 2 + shift, headY + 6);
      g.stroke({ color: p.skin - 0x2A2015, width: 1, alpha: 0.75 });
    }
  } else {
    // Assassino: olhos brilhantes + mÃ¡scara
    g.circle(-3 + shift, headY - 1, 1.8); g.fill({ color: p.accent, alpha: 0.85 });
    g.circle(-3 + shift, headY - 1, 0.8); g.fill({ color: 0xFFFFFF, alpha: 0.6 });
    g.circle(3 + shift, headY - 1, 1.8);  g.fill({ color: p.accent, alpha: 0.85 });
    g.circle(3 + shift, headY - 1, 0.8);  g.fill({ color: 0xFFFFFF, alpha: 0.6 });
    g.roundRect(-6 + shift, headY + 1, 12, 8, 2); g.fill({ color: p.primary, alpha: 0.9 });
    g.moveTo(-4 + shift, headY + 4); g.lineTo(4 + shift, headY + 4);
    g.stroke({ color: p.secondary, width: 0.8, alpha: 0.6 });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CAPACETE por tier
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawHelmet(
  g: Graphics, cls: PlayerClass, _dir: Direction,
  headY: number, t: number, p: typeof CLASS_PALETTE.warrior, frame: number,
): void {
  if (cls === 'warrior' || cls === 'assassin') {
    if (t === 1) {
      g.arc(0, headY, 10.5, -Math.PI * 0.95, 0.05); g.fill(0x7A5C3A);
    } else if (t === 2) {
      g.arc(0, headY, 11, -Math.PI, 0.1); g.fill(0x8B7355);
      g.rect(-1.5, headY - 2, 3, 8); g.fill(0x7A6340);
    } else if (t === 3) {
      g.arc(0, headY, 11, -Math.PI, 0.1); g.fill(0x6688AA);
      g.arc(0, headY - 1, 11.5, -Math.PI * 0.8, -Math.PI * 0.2); g.stroke({ color: p.accent, width: 1.5 });
    } else if (t === 4) {
      g.ellipse(0, headY, 11, 12); g.fill(p.primary);
      g.rect(-1.5, headY - 4, 3, 12); g.fill(p.accent);
      g.arc(0, headY - 1, 12, -Math.PI, 0.15); g.stroke({ color: p.accent, width: 1.2 });
    } else {
      g.ellipse(0, headY, 11, 12); g.fill(p.primary);
      g.ellipse(0, headY, 14, 15); g.fill({ color: 0xFFDD44, alpha: 0.18 });
      g.moveTo(-6, headY - 10); g.bezierCurveTo(-10, headY - 20, -8, headY - 26, -4, headY - 22); g.fill(0xCCBB44);
      g.moveTo( 6, headY - 10); g.bezierCurveTo( 10, headY - 20,  8, headY - 26,  4, headY - 22); g.fill(0xCCBB44);
      g.arc(0, headY, 12, -Math.PI * 0.95, 0.1); g.stroke({ color: 0xFFDD44, width: 1.5 });
    }
  } else if (cls === 'mage') {
    const hats = [0x334466, 0x2244AA, 0x4466CC, 0x8844BB, 0xCCAA22];
    const hatC = hats[Math.min(t - 1, 4)];
    g.moveTo(-9, headY - 7); g.lineTo(0, headY - 24 - (t * 2)); g.lineTo(9, headY - 7); g.fill(hatC);
    g.moveTo(-11, headY - 6); g.lineTo(11, headY - 6); g.stroke({ color: p.accent, width: 2 });
    if (t >= 3) drawStar(g, 0, headY - 17, 3, 5.5, p.accent);
    if (t >= 5) {
      const glow = Math.sin(frame * 0.06) * 0.15 + 0.2;
      g.circle(0, headY - 16, 8); g.fill({ color: 0xAADDFF, alpha: glow });
    }
  } else {
    // archer
    if (t <= 2) {
      g.arc(0, headY - 2, 11, -Math.PI * 0.85, -Math.PI * 0.15);
      g.stroke({ color: t === 1 ? 0x8B6B42 : p.accent, width: 2.5 });
      g.moveTo(8, headY - 10); g.bezierCurveTo(14, headY - 18, 10, headY - 14, 6, headY - 8); g.fill(0xDDDD88);
    } else {
      g.arc(0, headY, 11, -Math.PI, 0.1); g.fill(0x4A6A2A);
      g.arc(0, headY - 1, 12, -Math.PI * 0.9, -Math.PI * 0.1); g.stroke({ color: p.accent, width: 1.5 });
    }
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ARMA por classe e tier
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function drawWeaponSprite(
  g: Graphics, cls: PlayerClass, _dir: Direction,
  bobY: number, armSwing: number, frame: number,
  p: typeof CLASS_PALETTE.warrior, tW: number,
): void {
  const wb     = Math.sin(frame * 0.05) * 1;
  const bladeC = tW === 0 ? 0xAAAAAA : tW <= 2 ? 0xBBBBCC : tW <= 3 ? 0xCCDDEE : tW >= 5 ? 0xFFEE88 : p.accent;
  const handleC = tW === 0 ? 0x5C3A1E : tW <= 2 ? 0x7A4A22 : 0x222244;

  if (cls === 'warrior') {
    const sx = 15, sy = -6 + bobY - armSwing + wb;
    if (tW === 0) {
      // espada improvisada / faca de madeira
      g.rect(sx - 1, sy - 14, 2, 16); g.fill(0x888888);
      g.rect(sx - 4, sy, 8, 1.5); g.fill(0x666655);
      g.rect(sx - 1, sy + 1, 2, 6); g.fill(0x7A5C3A);
    } else {
      g.moveTo(sx, sy); g.lineTo(sx + 2.5, sy - 18); g.lineTo(sx, sy - 21); g.lineTo(sx - 2.5, sy - 18); g.closePath(); g.fill(bladeC);
      g.moveTo(sx, sy); g.lineTo(sx + 0.8, sy - 17); g.stroke({ color: 0xFFFFFF, width: 0.7, alpha: 0.55 });
      g.rect(sx - 5, sy, 10, 2); g.fill(tW >= 5 ? 0xCCBB44 : p.accent);
      g.rect(sx - 1.5, sy + 1.5, 3, 8); g.fill(handleC);
      g.circle(sx, sy + 10, 2); g.fill(tW >= 5 ? 0xCCBB44 : p.accent);
      if (tW >= 4) { g.moveTo(sx, sy); g.lineTo(sx, sy - 21); g.stroke({ color: bladeC, width: 3, alpha: 0.18 }); }
      if (tW >= 2) {
        const shX = -17, shY = -2 + bobY + armSwing;
        const shW = 10 + tW * 2, shH = 14 + tW * 2;
        g.roundRect(shX - shW / 2, shY - shH / 2, shW, shH, 3); g.fill(tW >= 5 ? 0x9933AA : 0x667788);
        g.roundRect(shX - shW / 2 + 2, shY - shH / 2 + 2, shW - 4, shH - 4, 2); g.fill(tW >= 5 ? 0xAA44CC : 0x8899AA);
        g.circle(shX, shY, 3 + tW * 0.5); g.fill(tW >= 4 ? p.accent : 0xDDAA33);
      }
    }
  } else if (cls === 'mage') {
    const sx = 15, sy = -16 + bobY + wb;
    const staffC = tW === 0 ? 0x8B6B42 : tW <= 2 ? 0x775533 : tW >= 5 ? 0x9933CC : 0x4444AA;
    g.rect(sx - 1, sy, 2, 33); g.fill(staffC);
    if (tW >= 2) {
      for (let i = 1; i <= Math.min(tW, 4); i++) {
        g.ellipse(sx, sy + i * 7, 2.5, 1.5); g.fill(i % 2 === 0 ? p.accent : staffC + 0x222222);
      }
    }
    const orbR = 3.5 + tW * 0.7;
    g.circle(sx, sy - 2, orbR); g.fill({ color: tW >= 5 ? 0xFFDD44 : p.accent, alpha: 0.88 });
    g.circle(sx, sy - 2, orbR - 1); g.fill({ color: 0xFFFFFF, alpha: 0.22 });
    const glowR = orbR + 3 + Math.sin(frame * 0.08) * 2;
    g.circle(sx, sy - 2, glowR); g.fill({ color: p.accent, alpha: tW >= 5 ? 0.25 : 0.12 });
    if (tW >= 3) { for (let i = 0; i < 3; i++) { g.circle(sx, sy + 9 + i * 8, 1); g.fill({ color: p.accent, alpha: 0.5 }); } }
    if (tW >= 2) { g.roundRect(-14, 0 + bobY, 6, 7, 1.5); g.fill(tW >= 5 ? 0x442266 : 0x553322); g.rect(-13, 1 + bobY, 4, 1); g.fill(p.accent); }
  } else if (cls === 'archer') {
    const bx = -15, by = -10 + bobY;
    const arcR = 11 + tW;
    const bowC = tW === 0 ? 0x8B6B42 : tW <= 2 ? p.weapon : tW >= 5 ? 0xFFDD44 : p.accent;
    g.arc(bx, by + 8, arcR, -Math.PI * 0.7, Math.PI * 0.7); g.stroke({ color: bowC, width: 2 + tW * 0.3 });
    g.moveTo(bx + arcR * Math.cos(-Math.PI * 0.7), by + 8 + arcR * Math.sin(-Math.PI * 0.7));
    g.lineTo(bx + arcR * Math.cos(Math.PI * 0.7),  by + 8 + arcR * Math.sin(Math.PI * 0.7));
    g.stroke({ color: 0xCCCCCC, width: 0.8 });
    g.roundRect(10, -14 + bobY, 5 + tW * 0.5, 18 + tW, 2);
    g.fill(tW === 0 ? 0x7A5C3A : tW <= 2 ? 0x8B6B42 : tW >= 5 ? 0x4433AA : p.weapon);
    const arrowQty = Math.min(3 + tW, 5);
    for (let i = 0; i < arrowQty; i++) {
      g.rect(11 + i * 1.1, -17 + bobY, 0.9, 6); g.fill(0x8B6B42);
      g.moveTo(11 + i * 1.1, -17 + bobY); g.lineTo(11.5 + i * 1.1, -19.5 + bobY); g.lineTo(12 + i * 1.1, -17 + bobY);
      g.fill(tW >= 3 ? p.accent : 0xAAAAAA);
    }
    if (tW >= 4) { g.arc(bx, by + 8, arcR + 2, -Math.PI * 0.7, Math.PI * 0.7); g.stroke({ color: p.accent, width: 1, alpha: 0.3 }); }
  } else {
    // assassin â€” adagas duplas
    const db = Math.sin(frame * 0.09) * 1.5;
    const drawDag = (dx: number, ds: number): void => {
      const ty = 2 + bobY + ds + db;
      g.rect(dx - 1, ty, 2, 4); g.fill(handleC);
      g.rect(dx - 3, ty, 6, 1.5); g.fill(tW >= 5 ? 0xCCBB44 : 0x555566);
      g.moveTo(dx - 1.5, ty - 0.5); g.lineTo(dx, ty - 11 - tW * 1.5); g.lineTo(dx + 1.5, ty - 0.5); g.fill(bladeC);
      g.moveTo(dx, ty - 0.5); g.lineTo(dx + 0.5, ty - 10 - tW); g.stroke({ color: 0xFFFFFF, width: 0.6, alpha: 0.5 });
      if (tW >= 2) { g.circle(dx, ty - 10 - tW, 2); g.fill({ color: tW >= 5 ? 0xFFDD44 : 0x66FF66, alpha: 0.22 }); }
    };
    drawDag(-14, armSwing);
    drawDag(14, -armSwing);
  }
}

/* ---- Estrela de 5 pontas ---- */
function drawStar(g: Graphics, cx: number, cy: number, inner: number, outer: number, color: number): void {
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill(color);
}

const NPC_PALETTES = {
  enemy:    { body: 0xCC4444, accent: 0xFF6666, outline: 0x881111 },
  friendly: { body: 0x44BB66, accent: 0x88DDAA, outline: 0x227744 },
  boss:     { body: 0xAA22AA, accent: 0xDD66DD, outline: 0x661166 },
  merchant: { body: 0xDDAA33, accent: 0xFFDD88, outline: 0x886611 },
};

/* ---- Draw detailed NPC ---- */
export function drawNpcBody(
  g: Graphics,
  _name: string,
  type: 'enemy' | 'friendly' | 'boss' | 'merchant',
  spriteKey: string,
  frame: number = 0,
): void {
  const pal = NPC_PALETTES[type];
  const isBoss = type === 'boss';
  const scale = isBoss ? 1.5 : 1;

  // Shadow
  g.ellipse(0, 18 * scale, 14 * scale, 5 * scale);
  g.fill({ color: 0x000000, alpha: 0.3 });

  if (spriteKey.includes('slime')) {
    drawSlime(g, pal, frame, scale);
  } else if (spriteKey.includes('wolf')) {
    drawWolf(g, pal, frame, scale, spriteKey.includes('dark'));
  } else if (spriteKey.includes('spider')) {
    drawSpider(g, pal, frame, scale);
  } else if (spriteKey.includes('skeleton')) {
    drawSkeleton(g, pal, frame, scale);
  } else if (spriteKey.includes('bandit')) {
    drawBandit(g, frame, scale);
  } else if (spriteKey.includes('mage') && type === 'enemy') {
    drawDarkMage(g, frame, scale);
  } else if (spriteKey.includes('golem')) {
    drawGolem(g, frame, scale);
  } else if (spriteKey.includes('dragon')) {
    drawDragon(g, frame, scale);
  } else if (spriteKey.includes('merchant') || type === 'merchant') {
    drawMerchant(g, frame);
  } else if (spriteKey.includes('guard') || type === 'friendly') {
    drawGuard(g, frame);
  } else {
    // Generic NPC
    drawGenericNpc(g, pal, frame, scale);
  }
}

/* ---- Slime ---- */
function drawSlime(g: Graphics, pal: typeof NPC_PALETTES.enemy, frame: number, scale: number): void {
  const squish = Math.sin(frame * 0.08) * 2;
  const w = 16 * scale + squish;
  const h = 12 * scale - squish * 0.5;

  // Body blob
  g.ellipse(0, 4, w, h);
  g.fill(pal.body);
  // Highlight
  g.ellipse(-3 * scale, -2, w * 0.5, h * 0.4);
  g.fill({ color: 0xFFFFFF, alpha: 0.2 });
  // Eyes
  g.ellipse(-4 * scale, -1, 3 * scale, 3.5 * scale);
  g.fill(0xFFFFFF);
  g.circle(-4 * scale + 1, -1, 1.5 * scale);
  g.fill(0x222222);
  g.ellipse(4 * scale, -1, 3 * scale, 3.5 * scale);
  g.fill(0xFFFFFF);
  g.circle(4 * scale + 1, -1, 1.5 * scale);
  g.fill(0x222222);
  // Mouth
  g.arc(0, 3, 4 * scale, 0, Math.PI);
  g.stroke({ color: 0x222222, width: 1.5 });
  // Drip effect
  const dripY = Math.abs(Math.sin(frame * 0.04)) * 4;
  g.ellipse(-8 * scale, 10 + dripY, 3, 2);
  g.fill({ color: pal.body, alpha: 0.5 });
}

/* ---- Wolf ---- */
function drawWolf(g: Graphics, _pal: typeof NPC_PALETTES.enemy, frame: number, scale: number, isDark: boolean): void {
  const runCycle = Math.sin(frame * 0.1) * 3;
  const baseColor = isDark ? 0x333344 : 0x887766;
  const bellyColor = isDark ? 0x444455 : 0xccbbaa;

  // Body
  g.ellipse(0, 0, 18 * scale, 10 * scale);
  g.fill(baseColor);
  // Belly
  g.ellipse(0, 3 * scale, 14 * scale, 6 * scale);
  g.fill(bellyColor);
  // Head
  g.ellipse(12 * scale, -6 * scale, 8 * scale, 7 * scale);
  g.fill(baseColor);
  // Snout
  g.ellipse(18 * scale, -3 * scale, 5 * scale, 3.5 * scale);
  g.fill(bellyColor);
  // Nose
  g.circle(22 * scale, -3 * scale, 2 * scale);
  g.fill(0x222222);
  // Eyes
  g.circle(14 * scale, -8 * scale, 2 * scale);
  g.fill(isDark ? 0xFF4444 : 0xFFDD44);
  g.circle(14 * scale, -8 * scale, 1 * scale);
  g.fill(0x111111);
  // Ears
  g.moveTo(8 * scale, -12 * scale);
  g.lineTo(10 * scale, -18 * scale);
  g.lineTo(13 * scale, -12 * scale);
  g.fill(baseColor);
  g.moveTo(14 * scale, -12 * scale);
  g.lineTo(16 * scale, -18 * scale);
  g.lineTo(19 * scale, -12 * scale);
  g.fill(baseColor);
  // Legs
  const legOffset = runCycle;
  for (const lx of [-10 * scale, -4 * scale, 4 * scale, 10 * scale]) {
    const ly = lx < 0 ? legOffset : -legOffset;
    g.rect(lx - 2, 8 * scale + ly, 4, 10 * scale);
    g.fill(baseColor);
  }
  // Tail
  const tailWave = Math.sin(frame * 0.07) * 4;
  g.moveTo(-16 * scale, -2 * scale);
  g.bezierCurveTo(-20 * scale, -6 * scale + tailWave, -24 * scale, -4 * scale + tailWave, -22 * scale, -8 * scale + tailWave);
  g.stroke({ color: baseColor, width: 4 * scale });
  // Dark wolf: glow effect
  if (isDark) {
    g.ellipse(0, 0, 22 * scale, 14 * scale);
    g.fill({ color: 0x6644AA, alpha: 0.1 });
  }
}

/* ---- Spider ---- */
function drawSpider(g: Graphics, _pal: typeof NPC_PALETTES.enemy, frame: number, scale: number): void {
  const legMove = Math.sin(frame * 0.12) * 4;
  // Body
  g.ellipse(0, 0, 10 * scale, 8 * scale);
  g.fill(0x443322);
  // Abdomen
  g.ellipse(-8 * scale, 4 * scale, 12 * scale, 10 * scale);
  g.fill(0x332211);
  // Pattern on abdomen
  g.circle(-8 * scale, 2 * scale, 3 * scale);
  g.fill({ color: 0xFF4444, alpha: 0.5 });
  g.circle(-6 * scale, 6 * scale, 2 * scale);
  g.fill({ color: 0xFF4444, alpha: 0.4 });
  // Eyes (8 eyes!)
  for (let i = 0; i < 4; i++) {
    const ex = 4 * scale + i * 2;
    const ey = -4 * scale + (i % 2) * 3;
    g.circle(ex, ey, 1.5);
    g.fill(0xFF2222);
  }
  // Legs (8 total)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const baseX = -4 * scale + i * 4 * scale;
      const lm = (i % 2 === 0 ? legMove : -legMove) * side;
      g.moveTo(baseX, 0);
      g.lineTo(baseX + side * 14 * scale, -8 * scale + lm);
      g.lineTo(baseX + side * 18 * scale, 4 * scale + lm * 0.5);
      g.stroke({ color: 0x443322, width: 1.5 * scale });
    }
  }
  // Fangs
  g.moveTo(8 * scale, -2 * scale);
  g.lineTo(12 * scale, 2 * scale);
  g.stroke({ color: 0xCCCCAA, width: 1.5 });
  g.moveTo(8 * scale, 2 * scale);
  g.lineTo(12 * scale, 5 * scale);
  g.stroke({ color: 0xCCCCAA, width: 1.5 });
}

/* ---- Skeleton ---- */
function drawSkeleton(g: Graphics, _pal: typeof NPC_PALETTES.enemy, frame: number, scale: number): void {
  const sway = Math.sin(frame * 0.06) * 1.5;
  const boneColor = 0xDDDDBB;

  // Rib cage
  for (let i = 0; i < 4; i++) {
    g.arc(0, -6 * scale + i * 4, 6 * scale, -Math.PI * 0.7, Math.PI * 0.7);
    g.stroke({ color: boneColor, width: 1.5 });
  }
  // Spine
  g.rect(-1, -12 * scale, 2, 24 * scale);
  g.fill(boneColor);
  // Pelvis
  g.arc(0, 10 * scale, 6 * scale, 0, Math.PI);
  g.stroke({ color: boneColor, width: 2 });
  // Legs
  g.rect(-5, 10 * scale, 2, 12 * scale);
  g.fill(boneColor);
  g.rect(3, 10 * scale, 2, 12 * scale);
  g.fill(boneColor);
  // Feet
  g.rect(-6, 20 * scale, 5, 2);
  g.fill(boneColor);
  g.rect(2, 20 * scale, 5, 2);
  g.fill(boneColor);
  // Arms
  g.rect(-10, -10 * scale + sway, 2, 14 * scale);
  g.fill(boneColor);
  g.rect(8, -10 * scale - sway, 2, 14 * scale);
  g.fill(boneColor);
  // Skull
  g.circle(0, -16 * scale, 7 * scale);
  g.fill(boneColor);
  // Eye sockets
  g.circle(-3 * scale, -17 * scale, 2.5 * scale);
  g.fill(0x111111);
  g.circle(3 * scale, -17 * scale, 2.5 * scale);
  g.fill(0x111111);
  // Eye glow
  g.circle(-3 * scale, -17 * scale, 1.2 * scale);
  g.fill(0xFF4444);
  g.circle(3 * scale, -17 * scale, 1.2 * scale);
  g.fill(0xFF4444);
  // Nose hole
  g.moveTo(0, -14 * scale);
  g.lineTo(-1, -13 * scale);
  g.lineTo(1, -13 * scale);
  g.fill(0x111111);
  // Jaw
  g.arc(0, -13 * scale, 5 * scale, 0, Math.PI);
  g.stroke({ color: boneColor, width: 1.5 });
  // Teeth
  for (let i = -3; i <= 3; i++) {
    g.rect(i * 1.5, -13 * scale, 1, 2);
    g.fill(boneColor);
  }
  // Sword (sometime)
  g.rect(10, -6 * scale - sway, 2, -18 * scale);
  g.fill(0x888899);
  g.rect(7, -4 * scale - sway, 8, 2);
  g.fill(0xAAAABB);
}

/* ---- Bandit ---- */
function drawBandit(g: Graphics, frame: number, _scale: number): void {
  const bobY = Math.sin(frame * 0.07) * 1;
  // Legs
  g.roundRect(-6, 4 + bobY, 5, 14, 2);
  g.fill(0x443322);
  g.roundRect(1, 4 + bobY, 5, 14, 2);
  g.fill(0x443322);
  // Body
  g.roundRect(-9, -12 + bobY, 18, 18, 3);
  g.fill(0x554433);
  // Leather vest
  g.roundRect(-7, -10 + bobY, 14, 14, 2);
  g.fill(0x665544);
  // Face
  g.circle(0, -18 + bobY, 7);
  g.fill(0xDEB887);
  // Mask/bandana
  g.rect(-7, -16 + bobY, 14, 5);
  g.fill(0x553333);
  // Eyes (through mask)
  g.circle(-3, -15 + bobY, 1.5);
  g.fill(0x222222);
  g.circle(3, -15 + bobY, 1.5);
  g.fill(0x222222);
  // Hat
  g.arc(0, -22 + bobY, 8, -Math.PI, 0);
  g.fill(0x443322);
  g.rect(-10, -22 + bobY, 20, 2);
  g.fill(0x443322);
  // Sword
  g.rect(12, -8 + bobY, 2, -16);
  g.fill(0x888899);
  g.rect(9, -8 + bobY, 8, 2);
  g.fill(0x5C3A1E);
  // Money bag
  g.circle(-11, 2 + bobY, 4);
  g.fill(0xCCAA44);
  g.moveTo(-13, 0 + bobY);
  g.lineTo(-11, -2 + bobY);
  g.lineTo(-9, 0 + bobY);
  g.stroke({ color: 0x887722, width: 1 });
}

/* ---- Dark Mage ---- */
function drawDarkMage(g: Graphics, frame: number, _scale: number): void {
  const floatY = Math.sin(frame * 0.05) * 3;
  // Robe
  g.moveTo(-12, -8 + floatY);
  g.lineTo(-14, 16 + floatY);
  g.lineTo(14, 16 + floatY);
  g.lineTo(12, -8 + floatY);
  g.fill(0x221133);
  // Robe trim
  g.moveTo(-14, 14 + floatY);
  g.lineTo(14, 14 + floatY);
  g.stroke({ color: 0x8844CC, width: 1.5 });
  // Hood
  g.arc(0, -14 + floatY, 10, -Math.PI, 0.2);
  g.fill(0x221133);
  // Eyes
  g.circle(-3, -12 + floatY, 2);
  g.fill(0xAA44FF);
  g.circle(3, -12 + floatY, 2);
  g.fill(0xAA44FF);
  // Staff
  g.rect(14, -20 + floatY, 2, 36);
  g.fill(0x442255);
  // Orb
  g.circle(15, -22 + floatY, 5);
  g.fill({ color: 0xAA44FF, alpha: 0.8 });
  g.circle(15, -22 + floatY, 7);
  g.fill({ color: 0xAA44FF, alpha: 0.15 });
  // Floating particles
  for (let i = 0; i < 4; i++) {
    const px = Math.sin(frame * 0.03 + i * 1.5) * 16;
    const py = Math.cos(frame * 0.04 + i * 1.5) * 10 - 5;
    g.circle(px, py + floatY, 1.5);
    g.fill({ color: 0xAA44FF, alpha: 0.4 });
  }
}

/* ---- Golem ---- */
function drawGolem(g: Graphics, frame: number, _scale: number): void {
  const shake = Math.sin(frame * 0.04) * 1;
  // Body (large rock)
  g.roundRect(-16 + shake, -18, 32, 34, 6);
  g.fill(0x667766);
  g.roundRect(-14                + shake, -16, 28, 30, 4);
  g.fill(0x778877);
  // Cracks
  g.moveTo(-8 + shake, -14);
  g.lineTo(-4 + shake, -4);
  g.lineTo(-10 + shake, 6);
  g.stroke({ color: 0x445544, width: 1.5 });
  g.moveTo(6 + shake, -10);
  g.lineTo(10 + shake, 2);
  g.stroke({ color: 0x445544, width: 1.5 });
  // Glowing core
  g.circle(0 + shake, 0, 5);
  g.fill({ color: 0xFFAA33, alpha: 0.7 });
  g.circle(0 + shake, 0, 8);
  g.fill({ color: 0xFFAA33, alpha: 0.15 });
  // Eyes
  g.rect(-8 + shake, -12, 5, 3);
  g.fill(0xFFAA33);
  g.rect(3 + shake, -12, 5, 3);
  g.fill(0xFFAA33);
  // Arms (huge)
  g.roundRect(-26 + shake, -10, 12, 22, 4);
  g.fill(0x667766);
  g.roundRect(14 + shake, -10, 12, 22, 4);
  g.fill(0x667766);
  // Fists
  g.roundRect(-28 + shake, 8, 14, 10, 4);
  g.fill(0x556655);
  g.roundRect(14 + shake, 8, 14, 10, 4);
  g.fill(0x556655);
  // Legs
  g.roundRect(-12 + shake, 14, 10, 10, 3);
  g.fill(0x556655);
  g.roundRect(2 + shake, 14, 10, 10, 3);
  g.fill(0x556655);
}

/* ---- Dragon Boss ---- */
function drawDragon(g: Graphics, frame: number, _scale: number): void {
  const breathe = Math.sin(frame * 0.03) * 2;
  const wingFlap = Math.sin(frame * 0.05) * 8;

  // Wings (behind)
  // Left wing
  g.moveTo(-10, -20);
  g.bezierCurveTo(-30, -40 - wingFlap, -50, -30 - wingFlap, -45, -10 - wingFlap);
  g.lineTo(-30, -5);
  g.lineTo(-15, -15);
  g.fill(0x771133);
  // Wing membrane
  g.moveTo(-15, -15);
  g.bezierCurveTo(-25, -25 - wingFlap, -40, -20 - wingFlap, -35, -8);
  g.stroke({ color: 0x881144, width: 1 });
  // Right wing
  g.moveTo(10, -20);
  g.bezierCurveTo(30, -40 - wingFlap, 50, -30 - wingFlap, 45, -10 - wingFlap);
  g.lineTo(30, -5);
  g.lineTo(15, -15);
  g.fill(0x771133);

  // Body
  g.ellipse(0, 0 + breathe, 22, 16);
  g.fill(0x882222);
  // Belly scales
  g.ellipse(0, 4 + breathe, 16, 10);
  g.fill(0xCC8844);
  // Scale pattern
  for (let i = -2; i <= 2; i++) {
    g.arc(i * 6, 2 + breathe, 4, -Math.PI * 0.3, Math.PI * 0.3);
    g.stroke({ color: 0xBB7733, width: 0.8 });
  }
  // Neck
  g.moveTo(5, -14 + breathe);
  g.bezierCurveTo(8, -22, 12, -30, 8, -36);
  g.bezierCurveTo(4, -30, 0, -22, -5, -14 + breathe);
  g.fill(0x882222);
  // Head
  g.ellipse(4, -38, 10, 8);
  g.fill(0x992222);
  // Snout
  g.ellipse(12, -36, 6, 4);
  g.fill(0x993322);
  // Horns
  g.moveTo(-2, -44);
  g.lineTo(-6, -54);
  g.lineTo(0, -46);
  g.fill(0x553311);
  g.moveTo(8, -44);
  g.lineTo(14, -54);
  g.lineTo(10, -46);
  g.fill(0x553311);
  // Eyes
  g.ellipse(2, -40, 3, 2.5);
  g.fill(0xFFDD00);
  g.circle(2, -40, 1.2);
  g.fill(0x222222);
  g.ellipse(8, -40, 3, 2.5);
  g.fill(0xFFDD00);
  g.circle(8, -40, 1.2);
  g.fill(0x222222);
  // Fire breath glow
  if (Math.sin(frame * 0.02) > 0.3) {
    g.circle(16, -34, 4);
    g.fill({ color: 0xFF4400, alpha: 0.5 });
    g.circle(20, -33, 3);
    g.fill({ color: 0xFFAA00, alpha: 0.3 });
  }
  // Tail
  const tailSwing = Math.sin(frame * 0.04) * 6;
  g.moveTo(-18, 4 + breathe);
  g.bezierCurveTo(-28, 8, -36 + tailSwing, 4, -40 + tailSwing, -2);
  g.lineTo(-42 + tailSwing, -6);
  g.lineTo(-38 + tailSwing, -4);
  g.stroke({ color: 0x882222, width: 4 });
  // Tail spike
  g.moveTo(-40 + tailSwing, -2);
  g.lineTo(-46 + tailSwing, -6);
  g.lineTo(-42 + tailSwing, 2);
  g.fill(0x553311);
  // Legs
  g.roundRect(-14, 12 + breathe, 8, 12, 3);
  g.fill(0x772222);
  g.roundRect(6, 12 + breathe, 8, 12, 3);
  g.fill(0x772222);
  // Claws
  for (const lx of [-14, 6]) {
    for (let i = 0; i < 3; i++) {
      g.moveTo(lx + 2 + i * 2, 22 + breathe);
      g.lineTo(lx + 1 + i * 2, 26 + breathe);
      g.lineTo(lx + 3 + i * 2, 22 + breathe);
      g.fill(0x444444);
    }
  }
}

/* ---- Merchant NPC ---- */
function drawMerchant(g: Graphics, frame: number): void {
  const bobY = Math.sin(frame * 0.05) * 0.8;
  // Body
  g.roundRect(-10, -10 + bobY, 20, 24, 4);
  g.fill(0x8B6B42);
  // Apron
  g.roundRect(-8, -4 + bobY, 16, 20, 2);
  g.fill(0xDDAA55);
  // Head
  g.circle(0, -18 + bobY, 8);
  g.fill(0xF2D1A0);
  // Hair
  g.arc(0, -18 + bobY, 8.5, -Math.PI, -0.1);
  g.fill(0x886644);
  // Face
  g.circle(-3, -18 + bobY, 1.5);
  g.fill(0x333333);
  g.circle(3, -18 + bobY, 1.5);
  g.fill(0x333333);
  g.arc(0, -15 + bobY, 3, 0, Math.PI);
  g.stroke({ color: 0x884444, width: 0.8 });
  // Hat
  g.roundRect(-10, -26 + bobY, 20, 4, 2);
  g.fill(0x554422);
  g.roundRect(-6, -32 + bobY, 12, 8, 2);
  g.fill(0x554422);
  // Items display (sack)
  g.circle(-14, 6 + bobY, 5);
  g.fill(0x887744);
  g.moveTo(-16, 4 + bobY);
  g.lineTo(-14, 1 + bobY);
  g.lineTo(-12, 4 + bobY);
  g.stroke({ color: 0x665533, width: 1 });
  // Gold icon
  g.circle(13, 0 + bobY, 3);
  g.fill(0xFFDD44);
  g.circle(13, 0 + bobY, 1.5);
  g.fill(0xFFAA00);
}

/* ---- Guard NPC ---- */
function drawGuard(g: Graphics, frame: number): void {
  const bobY = Math.sin(frame * 0.05) * 0.8;
  // Legs
  g.roundRect(-6, 4 + bobY, 5, 14, 2);
  g.fill(0x444466);
  g.roundRect(1, 4 + bobY, 5, 14, 2);
  g.fill(0x444466);
  // Body armor
  g.roundRect(-10, -12 + bobY, 20, 18, 3);
  g.fill(0x888899);
  g.roundRect(-8, -10 + bobY, 16, 14, 2);
  g.fill(0x9999AA);
  // Emblem
  g.circle(0, -4 + bobY, 3);
  g.fill(0xDDAA33);
  // Shoulder plates
  g.roundRect(-14, -12 + bobY, 6, 8, 3);
  g.fill(0x777788);
  g.roundRect(8, -12 + bobY, 6, 8, 3);
  g.fill(0x777788);
  // Head
  g.circle(0, -20 + bobY, 7);
  g.fill(0xF2D1A0);
  // Helmet
  g.arc(0, -20 + bobY, 8, -Math.PI, 0.1);
  g.fill(0x888899);
  // Helmet plume
  g.moveTo(0, -28 + bobY);
  g.bezierCurveTo(4, -32 + bobY, 8, -30 + bobY, 6, -26 + bobY);
  g.fill(0xCC3333);
  // Face
  g.circle(-3, -20 + bobY, 1.5);
  g.fill(0x333333);
  g.circle(3, -20 + bobY, 1.5);
  g.fill(0x333333);
  // Spear
  g.rect(14, -30 + bobY, 2, 44);
  g.fill(0x8B6B42);
  g.moveTo(13, -30 + bobY);
  g.lineTo(15, -36 + bobY);
  g.lineTo(17, -30 + bobY);
  g.fill(0xAAAABB);
}

/* ---- Generic NPC fallback ---- */
function drawGenericNpc(g: Graphics, pal: typeof NPC_PALETTES.enemy, frame: number, scale: number): void {
  const bobY = Math.sin(frame * 0.06) * 1;
  g.roundRect(-8 * scale, -14 * scale + bobY, 16 * scale, 26 * scale, 3);
  g.fill(pal.body);
  g.circle(0, -20 * scale + bobY, 7 * scale);
  g.fill(0xDEB887);
  g.circle(-3 * scale, -20 * scale + bobY, 1.5);
  g.fill(0x222222);
  g.circle(3 * scale, -20 * scale + bobY, 1.5);
  g.fill(0x222222);
}
