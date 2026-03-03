// ============================================
// Effects Manager — anime-style combat VFX
// ============================================
import { Container, Graphics, Text } from 'pixi.js';
import type { Vec2 } from '@/store/types';

/* ---- Effect base ---- */
interface ActiveEffect {
  elapsed: number;
  duration: number;
  update: (dt: number, elapsed: number, progress: number) => boolean; // return false to remove
  container: Container;
}

/* ---- Floating damage number ---- */
function createDamageNumber(
  parent: Container,
  pos: Vec2,
  damage: number,
  isCrit: boolean,
): ActiveEffect {
  const c = new Container();
  c.position.set(pos.x, pos.y - 30);

  const text = new Text({
    text: isCrit ? `${damage}!` : `${damage}`,
    style: {
      fontSize: isCrit ? 22 : 16,
      fontFamily: 'Georgia, serif',
      fontWeight: 'bold',
      fill: isCrit ? 0xffdd33 : 0xff4444,
      stroke: { color: 0x000000, width: 4 },
    },
  });
  text.anchor.set(0.5);
  c.addChild(text);
  parent.addChild(c);

  return {
    elapsed: 0,
    duration: 1.2,
    container: c,
    update(dt, elapsed, progress) {
      c.position.y -= dt * 40;
      c.alpha = 1 - progress * progress;
      if (isCrit) {
        c.scale.set(1 + Math.sin(progress * Math.PI) * 0.3);
      }
      return progress < 1;
    },
  };
}

/* ---- Slash effect (anime style) ---- */
function createSlashEffect(
  parent: Container,
  pos: Vec2,
  angle: number,
  color: number = 0xffffff,
): ActiveEffect {
  const c = new Container();
  c.position.set(pos.x, pos.y);
  const g = new Graphics();
  c.addChild(g);
  parent.addChild(c);

  return {
    elapsed: 0,
    duration: 0.35,
    container: c,
    update(dt, elapsed, progress) {
      g.clear();
      const len = 40 + progress * 30;
      const width = (1 - progress) * 8;
      const alpha = 1 - progress;

      g.moveTo(0, 0);
      const endX = Math.cos(angle) * len;
      const endY = Math.sin(angle) * len;
      g.lineTo(endX, endY);
      g.stroke({ color, width, alpha });

      // Arc swoosh
      const arcRadius = 20 + progress * 20;
      const startAngle = angle - 0.6 + progress * 0.3;
      const endAngle = angle + 0.6 - progress * 0.3;
      g.arc(0, 0, arcRadius, startAngle, endAngle);
      g.stroke({ color, width: width * 0.6, alpha: alpha * 0.6 });

      c.scale.set(1 + progress * 0.5);
      c.alpha = alpha;
      return progress < 1;
    },
  };
}

/* ---- Energy burst (AoE effect) ---- */
function createEnergyBurst(
  parent: Container,
  pos: Vec2,
  radius: number,
  color: number,
): ActiveEffect {
  const c = new Container();
  c.position.set(pos.x, pos.y);
  const g = new Graphics();
  c.addChild(g);
  parent.addChild(c);

  return {
    elapsed: 0,
    duration: 0.6,
    container: c,
    update(dt, elapsed, progress) {
      g.clear();
      const r = radius * progress;
      const alpha = (1 - progress) * 0.5;

      // Outer ring
      g.circle(0, 0, r);
      g.stroke({ color, width: 3 * (1 - progress), alpha });

      // Inner glow
      g.circle(0, 0, r * 0.6);
      g.fill({ color, alpha: alpha * 0.3 });

      // Particle rays
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + progress * 2;
        const len = r * 0.8;
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        g.stroke({ color, width: 2 * (1 - progress), alpha: alpha * 0.6 });
      }

      return progress < 1;
    },
  };
}

/* ---- Heal effect ---- */
function createHealEffect(
  parent: Container,
  pos: Vec2,
): ActiveEffect {
  const c = new Container();
  c.position.set(pos.x, pos.y);
  const g = new Graphics();
  c.addChild(g);
  parent.addChild(c);

  return {
    elapsed: 0,
    duration: 0.8,
    container: c,
    update(dt, elapsed, progress) {
      g.clear();

      // Rising green sparkles
      for (let i = 0; i < 6; i++) {
        const offsetX = Math.sin(progress * Math.PI * 3 + i * 1.2) * 15;
        const offsetY = -progress * 50 - i * 8;
        const size = (1 - progress) * 3;
        g.circle(offsetX, offsetY, size);
        g.fill({ color: 0x44ff66, alpha: (1 - progress) * 0.8 });
      }

      // Plus sign
      const s = 8 * (1 - progress * 0.5);
      const y = -20 - progress * 30;
      g.rect(-s / 2, y - 1, s, 2);
      g.fill({ color: 0x44ff66, alpha: 1 - progress });
      g.rect(-1, y - s / 2, 2, s);
      g.fill({ color: 0x44ff66, alpha: 1 - progress });

      return progress < 1;
    },
  };
}

/* ---- Impact flash (screen-level white flash) ---- */
function createImpactFlash(
  parent: Container,
  pos: Vec2,
  color: number = 0xffffff,
): ActiveEffect {
  const c = new Container();
  c.position.set(pos.x, pos.y);
  const g = new Graphics();
  c.addChild(g);
  parent.addChild(c);

  return {
    elapsed: 0,
    duration: 0.15,
    container: c,
    update(dt, elapsed, progress) {
      g.clear();
      const size = 30 * (1 - progress);
      g.circle(0, 0, size);
      g.fill({ color, alpha: (1 - progress) * 0.6 });
      return progress < 1;
    },
  };
}

/* ---- Manager ---- */
export class EffectsManager {
  private parent: Container;
  private effects: ActiveEffect[] = [];

  constructor(parent: Container) {
    this.parent = parent;
  }

  update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      fx.elapsed += dt;
      const progress = Math.min(1, fx.elapsed / fx.duration);
      const alive = fx.update(dt, fx.elapsed, progress);
      if (!alive) {
        this.parent.removeChild(fx.container);
        fx.container.destroy({ children: true });
        this.effects.splice(i, 1);
      }
    }
  }

  /** Show floating damage number */
  showDamage(pos: Vec2, damage: number, isCrit: boolean): void {
    this.effects.push(createDamageNumber(this.parent, pos, damage, isCrit));
  }

  /** Show slash attack effect */
  showSlash(pos: Vec2, angle: number, color?: number): void {
    this.effects.push(createSlashEffect(this.parent, pos, angle, color));
  }

  /** Show AoE energy burst */
  showEnergyBurst(pos: Vec2, radius: number, color: number): void {
    this.effects.push(createEnergyBurst(this.parent, pos, radius, color));
  }

  /** Show heal effect */
  showHeal(pos: Vec2): void {
    this.effects.push(createHealEffect(this.parent, pos));
  }

  /** Show impact flash */
  showImpactFlash(pos: Vec2, color?: number): void {
    this.effects.push(createImpactFlash(this.parent, pos, color));
  }

  clear(): void {
    for (const fx of this.effects) {
      this.parent.removeChild(fx.container);
      fx.container.destroy({ children: true });
    }
    this.effects = [];
  }
}
