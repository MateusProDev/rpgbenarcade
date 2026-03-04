// ============================================
// Entity Manager — player, NPCs, remote players
// Uses detailed procedural character rendering
// ============================================
import { Container, Graphics, Text } from 'pixi.js';
import { Camera } from './Camera';
import { input } from './InputManager';
import { resolveMovement } from './Physics';
import { useGameStore } from '@/store/gameStore';
import { drawCharacterBody, drawNpcBody, CLASS_PALETTE } from './rendering/CharacterRenderer';
import type { EquipmentVisuals } from './rendering/CharacterRenderer';
import type { Vec2, Direction, PlayerClass } from '@/store/types';
import { NPC_DEFS } from '@/data/npcs';
import { ZONES } from '@/data/zones';
import { CRAFTING_STATIONS, type CraftingStation } from '@/data/crafting';

/* ---- Map NPC IDs to crafting stations ---- */
const NPC_CRAFTING_MAP: Record<string, CraftingStation> = {};
for (const station of Object.values(CRAFTING_STATIONS)) {
  if (station.npcId) {
    NPC_CRAFTING_MAP[station.npcId] = station.id;
  }
}

/* ---- Entity visual (detailed procedural sprite) ---- */
class EntityVisual {
  container = new Container();
  private bodyContainer = new Container();
  private bodyGfx: Graphics;
  private nameText: Text;
  private hpBar: Graphics;
  private shadowGfx: Graphics;
  private classLabel: Text;
  private frame = 0;

  name: string;
  className: PlayerClass;
  maxHp: number;
  direction: Direction = 'down';
  private _isLocal: boolean;
  private _lastDir: Direction = 'down';
  private _equip: EquipmentVisuals = {};

  constructor(
    name: string,
    className: PlayerClass,
    maxHp: number,
    isLocal: boolean = false,
  ) {
    this.name = name;
    this.className = className;
    this.maxHp = maxHp;
    this._isLocal = isLocal;

    // Shadow
    this.shadowGfx = new Graphics();
    this.shadowGfx.ellipse(0, 18, 14, 5);
    this.shadowGfx.fill({ color: 0x000000, alpha: 0.25 });
    this.container.addChild(this.shadowGfx);

    // Body
    this.bodyGfx = new Graphics();
    this.bodyContainer.addChild(this.bodyGfx);
    this.container.addChild(this.bodyContainer);
    this.redrawBody();

    // Local player indicator ring
    if (this._isLocal) {
      const ring = new Graphics();
      ring.circle(0, 0, 20);
      ring.stroke({ color: 0xddaa33, width: 1.5, alpha: 0.5 });
      this.container.addChild(ring);

      // Arrow above head
      const arrow = new Graphics();
      arrow.moveTo(0, -52);
      arrow.lineTo(-4, -46);
      arrow.lineTo(4, -46);
      arrow.closePath();
      arrow.fill({ color: 0xddaa33, alpha: 0.7 });
      this.container.addChild(arrow);
    }

    // Name tag
    const palette = CLASS_PALETTE[className];
    this.nameText = new Text({
      text: name,
      style: {
        fontSize: 11,
        fontFamily: 'Segoe UI, sans-serif',
        fill: this._isLocal ? 0xddaa33 : 0xcccccc,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
      },
    });
    this.nameText.anchor.set(0.5, 1);
    this.nameText.position.set(0, -46);
    this.container.addChild(this.nameText);

    // Class indicator
    this.classLabel = new Text({
      text: this.classIcon(),
      style: {
        fontSize: 10,
        fontFamily: 'Segoe UI, sans-serif',
        fill: palette.accent,
        stroke: { color: 0x000000, width: 3 },
      },
    });
    this.classLabel.anchor.set(0.5, 1);
    this.classLabel.position.set(0, -54);
    this.container.addChild(this.classLabel);

    // HP bar
    this.hpBar = new Graphics();
    this.container.addChild(this.hpBar);
    this.updateHp(maxHp);
  }

  private classIcon(): string {
    switch (this.className) {
      case 'warrior': return '⚔️';
      case 'mage': return '🔮';
      case 'archer': return '🏹';
      case 'assassin': return '🗡️';
    }
  }

  private redrawBody(): void {
    this.bodyGfx.clear();
    drawCharacterBody(this.bodyGfx, this.className, this.direction, this.frame, this._equip);
  }

  updateEquipment(eq: EquipmentVisuals): void {
    this._equip = eq;
    this.redrawBody();
  }

  /** Call each frame to animate */
  animate(dt: number, moving: boolean): void {
    if (moving) {
      this.frame += dt * 60; // ~60fps animation speed
    }
    // Only redraw every few frames for performance
    if (moving || this.direction !== this._lastDir) {
      this.redrawBody();
      this._lastDir = this.direction;
    }
  }

  updateHp(hp: number): void {
    this.hpBar.clear();
    const ratio = Math.max(0, Math.min(1, hp / this.maxHp));
    const barW = 28;
    const barH = 3;
    const x = -barW / 2;
    const y = -58;

    // Background
    this.hpBar.rect(x - 1, y - 1, barW + 2, barH + 2);
    this.hpBar.fill({ color: 0x000000, alpha: 0.5 });

    // Fill
    const hpColor = ratio > 0.5 ? 0x44bb66 : ratio > 0.25 ? 0xddaa33 : 0xcc3344;
    this.hpBar.rect(x, y, barW * ratio, barH);
    this.hpBar.fill(hpColor);

    // Border
    this.hpBar.rect(x - 1, y - 1, barW + 2, barH + 2);
    this.hpBar.stroke({ color: 0x333333, width: 0.5 });
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
    this.container.zIndex = y; // depth sort
  }

  flash(color: number = 0xffffff): void {
    this.bodyGfx.tint = color;
    setTimeout(() => { this.bodyGfx.tint = 0xffffff; }, 120);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

/* ---- NPC Visual (detailed) ---- */
class NpcVisual {
  container = new Container();
  private bodyGfx: Graphics;
  private nameText: Text;
  private interactPrompt: Container;
  private frame = 0;

  npcId: string;
  name: string;
  type: 'enemy' | 'friendly' | 'boss' | 'merchant';
  spriteKey: string;

  constructor(
    npcId: string,
    name: string,
    type: 'enemy' | 'friendly' | 'boss' | 'merchant',
    spriteKey: string,
  ) {
    this.npcId = npcId;
    this.name = name;
    this.type = type;
    this.spriteKey = spriteKey;

    this.bodyGfx = new Graphics();
    drawNpcBody(this.bodyGfx, name, type, spriteKey, 0);
    this.container.addChild(this.bodyGfx);

    const nameColor = {
      enemy: 0xcc4444,
      friendly: 0x44bb66,
      boss: 0xaa22aa,
      merchant: 0xddaa33,
    }[type] || 0xcccccc;

    const typeLabel = {
      enemy: '',
      friendly: '💬',
      boss: '💀',
      merchant: '🛒',
    }[type];

    this.nameText = new Text({
      text: `${typeLabel} ${name}`,
      style: {
        fontSize: 10,
        fontFamily: 'Segoe UI, sans-serif',
        fill: nameColor,
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
      },
    });
    this.nameText.anchor.set(0.5, 1);
    this.nameText.position.set(0, type === 'boss' ? -60 : -36);
    this.container.addChild(this.nameText);

    // Shadow
    const shadow = new Graphics();
    const size = type === 'boss' ? 1.5 : 1;
    shadow.ellipse(0, 18 * size, 14 * size, 5 * size);
    shadow.fill({ color: 0x000000, alpha: 0.25 });
    this.container.addChildAt(shadow, 0);

    // Interact prompt for friendly/merchants
    this.interactPrompt = new Container();
    if (type === 'merchant' || type === 'friendly') {
      const bg = new Graphics();
      bg.roundRect(-22, -14, 44, 16, 4);
      bg.fill({ color: 0x000000, alpha: 0.7 });
      bg.roundRect(-22, -14, 44, 16, 4);
      bg.stroke({ color: 0xDDAA33, width: 1, alpha: 0.6 });
      this.interactPrompt.addChild(bg);
      const pText = new Text({
        text: type === 'merchant' ? '[E] 🛒' : '[E] 💬',
        style: { fontSize: 9, fontFamily: 'Segoe UI, sans-serif', fill: 0xDDAA33 },
      });
      pText.anchor.set(0.5, 0.5);
      pText.position.set(0, -6);
      this.interactPrompt.addChild(pText);
      this.interactPrompt.position.set(0, -44);
      this.interactPrompt.visible = false;
      this.container.addChild(this.interactPrompt);
    }
  }

  animate(dt: number): void {
    this.frame += dt * 30;
    this.bodyGfx.clear();
    drawNpcBody(this.bodyGfx, this.name, this.type, this.spriteKey, this.frame);
  }

  showInteract(show: boolean): void {
    if (this.interactPrompt) {
      this.interactPrompt.visible = show;
      if (show) {
        this.interactPrompt.alpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
      }
    }
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
    this.container.zIndex = y;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}

/* ---- Click indicator visual ---- */
class ClickIndicator {
  readonly gfx = new Graphics();
  private _life = 0;

  constructor(parent: Container) {
    parent.addChild(this.gfx);
  }

  show(x: number, y: number): void {
    this._life = 1.0;
    this.gfx.position.set(x, y);
  }

  update(dt: number): void {
    if (this._life <= 0) { this.gfx.visible = false; return; }
    this._life = Math.max(0, this._life - dt * 3);
    this.gfx.visible = true;
    this.gfx.clear();
    const alpha = this._life;
    const scale = 1 + (1 - this._life) * 0.6;
    const r = 10 * scale;
    this.gfx.circle(0, 0, r);
    this.gfx.stroke({ color: 0xDDAA33, width: 1.5, alpha });
    this.gfx.circle(0, 0, 3);
    this.gfx.fill({ color: 0xDDAA33, alpha: alpha * 0.6 });
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
  private isMoving = false;

  /** Click-to-move state */
  private clickTarget: Vec2 | null = null;
  private pendingInteractNpc: NpcVisual | null = null;
  private clickIndicator!: ClickIndicator;

  constructor(parent: Container, camera: Camera) {
    this.parent = parent;
    this.camera = camera;
    this.clickIndicator = new ClickIndicator(parent);
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

    for (const npcId of zone.npcs) {
      const def = NPC_DEFS[npcId];
      if (!def) continue;
      const visual = new NpcVisual(def.id, def.name, def.type, def.spriteKey);
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
    this.updateLocalEquipment();
    this.animateAll(dt);
  }

  private updateLocalEquipment(): void {
    if (!this.localPlayer) return;
    const inv = useGameStore.getState().player?.inventory ?? [];
    const eq: EquipmentVisuals = {};
    for (const item of inv) {
      if (!item.equipped) continue;
      if (item.slot === 'armor')  eq.armorRarity  = item.rarity;
      if (item.slot === 'helmet') eq.helmetRarity = item.rarity;
      if (item.slot === 'boots')  eq.bootsRarity  = item.rarity;
      if (item.slot === 'weapon') eq.weaponRarity = item.rarity;
    }
    this.localPlayer.updateEquipment(eq);
  }

  private animateAll(dt: number): void {
    // Animate local player
    if (this.localPlayer) {
      this.localPlayer.direction = this.localDir;
      this.localPlayer.animate(dt, this.isMoving);
    }

    // Animate NPCs (only those near player for performance)
    const pp = this.localPos;
    for (const npc of this.npcs) {
      const nx = npc.container.position.x;
      const ny = npc.container.position.y;
      const dist = Math.abs(nx - pp.x) + Math.abs(ny - pp.y);
      if (dist < 600) {
        npc.animate(dt);
        // Show interact prompt when close
        npc.showInteract(dist < 80);
      }
    }
  }

  private triggerNpcInteract(npc: NpcVisual): void {
    const storeState = useGameStore.getState();
    if (storeState.activeDialogue) {
      storeState.advanceDialogue();
      return;
    }
    const station = NPC_CRAFTING_MAP[npc.npcId];
    if (station) {
      storeState.openCraftingStation(station);
      return;
    }
    const def = NPC_DEFS[npc.npcId];
    if (def?.dialogue && def.dialogue.length > 0) {
      storeState.openDialogue(npc.npcId, npc.name, npc.type, def.dialogue);
    }
  }

  private handleInteractKey(): void {
    const storeState = useGameStore.getState();
    let npcHandled = false;

    if (storeState.activeDialogue) {
      storeState.advanceDialogue();
      npcHandled = true;
    } else {
      for (const npc of this.npcs) {
        const nx = npc.container.position.x;
        const ny = npc.container.position.y;
        const dist = Math.hypot(nx - this.localPos.x, ny - this.localPos.y);
        if (dist < 100) {
          this.triggerNpcInteract(npc);
          npcHandled = true;
          break;
        }
      }
    }

    if (!npcHandled) {
      import('./GameEngine').then(({ getEngine }) => {
        const engine = getEngine();
        if (engine) engine.resourceNodes?.tryHarvest(this.localPos);
      });
    }
  }

  private updateLocalMovement(dt: number): void {
    if (!this.localPlayer) return;

    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    const speed = player.stats.speed;
    let dx = 0, dy = 0;

    // ── Click / tap handling ──────────────────────────────────────────
    const clickScreen = input.consumeClick();
    if (clickScreen) {
      const worldPos = this.camera.screenToWorld(clickScreen.x, clickScreen.y);

      // Check if a UI element was hit (skip if Y is near the top HUD area - simple guard)
      let clickedNpc = false;
      for (const npc of this.npcs) {
        const nx = npc.container.position.x;
        const ny = npc.container.position.y;
        if (Math.hypot(nx - worldPos.x, ny - worldPos.y) < 45) {
          const playerDist = Math.hypot(nx - this.localPos.x, ny - this.localPos.y);
          if (playerDist < 100) {
            this.triggerNpcInteract(npc);
          } else {
            // Walk toward NPC then interact
            this.clickTarget = { x: nx, y: ny };
            this.pendingInteractNpc = npc;
            this.clickIndicator.show(nx, ny);
          }
          clickedNpc = true;
          break;
        }
      }

      if (!clickedNpc) {
        // Check resource nodes via GameEngine
        import('./GameEngine').then(({ getEngine }) => {
          const engine = getEngine();
          if (engine) {
            const nodePos = engine.resourceNodes?.getClickableNodeNear(worldPos, 45);
            if (nodePos) {
              const playerDist = Math.hypot(nodePos.x - this.localPos.x, nodePos.y - this.localPos.y);
              if (playerDist < 65) {
                engine.resourceNodes?.tryHarvest(this.localPos);
              } else {
                this.clickTarget = { ...nodePos };
                this.pendingInteractNpc = null;
                this.clickIndicator.show(nodePos.x, nodePos.y);
              }
            } else {
              this.clickTarget = worldPos;
              this.pendingInteractNpc = null;
              this.clickIndicator.show(worldPos.x, worldPos.y);
            }
          } else {
            this.clickTarget = worldPos;
            this.pendingInteractNpc = null;
            this.clickIndicator.show(worldPos.x, worldPos.y);
          }
        });
      }
    }

    // ── Keyboard takes over, cancel click-to-move ─────────────────────
    const keyboardActive =
      input.isDown('up') || input.isDown('down') ||
      input.isDown('left') || input.isDown('right');

    if (keyboardActive) {
      this.clickTarget = null;
      this.pendingInteractNpc = null;
      if (input.isDown('up'))    { dy = -1; this.localDir = 'up'; }
      if (input.isDown('down'))  { dy =  1; this.localDir = 'down'; }
      if (input.isDown('left'))  { dx = -1; this.localDir = 'left'; }
      if (input.isDown('right')) { dx =  1; this.localDir = 'right'; }
      // Normalize diagonal
      if (dx !== 0 && dy !== 0) { const inv = 1 / Math.SQRT2; dx *= inv; dy *= inv; }
    } else if (this.clickTarget) {
      // ── Click-to-move: steer toward target ───────────────────────────
      const tdx = this.clickTarget.x - this.localPos.x;
      const tdy = this.clickTarget.y - this.localPos.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist < 6) {
        // Arrived at click target
        if (this.pendingInteractNpc) {
          this.triggerNpcInteract(this.pendingInteractNpc);
          this.pendingInteractNpc = null;
        } else {
          // Try harvest if standing on a resource node after walk
          import('./GameEngine').then(({ getEngine }) => {
            const engine = getEngine();
            if (engine) engine.resourceNodes?.tryHarvest(this.localPos);
          });
        }
        this.clickTarget = null;
      } else {
        dx = tdx / dist;
        dy = tdy / dist;
        this.localDir = Math.abs(tdx) >= Math.abs(tdy)
          ? (tdx > 0 ? 'right' : 'left')
          : (tdy > 0 ? 'down' : 'up');
      }
    }

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
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

    // Update click indicator animation
    this.clickIndicator.update(dt);

    // Check portal collisions
    this.checkPortals();

    // E key interact
    if (input.wasPressed('interact')) {
      this.handleInteractKey();
    }
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
        import('./GameEngine').then(({ getEngine }) => {
          const engine = getEngine();
          if (engine) {
            engine.loadZone(portal.targetZone);
          }
        });
        break;
      }
    }
  }

  private updateRemotePlayers(): void {
    const state = useGameStore.getState();
    const remotes = state.remotePlayers;
    const myUid = state.player?.uid;

    for (const [uid, visual] of this.remotePlayers) {
      if (!remotes[uid] || uid === myUid) {
        visual.destroy();
        this.remotePlayers.delete(uid);
      }
    }

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

  flashLocalPlayer(color?: number): void {
    this.localPlayer?.flash(color);
  }

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
