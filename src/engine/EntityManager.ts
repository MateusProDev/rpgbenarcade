// ============================================
// Entity Manager — player, NPCs, remote players
// ============================================
import { Container, Graphics, Text } from 'pixi.js';
import { Camera } from './Camera';
import { input } from './InputManager';
import { resolveMovement, distance } from './Physics';
import { useGameStore } from '@/store/gameStore';
import type { Vec2, Direction, PlayerClass, RemotePlayerState } from '@/store/types';
import { ZONES } from '@/data/zones';

/* ---- Color palette per class ---- */
const CLASS_COLORS: Record<PlayerClass, number> = {
  warrior: 0xcc4444,
  mage: 0x4488dd,
  archer: 0x44bb66,
  assassin: 0x9966cc,
};

/* ---- Entity visual (simple graphics-based sprite) ---- */
class EntityVisual {
  container = new Container();
  private body: Graphics;
  private nameText: Text;
  private hpBar: Graphics;
  private shadowGfx: Graphics;

  constructor(
    public name: string,
    public className: PlayerClass,
    public maxHp: number,
    private isLocal: boolean = false,
  ) {
    const color = CLASS_COLORS[className] || 0xcccccc;

    // Shadow
    this.shadowGfx = new Graphics();
    this.shadowGfx.ellipse(0, 10, 12, 5);
    this.shadowGfx.fill({ color: 0x000000, alpha: 0.3 });
    this.container.addChild(this.shadowGfx);

    // Body (rounded rectangle character)
    this.body = new Graphics();
    this.body.roundRect(-10, -20, 20, 28, 4);
    this.body.fill(color);
    this.body.roundRect(-8, -18, 16, 24, 3);
    this.body.fill(color + 0x222222);
    // Head
    this.body.circle(0, -26, 8);
    this.body.fill(0xeeddbb);
    // Eyes
    this.body.circle(-3, -27, 1.5);
    this.body.fill(0x222222);
    this.body.circle(3, -27, 1.5);
    this.body.fill(0x222222);
    this.container.addChild(this.body);

    // Local player indicator ring
    if (isLocal) {
      const ring = new Graphics();
      ring.circle(0, 0, 16);
      ring.stroke({ color: 0xddaa33, width: 1.5, alpha: 0.6 });
      this.container.addChild(ring);
    }

    // Name tag
    this.nameText = new Text({
      text: name,
      style: {
        fontSize: 11,
        fontFamily: 'Segoe UI, sans-serif',
        fill: isLocal ? 0xddaa33 : 0xcccccc,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
      },
    });
    this.nameText.anchor.set(0.5, 1);
    this.nameText.position.set(0, -38);
    this.container.addChild(this.nameText);

    // HP bar
    this.hpBar = new Graphics();
    this.container.addChild(this.hpBar);
    this.updateHp(maxHp);
  }

  updateHp(hp: number): void {
    this.hpBar.clear();
    const ratio = Math.max(0, Math.min(1, hp / this.maxHp));
    const barW = 24;
    const barH = 3;
    const x = -barW / 2;
    const y = -42;

    // Background
    this.hpBar.rect(x, y, barW, barH);
    this.hpBar.fill({ color: 0x000000, alpha: 0.6 });

    // Fill
    const hpColor = ratio > 0.5 ? 0x44bb66 : ratio > 0.25 ? 0xddaa33 : 0xcc3344;
    this.hpBar.rect(x, y, barW * ratio, barH);
    this.hpBar.fill(hpColor);
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
    this.container.zIndex = y; // depth sort
  }

  flash(color: number = 0xffffff): void {
    this.body.tint = color;
    setTimeout(() => { this.body.tint = 0xffffff; }, 120);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

/* ---- NPC Visual ---- */
class NpcVisual {
  container = new Container();
  private body: Graphics;
  private nameText: Text;

  constructor(
    public name: string,
    public type: 'enemy' | 'friendly' | 'boss' | 'merchant',
  ) {
    const colors = {
      enemy: 0xcc4444,
      friendly: 0x44bb66,
      boss: 0xaa22aa,
      merchant: 0xddaa33,
    };
    const color = colors[type] || 0xcccccc;

    this.body = new Graphics();
    if (type === 'boss') {
      // Boss is larger
      this.body.roundRect(-14, -28, 28, 36, 5);
      this.body.fill(color);
      this.body.circle(0, -36, 10);
      this.body.fill(0xcc5555);
      // Crown
      this.body.moveTo(-6, -46);
      this.body.lineTo(0, -52);
      this.body.lineTo(6, -46);
      this.body.fill(0xddaa33);
    } else {
      this.body.roundRect(-8, -16, 16, 22, 3);
      this.body.fill(color);
      this.body.circle(0, -22, 6);
      this.body.fill(0xddccaa);
    }
    this.container.addChild(this.body);

    this.nameText = new Text({
      text: name,
      style: {
        fontSize: 10,
        fontFamily: 'Segoe UI, sans-serif',
        fill: color,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
      },
    });
    this.nameText.anchor.set(0.5, 1);
    this.nameText.position.set(0, type === 'boss' ? -56 : -32);
    this.container.addChild(this.nameText);

    // Shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 8, type === 'boss' ? 16 : 10, type === 'boss' ? 6 : 4);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.container.addChildAt(shadow, 0);
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
    this.container.zIndex = y;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

/* ---- Entity Manager ---- */
export class EntityManager {
  private parent: Container;
  private camera: Camera;
  private localPlayer: EntityVisual | null = null;
  private localPos: Vec2 = { x: 0, y: 0 };
  private localDir: Direction = 'down';
  private remotePlayers = new Map<string, EntityVisual>();
  private npcs: NpcVisual[] = [];
  private walkAnim = 0;

  constructor(parent: Container, camera: Camera) {
    this.parent = parent;
    this.camera = camera;
  }

  spawnLocalPlayer(pos: Vec2): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    this.localPlayer = new EntityVisual(
      player.name,
      player.className,
      player.stats.maxHp,
      true,
    );
    this.localPos = { ...pos };
    this.localPlayer.setPosition(pos.x, pos.y);
    this.parent.addChild(this.localPlayer.container);

    // Spawn NPCs for current zone
    this.spawnZoneNpcs();
  }

  private spawnZoneNpcs(): void {
    const state = useGameStore.getState();
    const zone = ZONES[state.currentZone];
    if (!zone) return;

    // Import NPC definitions — we'll use zone.npcs list
    const { NPC_DEFS } = require('@/data/npcs');
    for (const npcId of zone.npcs) {
      const def = NPC_DEFS[npcId];
      if (!def) continue;
      const visual = new NpcVisual(def.name, def.type);
      visual.setPosition(def.position.x, def.position.y);
      this.parent.addChild(visual.container);
      this.npcs.push(visual);
    }
  }

  getLocalPlayerPos(): Vec2 | null {
    return this.localPlayer ? { ...this.localPos } : null;
  }

  update(dt: number): void {
    this.updateLocalMovement(dt);
    this.updateRemotePlayers();
    this.updateLocalHp();
  }

  private updateLocalMovement(dt: number): void {
    if (!this.localPlayer) return;

    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    const speed = player.stats.speed;
    let dx = 0, dy = 0;

    if (input.isDown('up')) { dy = -1; this.localDir = 'up'; }
    if (input.isDown('down')) { dy = 1; this.localDir = 'down'; }
    if (input.isDown('left')) { dx = -1; this.localDir = 'left'; }
    if (input.isDown('right')) { dx = 1; this.localDir = 'right'; }

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv; dy *= inv;
    }

    if (dx !== 0 || dy !== 0) {
      const velocity = { x: dx * speed * dt, y: dy * speed * dt };
      const zone = ZONES[state.currentZone];
      if (zone) {
        this.localPos = resolveMovement(
          this.localPos, velocity, 16,
          zone.tileSize, zone.width, zone.collisionMap,
        );
      } else {
        this.localPos.x += velocity.x;
        this.localPos.y += velocity.y;
      }

      // Walk animation (simple bob)
      this.walkAnim += dt * 10;
      this.localPlayer.container.pivot.y = Math.sin(this.walkAnim) * 1.5;
    } else {
      this.localPlayer.container.pivot.y = 0;
      this.walkAnim = 0;
    }

    this.localPlayer.setPosition(this.localPos.x, this.localPos.y);
    state.updatePlayerPos(this.localPos, this.localDir);

    // Check portal collisions
    this.checkPortals();
  }

  private checkPortals(): void {
    const state = useGameStore.getState();
    const zone = ZONES[state.currentZone];
    if (!zone) return;

    for (const portal of zone.portals) {
      const px = portal.position.x * zone.tileSize;
      const py = portal.position.y * zone.tileSize;
      const pw = portal.size.x * zone.tileSize;
      const ph = portal.size.y * zone.tileSize;

      if (
        this.localPos.x >= px && this.localPos.x <= px + pw &&
        this.localPos.y >= py && this.localPos.y <= py + ph
      ) {
        // Teleport to target zone
        const { getEngine } = require('./GameEngine');
        const engine = getEngine();
        if (engine) {
          engine.loadZone(portal.targetZone);
        }
        break;
      }
    }
  }

  private updateRemotePlayers(): void {
    const state = useGameStore.getState();
    const remotes = state.remotePlayers;
    const myUid = state.player?.uid;

    // Remove gone players
    for (const [uid, visual] of this.remotePlayers) {
      if (!remotes[uid] || uid === myUid) {
        visual.destroy();
        this.remotePlayers.delete(uid);
      }
    }

    // Add / update remote players
    for (const [uid, rp] of Object.entries(remotes)) {
      if (uid === myUid) continue;

      let visual = this.remotePlayers.get(uid);
      if (!visual) {
        visual = new EntityVisual(
          rp.name || 'Player',
          rp.className || 'warrior',
          rp.maxHp || 100,
          false,
        );
        this.parent.addChild(visual.container);
        this.remotePlayers.set(uid, visual);
      }

      // Interpolate position
      visual.setPosition(rp.x, rp.y);
      visual.updateHp(rp.hp);
    }
  }

  private updateLocalHp(): void {
    if (!this.localPlayer) return;
    const player = useGameStore.getState().player;
    if (player) {
      this.localPlayer.updateHp(player.stats.hp);
    }
  }

  /** Flash local player (hit effect) */
  flashLocalPlayer(color?: number): void {
    this.localPlayer?.flash(color);
  }

  /** Flash remote player */
  flashRemote(uid: string, color?: number): void {
    this.remotePlayers.get(uid)?.flash(color);
  }

  getLocalDir(): Direction { return this.localDir; }

  clear(): void {
    this.localPlayer?.destroy();
    this.localPlayer = null;
    for (const [, v] of this.remotePlayers) v.destroy();
    this.remotePlayers.clear();
    for (const npc of this.npcs) npc.destroy();
    this.npcs = [];
  }
}
