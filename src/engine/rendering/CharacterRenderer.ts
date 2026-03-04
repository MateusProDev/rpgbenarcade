// ============================================
// Character Renderer -- Miniatura Heroica
// Proporcoes heroicas realistas: ombros largos, postura firme,
// musculatura definida, sombreamento de volume,
// rosto com tracos marcados, marca runica no ombro,
// veias discretas nos antebracros, cicatriz na sobrancelha.
//
// Sistema de coordenadas (centro = pivot):
//   topo cabeca  : y ~ -42
//   centro cabeca: y ~ -30
//   pescoco      : y ~ -22...-16
//   ombros       : y ~ -16,  x ~ +/-14
//   peito        : y ~ -8
//   cintura      : y ~  0
//   quadril      : y ~  4
//   joelho       : y ~  12
//   tornozelo    : y ~  18
//   sola         : y ~  22
//   sombra       : y ~  24
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

/* ---- Tier numerico por raridade ---- */
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

/* ---- Helpers de cor ---- */
function shd(c: number, amt: number): number {
  const r = Math.max(0, ((c >> 16) & 0xFF) - amt);
  const gv = Math.max(0, ((c >> 8) & 0xFF) - amt);
  const b = Math.max(0, (c & 0xFF) - amt);
  return (r << 16) | (gv << 8) | b;
}
function lgt(c: number, amt: number): number {
  const r = Math.min(255, ((c >> 16) & 0xFF) + amt);
  const gv = Math.min(255, ((c >> 8) & 0xFF) + amt);
  const b = Math.min(255, (c & 0xFF) + amt);
  return (r << 16) | (gv << 8) | b;
}

/* ---- Paleta por classe ---- */
export const CLASS_PALETTE: Record<PlayerClass, {
  primary: number; secondary: number; accent: number;
  skin: number; hair: number; weapon: number; cape: number;
  cloth: number; pants: number;
}> = {
  warrior: {
    primary:   0x8B2020, secondary: 0xA83030, accent: 0xD4A030,
    skin:      0xC8854A, hair:      0x2E1A08, weapon: 0xCCCCDD,
    cape:      0x601010, cloth:     0xC0B488, pants:  0x5A4226,
  },
  mage: {
    primary:   0x1A3090, secondary: 0x2850CC, accent: 0x66AAFF,
    skin:      0xD8BE8A, hair:      0xD8D0C0, weapon: 0x5522AA,
    cape:      0x0E1A55, cloth:     0xB0ACC8, pants:  0x707098,
  },
  archer: {
    primary:   0x1E5225, secondary: 0x2E6E38, accent: 0x88BB33,
    skin:      0xBB8850, hair:      0xAA6622, weapon: 0x6A4C24,
    cape:      0x102214, cloth:     0x5A6820, pants:  0x9A7840,
  },
  assassin: {
    primary:   0x281440, secondary: 0x3E2260, accent: 0xAA44DD,
    skin:      0xC09060, hair:      0x0E0E18, weapon: 0x44446A,
    cape:      0x180A28, cloth:     0x343344, pants:  0x1E1E2C,
  },
};

/* ---- Cores de armadura por tier ---- */
function armorTorsoColor(t: number, p: typeof CLASS_PALETTE.warrior): number {
  if (t === 0) return p.cloth;
  if (t === 1) return 0x6E5030;
  if (t === 2) return 0x5C5040;
  if (t === 3) return 0x4A6890;
  if (t === 4) return p.primary;
  return 0xA88818;
}
function armorPantsColor(t: number, p: typeof CLASS_PALETTE.warrior): number {
  if (t === 0) return p.pants;
  if (t === 1) return 0x4A3820;
  if (t === 2) return 0x404050;
  if (t === 3) return 0x385580;
  if (t === 4) return p.secondary;
  return 0x906E10;
}
function bootsColor(t: number): number {
  if (t === 0) return 0x3C2C18;
  if (t === 1) return 0x4E2C10;
  if (t === 2) return 0x684C28;
  if (t === 3) return 0x2E3C4A;
  if (t === 4) return 0x441A66;
  return 0xAA9422;
}
function shoulderColor(t: number, accent: number): number {
  if (t <= 1) return 0;
  if (t === 2) return 0x585030;
  if (t === 3) return 0x2E4870;
  if (t === 4) return 0x441A70;
  return accent;
}

/* ====================================================================
   PERSONAGEM JOGADOR -- Miniatura Heroica Detalhada
==================================================================== */
export function drawCharacterBody(
  g: Graphics,
  cls: PlayerClass,
  dir: Direction,
  frame: number = 0,
  equip: EquipmentVisuals = {},
): void {
  const p = CLASS_PALETTE[cls];

  const bob  = Math.sin(frame * 0.08) * 1.6;
  const leg1 = Math.sin(frame * 0.11) * 5.0;
  const leg2 = -leg1;
  const arm1 = Math.sin(frame * 0.11) * 4.5;
  const arm2 = -arm1;

  const tArmor  = tier(equip.armorRarity);
  const tHelm   = tier(equip.helmetRarity);
  const tBoots  = tier(equip.bootsRarity);
  const tWeapon = tier(equip.weaponRarity);

  const torsoC = armorTorsoColor(tArmor, p);
  const pantsC = armorPantsColor(tArmor, p);
  const bootC  = bootsColor(tBoots);
  const shoulC = shoulderColor(tArmor, p.accent);

  // ========================================================
  // SOMBRA PROJETADA (elipse seguindo silhueta do corpo)
  // ========================================================
  g.ellipse(2, 25, 18, 5.5);
  g.fill({ color: 0x000000, alpha: 0.35 });
  // sombra interna mais escura (centro do corpo)
  g.ellipse(1, 24, 11, 3);
  g.fill({ color: 0x000000, alpha: 0.15 });

  // ========================================================
  // CAPA (tier >= 2)
  // ========================================================
  if (tArmor >= 2 && dir !== 'up') {
    const capeC = tArmor >= 5 ? 0x771AAA : p.cape;
    const cw    = Math.sin(frame * 0.05) * 3.5;
    g.moveTo(-11, -14 + bob);
    g.bezierCurveTo(-16, 0 + bob, -13 + cw, 18 + bob, -4, 23 + bob);
    g.lineTo(4, 23 + bob);
    g.bezierCurveTo(13 - cw, 18 + bob, 16, 0 + bob, 11, -14 + bob);
    g.fill({ color: capeC, alpha: 0.88 });
    // dobra central da capa
    g.moveTo(-2, -10 + bob);
    g.bezierCurveTo(-3, 2 + bob, -2 + cw * 0.3, 14 + bob, 0, 21 + bob);
    g.fill({ color: shd(capeC, 35), alpha: 0.28 });
    // borda lateral iluminada
    g.moveTo(-11, -14 + bob);
    g.bezierCurveTo(-14, -2 + bob, -12 + cw, 10 + bob, -4, 23 + bob);
    g.stroke({ color: lgt(capeC, 30), width: 0.8, alpha: 0.4 });
  }

  // ========================================================
  // PERNAS (coxas robustas + panturrilhas definidas)
  // ========================================================
  const drawLeg = (offX: number, swing: number, isBack: boolean): void => {
    const al  = isBack ? 0.62 : 1.0;
    const sdV = isBack ? -38 : 0;
    const tw  = 5.8; // largura da coxa
    const knX = offX + swing * 0.42;
    const anX = offX + swing * 0.68;
    const fxB = anX + (offX < 0 ? -1.5 : 2);

    // Coxa robusta
    g.moveTo(offX - tw, 4 + bob);
    g.bezierCurveTo(offX - tw - 1.5, 7 + bob, knX - 4, 10 + bob, knX - 3, 12.5 + bob + swing * 0.12);
    g.bezierCurveTo(knX + 3.5, 12.5 + bob + swing * 0.12, offX + tw + 1.5, 7 + bob, offX + tw, 4 + bob);
    g.fill({ color: pantsC + sdV, alpha: al });

    // Linha muscular quadriceps (frente)
    if (!isBack) {
      g.moveTo(offX + 2, 5 + bob);
      g.bezierCurveTo(offX + 3.5, 8 + bob, knX + 2, 11 + bob, knX + 2, 12.5 + bob);
      g.stroke({ color: shd(pantsC, 38), width: 0.9, alpha: 0.5 });
    }

    // Rotula (joelho visivel)
    g.ellipse(knX, 12.5 + bob + swing * 0.12, 3.2, 2.6);
    g.fill({ color: shd(pantsC + sdV, 18), alpha: al });
    if (!isBack) {
      g.ellipse(knX - 0.5, 12 + bob, 1.5, 1.2);
      g.fill({ color: lgt(pantsC, 10), alpha: 0.35 });
    }

    // Canela com panturrilha definida (gastrocnemio)
    g.moveTo(knX - 3, 12.5 + bob + swing * 0.12);
    g.bezierCurveTo(knX - 3.5, 14.5 + bob, anX - 2.8, 17 + bob, anX - 2, 18.5 + bob);
    g.bezierCurveTo(anX + 3, 17.5 + bob, knX + 3.5, 14.5 + bob, knX + 3, 12.5 + bob + swing * 0.12);
    g.fill({ color: shd(pantsC + sdV, 12), alpha: al });
    // curva do gastrocnemio
    if (!isBack) {
      g.moveTo(knX + 3, 13 + bob);
      g.bezierCurveTo(knX + 5, 15 + bob, anX + 3.5, 17 + bob, anX + 2, 18.5 + bob);
      g.stroke({ color: shd(pantsC, 48), width: 0.8, alpha: 0.55 });
    }

    // Bota / pe
    g.moveTo(anX - 2.5, 18.5 + bob);
    g.bezierCurveTo(anX - 3, 20.5 + bob, fxB - 1.5, 22.5 + bob, fxB + 7, 22.5 + bob);
    g.bezierCurveTo(fxB + 8.5, 22.5 + bob, fxB + 8, 19.5 + bob, anX + 2.5, 18.5 + bob);
    g.fill({ color: bootC, alpha: al });
    // sola
    if (!isBack) {
      g.moveTo(fxB, 23 + bob); g.lineTo(fxB + 7.5, 23 + bob);
      g.stroke({ color: shd(bootC, 55), width: 1.2, alpha: 0.8 });
    }
    // fivela da bota
    if (tBoots >= 2 && !isBack) {
      g.roundRect(anX - 2, 19.5 + bob, 4, 2.5, 0.8);
      g.fill({ color: p.accent, alpha: al });
    }
    // brilho lendario
    if (tBoots >= 5) {
      g.ellipse(anX, 21 + bob, 7, 3);
      g.fill({ color: 0xFFCC22, alpha: 0.28 * al });
    }
  };

  // Z-order: perna que recua vai por baixo, perna que avanca fica por cima
  if (leg1 >= 0) {
    drawLeg(6, leg2, true);    // perna direita recuando (desenhada primeiro)
    drawLeg(-6, leg1, false);  // perna esquerda avancando (por cima)
  } else {
    drawLeg(-6, leg1, true);   // perna esquerda recuando (desenhada primeiro)
    drawLeg(6, leg2, false);   // perna direita avancando (por cima)
  }

  // ========================================================
  // TRONCO (proporcoes heroicas: ombros +/-14, cintura +/-8)
  // ========================================================

  // Quadril levemente alargado
  g.moveTo(-11, 2 + bob);
  g.bezierCurveTo(-12, 4.5 + bob, -11, 7.5 + bob, -8.5, 7.5 + bob);
  g.lineTo(8.5, 7.5 + bob);
  g.bezierCurveTo(11, 7.5 + bob, 12, 4.5 + bob, 11, 2 + bob);
  g.bezierCurveTo(9, 0.5 + bob, -9, 0.5 + bob, -11, 2 + bob);
  g.fill(shd(pantsC, 18));

  // Cinto com fivela central
  const beltY = 0.5 + bob;
  g.roundRect(-10, beltY - 2.5, 20, 5, 2.5);
  g.fill(tArmor >= 1 ? 0x3A2408 : 0x6A4820);
  if (tArmor >= 2) {
    g.roundRect(-4.5, beltY - 3.5, 9, 7, 2.5); g.fill(p.accent);
    g.roundRect(-3, beltY - 2, 6, 4, 1.5);     g.fill(shd(p.accent, 70));
    g.circle(0, beltY, 2);                       g.fill(lgt(p.accent, 30));
  } else {
    g.roundRect(-3, beltY - 2, 6, 4, 1.5); g.fill(0x5A3C18);
  }

  // TORSO BASE -- cintura ~+-8, alarga progressivavmente
  //   ate ombros ~+-14 (silhueta heroica em V)
  g.moveTo(-8.5, 0.5 + bob);             // cintura esq
  g.bezierCurveTo(-10, -5 + bob, -13, -11 + bob, -14.5, -16 + bob); // flanco esq ate ombro
  g.lineTo(14.5, -16 + bob);             // linha do ombro
  g.bezierCurveTo(13, -11 + bob, 10, -5 + bob, 8.5, 0.5 + bob);    // flanco dir
  g.bezierCurveTo(6, 2 + bob, -6, 2 + bob, -8.5, 0.5 + bob);
  g.fill(torsoC);

  // Sombreamento lateral direito (iluminacao da esq)
  g.moveTo(7.5, 0.5 + bob);
  g.bezierCurveTo(9, -5 + bob, 12, -11 + bob, 14.5, -16 + bob);
  g.lineTo(11, -16 + bob);
  g.bezierCurveTo(10, -11 + bob, 8, -5 + bob, 6.5, 0.5 + bob);
  g.fill({ color: shd(torsoC, 32), alpha: 0.6 });

  // Highlight lateral esquerdo
  g.moveTo(-7.5, 0.5 + bob);
  g.bezierCurveTo(-9, -6 + bob, -11.5, -11 + bob, -13, -16 + bob);
  g.lineTo(-10.5, -16 + bob);
  g.bezierCurveTo(-9, -11 + bob, -6.5, -6 + bob, -5.5, 0.5 + bob);
  g.fill({ color: lgt(torsoC, 28), alpha: 0.38 });

  // Definicao peitoral (musculos pec sob a roupa/armadura)
  if (tArmor <= 2) {
    // arco do peitoral esq
    g.moveTo(-13, -15 + bob);
    g.bezierCurveTo(-13, -8 + bob, -5, -4.5 + bob, 0, -5.5 + bob);
    g.stroke({ color: shd(torsoC, 42), width: 1.2, alpha: 0.65 });
    // arco peitoral dir
    g.moveTo(13, -15 + bob);
    g.bezierCurveTo(13, -8 + bob, 5, -4.5 + bob, 0, -5.5 + bob);
    g.stroke({ color: shd(torsoC, 42), width: 1.2, alpha: 0.65 });
    // linha esternal central
    g.moveTo(0, -15 + bob); g.lineTo(0, -0.5 + bob);
    g.stroke({ color: shd(torsoC, 28), width: 0.9, alpha: 0.45 });
    // linha abdominal inferior (2 costelas)
    g.moveTo(-7, -3 + bob); g.lineTo(7, -3 + bob);
    g.stroke({ color: shd(torsoC, 22), width: 0.7, alpha: 0.35 });
  }

  // Detalhes por classe
  if (cls === 'warrior') {
    if (tArmor === 0) {
      // costura V da camisa de linho
      g.moveTo(-6, -15 + bob); g.lineTo(0, -9 + bob); g.lineTo(6, -15 + bob);
      g.stroke({ color: shd(torsoC, 30), width: 1.1, alpha: 0.6 });
    } else if (tArmor <= 2) {
      // colete de couro com tiras horizontais
      g.moveTo(-10, -13 + bob); g.lineTo(10, -13 + bob);
      g.stroke({ color: shd(torsoC, 35), width: 1.5 });
      g.moveTo(-11, -7.5 + bob); g.lineTo(11, -7.5 + bob);
      g.stroke({ color: shd(torsoC, 28), width: 1.2 });
      // rebites
      for (const rx of [-7.5, 0, 7.5]) {
        g.circle(rx, -13 + bob, 1.3); g.fill(shd(torsoC, 60));
      }
    } else {
      // placa de armadura
      g.moveTo(-5, -15.5 + bob); g.lineTo(5, -15.5 + bob);
      g.stroke({ color: p.accent, width: 2.2 });
      g.moveTo(-14, -7 + bob); g.lineTo(14, -7 + bob);
      g.stroke({ color: p.accent, width: 1.6, alpha: 0.8 });
      g.moveTo(0, -15 + bob); g.lineTo(0, 0 + bob);
      g.stroke({ color: p.accent, width: 1.5, alpha: 0.75 });
    }
  } else if (cls === 'mage') {
    if (tArmor === 0) {
      // robe com decote rúnico bordado
      g.moveTo(-7, -15 + bob); g.lineTo(0, -8 + bob); g.lineTo(7, -15 + bob);
      g.stroke({ color: shd(torsoC, 25), width: 1.3, alpha: 0.7 });
      g.moveTo(-1.5, -8 + bob); g.lineTo(-1.5, -0.5 + bob);
      g.stroke({ color: shd(torsoC, 18), width: 0.8, alpha: 0.4 });
    } else {
      drawStar(g, 0, -8.5 + bob, 2.5, 4.5, tArmor >= 5 ? 0xFFDD44 : p.accent);
      g.moveTo(-11, -14 + bob); g.lineTo(-11, -0.5 + bob);
      g.stroke({ color: p.accent, width: 0.9, alpha: 0.4 });
      g.moveTo(11, -14 + bob);  g.lineTo(11, -0.5 + bob);
      g.stroke({ color: p.accent, width: 0.9, alpha: 0.4 });
    }
  } else if (cls === 'archer') {
    // tirantes de couro cruzados
    g.moveTo(-11, -15 + bob); g.lineTo(6, 0.5 + bob);
    g.stroke({ color: shd(torsoC, 48), width: 2.2, alpha: 0.75 });
    g.moveTo(11, -15 + bob); g.lineTo(-6, 0.5 + bob);
    g.stroke({ color: shd(torsoC, 48), width: 2.2, alpha: 0.75 });
    if (tArmor >= 3) {
      g.circle(0, -7 + bob, 3.5); g.fill({ color: p.accent, alpha: 0.7 });
    }
  } else {
    // assassin: colete escuro com fivelas
    g.roundRect(-11, -15 + bob, 22, 8, 2.5);
    g.fill({ color: 0x000000, alpha: 0.25 });
    if (tArmor >= 2) {
      for (const fx of [-5.5, 5.5]) {
        g.roundRect(fx - 2, -11 + bob, 4, 3, 1);
        g.fill(0x7A7A8E);
      }
    }
    if (tArmor >= 3) {
      g.roundRect(-10, -3 + bob, 4.5, 6, 1.5); g.fill(0x332244);
      g.roundRect(5.5, -3 + bob, 4.5, 6, 1.5); g.fill(0x332244);
    }
  }

  // Brilho de armadura alta
  if (tArmor >= 4) {
    g.moveTo(-14.5, -16 + bob); g.lineTo(14.5, -16 + bob);
    g.stroke({ color: tArmor >= 5 ? 0xFFEE44 : lgt(p.accent, 50), width: 1.8, alpha: tArmor >= 5 ? 0.8 : 0.45 });
    g.roundRect(-14, -16 + bob, 28, 17, 4);
    g.stroke({ color: tArmor >= 5 ? 0xFFDD44 : p.accent, width: 1.1, alpha: 0.25 });
  }

  // ========================================================
  // OMBREIRAS VOLUMOSAS (tier >= 2)
  // ========================================================
  if (tArmor >= 2 && shoulC !== 0) {
    // ombreira esquerda -- com aresta iluminada
    g.ellipse(-13.5, -15 + bob, 7, 5.5); g.fill(shoulC);
    g.ellipse(-14, -15.5 + bob, 5.5, 3.5); g.fill(lgt(shoulC, 28));
    g.circle(-13.5, -14.5 + bob, 1.8); g.fill(p.accent);
    // sombra inferior da ombreira
    g.moveTo(-18, -13 + bob); g.lineTo(-10, -13 + bob);
    g.stroke({ color: shd(shoulC, 40), width: 0.9, alpha: 0.5 });
    // ombreira direita
    g.ellipse(13.5, -15 + bob, 7, 5.5); g.fill(shoulC);
    g.ellipse(14, -15.5 + bob, 5.5, 3.5); g.fill(lgt(shoulC, 28));
    g.circle(13.5, -14.5 + bob, 1.8); g.fill(p.accent);
    g.moveTo(10, -13 + bob); g.lineTo(18, -13 + bob);
    g.stroke({ color: shd(shoulC, 40), width: 0.9, alpha: 0.5 });
    // aura lendaria
    if (tArmor >= 5) {
      g.ellipse(-13.5, -15 + bob, 11, 8); g.fill({ color: p.accent, alpha: 0.18 });
      g.ellipse(13.5, -15 + bob, 11, 8); g.fill({ color: p.accent, alpha: 0.18 });
    }
  }

  // ========================================================
  // BRACOS MUSCULOSOS
  // ========================================================
  const drawArm = (side: -1 | 1, swing: number, isBack: boolean): void => {
    const al  = isBack ? 0.62 : 1.0;
    const sdV = isBack ? -40 : 0;
    const sx  = side * 11.5;          // raiz no ombro
    const elX = sx + swing * side * 0.58;  // cotovelo
    const wrX = sx + swing * side * 1.1;   // pulso

    // Bicep / braco superior (espesso, muscular)
    g.moveTo(sx - 4 * side, -15.5 + bob);
    g.bezierCurveTo(
      sx - 6.5 * side, -9 + bob,
      elX - 4.5,        -3.5 + bob + swing * 0.13,
      elX - 3,          -4 + bob + swing * 0.13,
    );
    g.bezierCurveTo(
      elX + 3,           -4 + bob + swing * 0.13,
      sx + 5.5 * side,  -9 + bob,
      sx + 3.5 * side,  -15.5 + bob,
    );
    g.fill({ color: torsoC + sdV, alpha: al });

    // Highlight do bicep (crista muscular)
    if (!isBack) {
      g.moveTo(sx - 5 * side, -13.5 + bob);
      g.bezierCurveTo(sx - 7 * side, -8 + bob, elX - 5.5, -5 + bob, elX - 3.5, -4 + bob);
      g.stroke({ color: lgt(torsoC, 32), width: 0.9, alpha: 0.5 });
    }

    // Cotovelo articular
    g.circle(elX, -4 + bob + swing * 0.13, 3.2);
    g.fill({ color: shd(torsoC + sdV, 22), alpha: al });

    // Antebraco (levemente mais espesso que a media = atletico)
    g.moveTo(elX - 3, -4 + bob + swing * 0.13);
    g.bezierCurveTo(elX - 3.8, 2.5 + bob, wrX - 3, 5.5 + bob, wrX - 2.5, 7 + bob + swing * 0.22);
    g.bezierCurveTo(wrX + 3, 6.5 + bob, elX + 3.5, 2.5 + bob, elX + 3, -4 + bob + swing * 0.13);
    g.fill({ color: lgt(torsoC + sdV, 10), alpha: al });

    // Veias discretas no antebraco (apenas sem armadura)
    if (!isBack && tArmor <= 1) {
      const veinC = shd(p.skin, 30);
      g.moveTo(elX - 0.5, -1 + bob + swing * 0.1);
      g.bezierCurveTo(elX - 1, 2.5 + bob, wrX - 1.5, 5.5 + bob, wrX - 1.5, 7 + bob + swing * 0.18);
      g.stroke({ color: veinC, width: 0.7, alpha: 0.52 });
      g.moveTo(elX + 1, 0 + bob);
      g.bezierCurveTo(elX + 0.5, 3 + bob, wrX + 0.8, 5.5 + bob, wrX + 0.5, 6.5 + bob);
      g.stroke({ color: veinC, width: 0.5, alpha: 0.38 });
    }

    // MAO com proporco realista e dedos visiveis
    g.ellipse(wrX, 9 + bob + swing * 0.3, 3.8, 3.2);
    g.fill({ color: p.skin, alpha: al });
    // knuckles (4 dedos)
    if (!isBack) {
      for (let fi = 0; fi < 4; fi++) {
        const kx = wrX - 3.2 + fi * 2.2;
        const ky = 10.5 + bob + swing * 0.32 + (fi === 0 || fi === 3 ? 0.6 : 0);
        g.circle(kx, ky, 1.0); g.fill({ color: shd(p.skin, 22), alpha: 0.9 });
      }
      // polegar (lateral)
      g.circle(wrX + 3.5 * side, 8.5 + bob + swing * 0.25, 1.1);
      g.fill({ color: shd(p.skin, 18), alpha: 0.8 });
    }

    // Bracelete / luva tier >= 3
    if (tArmor >= 3) {
      g.roundRect(wrX - 4, 4.5 + bob + swing * 0.2, 8, 5.5, 2.5);
      g.fill({ color: tArmor >= 5 ? 0xBBAA22 : 0x5A6878, alpha: al });
      g.moveTo(wrX - 3.5, 6 + bob + swing * 0.2); g.lineTo(wrX + 3.5, 6 + bob + swing * 0.2);
      g.stroke({ color: lgt(tArmor >= 5 ? 0xBBAA22 : 0x5A6878, 35), width: 0.8, alpha: al * 0.65 });
    }

    // Marca runica no ombro esquerdo (apenas sem armadura)
    if (tArmor === 0 && side === -1 && !isBack) {
      drawRune(g, sx - 0.5, -12 + bob, p.skin);
    }
  };

  // Z-order: braco que recua vai por baixo do torso, braco que avanca fica por cima
  if (arm1 > 0) {
    drawArm(1, arm2, true);    // braco direito recuando (desenhado primeiro)
    drawArm(-1, arm1, false);  // braco esquerdo avancando (por cima)
  } else {
    drawArm(-1, arm1, true);   // braco esquerdo recuando (desenhado primeiro)
    drawArm(1, arm2, false);   // braco direito avancando (por cima)
  }

  // ========================================================
  // PESCOCO FORTE E CURTO
  // ========================================================
  const headY = -31 + bob;

  // Corpo do pescoco (espesso)
  g.moveTo(-5, -16 + bob);
  g.bezierCurveTo(-5, -19.5 + bob, -4, -22 + bob, 0, -22 + bob);
  g.bezierCurveTo(4, -22 + bob, 5, -19.5 + bob, 5, -16 + bob);
  g.fill(p.skin);
  // Musculos do trapezio (lateral do pescoco)
  g.moveTo(-4.5, -16 + bob); g.lineTo(-7, -14 + bob); g.lineTo(-3, -22 + bob);
  g.fill({ color: shd(p.skin, 28), alpha: 0.45 });
  g.moveTo(4.5, -16 + bob); g.lineTo(7, -14 + bob); g.lineTo(3, -22 + bob);
  g.fill({ color: shd(p.skin, 28), alpha: 0.45 });
  // linha central do pescoco (esternocleidomastoideo)
  g.moveTo(0, -16 + bob); g.lineTo(0, -22.5 + bob);
  g.stroke({ color: shd(p.skin, 35), width: 0.9, alpha: 0.3 });

  // ========================================================
  // CABECA HEROICA (queixo marcado, mandibula estruturada)
  // ========================================================

  // Cranio (cabeca um pouco mais comprimida para top-down)
  g.ellipse(0, headY, 9.5, 9.8);
  g.fill(p.skin);

  // Mandibula / bochecha
  g.moveTo(-7.5, headY + 3);
  g.bezierCurveTo(-9, headY + 6.5, -7, headY + 10, -3.5, headY + 12.5);
  g.bezierCurveTo(-1.5, headY + 14, 1.5, headY + 14, 3.5, headY + 12.5);
  g.bezierCurveTo(7, headY + 10, 9, headY + 6.5, 7.5, headY + 3);
  g.fill(p.skin);

  // Queixo marcado (plano central do queixo)
  g.moveTo(-2.5, headY + 13.5);
  g.bezierCurveTo(-2, headY + 15, 2, headY + 15, 2.5, headY + 13.5);
  g.fill(shd(p.skin, 18));

  // Linha da mandibula (estruturada)
  g.moveTo(-7.5, headY + 3.5);
  g.bezierCurveTo(-9, headY + 7, -7.5, headY + 11, -4, headY + 12);
  g.stroke({ color: shd(p.skin, 38), width: 1, alpha: 0.6 });
  g.moveTo(7.5, headY + 3.5);
  g.bezierCurveTo(9, headY + 7, 7.5, headY + 11, 4, headY + 12);
  g.stroke({ color: shd(p.skin, 38), width: 1, alpha: 0.6 });

  // Sombreamento lateral (volume craniano)
  g.ellipse(4.5, headY + 1, 4, 7.5);
  g.fill({ color: shd(p.skin, 28), alpha: 0.32 });

  // Textura de pele (microdetalhe)
  if (dir !== 'up') {
    for (let ti = 0; ti < 3; ti++) {
      const tx = -3 + ti * 3;
      g.circle(tx, headY + 8, 0.6);
      g.fill({ color: shd(p.skin, 12), alpha: 0.28 });
    }
  }

  // Orelhas
  if (tHelm === 0) {
    if (dir === 'down' || dir === 'up') {
      // orelha esq
      g.ellipse(-10.5, headY + 0, 2.2, 3.2); g.fill(shd(p.skin, 18));
      g.ellipse(-10.5, headY + 0, 1.2, 1.8); g.fill(shd(p.skin, 35));
      // orelha dir
      g.ellipse(10.5, headY + 0, 2.2, 3.2); g.fill(shd(p.skin, 18));
      g.ellipse(10.5, headY + 0, 1.2, 1.8); g.fill(shd(p.skin, 35));
    } else if (dir === 'left') {
      g.ellipse(7.5, headY + 0, 2, 3); g.fill(shd(p.skin, 18));
      g.ellipse(7.5, headY + 0, 1.1, 1.7); g.fill(shd(p.skin, 30));
    } else {
      g.ellipse(-7.5, headY + 0, 2, 3); g.fill(shd(p.skin, 18));
      g.ellipse(-7.5, headY + 0, 1.1, 1.7); g.fill(shd(p.skin, 30));
    }
  }

  // CABELO
  if (tHelm === 0) drawHair(g, cls, dir, headY, frame, p);

  // Vista traseira: topo do cabelo
  if (dir === 'up' && tHelm === 0) {
    g.arc(0, headY - 1, 10, -Math.PI, 0);
    g.fill(p.hair);
    if (cls === 'warrior') {
      // espinhos na vista traseira
      for (let si = -8; si <= 8; si += 4) {
        g.moveTo(si, headY - 9); g.lineTo(si + 1, headY - 15); g.lineTo(si + 2.5, headY - 9);
        g.fill(p.hair);
      }
    }
  }

  // ROSTO
  if (dir !== 'up') drawFace(g, cls, dir, headY, p);

  // CAPACETE
  if (tHelm >= 1) drawHelmet(g, cls, dir, headY, tHelm, p, frame);

  // ARMA
  drawWeaponSprite(g, cls, dir, bob, arm2, frame, p, tWeapon);
}

// ======================================================
//  MARCA RUNICA (entalhe na pele do ombro)
// ======================================================
function drawRune(
  g: Graphics, cx: number, cy: number, skinC: number,
): void {
  const rc = shd(skinC, 62);
  const rl = 0.7;
  // Runa tipo Elder Futhark: 3 tracos verticais + 2 diagonais
  g.moveTo(cx - 2.5, cy - 3); g.lineTo(cx - 2.5, cy + 3);
  g.stroke({ color: rc, width: rl, alpha: 0.7 });
  g.moveTo(cx,       cy - 3); g.lineTo(cx,       cy + 3);
  g.stroke({ color: rc, width: rl, alpha: 0.7 });
  g.moveTo(cx + 2.5, cy - 3); g.lineTo(cx + 2.5, cy + 3);
  g.stroke({ color: rc, width: rl, alpha: 0.7 });
  g.moveTo(cx - 2.5, cy - 3); g.lineTo(cx,       cy);
  g.stroke({ color: rc, width: rl, alpha: 0.55 });
  g.moveTo(cx,       cy - 3); g.lineTo(cx + 2.5, cy);
  g.stroke({ color: rc, width: rl, alpha: 0.55 });
  // ponto central
  g.circle(cx, cy + 3.5, 0.7); g.fill({ color: rc, alpha: 0.5 });
}

// ======================================================
//  CABELO por classe
// ======================================================
function drawHair(
  g: Graphics, cls: PlayerClass, dir: Direction,
  headY: number, frame: number, p: typeof CLASS_PALETTE.warrior,
): void {
  if (cls === 'warrior') {
    // Cabelo curto com espinhos agressivos
    g.arc(0, headY, 10.5, -Math.PI, 0.1); g.fill(p.hair);
    // costeleta (sideburn)
    if (dir !== 'up') {
      g.moveTo(-8.5, headY + 5); g.bezierCurveTo(-11, headY + 9, -9, headY + 14, -6, headY + 13);
      g.fill(shd(p.hair, 20));
      if (dir === 'down') {
        g.moveTo(8.5, headY + 5); g.bezierCurveTo(11, headY + 9, 9, headY + 14, 6, headY + 13);
        g.fill(shd(p.hair, 20));
      }
    }
    // Espinhos no topo
    const spikes = [-5, -3, -1, 1, 3, 5];
    for (const sx of spikes) {
      const h = 12 + Math.abs(sx) * 0.4;
      g.moveTo(sx * 1.5, headY - 7);
      g.lineTo(sx * 1.5 + 1.2, headY - 7 - h);
      g.lineTo(sx * 1.5 + 2.8, headY - 7);
      g.fill(p.hair);
      // aresta brilhante no espinho
      g.moveTo(sx * 1.5 + 1, headY - 7);
      g.lineTo(sx * 1.5 + 1.6, headY - 7 - h * 0.75);
      g.stroke({ color: lgt(p.hair, 25), width: 0.6, alpha: 0.5 });
    }
  } else if (cls === 'mage') {
    // Cabelo longo prateado/branco ondulado
    g.arc(0, headY, 10.5, -Math.PI, 0.1); g.fill(p.hair);
    const wave = Math.sin(frame * 0.04) * 2.5;
    // Mecha esquerda -- cai pelo lado externo, NAO entra na area do rosto
    g.moveTo(-9.5, headY - 1);
    g.bezierCurveTo(-13.5, headY + 5 + wave, -13, headY + 11, -10.5, headY + 14);
    g.lineTo(-8.5, headY + 14);
    g.bezierCurveTo(-10, headY + 9, -10, headY + 3, -7, headY - 1);
    g.fill(p.hair);
    // reflexo no fio esquerdo
    g.moveTo(-10, headY);
    g.bezierCurveTo(-13, headY + 6 + wave, -12.5, headY + 10, -10, headY + 13);
    g.stroke({ color: lgt(p.hair, 40), width: 0.9, alpha: 0.45 });
    // Mecha direita -- cai pelo lado direito
    if (dir !== 'up') {
      g.moveTo(9.5, headY - 1);
      g.bezierCurveTo(13.5, headY + 5 + wave, 13, headY + 11, 10.5, headY + 14);
      g.lineTo(8.5, headY + 14);
      g.bezierCurveTo(10, headY + 9, 10, headY + 3, 7, headY - 1);
      g.fill(p.hair);
      // reflexo no fio direito
      g.moveTo(10, headY);
      g.bezierCurveTo(13, headY + 6 + wave, 12.5, headY + 10, 10, headY + 13);
      g.stroke({ color: lgt(p.hair, 40), width: 0.9, alpha: 0.45 });
    }
    // Chapeu pontudo basico (antes do capacete)
    g.moveTo(-9, headY - 8);
    g.lineTo(0, headY - 25);
    g.lineTo(9, headY - 8);
    g.fill(p.cloth);
    // borda do chapeu
    g.moveTo(-11, headY - 7); g.lineTo(11, headY - 7);
    g.stroke({ color: p.accent, width: 2.2 });
    drawStar(g, 1.5, headY - 17, 2, 3.5, p.accent);
    // reflexo no chapeu
    g.moveTo(-4, headY - 9); g.lineTo(-1, headY - 22);
    g.stroke({ color: lgt(p.cloth, 28), width: 0.8, alpha: 0.4 });
  } else if (cls === 'archer') {
    // Rabo de cavalo + bandana
    g.arc(0, headY, 10.5, -Math.PI, -0.1); g.fill(p.hair);
    // bandana
    g.arc(0, headY - 2, 11, -Math.PI * 0.88, -Math.PI * 0.12);
    g.stroke({ color: p.accent, width: 2.5 });
    // rabo ondulante
    const tailW = Math.sin(frame * 0.07) * 4.5;
    if (dir !== 'left') {
      g.moveTo(7.5, headY - 5);
      g.bezierCurveTo(15, headY + 1, 17 + tailW, headY + 12, 13 + tailW, headY + 20);
      g.stroke({ color: p.hair, width: 4.5 });
      // fio de destaque no rabo
      g.moveTo(7, headY - 5);
      g.bezierCurveTo(13, headY + 1, 15 + tailW * 0.8, headY + 12, 11 + tailW * 0.8, headY + 20);
      g.stroke({ color: lgt(p.hair, 30), width: 1.2, alpha: 0.4 });
    } else {
      g.moveTo(-7.5, headY - 5);
      g.bezierCurveTo(-15, headY + 1, -17 + tailW, headY + 12, -13 + tailW, headY + 20);
      g.stroke({ color: p.hair, width: 4.5 });
    }
  } else {
    // Assassino: capuz escuro profundo
    g.arc(0, headY, 11.5, -Math.PI, 0.22); g.fill(p.primary);
    // volume do capuz
    g.arc(0, headY - 1, 12, -Math.PI * 0.95, -Math.PI * 0.05);
    g.stroke({ color: p.secondary, width: 2 });
    // sombra interna do capuz
    g.arc(0, headY, 10, -Math.PI * 0.55, Math.PI * 0.2);
    g.fill({ color: 0x000000, alpha: 0.28 });
    // dobra lateral do capuz
    g.moveTo(-10, headY - 4); g.bezierCurveTo(-12, headY + 2, -11, headY + 8, -8, headY + 12);
    g.stroke({ color: shd(p.primary, 25), width: 0.9, alpha: 0.5 });
  }
}

// ======================================================
//  ROSTO -- tracros marcados, simplificados para top-down
// ======================================================
function drawFace(
  g: Graphics, cls: PlayerClass, dir: Direction,
  headY: number, p: typeof CLASS_PALETTE.warrior,
): void {
  const shift = dir === 'left' ? -3 : dir === 'right' ? 2.5 : 0;
  const mirrorX = (x: number) => dir === 'left' ? -x + shift + 2 : x + shift;

  if (cls !== 'assassin') {

    // --- Sobrancelhas anguladas (descendo para o centro) ---
    // Sobrancelha esquerda (angulada = mais baixa no centro)
    g.moveTo(-6 + shift, headY - 5.5);
    g.bezierCurveTo(-4.5 + shift, headY - 6, -2.5 + shift, headY - 5.5, -1 + shift, headY - 4.8);
    g.stroke({ color: p.hair, width: 1.6 });
    // Sobrancelha direita
    g.moveTo(6 + shift, headY - 5.5);
    g.bezierCurveTo(4.5 + shift, headY - 6, 2.5 + shift, headY - 5.5, 1 + shift, headY - 4.8);
    g.stroke({ color: p.hair, width: 1.6 });

    // --- Cicatriz discreta na sobrancelha esquerda ---
    // (independente de classe, marca de personagem real)
    const scarX = mirrorX(-4.5);
    g.moveTo(scarX - 0.5, headY - 6.5);
    g.lineTo(scarX + 1, headY - 4.5);
    g.stroke({ color: lgt(p.skin, 38), width: 0.9, alpha: 0.7 });

    // --- Olhos pequenos e expressivos ---
    const eyeC = cls === 'warrior' ? 0x4A2E0E
               : cls === 'mage'   ? 0x3366BB
               : cls === 'archer' ? 0x2A5520
               :                    0x442255;
    for (const isLeft of [true, false]) {
      const ex = (isLeft ? -3.8 : 3.8) + shift;
      // esclera
      g.ellipse(ex, headY - 1.8, 2.6, 2.1); g.fill(0xF5F0E8);
      // palpebra superior (sombra leve)
      g.moveTo(ex - 2.5, headY - 2.5); g.lineTo(ex + 2.5, headY - 2.5);
      g.stroke({ color: shd(p.skin, 18), width: 0.7, alpha: 0.4 });
      // iris
      g.ellipse(ex + 0.3, headY - 1.7, 1.7, 1.7); g.fill(eyeC);
      // pupila
      g.circle(ex + 0.5, headY - 1.6, 0.85); g.fill(0x0C0C1A);
      // reflexo
      g.circle(ex + 0.9, headY - 2.2, 0.5); g.fill({ color: 0xFFFFFF, alpha: 0.85 });
    }

    // --- Nariz curto e bem definido ---
    g.moveTo(0.5 + shift, headY + 0.8);
    g.bezierCurveTo(-1.2 + shift, headY + 2.8, -1.8 + shift, headY + 4, -0.2 + shift, headY + 4.5);
    g.stroke({ color: shd(p.skin, 22), width: 1.0, alpha: 0.65 });
    // narina esq
    g.ellipse(-1.2 + shift, headY + 4.5, 1.1, 0.8);
    g.fill({ color: shd(p.skin, 32), alpha: 0.55 });
    // narina dir
    g.ellipse(1.2 + shift, headY + 4.5, 1.1, 0.8);
    g.fill({ color: shd(p.skin, 32), alpha: 0.55 });

    // --- Boca por classe ---
    if (cls === 'warrior') {
      // Expressao serena-determinada (linha fechada)
      g.moveTo(-2.8 + shift, headY + 7.5); g.lineTo(2.8 + shift, headY + 7.5);
      g.stroke({ color: shd(p.skin, 42), width: 1.1 });
      // labio superior (linha discreta)
      g.moveTo(-2.2 + shift, headY + 6.5);
      g.bezierCurveTo(-0.8 + shift, headY + 6, 0.8 + shift, headY + 6, 2.2 + shift, headY + 6.5);
      g.stroke({ color: shd(p.skin, 30), width: 0.8, alpha: 0.55 });
    } else if (cls === 'mage') {
      // Leve sorriso arrogante
      g.moveTo(-2.5 + shift, headY + 7);
      g.bezierCurveTo(-1 + shift, headY + 8.5, 1 + shift, headY + 8.5, 2.5 + shift, headY + 7);
      g.stroke({ color: shd(p.skin, 35), width: 1, alpha: 0.8 });
    } else {
      // Neutro-amigavel
      g.moveTo(-2.2 + shift, headY + 7);
      g.bezierCurveTo(-0.8 + shift, headY + 8, 0.8 + shift, headY + 8, 2.2 + shift, headY + 7);
      g.stroke({ color: shd(p.skin, 30), width: 1, alpha: 0.75 });
    }

    // Contorno estetico do queixo na vista frontal
    if (dir === 'down') {
      g.moveTo(-1.5, headY + 13); g.lineTo(0, headY + 14.5); g.lineTo(1.5, headY + 13);
      g.stroke({ color: shd(p.skin, 25), width: 0.8, alpha: 0.5 });
    }

  } else {
    // --- Assassino: olhos brilhantes + mascara lower-face ---
    const sX1 = -3.5 + shift, sX2 = 3.5 + shift;
    // olho esq
    g.circle(sX1, headY - 1.5, 2); g.fill({ color: p.accent, alpha: 0.9 });
    g.circle(sX1, headY - 1.5, 1.1); g.fill({ color: 0x000000, alpha: 0.8 });
    g.circle(sX1 + 0.6, headY - 2.1, 0.55); g.fill({ color: 0xFFFFFF, alpha: 0.7 });
    // olho dir
    g.circle(sX2, headY - 1.5, 2); g.fill({ color: p.accent, alpha: 0.9 });
    g.circle(sX2, headY - 1.5, 1.1); g.fill({ color: 0x000000, alpha: 0.8 });
    g.circle(sX2 + 0.6, headY - 2.1, 0.55); g.fill({ color: 0xFFFFFF, alpha: 0.7 });
    // mascara lower-face
    g.roundRect(-7 + shift, headY + 1.5, 14, 10, 2);
    g.fill({ color: p.primary, alpha: 0.92 });
    // detalhe costura da mascara
    g.moveTo(-5 + shift, headY + 5); g.lineTo(5 + shift, headY + 5);
    g.stroke({ color: p.secondary, width: 0.9, alpha: 0.55 });
    g.moveTo(-5 + shift, headY + 8); g.lineTo(5 + shift, headY + 8);
    g.stroke({ color: p.secondary, width: 0.7, alpha: 0.4 });
  }
}

// ======================================================
//  CAPACETE por tier
// ======================================================
function drawHelmet(
  g: Graphics, cls: PlayerClass, _dir: Direction,
  headY: number, t: number, p: typeof CLASS_PALETTE.warrior, frame: number,
): void {
  if (cls === 'warrior' || cls === 'assassin') {
    if (t === 1) {
      // Capacete de couro
      g.arc(0, headY, 11, -Math.PI * 0.96, 0.08); g.fill(0x6A4E28);
      g.arc(0, headY, 11.5, -Math.PI * 0.88, -Math.PI * 0.12);
      g.stroke({ color: shd(0x6A4E28, 30), width: 1 });
    } else if (t === 2) {
      // Elmo aberto de ferro
      g.arc(0, headY, 11.5, -Math.PI, 0.12); g.fill(0x7A7055);
      g.rect(-2, headY - 2, 4, 10); g.fill(0x6A6045);
      g.arc(0, headY, 12, -Math.PI * 0.92, -Math.PI * 0.08);
      g.stroke({ color: lgt(0x7A7055, 25), width: 1.2 });
    } else if (t === 3) {
      // Elmo de cota de malha
      g.arc(0, headY, 11.5, -Math.PI, 0.12); g.fill(0x5A7088);
      g.arc(0, headY - 1, 12, -Math.PI * 0.9, -Math.PI * 0.1);
      g.stroke({ color: p.accent, width: 1.6 });
      // nasal
      g.rect(-1.5, headY, 3, 9); g.fill(0x4A6078);
    } else if (t === 4) {
      // Elmo fechado epico
      g.ellipse(0, headY, 11.5, 12.5); g.fill(p.primary);
      g.rect(-2, headY - 4, 4, 14); g.fill(p.accent);
      g.arc(0, headY - 1, 12.5, -Math.PI, 0.15);
      g.stroke({ color: p.accent, width: 1.5 });
      // viseira horizontal
      g.moveTo(-10, headY + 1); g.lineTo(10, headY + 1);
      g.stroke({ color: p.accent, width: 0.9 });
    } else {
      // Elmo lendario com chifres
      g.ellipse(0, headY, 12, 13); g.fill(p.primary);
      g.ellipse(0, headY, 15.5, 16.5); g.fill({ color: 0xFFDD44, alpha: 0.16 });
      // chifres
      g.moveTo(-6, headY - 10); g.bezierCurveTo(-10, headY - 20, -9, headY - 28, -5, headY - 24);
      g.fill(0xCCBB33);
      g.moveTo(6, headY - 10); g.bezierCurveTo(10, headY - 20, 9, headY - 28, 5, headY - 24);
      g.fill(0xCCBB33);
      // highlight nos chifres
      g.moveTo(-8, headY - 12); g.bezierCurveTo(-9.5, headY - 20, -8.5, headY - 26, -5.5, headY - 23);
      g.stroke({ color: lgt(0xCCBB33, 35), width: 0.8, alpha: 0.55 });
      g.arc(0, headY, 13, -Math.PI * 0.96, 0.12); g.stroke({ color: 0xFFEE44, width: 1.8 });
      // glow
      const gl = Math.sin(frame * 0.06) * 0.08 + 0.12;
      g.ellipse(0, headY, 17, 18); g.fill({ color: 0xFFCC22, alpha: gl });
    }
  } else if (cls === 'mage') {
    const hats = [0x2A3855, 0x1A3899, 0x3355BB, 0x7733AA, 0xBB9918];
    const hatC = hats[Math.min(t - 1, 4)];
    const hatH = 20 + t * 2.5;
    g.moveTo(-10, headY - 7); g.lineTo(0, headY - hatH); g.lineTo(10, headY - 7);
    g.fill(hatC);
    // borda do chapeu
    g.moveTo(-12, headY - 6); g.lineTo(12, headY - 6);
    g.stroke({ color: p.accent, width: 2.5 });
    // fita decorativa
    g.moveTo(-10, headY - 9); g.lineTo(10, headY - 9);
    g.stroke({ color: lgt(hatC, 25), width: 1.2, alpha: 0.5 });
    if (t >= 3) {
      drawStar(g, 0, headY - hatH * 0.6, 3, 5.5, p.accent);
    }
    if (t >= 5) {
      const glow = Math.sin(frame * 0.06) * 0.12 + 0.2;
      g.circle(0, headY - hatH * 0.6, 9);
      g.fill({ color: 0xAADDFF, alpha: glow });
    }
    // reflexo lateral do chapeu
    g.moveTo(-5, headY - 9); g.lineTo(-1, headY - hatH * 0.92);
    g.stroke({ color: lgt(hatC, 40), width: 0.8, alpha: 0.4 });
  } else {
    // archer
    if (t <= 2) {
      // Chapeu de aventureiro com pena
      g.arc(0, headY - 1, 11.5, -Math.PI * 0.88, -Math.PI * 0.12);
      g.stroke({ color: t === 1 ? 0x7A5C30 : p.accent, width: 2.8 });
      // pena
      g.moveTo(8, headY - 10);
      g.bezierCurveTo(15, headY - 20, 12, headY - 16, 7, headY - 8);
      g.fill(t === 1 ? 0xDDDD88 : p.accent);
      g.moveTo(8, headY - 10); g.lineTo(12, headY - 18);
      g.stroke({ color: lgt(0xDDDD88, 20), width: 0.8, alpha: 0.5 });
    } else {
      // Elmo de couro duro com viseira
      g.arc(0, headY, 11.5, -Math.PI, 0.12); g.fill(0x3E5A22);
      g.arc(0, headY - 1, 12.5, -Math.PI * 0.92, -Math.PI * 0.08);
      g.stroke({ color: p.accent, width: 1.6 });
      if (t >= 5) {
        const gl = Math.sin(frame * 0.07) * 0.1 + 0.14;
        g.ellipse(0, headY, 14, 14.5); g.fill({ color: p.accent, alpha: gl });
      }
    }
  }
}

// ======================================================
//  ARMA por classe e tier
// ======================================================
function drawWeaponSprite(
  g: Graphics, cls: PlayerClass, _dir: Direction,
  bobY: number, armSwing: number, frame: number,
  p: typeof CLASS_PALETTE.warrior, tW: number,
): void {
  const wb = Math.sin(frame * 0.05) * 1.2;
  const bladeC  = tW === 0 ? 0x999999 : tW <= 2 ? 0xBBBBCC : tW <= 3 ? 0xCCDDEE : tW >= 5 ? 0xFFEE77 : p.accent;
  const handleC = tW === 0 ? 0x5A3A10 : tW <= 2 ? 0x7A4A18 : 0x1C1C3A;

  if (cls === 'warrior') {
    const sx = 16, sy = -5 + bobY - armSwing + wb;
    if (tW === 0) {
      // espada improvisada (madeira com fio metalico)
      g.rect(sx - 1, sy - 15, 2, 17); g.fill(0x7A7A7A);
      g.moveTo(sx, sy - 15); g.lineTo(sx + 0.8, sy - 2);
      g.stroke({ color: 0xCCCCCC, width: 0.7, alpha: 0.5 });
      g.rect(sx - 5, sy, 10, 2); g.fill(0x5A4A2A);
      g.rect(sx - 1.5, sy + 1.5, 3, 8); g.fill(0x7A5C2A);
    } else {
      // lamina
      g.moveTo(sx, sy);
      g.lineTo(sx + 3, sy - 19); g.lineTo(sx, sy - 22); g.lineTo(sx - 3, sy - 19);
      g.closePath(); g.fill(bladeC);
      // aresta da lamina
      g.moveTo(sx, sy); g.lineTo(sx + 1, sy - 18);
      g.stroke({ color: 0xFFFFFF, width: 0.8, alpha: 0.6 });
      g.moveTo(sx, sy); g.lineTo(sx - 0.5, sy - 18);
      g.stroke({ color: shd(bladeC, 30), width: 0.6, alpha: 0.4 });
      // guarda
      g.rect(sx - 5.5, sy, 11, 2.5); g.fill(tW >= 5 ? 0xCCBB33 : p.accent);
      g.moveTo(sx - 5.5, sy + 0.5); g.lineTo(sx + 5.5, sy + 0.5);
      g.stroke({ color: lgt(tW >= 5 ? 0xCCBB33 : p.accent, 40), width: 0.7, alpha: 0.6 });
      // cabo
      g.rect(sx - 1.8, sy + 2, 3.5, 9); g.fill(handleC);
      // enrolamento do cabo
      for (let ti = 0; ti < 3; ti++) {
        g.rect(sx - 1.8, sy + 3 + ti * 2.5, 3.5, 1);
        g.fill({ color: lgt(handleC, 20), alpha: 0.5 });
      }
      // pomo
      g.circle(sx, sy + 12, 2.5); g.fill(tW >= 5 ? 0xCCBB33 : p.accent);
      // glow epico
      if (tW >= 4) {
        g.moveTo(sx, sy); g.lineTo(sx, sy - 22);
        g.stroke({ color: bladeC, width: 4, alpha: 0.16 });
      }
      // Escudo (tier >= 2)
      if (tW >= 2) {
        const shX = -18, shY = -0.5 + bobY + armSwing;
        const shW = 11 + tW * 1.5, shH = 16 + tW * 2;
        g.roundRect(shX - shW / 2, shY - shH / 2, shW, shH, 4);
        g.fill(tW >= 5 ? 0x882299 : 0x5A6878);
        g.roundRect(shX - shW / 2 + 2, shY - shH / 2 + 2, shW - 4, shH - 4, 3);
        g.fill(tW >= 5 ? 0xAA33CC : 0x7A8898);
        // emblema
        g.circle(shX, shY, 3.5 + tW * 0.4);
        g.fill(tW >= 4 ? p.accent : 0xDDAA22);
        // borda
        g.roundRect(shX - shW / 2, shY - shH / 2, shW, shH, 4);
        g.stroke({ color: lgt(tW >= 5 ? 0x882299 : 0x5A6878, 25), width: 0.9, alpha: 0.5 });
      }
    }
  } else if (cls === 'mage') {
    const sx = 16, sy = -16 + bobY + wb;
    const staffC = tW === 0 ? 0x8A6238 : tW <= 2 ? 0x6A4820 : tW >= 5 ? 0x881ABB : 0x3A3A99;
    // cabo do cajado
    g.rect(sx - 1.2, sy, 2.4, 35); g.fill(staffC);
    // detalhes no cajado
    if (tW >= 2) {
      for (let i = 1; i <= Math.min(tW, 4); i++) {
        g.ellipse(sx, sy + i * 7.5, 2.8, 2);
        g.fill(i % 2 === 0 ? p.accent : lgt(staffC, 20));
      }
    }
    // reflexo no cajado
    g.moveTo(sx - 0.5, sy + 1); g.lineTo(sx - 0.5, sy + 34);
    g.stroke({ color: lgt(staffC, 30), width: 0.7, alpha: 0.35 });
    // orbe
    const orbR = 4 + tW * 0.8;
    g.circle(sx, sy - 2, orbR);
    g.fill({ color: tW >= 5 ? 0xFFDD33 : p.accent, alpha: 0.9 });
    g.circle(sx, sy - 2, orbR * 0.7);
    g.fill({ color: 0xFFFFFF, alpha: 0.2 });
    // highlight do orbe
    g.circle(sx - orbR * 0.3, sy - orbR * 0.4, orbR * 0.28);
    g.fill({ color: 0xFFFFFF, alpha: 0.4 });
    // glow animado
    const glowR = orbR + 3.5 + Math.sin(frame * 0.07) * 2.5;
    g.circle(sx, sy - 2, glowR);
    g.fill({ color: p.accent, alpha: tW >= 5 ? 0.28 : 0.14 });
    // runa no cajado (tier >= 3)
    if (tW >= 3) {
      for (let i = 0; i < 3; i++) {
        g.circle(sx, sy + 10 + i * 8, 1.1);
        g.fill({ color: p.accent, alpha: 0.55 });
      }
    }
    // grimorio no cinto (tier >= 2)
    if (tW >= 2) {
      g.roundRect(-15, 0 + bobY, 7, 8, 2);
      g.fill(tW >= 5 ? 0x38155A : 0x4A2A18);
      g.rect(-14, 1 + bobY, 5, 1.2); g.fill(p.accent);
      g.rect(-14, 3 + bobY, 5, 1);   g.fill({ color: p.accent, alpha: 0.5 });
    }
  } else if (cls === 'archer') {
    const bx = -16, by = -9 + bobY;
    const arcR = 12 + tW * 0.8;
    const bowC = tW === 0 ? 0x7A5C28 : tW <= 2 ? p.weapon : tW >= 5 ? 0xFFDD33 : p.accent;
    // arco
    g.arc(bx, by + 8, arcR, -Math.PI * 0.72, Math.PI * 0.72);
    g.stroke({ color: bowC, width: 2.5 + tW * 0.25 });
    // corda
    g.moveTo(bx + arcR * Math.cos(-Math.PI * 0.72), by + 8 + arcR * Math.sin(-Math.PI * 0.72));
    g.lineTo(bx + arcR * Math.cos(Math.PI * 0.72), by + 8 + arcR * Math.sin(Math.PI * 0.72));
    g.stroke({ color: 0xCCCCCC, width: 1 });
    // highlight no arco
    g.arc(bx, by + 8, arcR, -Math.PI * 0.6, Math.PI * 0.1);
    g.stroke({ color: lgt(bowC, 30), width: 0.8, alpha: 0.4 });
    // aljava
    const qW = 5.5 + tW * 0.4;
    g.roundRect(11, -13 + bobY, qW, 20 + tW, 2.5);
    g.fill(tW === 0 ? 0x6A4A28 : tW <= 2 ? 0x7A5C32 : tW >= 5 ? 0x3322AA : p.weapon);
    g.roundRect(11, -13 + bobY, qW, 3, 2);
    g.fill(shd(tW === 0 ? 0x6A4A28 : p.weapon, 25));
    // flechas
    const arrowQty = Math.min(3 + tW, 6);
    for (let i = 0; i < arrowQty; i++) {
      // haste
      g.rect(12 + i * 1.0, -16 + bobY, 1, 7); g.fill(0x8A6832);
      // ponta
      g.moveTo(12 + i * 1.0, -16 + bobY);
      g.lineTo(12.5 + i * 1.0, -19.5 + bobY);
      g.lineTo(13 + i * 1.0, -16 + bobY);
      g.fill(tW >= 3 ? p.accent : 0xBBBBBB);
    }
    // glow lendario do arco
    if (tW >= 4) {
      g.arc(bx, by + 8, arcR + 2.5, -Math.PI * 0.72, Math.PI * 0.72);
      g.stroke({ color: p.accent, width: 1.2, alpha: 0.32 });
    }
  } else {
    // assassin -- adagas duplas
    const db = Math.sin(frame * 0.09) * 2;
    const drawDag = (dx: number, ds: number): void => {
      const ty = 2 + bobY + ds + db;
      // cabo
      g.roundRect(dx - 1.5, ty, 3, 5, 1.5); g.fill(handleC);
      // enrolamento
      for (let wi = 0; wi < 2; wi++) {
        g.rect(dx - 1.4, ty + 1 + wi * 2, 2.8, 0.9);
        g.fill({ color: lgt(handleC, 22), alpha: 0.55 });
      }
      // guarda
      g.rect(dx - 4, ty, 8, 2); g.fill(tW >= 5 ? 0xCCBB22 : 0x484460);
      // lamina
      g.moveTo(dx - 2, ty - 1);
      g.lineTo(dx, ty - 13 - tW * 1.8);
      g.lineTo(dx + 2, ty - 1);
      g.fill(bladeC);
      // aresta
      g.moveTo(dx, ty - 1); g.lineTo(dx + 0.6, ty - 12 - tW * 1.5);
      g.stroke({ color: 0xFFFFFF, width: 0.7, alpha: 0.55 });
      // glow veneno
      if (tW >= 2) {
        g.circle(dx, ty - 12 - tW * 1.8, 2.5);
        g.fill({ color: tW >= 5 ? 0xFFDD22 : 0x44FF88, alpha: 0.24 });
      }
    };
    drawDag(-15, armSwing);
    drawDag(15, -armSwing);
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
