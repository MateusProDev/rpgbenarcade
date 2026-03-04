// ============================================
// Character Renderer — highly-detailed procedural character sprites
// Uses PixiJS Graphics API to draw rich, class-specific characters
// with armor details, hair, capes, weapons, idle animations, etc.
// All rendering is cached to RenderTexture for performance.
// ============================================
import { Container, Graphics, Text, RenderTexture, Sprite } from 'pixi.js';
import type { PlayerClass, Direction } from '@/store/types';

/* ---- Palette per class ---- */
export const CLASS_PALETTE: Record<PlayerClass, {
  primary: number; secondary: number; accent: number;
  skin: number; hair: number; weapon: number; cape: number;
}> = {
  warrior: {
    primary: 0x8B2222, secondary: 0xA63333, accent: 0xD4A444,
    skin: 0xF2D1A0, hair: 0x5C3A1E, weapon: 0xAAAAAA, cape: 0x6B1111,
  },
  mage: {
    primary: 0x2244AA, secondary: 0x3366CC, accent: 0x88CCFF,
    skin: 0xF2D1A0, hair: 0xE8E0D4, weapon: 0x7744CC, cape: 0x1A2266,
  },
  archer: {
    primary: 0x2B6B3A, secondary: 0x3D8B4D, accent: 0xAADD66,
    skin: 0xDEB887, hair: 0xCC8844, weapon: 0x8B6B42, cape: 0x1A4422,
  },
  assassin: {
    primary: 0x3A2255, secondary: 0x553377, accent: 0xCC66FF,
    skin: 0xE8D0B0, hair: 0x1A1A2E, weapon: 0x666688, cape: 0x221133,
  },
};

/* ---- Draw detailed character body into a Graphics object ---- */
export function drawCharacterBody(
  g: Graphics,
  cls: PlayerClass,
  dir: Direction,
  frame: number = 0,
): void {
  const p = CLASS_PALETTE[cls];
  const bobY = Math.sin(frame * 0.08) * 1.2;

  // === Shadow ===
  g.ellipse(0, 18, 14, 5);
  g.fill({ color: 0x000000, alpha: 0.3 });

  // === Cape (behind body) ===
  if (dir === 'down' || dir === 'left' || dir === 'right') {
    const capeWave = Math.sin(frame * 0.06) * 2;
    g.moveTo(-9, -10 + bobY);
    g.bezierCurveTo(-11, 5 + bobY, -8 + capeWave, 14 + bobY, -3, 16 + bobY);
    g.lineTo(3, 16 + bobY);
    g.bezierCurveTo(8 - capeWave, 14 + bobY, 11, 5 + bobY, 9, -10 + bobY);
    g.fill({ color: p.cape, alpha: 0.85 });
    // Cape highlight
    g.moveTo(-5, -6 + bobY);
    g.bezierCurveTo(-6, 4 + bobY, -4, 10 + bobY, -1, 14 + bobY);
    g.lineTo(1, 14 + bobY);
    g.bezierCurveTo(4, 10 + bobY, 6, 4 + bobY, 5, -6 + bobY);
    g.fill({ color: p.cape + 0x222222, alpha: 0.3 });
  }

  // === Legs ===
  const legSwing = Math.sin(frame * 0.12) * 3;
  // Left leg
  g.roundRect(-7, 4 + bobY, 6, 14, 2);
  g.fill(p.primary - 0x111111);
  // Right leg
  g.roundRect(1, 4 + bobY, 6, 14, 2);
  g.fill(p.primary - 0x111111);
  // Boots
  g.roundRect(-8, 14 + bobY + legSwing * 0.3, 7, 5, 2);
  g.fill(0x443322);
  g.roundRect(1, 14 + bobY - legSwing * 0.3, 7, 5, 2);
  g.fill(0x443322);
  // Boot buckles
  g.rect(-6, 15 + bobY + legSwing * 0.3, 3, 1.5);
  g.fill(p.accent);
  g.rect(3, 15 + bobY - legSwing * 0.3, 3, 1.5);
  g.fill(p.accent);

  // === Torso (main body) ===
  g.roundRect(-10, -14 + bobY, 20, 20, 4);
  g.fill(p.primary);
  // Chest plate / robe detail
  g.roundRect(-8, -12 + bobY, 16, 16, 3);
  g.fill(p.secondary);
  // Center detail line
  g.rect(-1, -10 + bobY, 2, 12);
  g.fill({ color: p.accent, alpha: 0.6 });

  // Class-specific torso details
  if (cls === 'warrior') {
    // Chest cross armor
    g.moveTo(-8, -6 + bobY);
    g.lineTo(8, -6 + bobY);
    g.stroke({ color: p.accent, width: 1.5, alpha: 0.7 });
    g.moveTo(0, -12 + bobY);
    g.lineTo(0, 4 + bobY);
    g.stroke({ color: p.accent, width: 1.5, alpha: 0.7 });
    // Shoulder plates
    g.roundRect(-14, -14 + bobY, 6, 8, 3);
    g.fill(0x888888);
    g.roundRect(8, -14 + bobY, 6, 8, 3);
    g.fill(0x888888);
    // Shoulder rivets
    g.circle(-11, -10 + bobY, 1.2);
    g.fill(p.accent);
    g.circle(11, -10 + bobY, 1.2);
    g.fill(p.accent);
  } else if (cls === 'mage') {
    // Robe collar / V-neck
    g.moveTo(-6, -12 + bobY);
    g.lineTo(0, -4 + bobY);
    g.lineTo(6, -12 + bobY);
    g.stroke({ color: p.accent, width: 1.5 });
    // Star emblem
    drawStar(g, 0, -7 + bobY, 3, 5, p.accent);
    // Robe sash
    g.moveTo(-8, 2 + bobY);
    g.bezierCurveTo(-4, 6 + bobY, 4, 6 + bobY, 8, 2 + bobY);
    g.stroke({ color: p.accent, width: 1.2 });
  } else if (cls === 'archer') {
    // Leather straps
    g.moveTo(-7, -12 + bobY);
    g.lineTo(5, 2 + bobY);
    g.stroke({ color: 0x5C3A1E, width: 2 });
    g.moveTo(7, -12 + bobY);
    g.lineTo(-5, 2 + bobY);
    g.stroke({ color: 0x5C3A1E, width: 2 });
    // Belt
    g.rect(-9, 1 + bobY, 18, 3);
    g.fill(0x5C3A1E);
    g.rect(-2, 1 + bobY, 4, 3);
    g.fill(p.accent);
  } else if (cls === 'assassin') {
    // Hood shadow overlay on torso
    g.roundRect(-8, -13 + bobY, 16, 8, 3);
    g.fill({ color: 0x000000, alpha: 0.2 });
    // Belt with pouches
    g.rect(-9, 1 + bobY, 18, 3);
    g.fill(0x333344);
    g.roundRect(-8, -1 + bobY, 4, 5, 1);
    g.fill(0x443355);
    g.roundRect(4, -1 + bobY, 4, 5, 1);
    g.fill(0x443355);
  }

  // === Arms ===
  const armSwing = Math.sin(frame * 0.1) * 2;
  // Left arm
  g.roundRect(-14, -12 + bobY + armSwing, 5, 16, 2);
  g.fill(p.primary);
  // Right arm
  g.roundRect(9, -12 + bobY - armSwing, 5, 16, 2);
  g.fill(p.primary);
  // Hands (skin)
  g.circle(-11.5, 5 + bobY + armSwing, 2.5);
  g.fill(p.skin);
  g.circle(11.5, 5 + bobY - armSwing, 2.5);
  g.fill(p.skin);

  // Warrior: gauntlets
  if (cls === 'warrior') {
    g.roundRect(-14, -1 + bobY + armSwing, 5, 6, 1);
    g.fill(0x777777);
    g.roundRect(9, -1 + bobY - armSwing, 5, 6, 1);
    g.fill(0x777777);
  }

  // === Head ===
  const headY = -22 + bobY;
  // Neck
  g.rect(-2, -15 + bobY, 4, 4);
  g.fill(p.skin);
  // Head shape
  g.circle(0, headY, 9);
  g.fill(p.skin);

  // Hair based on class
  if (cls === 'warrior') {
    // Short spiky
    g.arc(0, headY, 9.5, -Math.PI, 0);
    g.fill(p.hair);
    for (let i = -3; i <= 3; i++) {
      g.moveTo(i * 2.5, headY - 9);
      g.lineTo(i * 2.5 + 1, headY - 13 - Math.abs(i));
      g.lineTo(i * 2.5 + 2, headY - 9);
      g.fill(p.hair);
    }
  } else if (cls === 'mage') {
    // Long flowing hair
    g.arc(0, headY, 9.5, -Math.PI, 0);
    g.fill(p.hair);
    // Side hair
    g.moveTo(-9, headY);
    g.bezierCurveTo(-11, headY + 6, -10, headY + 14, -7, headY + 18);
    g.lineTo(-5, headY + 18);
    g.bezierCurveTo(-8, headY + 12, -8, headY + 6, -6, headY);
    g.fill(p.hair);
    g.moveTo(9, headY);
    g.bezierCurveTo(11, headY + 6, 10, headY + 14, 7, headY + 18);
    g.lineTo(5, headY + 18);
    g.bezierCurveTo(8, headY + 12, 8, headY + 6, 6, headY);
    g.fill(p.hair);
    // Wizard hat
    g.moveTo(-8, headY - 6);
    g.lineTo(0, headY - 22);
    g.lineTo(8, headY - 6);
    g.fill(p.primary);
    g.moveTo(-10, headY - 5);
    g.lineTo(10, headY - 5);
    g.stroke({ color: p.accent, width: 2 });
    // Hat star
    drawStar(g, 0, headY - 14, 2, 4, p.accent);
  } else if (cls === 'archer') {
    // Ponytail
    g.arc(0, headY, 9.5, -Math.PI, -0.2);
    g.fill(p.hair);
    // Ponytail back
    const tailWave = Math.sin(frame * 0.07) * 3;
    g.moveTo(6, headY - 4);
    g.bezierCurveTo(12, headY + 2, 14 + tailWave, headY + 10, 10 + tailWave, headY + 16);
    g.stroke({ color: p.hair, width: 4 });
    // Headband
    g.arc(0, headY, 10, -Math.PI * 0.8, -Math.PI * 0.2);
    g.stroke({ color: p.accent, width: 2 });
  } else if (cls === 'assassin') {
    // Hood
    g.arc(0, headY, 11, -Math.PI, 0.1);
    g.fill(p.primary);
    // Hood edge
    g.arc(0, headY, 11.5, -Math.PI * 0.8, -Math.PI * 0.15);
    g.stroke({ color: p.secondary, width: 1.5 });
    // Face shadow
    g.arc(0, headY, 9, -Math.PI * 0.4, Math.PI * 0.1);
    g.fill({ color: 0x000000, alpha: 0.25 });
  }

  // === Face (direction-dependent) ===
  if (dir !== 'up') {
    // Eyes
    const eyeSpacing = dir === 'left' ? -3 : dir === 'right' ? 1 : 0;
    if (cls !== 'assassin') {
      // Left eye
      g.ellipse(-3 + eyeSpacing, headY - 1, 2.5, 2);
      g.fill(0xFFFFFF);
      g.circle(-3 + eyeSpacing + 0.5, headY - 0.5, 1.2);
      g.fill(0x222233);
      g.circle(-3 + eyeSpacing + 0.8, headY - 1, 0.5);
      g.fill(0xFFFFFF);
      // Right eye
      g.ellipse(3 + eyeSpacing, headY - 1, 2.5, 2);
      g.fill(0xFFFFFF);
      g.circle(3 + eyeSpacing + 0.5, headY - 0.5, 1.2);
      g.fill(0x222233);
      g.circle(3 + eyeSpacing + 0.8, headY - 1, 0.5);
      g.fill(0xFFFFFF);
    } else {
      // Assassin: glowing eyes
      g.circle(-3 + eyeSpacing, headY - 1, 1.5);
      g.fill(p.accent);
      g.circle(3 + eyeSpacing, headY - 1, 1.5);
      g.fill(p.accent);
    }

    // Mouth
    if (cls !== 'assassin') {
      g.moveTo(-2, headY + 3);
      g.bezierCurveTo(-1, headY + 4.5, 1, headY + 4.5, 2, headY + 3);
      g.stroke({ color: 0x884444, width: 0.8 });
    }

    // Eyebrows
    g.moveTo(-5, headY - 4);
    g.lineTo(-1, headY - 3.5);
    g.stroke({ color: p.hair, width: 1.2 });
    g.moveTo(5, headY - 4);
    g.lineTo(1, headY - 3.5);
    g.stroke({ color: p.hair, width: 1.2 });
  }

  // === Weapon (class-specific) ===
  drawWeapon(g, cls, dir, bobY, armSwing, frame, p);
}

/* ---- Draw weapon per class ---- */
function drawWeapon(
  g: Graphics,
  cls: PlayerClass,
  dir: Direction,
  bobY: number,
  armSwing: number,
  frame: number,
  p: typeof CLASS_PALETTE.warrior,
): void {
  const weaponBob = Math.sin(frame * 0.05) * 1;

  if (cls === 'warrior') {
    // Sword on right side
    const sx = 14, sy = -8 + bobY - armSwing + weaponBob;
    // Blade
    g.moveTo(sx, sy);
    g.lineTo(sx + 3, sy - 20);
    g.lineTo(sx, sy - 22);
    g.lineTo(sx - 3, sy - 20);
    g.closePath();
    g.fill(0xCCCCDD);
    // Blade edge highlight
    g.moveTo(sx, sy);
    g.lineTo(sx + 1, sy - 18);
    g.stroke({ color: 0xFFFFFF, width: 0.8, alpha: 0.6 });
    // Guard
    g.rect(sx - 5, sy - 1, 10, 2);
    g.fill(p.accent);
    // Handle
    g.rect(sx - 1.5, sy, 3, 8);
    g.fill(0x5C3A1E);
    // Pommel
    g.circle(sx, sy + 9, 2);
    g.fill(p.accent);
    // Shield on left
    const shX = -16, shY = -4 + bobY + armSwing;
    g.roundRect(shX - 6, shY - 8, 12, 16, 3);
    g.fill(0x666688);
    g.roundRect(shX - 4, shY - 6, 8, 12, 2);
    g.fill(0x888899);
    // Shield emblem
    g.circle(shX, shY, 3);
    g.fill(p.accent);
  } else if (cls === 'mage') {
    // Staff
    const sx = 14, sy = -20 + bobY + weaponBob;
    g.rect(sx - 1, sy, 2, 35);
    g.fill(0x775533);
    // Orb on top
    g.circle(sx, sy - 2, 4);
    g.fill({ color: p.accent, alpha: 0.9 });
    g.circle(sx, sy - 2, 3);
    g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    // Orb glow
    g.circle(sx, sy - 2, 6);
    g.fill({ color: p.accent, alpha: 0.15 });
    // Staff runes
    for (let i = 0; i < 3; i++) {
      g.circle(sx, sy + 8 + i * 8, 1);
      g.fill({ color: p.accent, alpha: 0.5 });
    }
    // Spell book on belt
    g.roundRect(-13, 0 + bobY, 5, 6, 1);
    g.fill(0x553322);
    g.rect(-12, 1 + bobY, 3, 1);
    g.fill(p.accent);
  } else if (cls === 'archer') {
    // Bow on back
    const bx = -14, by = -12 + bobY;
    g.arc(bx, by + 8, 12, -Math.PI * 0.7, Math.PI * 0.7);
    g.stroke({ color: p.weapon, width: 2.5 });
    // Bowstring
    g.moveTo(bx + 12 * Math.cos(-Math.PI * 0.7), by + 8 + 12 * Math.sin(-Math.PI * 0.7));
    g.lineTo(bx + 12 * Math.cos(Math.PI * 0.7), by + 8 + 12 * Math.sin(Math.PI * 0.7));
    g.stroke({ color: 0xCCCCCC, width: 0.8 });
    // Quiver on back
    g.roundRect(10, -15 + bobY, 5, 18, 2);
    g.fill(0x5C3A1E);
    // Arrows in quiver
    for (let i = 0; i < 3; i++) {
      g.rect(11 + i * 1.2, -18 + bobY, 0.8, 6);
      g.fill(0x8B6B42);
      // Arrow tips
      g.moveTo(11 + i * 1.2, -18 + bobY);
      g.lineTo(11.4 + i * 1.2, -20 + bobY);
      g.lineTo(11.8 + i * 1.2, -18 + bobY);
      g.fill(0xAAAAAA);
    }
  } else if (cls === 'assassin') {
    // Twin daggers
    const daggerBob = Math.sin(frame * 0.09) * 1.5;
    // Left dagger
    g.moveTo(-13, 2 + bobY + armSwing + daggerBob);
    g.lineTo(-13, -8 + bobY + armSwing + daggerBob);
    g.stroke({ color: p.weapon, width: 2 });
    g.moveTo(-14, -8 + bobY + armSwing + daggerBob);
    g.lineTo(-13, -12 + bobY + armSwing + daggerBob);
    g.lineTo(-12, -8 + bobY + armSwing + daggerBob);
    g.fill(0xCCCCDD);
    // Right dagger
    g.moveTo(13, 2 + bobY - armSwing + daggerBob);
    g.lineTo(13, -8 + bobY - armSwing + daggerBob);
    g.stroke({ color: p.weapon, width: 2 });
    g.moveTo(12, -8 + bobY - armSwing + daggerBob);
    g.lineTo(13, -12 + bobY - armSwing + daggerBob);
    g.lineTo(14, -8 + bobY - armSwing + daggerBob);
    g.fill(0xCCCCDD);
    // Poison glow
    g.circle(-13, -10 + bobY + armSwing + daggerBob, 2);
    g.fill({ color: 0x66FF66, alpha: 0.2 });
    g.circle(13, -10 + bobY - armSwing + daggerBob, 2);
    g.fill({ color: 0x66FF66, alpha: 0.2 });
  }
}

/* ---- Draw a 5-pointed star ---- */
function drawStar(g: Graphics, cx: number, cy: number, inner: number, outer: number, color: number): void {
  const pts = 5;
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill(color);
}

/* ---- NPC type palettes ---- */
const NPC_PALETTES = {
  enemy:    { body: 0xCC4444, accent: 0xFF6666, outline: 0x881111 },
  friendly: { body: 0x44BB66, accent: 0x88DDAA, outline: 0x227744 },
  boss:     { body: 0xAA22AA, accent: 0xDD66DD, outline: 0x661166 },
  merchant: { body: 0xDDAA33, accent: 0xFFDD88, outline: 0x886611 },
};

/* ---- Draw detailed NPC ---- */
export function drawNpcBody(
  g: Graphics,
  name: string,
  type: 'enemy' | 'friendly' | 'boss' | 'merchant',
  spriteKey: string,
  frame: number = 0,
): void {
  const pal = NPC_PALETTES[type];
  const bobY = Math.sin(frame * 0.06) * 1;
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
function drawWolf(g: Graphics, pal: typeof NPC_PALETTES.enemy, frame: number, scale: number, isDark: boolean): void {
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
function drawSpider(g: Graphics, pal: typeof NPC_PALETTES.enemy, frame: number, scale: number): void {
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
function drawBandit(g: Graphics, frame: number, scale: number): void {
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
function drawDarkMage(g: Graphics, frame: number, scale: number): void {
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
function drawGolem(g: Graphics, frame: number, scale: number): void {
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
function drawDragon(g: Graphics, frame: number, scale: number): void {
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
