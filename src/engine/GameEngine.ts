// ============================================
// Game Engine — PixiJS Application, layer system, game loop
// ============================================
import { Application, Container } from 'pixi.js';
import { Camera } from './Camera';
import { input } from './InputManager';
import { TileMap } from './TileMap';
import { EntityManager } from './EntityManager';
import { EffectsManager } from './effects/EffectsManager';
import { CombatManager } from './combat/CombatManager';
import { SyncManager } from './multiplayer/SyncManager';
import { MinimapRenderer } from './MinimapRenderer';
import { ResourceNodeManager } from './world/ResourceNodeManager';
import { useGameStore } from '@/store/gameStore';
import { ZONES } from '@/data/zones';
import type { ZoneDefinition } from '@/store/types';

export class GameEngine {
  app!: Application;
  camera!: Camera;
  tileMap!: TileMap;
  entities!: EntityManager;
  effects!: EffectsManager;
  combat!: CombatManager;
  sync!: SyncManager;
  minimap!: MinimapRenderer;
  resourceNodes!: ResourceNodeManager;

  // Layer containers (added to camera.pivot in order)
  layers = {
    ground: new Container(),
    entities: new Container(),
    effects: new Container(),
    overhead: new Container(),
  };

  private _currentZone: ZoneDefinition | null = null;
  private _running = false;
  private _destroyed = false;
  private _canvasParent: HTMLElement | null = null;

  get currentZone(): ZoneDefinition | null { return this._currentZone; }
  get isDestroyed(): boolean { return this._destroyed; }

  async init(parent: HTMLElement): Promise<void> {
    this._canvasParent = parent;
    const w = parent.clientWidth  || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;

    this.app = new Application();
    await this.app.init({
      width: w,
      height: h,
      backgroundColor: 0x0a0c10,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // If destroy() was called while we awaited, bail out immediately
    if (this._destroyed) {
      try { this.app.destroy(true, { children: true }); } catch { /* */ }
      return;
    }

    parent.appendChild(this.app.canvas as HTMLCanvasElement);

    // Camera
    this.camera = new Camera(w, h);
    this.app.stage.addChild(this.camera.pivot);

    // Build layer stack
    this.camera.pivot.addChild(this.layers.ground);
    this.camera.pivot.addChild(this.layers.entities);
    this.camera.pivot.addChild(this.layers.effects);
    this.camera.pivot.addChild(this.layers.overhead);

    // Sorted entity layer (by Y position)
    this.layers.entities.sortableChildren = true;

    // Sub-systems
    this.tileMap = new TileMap(this.layers.ground);
    this.entities = new EntityManager(this.layers.entities, this.camera);
    this.effects = new EffectsManager(this.layers.effects);
    this.combat = new CombatManager(this);
    this.sync = new SyncManager(this);
    this.minimap = new MinimapRenderer(this.app.stage, w, h);
    this.resourceNodes = new ResourceNodeManager(this.layers.entities);

    // Input
    input.init(this.app.canvas as HTMLElement);

    // Resize
    window.addEventListener('resize', this.onResize);

    // Load initial zone
    const zone = useGameStore.getState().currentZone;
    this.loadZone(zone);

    // Final destroyed check (re-entrance guard)
    if (this._destroyed) return;

    useGameStore.getState().setEngineReady(true);
    this._running = true;

    // Game loop
    this.app.ticker.add(this.gameLoop);
  }

  private gameLoop = (): void => {
    if (!this._running || !this._currentZone) return;
    const dt = this.app.ticker.deltaMS / 1000; // seconds

    // Update systems
    this.entities.update(dt);
    this.effects.update(dt);
    this.combat.update(dt);
    this.sync.update(dt);

    // Update resource nodes (show/hide interact prompts, respawn)
    const playerPos = this.entities.getLocalPlayerPos();
    if (playerPos) {
      this.resourceNodes.update(dt, playerPos);
    }

    // Camera follows local player
    if (playerPos) {
      this.camera.setTarget(playerPos);
    }
    this.camera.update(dt);

    // Sort entities by Y for depth (zIndex)
    this.layers.entities.sortChildren();

    // Update minimap
    this.minimap.update(this);

    // Input end frame
    input.endFrame();
  };

  loadZone(zoneId: string): void {
    const zone = ZONES[zoneId];
    if (!zone) {
      console.warn(`Zone "${zoneId}" not found, defaulting to town`);
      this._currentZone = ZONES['town'] ?? null;
    } else {
      this._currentZone = zone;
    }
    if (!this._currentZone) return;

    // Clear old
    this.tileMap.clear();
    this.entities.clear();
    this.effects.clear();
    this.resourceNodes.clear();

    // Build new zone
    this.tileMap.build(this._currentZone);
    this.entities.spawnLocalPlayer(this._currentZone.spawnPoint);
    this.resourceNodes.spawnForZone(zoneId);

    // Snap camera
    this.camera.snap();

    // Update store
    useGameStore.getState().setCurrentZone(zoneId);

    // Sync presence
    this.sync.changeZone(zoneId);
  }

  private onResize = (): void => {
    if (!this._canvasParent) return;
    const w = this._canvasParent.clientWidth;
    const h = this._canvasParent.clientHeight;
    this.app.renderer.resize(w, h);
    this.camera.resize(w, h);
    this.minimap.resize(w, h);
  };

  destroy(): void {
    this._destroyed = true;
    this._running = false;
    try { this.app?.ticker?.remove(this.gameLoop); } catch { /* not yet initialised */ }
    window.removeEventListener('resize', this.onResize);
    try { input.destroy(); } catch { /* */ }
    try { this.sync?.destroy(); } catch { /* */ }
    try { this.app?.destroy(true, { children: true }); } catch { /* */ }
    useGameStore.getState().setEngineReady(false);
  }
}

/** Singleton for use across modules */
let _engine: GameEngine | null = null;
export function getEngine(): GameEngine | null { return _engine; }
export function setEngine(e: GameEngine | null): void { _engine = e; }
