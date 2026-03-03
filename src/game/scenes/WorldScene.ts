// ========================
// World Scene - Main Game Scene
// Animated directional sprites + Rich map environments
// Click-to-move + WASD + full gameplay
// ========================
import Phaser from "phaser";
import { throttle } from "lodash";
import { useGameStore } from "../../store/gameStore";
import { getMapConfig } from "../entities/maps";
import { getEnemyConfig } from "../entities/enemies";
import { getClassSkills, calculateDamage, calculateDefense } from "../entities/classes";
import { generateLoot } from "../entities/items";
import { QUESTS } from "../entities/quests";
import { updatePlayerPosition, updatePlayerPresence, listenToPlayersOnMap, removePlayerPresence, startHeartbeat, cleanupOfflinePlayers } from "../../firebase/playerService";
import type { MapId, RemotePlayer, Direction, EnemyType, Item } from "../../types";

const PLAYER_SPEED = 160;
const ATTACK_RANGE = 60;
const ATTACK_COOLDOWN = 600;
const CLICK_STOP_DIST = 6;

// Ordered list of tile texture keys — must match BootScene.createTilesetAtlas() order.
const TILE_KEYS = [
  "tile_grass", "tile_grass_lush", "tile_grass_dark",
  "tile_dirt", "tile_dirt_dark", "tile_cobble", "tile_path",
  "tile_water", "tile_water_deep", "tile_stone", "tile_stone_mossy",
  "tile_dark", "tile_wall", "tile_lava", "tile_sand", "tile_arena",
  "tile_swamp", "tile_wood",
] as const;
const TILE_IDX: Record<string, number> = {};
TILE_KEYS.forEach((k, i) => { TILE_IDX[k] = i; });

// Color lookup for the canvas-drawn minimap (hex CSS colors per tile type)
const TILE_MINIMAP_COLORS: Record<string, string> = {
  tile_grass:       '#3a6b3a',
  tile_grass_lush:  '#4a8a3a',
  tile_grass_dark:  '#2a4a2a',
  tile_dirt:        '#6b5a3a',
  tile_dirt_dark:   '#4a3a2a',
  tile_cobble:      '#7a7a7a',
  tile_path:        '#8a7a5a',
  tile_water:       '#2a5a9a',
  tile_water_deep:  '#1a2a6a',
  tile_stone:       '#5a5a5a',
  tile_stone_mossy: '#4a6a4a',
  tile_dark:        '#1a1a2a',
  tile_wall:        '#3a3a3a',
  tile_lava:        '#aa3a1a',
  tile_sand:        '#c0b080',
  tile_arena:       '#b0a068',
  tile_swamp:       '#3a4a2a',
  tile_wood:        '#6a4a2a',
};

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  damage: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  aggroRange: number;
  hpBar: Phaser.GameObjects.Graphics;
  nameText: Phaser.GameObjects.Text;
  isDead: boolean;
  respawnTime: number;
  spawnX: number;
  spawnY: number;
  lastAttack: number;
}

interface RemotePlayerSprite extends Phaser.Physics.Arcade.Sprite {
  uid: string;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Graphics;
  titleText?: Phaser.GameObjects.Text;
}

interface ItemDrop extends Phaser.Physics.Arcade.Sprite {
  item: Item;
  despawnTimer: Phaser.Time.TimerEvent;
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private skillKeys!: Phaser.Input.Keyboard.Key[];
  private enemies: EnemySprite[] = [];
  private remotePlayers: Map<string, RemotePlayerSprite> = new Map();
  private itemDrops: ItemDrop[] = [];
  private npcs: Phaser.Physics.Arcade.Sprite[] = [];
  private portals: Phaser.Physics.Arcade.Sprite[] = [];
  private currentMap: MapId = "village";
  private direction: Direction = "down";
  private lastAttackTime = 0;
  private nameText!: Phaser.GameObjects.Text;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFg!: Phaser.GameObjects.Graphics;
  private unsubPresence?: () => void;
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private dayNightOverlay!: Phaser.GameObjects.Rectangle;
  private dayNightTime = 0;

  // Click-to-move
  private moveTarget: { x: number; y: number } | null = null;
  private clickMarker?: Phaser.GameObjects.Sprite;
  private clickMarkerTween?: Phaser.Tweens.Tween;

  // Shadow
  private playerShadow!: Phaser.GameObjects.Ellipse;

  // Blocking decoration colliders
  private decoColliders!: Phaser.Physics.Arcade.StaticGroup;

  // === MINIMAP (canvas-texture approach — zero per-frame GPU cost) ===
  private minimapContainer: Phaser.GameObjects.Container | null = null;
  private minimapPlayerDot: Phaser.GameObjects.Arc | null = null;
  private minimapScaleX = 0;
  private minimapScaleY = 0;

  // === TILEMAP SYSTEM ===
  // TilemapLayer renders ALL visible tiles in ONE WebGL draw call
  // with automatic camera culling — zero per-frame CPU cost.
  private tileMap: Phaser.Tilemaps.Tilemap | null = null;
  private baseLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private decoLayer: Phaser.Tilemaps.TilemapLayer | null = null;

  // Throttled position update
  private throttledUpdatePosition = throttle(
    (uid: string, x: number, y: number, dir: string, map: MapId) => {
      updatePlayerPosition(uid, Math.round(x), Math.round(y), dir, map);
    },
    80
  );

  constructor() {
    super({ key: "WorldScene" });
  }

  create() {
    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData) return;

    // Reset all arrays/maps to prevent stale references on scene restart
    this.enemies = [];
    this.remotePlayers = new Map();
    this.itemDrops = [];
    this.npcs = [];
    this.portals = [];
    this.moveTarget = null;
    this.lastAttackTime = 0;
    this.direction = "down";

    this.currentMap = playerData.currentMap || "village";
    store.setCurrentMap(this.currentMap);
    const mapConfig = getMapConfig(this.currentMap);

    // Physics world
    this.physics.world.setBounds(0, 0, mapConfig.width, mapConfig.height);

    // Decoration static group
    this.decoColliders = this.physics.add.staticGroup();

    // Generate rich map
    this.generateMap();

    // Player start position
    const startX = playerData.position?.x || mapConfig.spawnPoint.x;
    const startY = playerData.position?.y || mapConfig.spawnPoint.y;

    // Shadow
    this.playerShadow = this.add.ellipse(startX, startY + 20, 22, 8, 0x000000, 0.25);
    this.playerShadow.setDepth(9);

    // Player sprite (use animated down idle frame)
    const textureBase = `player_${playerData.classType}`;
    this.player = this.physics.add.sprite(startX, startY, `${textureBase}_down_0`);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body?.setSize(20, 24);
    this.player.body?.setOffset(14, 20);

    // Camera
    this.cameras.main.setBounds(0, 0, mapConfig.width, mapConfig.height);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);

    // Keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.skillKeys = [
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      ];
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E).on("down", () => this.interact());
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F).on("down", () => this.pickupItem());
    }

    // Click-to-move
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.moveTarget = { x: worldPoint.x, y: worldPoint.y };
      this.showClickMarker(worldPoint.x, worldPoint.y);
    });

    // Prevent context menu
    this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Ensure canvas focus
    this.game.canvas.setAttribute("tabindex", "1");
    this.game.canvas.focus();
    this.game.canvas.addEventListener("mousedown", () => this.game.canvas.focus());

    // Collider with decorations
    this.physics.add.collider(this.player, this.decoColliders);
    // Collider with tilemap border walls
    if (this.baseLayer) this.physics.add.collider(this.player, this.baseLayer);

    // Spawn game entities
    this.spawnEnemies();
    this.spawnNpcs();
    this.spawnPortals();

    // Player name
    this.nameText = this.add.text(startX, startY - 30, playerData.name, {
      fontSize: "10px",
      color: "#ffffff",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.nameText.setOrigin(0.5, 1);
    this.nameText.setDepth(11);

    // HP bars
    this.hpBarBg = this.add.graphics();
    this.hpBarBg.setDepth(11);
    this.hpBarFg = this.add.graphics();
    this.hpBarFg.setDepth(11);

    // Day/Night overlay
    this.dayNightOverlay = this.add.rectangle(
      mapConfig.width / 2, mapConfig.height / 2,
      mapConfig.width, mapConfig.height,
      0x000033, 0
    );
    this.dayNightOverlay.setDepth(50);
    this.dayNightOverlay.setScrollFactor(0);

    // Map label
    const mapLabel = this.add.text(this.cameras.main.width / 2, 20, mapConfig.name, {
      fontSize: "16px",
      color: "#c4a35a",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 3,
    });
    mapLabel.setOrigin(0.5, 0);
    mapLabel.setScrollFactor(0);
    mapLabel.setDepth(51);
    this.tweens.add({
      targets: mapLabel,
      alpha: 0,
      delay: 3000,
      duration: 2000,
      onComplete: () => mapLabel.destroy(),
    });

    // Multiplayer
    if (playerData.uid) {
      this.setupMultiplayer(playerData.uid);
      cleanupOfflinePlayers();
    }

    // === MINIMAP SETUP ===
    this.setupMinimap(mapConfig.width, mapConfig.height);
  }

  showClickMarker(x: number, y: number) {
    if (this.clickMarkerTween) {
      this.clickMarkerTween.stop();
    }
    if (this.clickMarker) {
      this.clickMarker.destroy();
    }
    this.clickMarker = this.add.sprite(x, y, "click_target");
    this.clickMarker.setDepth(2);
    this.clickMarker.setAlpha(0.8);
    this.clickMarkerTween = this.tweens.add({
      targets: this.clickMarker,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 600,
      onComplete: () => {
        this.clickMarker?.destroy();
        this.clickMarker = undefined;
      },
    });
  }

  // ========================
  // MINIMAP — Canvas-texture approach
  // Renders map overview ONCE to a small texture, zero ongoing GPU cost.
  // Dynamic player dot moves each frame (1 lightweight arc).
  // ========================
  setupMinimap(mapW: number, mapH: number) {
    const SIZE = 174;   // interior pixels
    const PAD = 15;     // screen padding

    this.minimapScaleX = SIZE / mapW;
    this.minimapScaleY = SIZE / mapH;

    // ---- 1. Create canvas texture with map overview ----
    if (this.textures.exists('minimap_tex')) this.textures.remove('minimap_tex');
    const canvasTex = this.textures.createCanvas('minimap_tex', SIZE, SIZE)!;
    const ctx = canvasTex.getContext();

    // Dark background
    ctx.fillStyle = '#0e140e';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Sample at minimap-pixel resolution (efficient: ~87×87 iterations max)
    const step = 2;
    const tileSize = 32;
    for (let mx = 0; mx < SIZE; mx += step) {
      for (let my = 0; my < SIZE; my += step) {
        const worldX = mx / this.minimapScaleX;
        const worldY = my / this.minimapScaleY;
        const tx = Math.floor(worldX / tileSize);
        const ty = Math.floor(worldY / tileSize);

        let color: string | null = null;
        // Deco layer tiles (roads, water features) override base
        if (this.decoLayer) {
          const dt = this.decoLayer.getTileAt(tx, ty);
          if (dt && dt.index >= 0) color = TILE_MINIMAP_COLORS[TILE_KEYS[dt.index]] || null;
        }
        if (!color && this.baseLayer) {
          const bt = this.baseLayer.getTileAt(tx, ty);
          if (bt && bt.index >= 0) color = TILE_MINIMAP_COLORS[TILE_KEYS[bt.index]] || '#1a2a1a';
        }
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(mx, my, step + 0.5, step + 0.5);
        }
      }
    }

    // ---- 2. Draw static POI markers ----
    const mapConfig = getMapConfig(this.currentMap);

    // Portals (purple)
    ctx.fillStyle = '#bb77ff';
    mapConfig.portals.forEach(p => {
      const px = (p.x + p.width / 2) * this.minimapScaleX;
      const py = (p.y + p.height / 2) * this.minimapScaleY;
      ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    // NPCs (yellow)
    ctx.fillStyle = '#ffdd44';
    mapConfig.npcs.forEach(n => {
      ctx.beginPath(); ctx.arc(n.x * this.minimapScaleX, n.y * this.minimapScaleY, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    // Enemy spawns (dim red)
    ctx.fillStyle = '#ff4444';
    ctx.globalAlpha = 0.45;
    mapConfig.enemies.forEach(e => {
      ctx.beginPath(); ctx.arc(e.x * this.minimapScaleX, e.y * this.minimapScaleY, 1.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ---- 3. Conflict Zone — 5 highlighted POIs (center + 4 corners) ----
    if (this.currentMap === 'conflict_zone') {
      const BO = 1600;
      const pois = [
        { x: mapW / 2, y: mapH / 2, color: '#ff44ff', r: 7, glow: '#ff88ff', label: 'FORTALEZA' },
        { x: BO, y: BO, color: '#ff4444', r: 5, glow: '#ff8888', label: 'CHAMA' },
        { x: mapW - BO, y: BO, color: '#4488ff', r: 5, glow: '#88aaff', label: 'GELO' },
        { x: BO, y: mapH - BO, color: '#44ff44', r: 5, glow: '#88ff88', label: 'NATUREZA' },
        { x: mapW - BO, y: mapH - BO, color: '#aa44ff', r: 5, glow: '#cc88ff', label: 'SOMBRIO' },
      ];
      pois.forEach(poi => {
        const px = poi.x * this.minimapScaleX;
        const py = poi.y * this.minimapScaleY;
        // Outer glow ring
        ctx.strokeStyle = poi.glow;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(px, py, poi.r + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // Solid circle
        ctx.fillStyle = poi.color;
        ctx.beginPath(); ctx.arc(px, py, poi.r, 0, Math.PI * 2); ctx.fill();
        // White center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        // Label
        ctx.fillStyle = poi.color;
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(poi.label, px, py + poi.r + 9);
      });
    }

    canvasTex.refresh();

    // ---- 4. Display minimap on screen (fixed position, scrollFactor 0) ----
    const screenW = this.cameras.main.width;
    this.minimapContainer = this.add.container(screenW - SIZE - PAD - 3, PAD + 3);
    this.minimapContainer.setScrollFactor(0);
    this.minimapContainer.setDepth(100);

    const bgImg = this.add.image(SIZE / 2, SIZE / 2, 'minimap_tex');
    this.minimapContainer.add(bgImg);

    // Player dot (only dynamic element — moves each frame)
    this.minimapPlayerDot = this.add.circle(0, 0, 4, 0x44ff44, 1);
    this.minimapContainer.add(this.minimapPlayerDot);

    this.tweens.add({
      targets: this.minimapPlayerDot,
      scaleX: 1.6, scaleY: 1.6,
      alpha: 0.5,
      yoyo: true, repeat: -1,
      duration: 700,
      ease: 'Sine.easeInOut',
    });

    // ---- 5. Handle window resize ----
    this.scale.on('resize', (gameSize: { width: number; height: number }) => {
      if (this.minimapContainer) {
        this.minimapContainer.setPosition(gameSize.width - SIZE - PAD - 3, PAD + 3);
      }
    });
  }

  // ========================
  // RICH MAP GENERATION
  // ========================
  generateMap() {
    const mapConfig = getMapConfig(this.currentMap);
    const { width, height, tileSize } = mapConfig;
    const cols = width / tileSize;
    const rows = height / tileSize;

    // Destroy previous tilemap if scene is restarting
    if (this.tileMap) { this.tileMap.destroy(); this.tileMap = null; }

    // --- BASE TILEMAP LAYER ---
    // One TilemapLayer = one WebGL draw call for all visible tiles (camera-culled).
    const map = this.make.tilemap({
      width: cols, height: rows,
      tileWidth: tileSize, tileHeight: tileSize,
    });
    const tileset = map.addTilesetImage("tiles", "__tileset__", tileSize, tileSize, 0, 0)!;
    this.tileMap = map;

    const baseLayer = map.createBlankLayer("base", tileset)!;
    baseLayer.setDepth(0);
    this.baseLayer = baseLayer;

    // Fast bulk-fill via direct array access (O(n), no per-call overhead)
    const wallIdx = TILE_IDX["tile_wall"];
    for (let ty = 0; ty < rows; ty++) {
      const row = baseLayer.layer.data[ty];
      for (let tx = 0; tx < cols; tx++) {
        const isBorder = tx === 0 || ty === 0 || tx >= cols - 1 || ty >= rows - 1;
        row[tx].index = isBorder ? wallIdx
          : TILE_IDX[this.getBaseTileKeyAt(tx * tileSize, ty * tileSize)];
      }
    }
    baseLayer.calculateFacesWithin();
    baseLayer.setCollision(wallIdx); // border walls block player automatically

    // --- DECO TILEMAP LAYER (roads, water, arena floors …) ---
    const decoLayer = map.createBlankLayer("deco", tileset)!;
    decoLayer.setDepth(1);
    this.decoLayer = decoLayer;

    // Area-specific decoration — calls drawTile() which writes to decoLayer
    switch (this.currentMap) {
      case "village": this.decorateVillage(width, height, tileSize); break;
      case "fields":  this.decorateFields(width, height, tileSize);  break;
      case "forest":  this.decorateForest(width, height, tileSize);  break;
      case "dungeon": this.decorateDungeon(width, height, tileSize); break;
      case "arena":   this.decorateArena(width, height, tileSize);   break;
      case "conflict_zone": this.decorateConflictZone(width, height, tileSize); break;
    }
  }

  // --- VILLAGE DECORATION --- (4800×3600)
  decorateVillage(w: number, h: number, _ts: number) {
    const cx = w / 2;
    const cy = h / 2;

    // === COBBLESTONE MAIN ROADS ===
    // Main east-west road
    for (let x = 80; x < w - 80; x += 32) {
      this.drawTile("tile_cobble", x, cy);
      this.drawTile("tile_cobble", x, cy + 32);
      this.drawTile("tile_cobble", x, cy - 32);
    }
    // Main north-south road
    for (let y = 80; y < h - 80; y += 32) {
      this.drawTile("tile_cobble", cx, y);
      this.drawTile("tile_cobble", cx + 32, y);
      this.drawTile("tile_cobble", cx - 32, y);
    }
    // Secondary path network
    const secPaths = [
      [900, 2100, 3600, 2100], [9600, 2100, 13500, 2100],
      [900, 8400, 3600, 8400], [9600, 8400, 13500, 8400],
      [3000, 900, 3000, 3600], [10800, 900, 10800, 3600],
      [3000, 7200, 3000, 9600], [10800, 7200, 10800, 9600],
    ];
    secPaths.forEach(([x1, y1, x2, y2]) => {
      if (y1 === y2) {
        for (let x = x1; x < x2; x += 32) this.drawTile("tile_path", x, y1);
      } else {
        for (let y = y1; y < y2; y += 32) this.drawTile("tile_path", x1, y);
      }
    });

    // === GRAND CENTRAL FOUNTAIN ===
    // Stone plaza around fountain
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (Math.sqrt(dx * dx + dy * dy) <= 3) {
          this.drawTile("tile_cobble", cx + dx * 32, cy + dy * 32);
        }
      }
    }
    const fountain = this.add.image(cx, cy, "deco_fountain").setScale(1.5);
    fountain.setDepth(3);
    const fBlock = this.decoColliders.create(cx, cy + 6, "deco_fountain");
    fBlock.setVisible(false); fBlock.body.setSize(50, 26); fBlock.body.setOffset(0, 24); fBlock.refreshBody();

    // === BUILDINGS — Spread across the massive 4800×3600 map ===
    // Northwest district - Administrative
    this.addRichBuilding(400, 300, 9, 6, 0xaa6633, "Hall do Ancião");
    this.addRichBuilding(1000, 300, 7, 5, 0x886644, "Taverna do Corvo");
    // Northeast - Military/Commercial
    this.addRichBuilding(3200, 300, 8, 6, 0x666666, "Ferreiro Baldur");
    this.addRichBuilding(4000, 300, 7, 5, 0x557788, "Armaria Real");
    // Central west - Residential
    this.addRichBuilding(300, 1400, 7, 5, 0x88aa55, "Curandeira Lyra");
    this.addRichBuilding(300, 2200, 6, 4, 0xcc8844, "Padaria");
    // Central east - Guild/Commerce
    this.addRichBuilding(3800, 1200, 9, 6, 0x8855aa, "Guilda dos Aventureiros");
    this.addRichBuilding(3800, 2200, 7, 5, 0xaa5533, "Mercado Central");
    // Southwest - Residential/Farm
    this.addRichBuilding(400, 2800, 7, 5, 0x886633, "Casa do Fazendeiro");
    this.addRichBuilding(1200, 2800, 6, 4, 0x667744, "Estábulos");
    // Southeast - Knowledge
    this.addRichBuilding(3600, 2800, 8, 5, 0x557788, "Biblioteca Arcana");
    this.addRichBuilding(4200, 2800, 6, 4, 0x885566, "Torre do Mago");

    // === SMALL HOUSES scattered ===
    const housePositions = [
      [1800, 3000], [3600, 1800], [5400, 3600], [8400, 1800],
      [2400, 7200], [4800, 7800], [9600, 5400], [12600, 4800],
      [6000, 6600], [10200, 7200], [13200, 2400], [4200, 5400],
    ];
    housePositions.forEach(([hx, hy]) => {
      const house = this.addDeco(hx, hy, "deco_house_small", true);
      if (house) { house.body.setSize(30, 16); house.body.setOffset(3, 14); house.refreshBody(); }
    });

    // === MARKET AREA (center-south) ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(cx - 200 + i * 60, cy + 250, "deco_barrel", false);
      if (i % 2 === 0) this.addDeco(cx - 200 + i * 60, cy + 280, "deco_crate", false);
    }
    for (let i = 0; i < 4; i++) {
      this.addDeco(cx - 100 + i * 70, cy + 310, "deco_cart", false);
    }

    // === WELLS ===
    const wellPositions = [[2400, 2400], [10800, 2400], [2400, 7800], [10800, 7800], [cx, cy + 1200]];
    wellPositions.forEach(([wx, wy]) => {
      const well = this.addDeco(wx, wy, "deco_well", true);
      if (well) { well.body.setSize(28, 14); well.body.setOffset(2, 22); well.refreshBody(); }
    });

    // === GARDENS WITH FENCES AND FLOWERS ===
    const gardenAreas = [
      [900, 3000], [4800, 1200], [9000, 3600], [12600, 6600],
      [3600, 7200], [10200, 4800], [6600, 2400], [7800, 7800],
    ];
    gardenAreas.forEach(([gx, gy]) => {
      for (let i = 0; i < 5; i++) this.addDeco(gx + i * 32, gy, "deco_fence", false);
      for (let i = 0; i < 5; i++) this.addDeco(gx + i * 32, gy + 80, "deco_fence", false);
      for (let i = 0; i < 5; i++) {
        const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue", "deco_flower_purple"];
        this.addDeco(gx + Math.random() * 150, gy + 10 + Math.random() * 60, flowers[Math.floor(Math.random() * 4)], false);
      }
      this.addDeco(gx + 80, gy + 40, "deco_bush_berry", false);
    });

    // === TREES — Coverage along edges and parks (optimized counts) ===
    for (let x = 100; x < w - 100; x += 240 + Math.floor(Math.random() * 100)) {
      const ty = 80 + Math.random() * 40;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_tree_large", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let x = 100; x < w - 100; x += 240 + Math.floor(Math.random() * 100)) {
      const ty = h - 80 - Math.random() * 40;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let y = 150; y < h - 150; y += 240 + Math.floor(Math.random() * 100)) {
      const tree = this.addDeco(80, y, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let y = 150; y < h - 150; y += 240 + Math.floor(Math.random() * 100)) {
      const tree = this.addDeco(w - 80, y, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Park trees (scattered interior)
    for (let i = 0; i < 12; i++) {
      const tx = 200 + Math.random() * (w - 400);
      const ty = 200 + Math.random() * (h - 400);
      // Skip if near roads
      if (Math.abs(ty - cy) < 60 || Math.abs(tx - cx) < 60) continue;
      const tree = this.addDeco(tx, ty, Math.random() > 0.3 ? "deco_tree" : "deco_tree_willow", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === BUSHES ===
    for (let i = 0; i < 15; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === SIGNPOSTS at key locations ===
    this.addDeco(cx + 200, cy - 200, "deco_signpost", false);
    this.addDeco(w - 200, cy, "deco_signpost", false);
    this.addDeco(cx, 200, "deco_signpost", false);
    this.addDeco(200, cy, "deco_signpost", false);

    // === LANTERNS along roads ===
    for (let x = 200; x < w - 200; x += 500) {
      this.addDeco(x, cy - 60, "deco_lantern", false);
      this.addDeco(x, cy + 80, "deco_lantern", false);
    }
    for (let y = 200; y < h - 200; y += 500) {
      this.addDeco(cx - 60, y, "deco_lantern", false);
      this.addDeco(cx + 80, y, "deco_lantern", false);
    }

    // === STATUE in training grounds ===
    const statue = this.addDeco(cx - 400, cy - 400, "deco_statue", true);
    if (statue) { statue.body.setSize(16, 8); statue.body.setOffset(2, 30); statue.refreshBody(); }
    const statue2 = this.addDeco(cx + 400, cy - 400, "deco_statue", true);
    if (statue2) { statue2.body.setSize(16, 8); statue2.body.setOffset(2, 30); statue2.refreshBody(); }

    // === BARRELS & CRATES near buildings ===
    const barrelSpots = [
      [2100, 1500], [3900, 1500], [10500, 1500], [12900, 1500],
      [1800, 4800], [1800, 7200], [12300, 4200], [12300, 7200],
      [2100, 9000], [4500, 9000], [11700, 9000], [13500, 9000],
    ];
    barrelSpots.forEach(([bx, by]) => {
      this.addDeco(bx, by, "deco_barrel", false);
      this.addDeco(bx + 20, by, "deco_crate", false);
    });

    // === ROCKS scattered ===
    for (let i = 0; i < 6; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_rock", false);
    }

    // === BANNERS at entrance gates ===
    this.addDeco(w - 100, cy - 80, "deco_banner_red", false);
    this.addDeco(w - 100, cy + 80, "deco_banner_blue", false);
    this.addDeco(cx - 80, 100, "deco_banner_red", false);
    this.addDeco(cx + 80, 100, "deco_banner_green", false);
    this.addDeco(100, cy - 80, "deco_banner_blue", false);
    this.addDeco(100, cy + 80, "deco_banner_red", false);
  }

  // --- FIELDS DECORATION --- (6400×4800)
  decorateFields(w: number, h: number, _ts: number) {
    // === ORGANIC DIRT ROAD NETWORK ===
    // Helper: draw a winding 2-tile-wide road along X axis with vertical sine wobble
    const windingRoadH = (y0: number, amp: number, freq: number, tileKey: string, width = 2) => {
      for (let x = 64; x < w - 64; x += 32) {
        const wobble = Math.round(Math.sin(x * freq) * amp / 32) * 32;
        for (let d = 0; d < width; d++) this.drawTile(tileKey, x, y0 + wobble + d * 32);
      }
    };
    // Helper: draw a winding road along Y axis with horizontal sine wobble
    const windingRoadV = (x0: number, amp: number, freq: number, tileKey: string, width = 2) => {
      for (let y = 64; y < h - 64; y += 32) {
        const wobble = Math.round(Math.sin(y * freq) * amp / 32) * 32;
        for (let d = 0; d < width; d++) this.drawTile(tileKey, x0 + wobble + d * 32, y);
      }
    };

    // Main east-west highway — gently winding, 3 tiles wide
    windingRoadH(h / 3, 64, 0.0055, "tile_dirt", 3);
    // Secondary southern trail — narrower, darker, more winding
    windingRoadH(2 * h / 3, 96, 0.009, "tile_dirt_dark", 2);
    // North-south crossroads — two winding verticals
    windingRoadV(w / 4, 48, 0.008, "tile_dirt", 2);
    windingRoadV(3 * w / 4, 48, 0.006, "tile_dirt", 2);
    // A diagonal connector path (south-west to north-east via tiles)
    const diagPts = 80;
    for (let i = 0; i < diagPts; i++) {
      const t = i / diagPts;
      const px = w * 0.15 + (w * 0.7) * t;
      const py = h * 0.75 - (h * 0.45) * t + Math.sin(t * Math.PI * 4) * 60;
      this.drawTile("tile_path", Math.round(px / 32) * 32, Math.round(py / 32) * 32);
      this.drawTile("tile_path", Math.round(px / 32) * 32, Math.round(py / 32) * 32 + 32);
    }

    // === FARM PLOTS — 12 farms spread across the map ===
    const farmPlots = [
      [600, 400], [1400, 300], [2400, 500], [3400, 400],
      [800, 2200], [1800, 2400], [3200, 2200], [4400, 2400],
      [600, 3600], [2000, 3800], [3600, 3600], [5000, 3200],
    ];
    farmPlots.forEach(([fx, fy]) => {
      // Dirt plots
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 7; col++) {
          const px = fx + col * 40;
          const py = fy + row * 50;
          this.drawTile("tile_dirt", px, py);
          if (Math.random() > 0.2) {
            this.addDeco(px, py - 8, "deco_wheat", false);
          }
        }
      }
      // Fences around plots
      for (let x = fx - 20; x < fx + 300; x += 32) {
        this.addDeco(x, fy - 30, "deco_fence", false);
        this.addDeco(x, fy + 220, "deco_fence", false);
      }
    });

    // === WINDMILLS ===
    const windmillPos = [[1000, 600], [3000, 600], [5000, 800], [1600, 3400], [4200, 3200]];
    windmillPos.forEach(([mx, my]) => {
      const mill = this.addDeco(mx, my, "deco_windmill", true);
      if (mill) { mill.body.setSize(12, 10); mill.body.setOffset(10, 36); mill.refreshBody(); }
    });

    // === HAYSTACKS in clusters ===
    for (let i = 0; i < 12; i++) {
      const hx = 200 + Math.random() * (w - 400);
      const hy = 200 + Math.random() * (h - 400);
      this.addDeco(hx, hy, "deco_haystack", false);
    }

    // === LARGE LAKE (center-west) ===
    const lakeX = w / 3;
    const lakeY = h / 2 + 200;
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (Math.sqrt(dx * dx + dy * dy) <= 3.5) {
          const tileKey = Math.sqrt(dx * dx + dy * dy) <= 2 ? "tile_water_deep" : "tile_water";
          this.drawTile(tileKey, lakeX + dx * 32, lakeY + dy * 32);
        }
      }
    }
    // Reeds around lake
    for (let a = 0; a < Math.PI * 2; a += 0.5) {
      const rx = lakeX + Math.cos(a) * 130;
      const ry = lakeY + Math.sin(a) * 105;
      this.addDeco(rx, ry, Math.random() > 0.5 ? "deco_bush" : "deco_flower_blue", false);
    }

    // === RIVER flowing south (wider, impassável — só pelas pontes) ===
    const riverX = Math.floor(2 * w / 3);
    const riverTiles = 4; // 128 px de largura
    const bridgeYArr = [Math.floor(h / 3), Math.floor(h / 2), Math.floor(2 * h / 3)];
    const bridgeHalfGap = 80; // zona passável ao redor de cada ponte

    for (let ry = 200; ry < h - 200; ry += 32) {
      const wobble = Math.round(Math.sin(ry * 0.01) * 40);
      const rx = riverX + wobble;
      // Tiles visuais de água
      for (let tx = 0; tx < riverTiles; tx++) {
        const tKey = (tx === 1 || tx === 2) ? "tile_water_deep" : "tile_water";
        this.drawTile(tKey, rx + tx * 32, ry);
      }
    }
    // Collision: 4 solid sections around the 3 bridge gaps
    const riverSections: [number, number][] = [
      [200, bridgeYArr[0] - bridgeHalfGap],
      [bridgeYArr[0] + bridgeHalfGap, bridgeYArr[1] - bridgeHalfGap],
      [bridgeYArr[1] + bridgeHalfGap, bridgeYArr[2] - bridgeHalfGap],
      [bridgeYArr[2] + bridgeHalfGap, h - 200],
    ];
    riverSections.forEach(([y1, y2]) => {
      const midY = (y1 + y2) / 2;
      this.addInvisibleWall(riverX + 64, midY, riverTiles * 32 + 80, y2 - y1);
    });
    // Pontes sobre o rio — grandes pontes de pedra
    bridgeYArr.forEach((by) => {
      const wobble = Math.round(Math.sin(by * 0.01) * 40);
      const rx = riverX + wobble;
      // Calçamento debaixo da ponte
      for (let bx = 0; bx < riverTiles; bx++) {
        this.drawTile("tile_cobble", rx + bx * 32, by);
      }
      this.addDeco(rx + 64, by, "deco_bridge", false);
    });

    // === SECOND POND (east) ===
    for (let dx = 0; dx < 8; dx++) {
      for (let dy = 0; dy < 7; dy++) {
        const tKey = (dx > 1 && dx < 6 && dy > 1 && dy < 5) ? "tile_water_deep" : "tile_water";
        this.drawTile(tKey, 15600 + dx * 32, 4800 + dy * 32);
      }
    }

    // === TREES — forest borders (optimized) ===
    // Northern tree line
    for (let x = 100; x < w - 100; x += 200 + Math.floor(Math.random() * 100)) {
      const ty = 80 + Math.random() * 60;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_tree_large", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Southern tree line
    for (let x = 100; x < w - 100; x += 200 + Math.floor(Math.random() * 100)) {
      const ty = h - 80 - Math.random() * 60;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Scattered trees across fields
    for (let i = 0; i < 20; i++) {
      const tx = 200 + Math.random() * (w - 400);
      const ty = 200 + Math.random() * (h - 400);
      const tree = this.addDeco(tx, ty, Math.random() > 0.6 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === BOULDERS AND ROCKS ===
    for (let i = 0; i < 8; i++) {
      const rx = 200 + Math.random() * (w - 400);
      const ry = 200 + Math.random() * (h - 400);
      this.addDeco(rx, ry, Math.random() > 0.5 ? "deco_rock" : "deco_boulder", Math.random() > 0.5);
    }

    // === MOUNTAIN ZONES — dense clusters with elevation feeling ===
    // Helper: place a mountain pack around a center point
    const mountainCluster = (cx: number, cy: number, radius: number, count: number, spread = 1.0) => {
      // Dense inner ring
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (i % 3) * 0.4;
        const r = radius * (0.2 + ((i * 7919) % 17) / 17 * 0.8) * spread;
        const mx = cx + Math.cos(a) * r + (((i * 6271) % 40) - 20);
        const my = cy + Math.sin(a) * r * 0.6 + (((i * 5381) % 30) - 15);
        const mt = this.addDeco(mx, my, "deco_mountain", true);
        if (mt) { mt.body.setSize(20, 12); mt.body.setOffset(6, 24); mt.refreshBody(); }
      }
      // Scattered outer foothills
      for (let i = 0; i < Math.floor(count * 0.5); i++) {
        const a = ((i * 11) / count) * Math.PI * 2;
        const r = radius * (1.0 + ((i * 3517) % 20) / 20 * 0.6) * spread;
        const mx = cx + Math.cos(a) * r + (((i * 7411) % 60) - 30);
        const my = cy + Math.sin(a) * r * 0.5 + (((i * 4637) % 40) - 20);
        this.addDeco(mx, my, "deco_boulder", Math.random() > 0.3);
      }
    };
    // Northern mountain range (dense)
    mountainCluster(w * 0.15, 80,  110, 8);
    mountainCluster(w * 0.35, 70,  100, 7);
    mountainCluster(w * 0.55, 90,  120, 9);
    mountainCluster(w * 0.78, 75,  100, 8);
    // Western mountain backdrop
    mountainCluster(60, h * 0.3, 90, 6, 0.5);
    mountainCluster(60, h * 0.6, 80, 5,  0.5);
    // Interior rocky rise (east-center)
    mountainCluster(w * 0.72, h * 0.55, 130, 7);

    // === BUSHES ===
    for (let i = 0; i < 15; i++) {
      this.addDeco(150 + Math.random() * (w - 300), 150 + Math.random() * (h - 300),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === FLOWERS ===
    for (let i = 0; i < 20; i++) {
      const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue", "deco_flower_purple"];
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        flowers[Math.floor(Math.random() * 4)], false);
    }

    // === STUMPS ===
    for (let i = 0; i < 5; i++) {
      this.addDeco(300 + Math.random() * (w - 600), 300 + Math.random() * (h - 600), "deco_stump", false);
    }

    // === SIGNPOSTS at crossroads ===
    this.addDeco(w / 4 + 40, h / 3 - 40, "deco_signpost", false);
    this.addDeco(3 * w / 4 + 40, h / 3 - 40, "deco_signpost", false);
    this.addDeco(w / 4 + 40, h / 2 - 40, "deco_signpost", false);

    // === CAMPFIRES (bandit camps) ===
    const campfirePos = [[13200, 4200], [14400, 5400], [15600, 6600], [9600, 10200]];
    campfirePos.forEach(([cfx, cfy]) => {
      this.addDeco(cfx, cfy, "deco_campfire", false);
      this.addDeco(cfx - 40, cfy + 20, "deco_tent", true);
      this.addDeco(cfx + 40, cfy + 20, "deco_barrel", false);
      this.addDeco(cfx - 20, cfy - 30, "deco_log", false);
    });

    // === CARTS on roads ===
    this.addDeco(w / 4 + 100, h / 3 + 50, "deco_cart", false);
    this.addDeco(w / 2, h / 3 + 50, "deco_cart", false);
    this.addDeco(3 * w / 4 - 100, h / 3 + 50, "deco_cart", false);

    // === STONE FENCES separating areas ===
    for (let x = w / 2 - 200; x < w / 2 + 200; x += 32) {
      this.addDeco(x, h / 4, "deco_fence_stone", false);
    }
  }

  // --- FOREST DECORATION ---
  decorateForest(w: number, h: number, _ts: number) {
    // === FOREST DECORATION (5600×4400) ===
    // Dense ancient forest with distinct biomes

    // === MAIN PATHS ===
    // Winding east-west forest trail
    for (let x = 80; x < w - 80; x += 32) {
      const wobble = Math.sin(x * 0.008) * 50;
      this.drawTile("tile_dirt", x, h / 2 + wobble);
      this.drawTile("tile_dirt", x, h / 2 + wobble + 32);
    }
    // North-south deer trail
    for (let y = 200; y < h - 200; y += 32) {
      const wobble = Math.sin(y * 0.01) * 30;
      this.drawTile("tile_dirt", w / 3 + wobble, y);
    }

    // === DENSE FOREST ZONES — organic clumps instead of uniform scatter ===
    // Returns true if position is too close to the main path/trail
    const nearPath = (tx: number, ty: number): boolean => {
      const pw1 = Math.sin(tx * 0.008) * 50;
      const pw2 = Math.sin(ty * 0.01) * 30;
      return Math.abs(ty - (h / 2 + pw1)) < 80 || Math.abs(tx - (w / 3 + pw2)) < 60;
    };

    const placeTree = (tx: number, ty: number, type: string) => {
      if (nearPath(tx, ty)) return;
      if (tx < 60 || ty < 60 || tx > w - 60 || ty > h - 60) return;
      const tree = this.addDeco(tx, ty, type, true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    };

    // Dense forest clump helper — organic irregular placement
    const forestClump = (
      fcx: number, fcy: number, baseRadius: number,
      types: string[], count: number
    ) => {
      for (let i = 0; i < count; i++) {
        const seed = i * 7919 + fcx;
        const a = (i / count) * Math.PI * 2 + ((seed % 31) / 31) * 1.2;
        const r = baseRadius * (0.15 + ((seed % 23) / 23) * 0.85);
        const jx = ((seed * 6271) % 60) - 30;
        const jy = ((seed * 5381) % 50) - 25;
        const tx = fcx + Math.cos(a) * r + jx;
        const ty = fcy + Math.sin(a) * r * 0.8 + jy;
        placeTree(tx, ty, types[seed % types.length]);
      }
    };

    // --- 8 distinct forest biome clumps (optimized counts) ---
    // NW: dense pine grove
    forestClump(w * 0.12, h * 0.20, 180, ["deco_pine", "deco_pine_large", "deco_pine"], 14);
    // NE: mixed deciduous
    forestClump(w * 0.75, h * 0.18, 200, ["deco_tree_large", "deco_tree", "deco_tree_large"], 16);
    // W center: ancient oaks (large + willow mix)
    forestClump(w * 0.08, h * 0.52, 160, ["deco_tree_large", "deco_tree_willow", "deco_tree"], 12);
    // E center: dark hollow (dead + pine)
    forestClump(w * 0.85, h * 0.55, 170, ["deco_tree_dead", "deco_pine", "deco_tree_dead"], 14);
    // SW: young mixed forest
    forestClump(w * 0.18, h * 0.78, 190, ["deco_tree", "deco_pine", "deco_tree_large"], 14);
    // SE: deep pine forest
    forestClump(w * 0.78, h * 0.80, 200, ["deco_pine_large", "deco_pine", "deco_pine_large"], 18);
    // Center-north: enchanted willow grove
    forestClump(w * 0.50, h * 0.14, 150, ["deco_tree_willow", "deco_tree_large", "deco_tree"], 12);
    // Center-south: glade edge trees
    forestClump(w * 0.48, h * 0.82, 160, ["deco_tree", "deco_pine", "deco_tree_willow"], 12);

    // Sparse connector trees between clumps
    const placed2: { x: number; y: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const seed = i * 6271 + 17;
      const tx = 80 + ((seed * 7411) % (w - 200));
      const ty = 80 + ((seed * 5381) % (h - 200));
      if (nearPath(tx, ty)) continue;
      const tooClose = placed2.some(p => Math.abs(p.x - tx) < 48 && Math.abs(p.y - ty) < 48);
      if (tooClose) continue;
      placed2.push({ x: tx, y: ty });
      const r2 = i % 7;
      const treeType = r2 < 2 ? "deco_pine" : r2 < 4 ? "deco_tree" : r2 < 5 ? "deco_tree_dead" : r2 < 6 ? "deco_pine_large" : "deco_tree_large";
      placeTree(tx, ty, treeType);
    }

    // Dense border tree wall (all 4 edges)
    for (let x = 64; x < w - 64; x += 120 + (x * 37) % 60) {
      placeTree(x, 64 + (x % 3) * 18, "deco_pine");
      placeTree(x, h - 64 - (x % 3) * 18, "deco_tree_large");
    }
    for (let y = 100; y < h - 100; y += 120 + (y * 41) % 60) {
      placeTree(64 + (y % 3) * 14, y, "deco_tree");
      placeTree(w - 64 - (y % 3) * 14, y, "deco_pine_large");
    }

    // === MOUNTAIN RIDGE — northern edge, forest origin ===
    const forestMtnCluster = (cx: number, cy: number, r: number, cnt: number) => {
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * Math.PI * 1.8 - Math.PI * 0.1;
        const d = r * (0.3 + ((i * 6271) % 17) / 17 * 0.7);
        const mx = cx + Math.cos(a) * d + (((i * 5381) % 40) - 20);
        const my = cy + Math.sin(a) * d * 0.45;
        const mt = this.addDeco(mx, my, "deco_mountain", true);
        if (mt) { mt.body.setSize(20, 12); mt.body.setOffset(6, 24); mt.refreshBody(); }
      }
    };
    forestMtnCluster(w * 0.10, 70, 100, 6);
    forestMtnCluster(w * 0.35, 65, 110, 7);
    forestMtnCluster(w * 0.62, 75, 100, 6);
    forestMtnCluster(w * 0.88, 68, 90, 6);


    // === WILLOW GROVE (center-east, near water) ===
    const willowPos = [[11400, 5400], [11700, 6000], [12000, 5100], [12300, 5700], [11100, 6300]];
    willowPos.forEach(([wx, wy]) => {
      const tree = this.addDeco(wx, wy, "deco_tree_willow", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    });

    // === ENCHANTED STREAM (impassável — só pelas pontes) ===
    const streamX = Math.floor(2 * w / 3);
    const streamTiles = 4; // 128px de largura
    const streamBridgeY = [Math.floor(h / 3), Math.floor(h / 2)];
    const streamBridgeGap = 80;

    for (let sy = 400; sy < h - 400; sy += 32) {
      const wobble = Math.round(Math.sin(sy * 0.015) * 60);
      const sx = streamX + wobble;
      for (let tx = 0; tx < streamTiles; tx++) {
        const tKey = (tx === 1 || tx === 2) ? "tile_water_deep" : "tile_water";
        this.drawTile(tKey, sx + tx * 32, sy);
      }
    }
    // Stream collision: 3 solid sections around the 2 bridge gaps
    const streamSections: [number, number][] = [
      [400, streamBridgeY[0] - streamBridgeGap],
      [streamBridgeY[0] + streamBridgeGap, streamBridgeY[1] - streamBridgeGap],
      [streamBridgeY[1] + streamBridgeGap, h - 400],
    ];
    streamSections.forEach(([y1, y2]) => {
      const midY = (y1 + y2) / 2;
      this.addInvisibleWall(streamX + 64, midY, streamTiles * 32 + 120, y2 - y1);
    });
    // Pontes sobre o riacho encantado
    streamBridgeY.forEach((by) => {
      const wobble = Math.round(Math.sin(by * 0.015) * 60);
      const sx = streamX + wobble;
      for (let bx = 0; bx < streamTiles; bx++) {
        this.drawTile("tile_cobble", sx + bx * 32, by);
      }
      this.addDeco(sx + 64, by, "deco_bridge", false);
    });

    // === WATERFALL (north, stream source) ===
    this.addDeco(2 * w / 3 + Math.sin(400 * 0.015) * 60, 380, "deco_waterfall", true);

    // === SWAMP ZONE (south-east) ===
    for (let x = 10800; x < 14400; x += 32) {
      for (let y = 9600; y < 12000; y += 32) {
        if (Math.random() > 0.4) this.drawTile("tile_swamp", x, y);
      }
    }
    // Dead trees in swamp
    for (let i = 0; i < 8; i++) {
      const tree = this.addDeco(10800 + Math.random() * 3600, 9600 + Math.random() * 2400, "deco_tree_dead", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === MUSHROOM GROVES ===
    for (let i = 0; i < 10; i++) {
      const mx = 300 + Math.random() * (w - 600);
      const my = 300 + Math.random() * (h - 600);
      this.addDeco(mx, my, "deco_mushroom", false);
      this.addDeco(mx + 15, my + 10, "deco_mushroom", false);
    }
    // Glowing mushrooms (deeper forest, north)
    for (let i = 0; i < 10; i++) {
      this.addDeco(4500 + Math.random() * 6000, 1500 + Math.random() * 3600, "deco_mushroom_glow", false);
    }

    // === ANCIENT RUINS (center-north) ===
    const ruinX = w / 2 - 100;
    const ruinY = h / 4;
    // Stone platform
    for (let x = -3; x <= 3; x++) {
      for (let y = -2; y <= 2; y++) {
        this.drawTile("tile_stone_mossy", ruinX + x * 32, ruinY + y * 32);
      }
    }
    // Ruined walls and pillars
    for (let x = -3; x <= 3; x++) {
      if (Math.random() > 0.3) this.addDeco(ruinX + x * 32, ruinY - 64, "deco_ruined_wall", true);
      if (Math.random() > 0.3) this.addDeco(ruinX + x * 32, ruinY + 80, "deco_ruined_wall", true);
    }
    const ruinPillar = (px: number, py: number) => {
      const p = this.addDeco(px, py, "deco_pillar_ruined", true);
      if (p) { p.body.setSize(12, 8); p.body.setOffset(2, 30); p.refreshBody(); }
    };
    ruinPillar(ruinX - 96, ruinY - 64); ruinPillar(ruinX + 96, ruinY - 64);
    ruinPillar(ruinX - 96, ruinY + 80); ruinPillar(ruinX + 96, ruinY + 80);
    // Shrine in ruins center
    this.addDeco(ruinX, ruinY, "deco_shrine_glow", false);

    // === FAIRY CLEARING (south-west) ===
    const fairyX = w / 5;
    const fairyY = 3 * h / 4;
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (Math.sqrt(dx * dx + dy * dy) <= 3) {
          this.drawTile("tile_grass_lush", fairyX + dx * 32, fairyY + dy * 32);
        }
      }
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.addDeco(fairyX + Math.cos(a) * 80, fairyY + Math.sin(a) * 80, "deco_crystal", false);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const flowers = ["deco_flower_blue", "deco_flower_purple"];
      this.addDeco(fairyX + Math.cos(a) * 50, fairyY + Math.sin(a) * 50, flowers[i % 2], false);
    }
    this.addDeco(fairyX, fairyY, "deco_lantern", false);

    // === SPIDER DEN (east) ===
    for (let i = 0; i < 10; i++) {
      this.addDeco(13200 + Math.random() * 2400, 3000 + Math.random() * 3000, "deco_web", false);
    }

    // === VINES on trees ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_vine", false);
    }

    // === LOGS and STUMPS ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_log", false);
    }
    for (let i = 0; i < 6; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_stump", false);
    }

    // === BUSHES ===
    for (let i = 0; i < 20; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === ROCKS AND BOULDERS ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(150 + Math.random() * (w - 300), 150 + Math.random() * (h - 300),
        Math.random() > 0.5 ? "deco_rock" : "deco_boulder", Math.random() > 0.5);
    }

    // === FLOWERS ===
    for (let i = 0; i < 12; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_flower_blue", false);
    }

    // === CAMPFIRE CLEARING ===
    const campX = w / 2 + 400;
    const campY = h / 2 + 300;
    this.addDeco(campX, campY, "deco_campfire", false);
    this.addDeco(campX - 50, campY + 20, "deco_tent", true);
    this.addDeco(campX + 40, campY - 20, "deco_log", false);
    this.addDeco(campX + 40, campY + 30, "deco_log", false);
    this.addDeco(campX - 30, campY - 40, "deco_barrel", false);

    // Mountain range (north edge)
    for (let x = 200; x < w - 200; x += 300 + Math.floor(Math.random() * 120)) {
      this.addDeco(x, 50 + Math.random() * 30, "deco_mountain", true);
    }
    // Cliffs near stream
    this.addDeco(2 * w / 3 + 100, 300, "deco_cliff", true);
    this.addDeco(2 * w / 3 - 60, 300, "deco_cliff", true);

    // === MOSSY DARK PATCHES ===
    for (let i = 0; i < 6; i++) {
      const dx = 200 + Math.random() * (w - 400);
      const dy = 200 + Math.random() * (h - 400);
      for (let px = 0; px < 2; px++) {
        for (let py = 0; py < 2; py++) {
          this.drawTile("tile_dark", dx + px * 32, dy + py * 32);
        }
      }
    }

    // === SIGNPOST at trail crossroads ===
    this.addDeco(w / 3 + 40, h / 2 - 40, "deco_signpost", false);
  }

  // --- DUNGEON DECORATION --- (14400×10800)
  decorateDungeon(w: number, h: number, _ts: number) {
    // === MAIN CORRIDORS ===
    // Horizontal main hall
    for (let x = 64; x < w - 64; x += 32) {
      for (let dy = -1; dy <= 1; dy++) {
        this.drawTile("tile_stone", x, h / 2 + dy * 32);
      }
    }
    // Vertical corridors (4)
    const vCorrX = [w / 5, 2 * w / 5, 3 * w / 5, 4 * w / 5];
    vCorrX.forEach(cx => {
      for (let y = 64; y < h - 64; y += 32) {
        this.drawTile("tile_stone", cx, y);
        this.drawTile("tile_stone", cx + 32, y);
      }
    });

    // === ROOM DEFINITIONS ===
    const rooms = [
      // [x, y, tw, th, name, floorTile]
      { x: 300, y: 300, tw: 24, th: 18, name: "Entrance Hall", tile: "tile_stone" },
      { x: 300, y: h - 2100, tw: 24, th: 18, name: "Prison Block", tile: "tile_stone" },
      { x: w / 2 - 480, y: 300, tw: 30, th: 21, name: "Ritual Chamber", tile: "tile_stone_mossy" },
      { x: w - 2700, y: 300, tw: 27, th: 18, name: "Armory", tile: "tile_stone" },
      { x: w - 2700, y: h - 2100, tw: 30, th: 24, name: "Boss Throne", tile: "tile_stone" },
      { x: 300, y: h / 2 - 900, tw: 21, th: 15, name: "Treasure Vault", tile: "tile_stone" },
      { x: w / 2 - 384, y: h - 2100, tw: 24, th: 18, name: "Crypt", tile: "tile_stone_mossy" },
      { x: w - 1500, y: h / 2 - 750, tw: 21, th: 15, name: "Library", tile: "tile_stone" },
    ];

    rooms.forEach(room => {
      // Floor
      for (let bx = 0; bx < room.tw; bx++) {
        for (let by = 0; by < room.th; by++) {
          this.drawTile(room.tile, room.x + bx * 32 + 16, room.y + by * 32 + 16);
        }
      }
      // Walls (border)
      for (let bx = 0; bx < room.tw; bx++) {
        this.addWallBlock(room.x + bx * 32 + 16, room.y);
        this.addWallBlock(room.x + bx * 32 + 16, room.y + (room.th - 1) * 32);
      }
      for (let by = 1; by < room.th - 1; by++) {
        this.addWallBlock(room.x, room.y + by * 32 + 16);
        this.addWallBlock(room.x + (room.tw - 1) * 32, room.y + by * 32 + 16);
      }
    });

    // === CORRIDOR WALLS ===
    for (let x = 64; x < w - 64; x += 32) {
      // Skip openings at vertical corridor intersections
      const nearVCorr = vCorrX.some(cx => Math.abs(x - cx) < 48);
      if (!nearVCorr) {
        this.addWallBlock(x, h / 2 - 64);
        this.addWallBlock(x, h / 2 + 64);
      }
    }

    // === PILLAR SYSTEM ===
    // Pillars in each room
    rooms.forEach(room => {
      const cx = room.x + (room.tw * 32) / 2;
      const cy = room.y + (room.th * 32) / 2;
      const offsets = [[-60, -40], [60, -40], [-60, 40], [60, 40]];
      offsets.forEach(([ox, oy]) => {
        const r = Math.random();
        const pType = r < 0.4 ? "deco_pillar" : "deco_pillar_ruined";
        const p = this.addDeco(cx + ox, cy + oy, pType, true);
        if (p) { p.body.setSize(12, 8); p.body.setOffset(2, 30); p.refreshBody(); }
      });
    });

    // === TORCHES — along corridors (optimized spacing) ===
    for (let x = 128; x < w - 128; x += 200) {
      this.addDeco(x, h / 2 - 90, "deco_torch", false);
      this.addDeco(x, h / 2 + 90, "deco_torch", false);
    }
    vCorrX.forEach(cx => {
      for (let y = 128; y < h - 128; y += 240) {
        this.addDeco(cx - 40, y, "deco_torch", false);
      }
    });
    // Lanterns in rooms
    rooms.forEach(room => {
      this.addDeco(room.x + 20, room.y + 20, "deco_lantern", false);
      this.addDeco(room.x + room.tw * 32 - 20, room.y + 20, "deco_lantern", false);
    });

    // === LAVA ZONE (center-south) ===
    const lavaX = w / 2;
    const lavaY = 2 * h / 3 + 200;
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (Math.sqrt(dx * dx + dy * dy) <= 3.5) {
          this.drawTile("tile_lava", lavaX + dx * 32, lavaY + dy * 32);
        }
      }
    }

    // === ENTRANCE HALL decorations ===
    this.addDeco(600, 600, "deco_barrel", false);
    this.addDeco(690, 600, "deco_barrel", false);
    this.addDeco(780, 600, "deco_crate", false);
    this.addDeco(600, 750, "deco_crate", false);

    // === PRISON BLOCK ===
    for (let i = 0; i < 4; i++) {
      const cellX = 450 + i * 180;
      const cellY = h - 1800;
      this.addDeco(cellX, cellY, "deco_bones", false);
      // Iron fences (use stone fence as bars)
      this.addDeco(cellX, cellY - 90, "deco_fence_stone", false);
    }

    // === RITUAL CHAMBER ===
    const ritualCX = w / 2;
    const ritualCY = 900;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      this.addDeco(ritualCX + Math.cos(a) * 70, ritualCY + Math.sin(a) * 70, "deco_crystal", false);
    }
    this.addDeco(ritualCX, ritualCY, "deco_shrine_glow", false);

    // === ARMORY room ===
    for (let i = 0; i < 5; i++) {
      this.addDeco(w - 2550 + i * 150, 600, "deco_barrel", false);
      this.addDeco(w - 2550 + i * 150, 750, "deco_crate", false);
    }
    this.addDeco(w - 1800, 1050, "deco_statue", true);

    // === TREASURE VAULT ===
    for (let i = 0; i < 6; i++) {
      this.addDeco(600 + i * 120, h / 2 - 660, "deco_chest", false);
    }
    this.addDeco(900, h / 2 - 450, "deco_barrel", false);
    this.addDeco(1050, h / 2 - 450, "deco_barrel", false);

    // === CRYPT ===
    for (let i = 0; i < 6; i++) {
      this.addDeco(w / 2 - 240 + i * 120, h - 1800, "deco_tombstone", false);
    }
    for (let i = 0; i < 4; i++) {
      this.addDeco(w / 2 - 180 + i * 150, h - 1500, "deco_bones", false);
    }

    // === BOSS THRONE ROOM ===
    const bossRX = w - 1500;
    const bossRY = h - 1200;
    this.addDeco(bossRX, bossRY - 100, "deco_statue", true);
    this.addDeco(bossRX - 80, bossRY - 60, "deco_banner_red", false);
    this.addDeco(bossRX + 80, bossRY - 60, "deco_banner_red", false);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.addDeco(bossRX + Math.cos(a) * 100, bossRY + Math.sin(a) * 80, "deco_torch", false);
    }
    // Scattered bones
    for (let i = 0; i < 8; i++) {
      this.addDeco(bossRX + (Math.random() - 0.5) * 150, bossRY + (Math.random() - 0.5) * 120, "deco_bones", false);
    }

    // === LIBRARY ROOM ===
    for (let i = 0; i < 4; i++) {
      this.addDeco(w - 1350 + i * 150, h / 2 - 600, "deco_crate", false);
      this.addDeco(w - 1350 + i * 150, h / 2 - 450, "deco_crate", false);
    }
    this.addDeco(w - 1050, h / 2 - 300, "deco_lantern", false);

    // === SCATTERED BONES throughout ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_bones", false);
    }

    // === SCATTERED ROCKS ===
    for (let i = 0; i < 8; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_rock", false);
    }

    // === WEBS in dark corners ===
    for (let i = 0; i < 5; i++) {
      this.addDeco(80 + Math.random() * (w - 160), 80 + Math.random() * (h - 160), "deco_web", false);
    }
  }

  // --- ARENA DECORATION --- (7200×7200)
  decorateArena(w: number, h: number, _ts: number) {
    const cx = w / 2;
    const cy = h / 2;

    // === GRAND ARENA PIT ===
    const pitR = 1500;
    for (let x = cx - pitR; x < cx + pitR; x += 32) {
      for (let y = cy - pitR; y < cy + pitR; y += 32) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < pitR) {
          this.drawTile("tile_arena", x, y);
        }
      }
    }

    // Sand border ring
    for (let angle = 0; angle < Math.PI * 2; angle += 0.06) {
      const bx = cx + Math.cos(angle) * (pitR + 16);
      const by = cy + Math.sin(angle) * (pitR + 16);
      this.drawTile("tile_sand", bx, by);
    }

    // Inner decorative circle
    for (let angle = 0; angle < Math.PI * 2; angle += 0.08) {
      this.drawTile("tile_sand", cx + Math.cos(angle) * (pitR - 40), cy + Math.sin(angle) * (pitR - 40));
    }

    // === 16 BANNERS around arena perimeter ===
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const bx = cx + Math.cos(angle) * (pitR + 80);
      const by = cy + Math.sin(angle) * (pitR + 80);
      const bannerType = i % 3 === 0 ? "deco_banner_red" : i % 3 === 1 ? "deco_banner_blue" : "deco_banner_green";
      this.addDeco(bx, by, bannerType, false);
    }

    // === 12 TORCHES ===
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.addDeco(cx + Math.cos(angle) * (pitR + 55), cy + Math.sin(angle) * (pitR + 55), "deco_torch", false);
    }

    // === 8 PILLARS ===
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = cx + Math.cos(angle) * (pitR + 100);
      const py = cy + Math.sin(angle) * (pitR + 100);
      const p = this.addDeco(px, py, "deco_pillar", true);
      if (p) { p.body.setSize(12, 8); p.body.setOffset(2, 30); p.refreshBody(); }
    }

    // === SPECTATOR STANDS (stone on all 4 sides) ===
    // North stands
    for (let x = 64; x < w - 64; x += 32) {
      for (let y = 40; y < 660; y += 32) {
        this.drawTile("tile_stone", x, y);
      }
    }
    // South stands
    for (let x = 64; x < w - 64; x += 32) {
      for (let y = h - 660; y < h - 40; y += 32) {
        this.drawTile("tile_stone", x, y);
      }
    }
    // West stands
    for (let y = 660; y < h - 660; y += 32) {
      for (let x = 40; x < 540; x += 32) {
        this.drawTile("tile_stone", x, y);
      }
    }
    // East stands
    for (let y = 660; y < h - 660; y += 32) {
      for (let x = w - 540; x < w - 40; x += 32) {
        this.drawTile("tile_stone", x, y);
      }
    }

    // === 4 STATUES at cardinal points ===
    const statuePos = [[cx, 600], [cx, h - 600], [540, cy], [w - 540, cy]];
    statuePos.forEach(([sx, sy]) => {
      const s = this.addDeco(sx, sy, "deco_statue", true);
      if (s) { s.body.setSize(12, 8); s.body.setOffset(4, 30); s.refreshBody(); }
    });

    // === ENTRANCE GATES (east and west) ===
    // West gate
    const wgP1 = this.addDeco(60, cy - 70, "deco_pillar", true);
    if (wgP1) { wgP1.body.setSize(12, 8); wgP1.body.setOffset(2, 30); wgP1.refreshBody(); }
    const wgP2 = this.addDeco(60, cy + 70, "deco_pillar", true);
    if (wgP2) { wgP2.body.setSize(12, 8); wgP2.body.setOffset(2, 30); wgP2.refreshBody(); }
    this.addDeco(60, cy - 100, "deco_banner_red", false);
    this.addDeco(60, cy + 100, "deco_banner_red", false);
    // East gate
    const egP1 = this.addDeco(w - 60, cy - 70, "deco_pillar", true);
    if (egP1) { egP1.body.setSize(12, 8); egP1.body.setOffset(2, 30); egP1.refreshBody(); }
    const egP2 = this.addDeco(w - 60, cy + 70, "deco_pillar", true);
    if (egP2) { egP2.body.setSize(12, 8); egP2.body.setOffset(2, 30); egP2.refreshBody(); }
    this.addDeco(w - 60, cy - 100, "deco_banner_blue", false);
    this.addDeco(w - 60, cy + 100, "deco_banner_blue", false);

    // === SUPPLY AREAS ===
    // West supplies
    this.addDeco(100, cy - 40, "deco_barrel", false);
    this.addDeco(100, cy + 40, "deco_barrel", false);
    this.addDeco(130, cy, "deco_crate", false);
    this.addDeco(130, cy - 30, "deco_crate", false);
    // East supplies
    this.addDeco(w - 100, cy - 40, "deco_barrel", false);
    this.addDeco(w - 100, cy + 40, "deco_barrel", false);
    this.addDeco(w - 130, cy, "deco_crate", false);

    // === BONES scattered in arena ===
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * (pitR - 150);
      this.addDeco(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, "deco_bones", false);
    }

    // === LANTERNS on stands ===
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + 0.2;
      this.addDeco(cx + Math.cos(angle) * (pitR + 130), cy + Math.sin(angle) * (pitR + 130), "deco_lantern", false);
    }

    // === CHAMPION PREPARATION ROOMS (NW and NE corners) ===
    // NW room
    for (let rx = 60; rx < 280; rx += 32) {
      for (let ry = 60; ry < 200; ry += 32) {
        this.drawTile("tile_stone", rx, ry);
      }
    }
    this.addDeco(100, 100, "deco_chest", false);
    this.addDeco(200, 100, "deco_barrel", false);
    // NE room
    for (let rx = w - 280; rx < w - 60; rx += 32) {
      for (let ry = 60; ry < 200; ry += 32) {
        this.drawTile("tile_stone", rx, ry);
      }
    }
    this.addDeco(w - 200, 100, "deco_chest", false);
    this.addDeco(w - 120, 100, "deco_barrel", false);
  }

  // ========================
  // CONFLICT ZONE DECORATION
  // Epic strategic PvP map: 4 quadrants, central fortress,
  // alliance bases, rivers, roads, dungeons, magic portals
  // ========================
  decorateConflictZone(w: number, h: number, _ts: number) {
    const cx = w / 2;   // 9600
    const cy = h / 2;   // 9600
    const BO = 1600;    // base offset from corners

    // ============================================
    // 1) ROADS — Stone roads connecting all bases to central fortress
    //    Slightly curved with worn texture
    // ============================================
    const drawRoad = (x1: number, y1: number, x2: number, y2: number, width = 3) => {
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 32;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        // Slight curve
        const wobble = Math.sin(t * Math.PI * 3) * 48;
        const perpX = -(y2 - y1) / (steps * 32);
        const perpY = (x2 - x1) / (steps * 32);
        for (let d = -Math.floor(width / 2); d <= Math.floor(width / 2); d++) {
          this.drawTile("tile_cobble", px + perpX * wobble + perpY * d * 32, py + perpY * wobble - perpX * d * 32);
        }
      }
    };

    // Diagonal roads: corners → center
    drawRoad(BO, BO, cx, cy, 3);
    drawRoad(w - BO, BO, cx, cy, 3);
    drawRoad(BO, h - BO, cx, cy, 3);
    drawRoad(w - BO, h - BO, cx, cy, 3);

    // Perimeter roads: connecting adjacent bases
    drawRoad(BO, BO, w - BO, BO, 2);          // top
    drawRoad(BO, h - BO, w - BO, h - BO, 2);  // bottom
    drawRoad(BO, BO, BO, h - BO, 2);           // left
    drawRoad(w - BO, BO, w - BO, h - BO, 2);   // right

    // Path/dirt border alongside roads for worn edge effect
    const drawDirtBorder = (x1: number, y1: number, x2: number, y2: number) => {
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 64;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        const wobble = Math.sin(t * Math.PI * 4) * 32;
        this.drawTile("tile_dirt", px + wobble + 64, py + wobble + 64);
        this.drawTile("tile_dirt_dark", px - wobble - 64, py - wobble - 64);
      }
    };
    drawDirtBorder(BO, BO, cx, cy);
    drawDirtBorder(w - BO, BO, cx, cy);
    drawDirtBorder(BO, h - BO, cx, cy);
    drawDirtBorder(w - BO, h - BO, cx, cy);

    // ============================================
    // 2) RIVERS — Flowing NW→SE with tributary from NE
    //    Deep center, shallow edges with realistic depth
    // ============================================
    const drawRiver = (points: { x: number; y: number }[], riverWidth = 5) => {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = dist / 32;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = p1.x + dx * t;
          const py = p1.y + dy * t;
          const sine = Math.sin(t * Math.PI * 2 + i) * 48;
          const nx = -dy / dist;
          const ny = dx / dist;
          for (let d = -riverWidth; d <= riverWidth; d++) {
            const rx = px + nx * d * 32 + nx * sine;
            const ry = py + ny * d * 32 + ny * sine;
            const ad = Math.abs(d);
            if (ad <= 1) {
              this.drawTile("tile_water_deep", rx, ry); // deep center
            } else if (ad <= 3) {
              this.drawTile("tile_water", rx, ry);      // shallow
            } else {
              this.drawTile("tile_dirt", rx, ry);        // muddy banks
            }
          }
        }
      }
    };

    // Main river NW → SE
    drawRiver([
      { x: 800, y: 4800 }, { x: 3200, y: 6400 }, { x: 6400, y: 7200 },
      { x: 9600, y: 8000 }, { x: 12800, y: 9600 },
      { x: 16000, y: 12800 }, { x: 18400, y: 16000 },
    ], 4);

    // Tributary from NE
    drawRiver([
      { x: 14400, y: 800 }, { x: 13600, y: 3200 },
      { x: 12000, y: 5600 }, { x: 10400, y: 7600 }, { x: 9600, y: 8000 },
    ], 3);

    // ============================================
    // 3) CENTRAL FORTRESS — Corrupted ground + massive structure
    // ============================================

    // Corrupted ground ring around fortress (optimized step)
    const corruptR = 1200;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.06) {
      for (let r = 400; r < corruptR; r += 64) {
        const fx = cx + Math.cos(angle) * r;
        const fy = cy + Math.sin(angle) * r;
        this.drawTile("tile_dark", fx, fy);
      }
    }

    // Purple crack lines radiating from center
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      for (let r = 200; r < corruptR + 200; r += 120) {
        const fx = cx + Math.cos(angle) * r;
        const fy = cy + Math.sin(angle) * r;
        this.addDeco(fx, fy, "cz_corrupted", false);
      }
    }

    // Boss aura
    this.addDeco(cx, cy, "cz_boss_aura", false);

    // Fortress structure (large)
    const fort = this.addDeco(cx, cy - 20, "cz_fortress", true);
    if (fort) {
      fort.body.setSize(100, 60);
      fort.body.setOffset(14, 40);
      fort.refreshBody();
    }

    // Fortress label
    const fortLabel = this.add.text(cx, cy - 100, "⚔️ Cidadela das Sombras ⚔️", {
      fontSize: "12px",
      color: "#cc88ff",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 3,
    });
    fortLabel.setOrigin(0.5, 1);
    fortLabel.setDepth(5);

    // Torches around fortress
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.addDeco(cx + Math.cos(angle) * 220, cy + Math.sin(angle) * 220, "deco_torch", false);
    }

    // Pillars around fortress entrance
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = cx + Math.cos(angle) * 300;
      const py = cy + Math.sin(angle) * 300;
      const p = this.addDeco(px, py, "deco_pillar", true);
      if (p) { p.body.setSize(12, 8); p.body.setOffset(2, 30); p.refreshBody(); }
    }

    // Bones scattered around fortress
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 600;
      this.addDeco(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, "deco_bones", false);
    }

    // ============================================
    // 4) ALLIANCE BASES — Four corners with colored structures
    // ============================================
    const bases = [
      { x: BO, y: BO, color: "red", baseKey: "cz_base_red", bannerKey: "cz_banner_red", portalKey: "cz_portal_red" },
      { x: w - BO, y: BO, color: "blue", baseKey: "cz_base_blue", bannerKey: "cz_banner_blue", portalKey: "cz_portal_blue" },
      { x: BO, y: h - BO, color: "green", baseKey: "cz_base_green", bannerKey: "cz_banner_green", portalKey: "cz_portal_green" },
      { x: w - BO, y: h - BO, color: "purple", baseKey: "cz_base_purple", bannerKey: "cz_banner_purple", portalKey: "cz_portal_purple" },
    ];

    const allianceNames: Record<string, string> = {
      red: "🔥 Ordem da Chama",
      blue: "❄️ Pacto do Gelo",
      green: "🌿 Sentinelas da Natureza",
      purple: "🔮 Círculo Sombrio",
    };

    bases.forEach((base) => {
      // Stone platform around base
      for (let dx = -4; dx <= 4; dx++) {
        for (let dy = -4; dy <= 4; dy++) {
          this.drawTile("tile_stone", base.x + dx * 32, base.y + dy * 32);
        }
      }

      // Cobble perimeter
      for (let i = -5; i <= 5; i++) {
        this.drawTile("tile_cobble", base.x + i * 32, base.y - 5 * 32);
        this.drawTile("tile_cobble", base.x + i * 32, base.y + 5 * 32);
        this.drawTile("tile_cobble", base.x - 5 * 32, base.y + i * 32);
        this.drawTile("tile_cobble", base.x + 5 * 32, base.y + i * 32);
      }

      // Base structure
      const b = this.addDeco(base.x, base.y, base.baseKey, true);
      if (b) { b.body.setSize(60, 40); b.body.setOffset(10, 20); b.refreshBody(); }

      // Label
      const lbl = this.add.text(base.x, base.y - 60, allianceNames[base.color], {
        fontSize: "10px",
        color: "#ffffff",
        fontFamily: "Georgia, serif",
        stroke: "#000000",
        strokeThickness: 3,
      });
      lbl.setOrigin(0.5, 1);
      lbl.setDepth(5);

      // Banners around base
      this.addDeco(base.x - 100, base.y - 80, base.bannerKey, false);
      this.addDeco(base.x + 100, base.y - 80, base.bannerKey, false);
      this.addDeco(base.x - 100, base.y + 80, base.bannerKey, false);
      this.addDeco(base.x + 100, base.y + 80, base.bannerKey, false);

      // Stone fences around base
      for (let i = -3; i <= 3; i++) {
        this.addDeco(base.x + i * 32, base.y - 120, "deco_fence_stone", false);
        this.addDeco(base.x + i * 32, base.y + 120, "deco_fence_stone", false);
      }

      // Torches at entrance
      this.addDeco(base.x - 80, base.y, "deco_torch", false);
      this.addDeco(base.x + 80, base.y, "deco_torch", false);

      // Barrels & crates for supplies
      this.addDeco(base.x - 60, base.y + 40, "deco_barrel", false);
      this.addDeco(base.x - 40, base.y + 40, "deco_crate", false);
      this.addDeco(base.x + 60, base.y + 40, "deco_barrel", false);
    });

    // ============================================
    // 5) MAGIC PORTALS — Near each base with glowing rune frames
    // ============================================
    const portalPositions = [
      { x: BO + 400, y: BO + 400, key: "cz_portal_red" },
      { x: w - BO - 400, y: BO + 400, key: "cz_portal_blue" },
      { x: BO + 400, y: h - BO - 400, key: "cz_portal_green" },
      { x: w - BO - 400, y: h - BO - 400, key: "cz_portal_purple" },
    ];
    portalPositions.forEach((pp) => {
      // Stone pedestal
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          this.drawTile("tile_stone_mossy", pp.x + dx * 32, pp.y + dy * 32);
        }
      }
      this.addDeco(pp.x, pp.y, pp.key, false);
      // Rune glow around portal
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        this.addDeco(pp.x + Math.cos(angle) * 48, pp.y + Math.sin(angle) * 48, "deco_shrine_glow", false);
      }
    });

    // ============================================
    // 6) DUNGEONS — Red PvP cave and Black full-loot cave
    // ============================================

    // Red dungeon (NW of center) — warm glow
    const rdx = cx - 3200;
    const rdy = cy - 2400;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        this.drawTile("tile_stone", rdx + dx * 32, rdy + dy * 32);
      }
    }
    const rd = this.addDeco(rdx, rdy, "cz_dungeon_red", true);
    if (rd) { rd.body.setSize(32, 24); rd.body.setOffset(8, 18); rd.refreshBody(); }
    const rdLabel = this.add.text(rdx, rdy - 36, "🔥 Masmorra Sangrenta (PvP)", {
      fontSize: "9px", color: "#ff6644", fontFamily: "Georgia, serif",
      stroke: "#000000", strokeThickness: 2,
    });
    rdLabel.setOrigin(0.5, 1);
    rdLabel.setDepth(5);
    // Torch flanks
    this.addDeco(rdx - 40, rdy, "deco_torch", false);
    this.addDeco(rdx + 40, rdy, "deco_torch", false);
    // Skull decorations
    this.addDeco(rdx - 30, rdy + 30, "deco_bones", false);
    this.addDeco(rdx + 30, rdy + 30, "deco_bones", false);

    // Black dungeon (SE of center) — cold purple fog
    const bdx = cx + 3200;
    const bdy = cy + 2400;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        this.drawTile("tile_dark", bdx + dx * 32, bdy + dy * 32);
      }
    }
    const bd = this.addDeco(bdx, bdy, "cz_dungeon_black", true);
    if (bd) { bd.body.setSize(32, 24); bd.body.setOffset(8, 18); bd.refreshBody(); }
    const bdLabel = this.add.text(bdx, bdy - 36, "💀 Abismo do Vazio (Full Loot)", {
      fontSize: "9px", color: "#aa66ff", fontFamily: "Georgia, serif",
      stroke: "#000000", strokeThickness: 2,
    });
    bdLabel.setOrigin(0.5, 1);
    bdLabel.setDepth(5);
    // Mist effect around
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.addDeco(bdx + Math.cos(angle) * 60, bdy + Math.sin(angle) * 60, "deco_mushroom_glow", false);
    }

    // ============================================
    // 7) TREES — Dense forest patches in quadrants
    // ============================================
    const treePatches = [
      // NW quadrant forests
      { cx: 3200, cy: 3600, count: 18, radius: 800 },
      { cx: 4800, cy: 2000, count: 12, radius: 600 },
      // NE quadrant forests
      { cx: 15200, cy: 3600, count: 18, radius: 800 },
      { cx: 13600, cy: 2000, count: 12, radius: 600 },
      // SW quadrant forests
      { cx: 3200, cy: 15600, count: 18, radius: 800 },
      { cx: 4800, cy: 17200, count: 12, radius: 600 },
      // SE quadrant forests
      { cx: 15200, cy: 15600, count: 18, radius: 800 },
      { cx: 13600, cy: 17200, count: 12, radius: 600 },
      // Mid-zone scattered trees
      { cx: 6400, cy: 9600, count: 8, radius: 500 },
      { cx: 12800, cy: 9600, count: 8, radius: 500 },
      { cx: 9600, cy: 6400, count: 8, radius: 500 },
      { cx: 9600, cy: 12800, count: 8, radius: 500 },
    ];

    treePatches.forEach((patch) => {
      for (let i = 0; i < patch.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * patch.radius;
        const tx = patch.cx + Math.cos(angle) * dist;
        const ty = patch.cy + Math.sin(angle) * dist;
        const types = ["deco_tree", "deco_tree_large", "deco_pine", "deco_tree_willow"];
        const tree = this.addDeco(tx, ty, types[Math.floor(Math.random() * types.length)], true);
        if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
      }
      // Add bushes around tree patches
      for (let i = 0; i < Math.floor(patch.count / 3); i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (patch.radius + 100);
        this.addDeco(
          patch.cx + Math.cos(angle) * dist,
          patch.cy + Math.sin(angle) * dist,
          Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false
        );
      }
    });

    // ============================================
    // 8) FENCES — Wooden fences projecting soft shadows
    // ============================================
    // Fence lines along some road segments
    const fenceSegments = [
      { x1: BO + 400, y1: BO, x2: 4800, y2: BO, axis: "h" as const },
      { x1: w - BO - 400, y1: BO, x2: w - 4800, y2: BO, axis: "h" as const },
      { x1: BO, y1: BO + 400, x2: BO, y2: 4800, axis: "v" as const },
      { x1: BO, y1: h - BO - 400, x2: BO, y2: h - 4800, axis: "v" as const },
    ];
    fenceSegments.forEach((seg) => {
      if (seg.axis === "h") {
        const startX = Math.min(seg.x1, seg.x2);
        const endX = Math.max(seg.x1, seg.x2);
        for (let x = startX; x < endX; x += 32) {
          this.addDeco(x, seg.y1 - 60, "deco_fence", false);
        }
      } else {
        const startY = Math.min(seg.y1, seg.y2);
        const endY = Math.max(seg.y1, seg.y2);
        for (let y = startY; y < endY; y += 32) {
          this.addDeco(seg.x1 - 60, y, "deco_fence", false);
        }
      }
    });

    // ============================================
    // 9) SCATTERED ENVIRONMENT — Rocks, mushrooms, ruins
    // ============================================
    // Rocks scattered across map
    for (let i = 0; i < 15; i++) {
      const rx = 200 + Math.random() * (w - 400);
      const ry = 200 + Math.random() * (h - 400);
      const dist = Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2);
      if (dist < 500) continue; // Skip center fortress area
      this.addDeco(rx, ry, Math.random() > 0.7 ? "deco_boulder" : "deco_rock", false);
    }

    // Ruined walls scattered (battle remnants)
    for (let i = 0; i < 6; i++) {
      const rx = 1000 + Math.random() * (w - 2000);
      const ry = 1000 + Math.random() * (h - 2000);
      const dist = Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2);
      if (dist < 1500 || dist > 7000) continue;
      this.addDeco(rx, ry, "deco_ruined_wall", false);
    }

    // Campfire spots for flavor
    const campfireSpots = [
      [3600, 6000], [6000, 3600], [13200, 3600], [15600, 6000],
      [3600, 13200], [6000, 15600], [13200, 15600], [15600, 13200],
    ];
    campfireSpots.forEach(([fx, fy]) => {
      this.addDeco(fx, fy, "deco_campfire", false);
      // Logs around campfire
      this.addDeco(fx + 30, fy + 10, "deco_log", false);
      this.addDeco(fx - 25, fy + 15, "deco_log", false);
    });

    // ============================================
    // 10) SIGNPOSTS at key intersections
    // ============================================
    this.addDeco(cx, cy - 1400, "deco_signpost", false);
    this.addDeco(cx, cy + 1400, "deco_signpost", false);
    this.addDeco(cx - 1400, cy, "deco_signpost", false);
    this.addDeco(cx + 1400, cy, "deco_signpost", false);

    // ============================================
    // 11) GRASS VARIATION (reduced)
    // ============================================
    const flowerTypes = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue", "deco_flower_purple"];
    for (let i = 0; i < 20; i++) {
      const fx = 500 + Math.random() * (w - 1000);
      const fy = 500 + Math.random() * (h - 1000);
      const dist = Math.sqrt((fx - cx) ** 2 + (fy - cy) ** 2);
      if (dist < 1500) continue; // Skip corrupted zone
      this.addDeco(fx, fy, flowerTypes[Math.floor(Math.random() * flowerTypes.length)], false);
    }

    // ============================================
    // 12) BORDER TREES (optimized spacing)
    // ============================================
    for (let x = 100; x < w - 100; x += 250 + Math.floor(Math.random() * 100)) {
      const tree = this.addDeco(x, 80 + Math.random() * 40, Math.random() > 0.5 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
      const tree2 = this.addDeco(x, h - 80 - Math.random() * 40, Math.random() > 0.5 ? "deco_tree" : "deco_tree_large", true);
      if (tree2) { tree2.body.setSize(8, 8); tree2.body.setOffset(12, 38); tree2.refreshBody(); }
    }
    for (let y = 150; y < h - 150; y += 250 + Math.floor(Math.random() * 100)) {
      const tree = this.addDeco(80, y, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
      const tree2 = this.addDeco(w - 80, y, "deco_pine", true);
      if (tree2) { tree2.body.setSize(8, 8); tree2.body.setOffset(12, 38); tree2.refreshBody(); }
    }

    // ============================================
    // 13) LANTERNS — Along main roads
    // ============================================
    const lanternRoads = [
      { x1: BO, y1: BO, x2: cx, y2: cy },
      { x1: w - BO, y1: BO, x2: cx, y2: cy },
      { x1: BO, y1: h - BO, x2: cx, y2: cy },
      { x1: w - BO, y1: h - BO, x2: cx, y2: cy },
    ];
    lanternRoads.forEach((road) => {
      const dx = road.x2 - road.x1;
      const dy = road.y2 - road.y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(dist / 400);
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        this.addDeco(road.x1 + dx * t + 40, road.y1 + dy * t + 40, "deco_lantern", false);
      }
    });

    // ============================================
    // 14) MOUNTAINS & CLIFFS — Natural barriers between quadrants
    // ============================================
    // Mountain ranges in cross pattern (separating quadrants)
    for (let i = 0; i < 12; i++) {
      // North-south divider (with gaps for roads)
      const my = 2400 + i * 1200;
      if (Math.abs(my - cy) < 2000) continue; // Gap at center
      const mx = cx + (Math.random() - 0.5) * 200;
      const m = this.addDeco(mx, my, Math.random() > 0.5 ? "deco_mountain" : "deco_cliff", true);
      if (m) { m.body.setSize(20, 12); m.body.setOffset(6, 32); m.refreshBody(); }
    }
    for (let i = 0; i < 12; i++) {
      // East-west divider (with gaps for roads)
      const mx = 2400 + i * 1200;
      if (Math.abs(mx - cx) < 2000) continue; // Gap at center
      const my = cy + (Math.random() - 0.5) * 200;
      const m = this.addDeco(mx, my, Math.random() > 0.5 ? "deco_mountain" : "deco_cliff", true);
      if (m) { m.body.setSize(20, 12); m.body.setOffset(6, 32); m.refreshBody(); }
    }
  }

  // --- Decoration helpers ---
  addDeco(x: number, y: number, key: string, blocking: boolean): any {
    if (blocking) {
      const sprite = this.decoColliders.create(x, y, key);
      sprite.setDepth(3);
      sprite.refreshBody();
      return sprite;
    } else {
      const img = this.add.image(x, y, key);
      img.setDepth(2);
      return null;
    }
  }

  addWallBlock(x: number, y: number) {
    const wall = this.decoColliders.create(x, y, "tile_wall");
    wall.setDepth(1);
    wall.body.setSize(32, 32);
    wall.refreshBody();
  }

  addInvisibleWall(x: number, y: number, sw: number, sh: number) {
    const wall = this.decoColliders.create(x, y, "tile_wall");
    wall.setVisible(false);
    wall.body.setSize(sw, sh);
    wall.refreshBody();
  }

  // Write a visual tile directly to the deco TilemapLayer (zero runtime cost after setup)
  drawTile(key: string, wx: number, wy: number) {
    const idx = TILE_IDX[key];
    if (idx === undefined || !this.decoLayer) return;
    this.decoLayer.putTileAt(idx, Math.floor(wx / 32), Math.floor(wy / 32));
  }

  // Deterministic base-tile selector (same position always returns same tile)
  getBaseTileKeyAt(wx: number, wy: number): string {
    // Fine-grain per-tile variation (high frequency)
    const n = (Math.abs(Math.sin(wx * 3.7 + wy * 6.1) * 99999) | 0) % 100;
    // Large-scale biome zone (very low frequency) — creates organic region patches
    const zone = Math.floor(
      ((Math.sin(wx * 0.00038 + wy * 0.00031) * Math.cos(wx * 0.00021 - wy * 0.00044) + 1) / 2) * 100
    );

    switch (this.currentMap) {
      case "village": {
        // lush garden zones, normal grass zones, and shadowed tree-lined zones
        if (zone < 28) return n < 68 ? "tile_grass_lush" : "tile_grass";
        if (zone > 74) return n < 65 ? "tile_grass_dark" : "tile_grass";
        return n < 62 ? "tile_grass" : n < 84 ? "tile_grass_lush" : "tile_grass_dark";
      }
      case "fields": {
        // farmland/dirt-zone, meadow, lush meadow, wild dark-meadow
        if (zone < 22) return n < 65 ? "tile_dirt" : "tile_dirt_dark";         // bare dirt patches
        if (zone > 80) return n < 62 ? "tile_grass_dark" : "tile_grass";       // dark wild scrub
        if (zone > 62) return n < 72 ? "tile_grass_lush" : "tile_grass";       // lush meadow
        return n < 42 ? "tile_grass" : n < 67 ? "tile_grass_lush" : n < 84 ? "tile_dirt" : "tile_dirt_dark";
      }
      case "forest": {
        // deep forest floor (dark), forest glades (lush), dense undergrowth
        if (zone < 22) return n < 70 ? "tile_dark" : "tile_grass_dark";        // deep shadow floor
        if (zone > 78) return n < 58 ? "tile_grass_lush" : "tile_grass";       // sun-dappled glade
        return n < 30 ? "tile_grass_dark" : n < 55 ? "tile_dark" : n < 80 ? "tile_grass" : "tile_grass_lush";
      }
      case "dungeon": return n < 50 ? "tile_dark" : n < 80 ? "tile_stone" : "tile_stone_mossy";
      case "arena":   return n < 70 ? "tile_sand" : n < 90 ? "tile_arena" : "tile_stone";
      case "conflict_zone": {
        // Corrupted center zone
        const dx = wx - 9600;
        const dy = wy - 9600;
        const distCenter = Math.sqrt(dx * dx + dy * dy);
        if (distCenter < 800) return n < 60 ? "tile_dark" : "tile_stone";
        if (distCenter < 1600) return n < 40 ? "tile_stone" : n < 70 ? "tile_grass_dark" : "tile_dark";
        // River zones handled by deco layer
        if (zone < 20) return n < 65 ? "tile_dirt" : "tile_dirt_dark";
        if (zone > 80) return n < 62 ? "tile_grass_dark" : "tile_grass";
        if (zone > 60) return n < 72 ? "tile_grass_lush" : "tile_grass";
        return n < 42 ? "tile_grass" : n < 67 ? "tile_grass_lush" : n < 84 ? "tile_grass_dark" : "tile_dirt";
      }
      default: return "tile_grass";
    }
  }

  addRichBuilding(x: number, y: number, tw: number, th: number, roofColor: number, label: string) {
    const tileSize = 32;
    const bw = tw * tileSize;

    // Floor
    for (let bx = 0; bx < tw; bx++) {
      for (let by = 0; by < th; by++) {
        const wx = x + bx * tileSize;
        const wy = y + by * tileSize;
        this.drawTile("tile_wood", wx + tileSize / 2, wy + tileSize / 2);

        // Walls (border of building)
        if (bx === 0 || by === 0 || bx === tw - 1 || by === th - 1) {
          const wall = this.decoColliders.create(wx + tileSize / 2, wy + tileSize / 2, "tile_wall");
          wall.setDepth(1);
          wall.body.setSize(tileSize, tileSize);
          wall.refreshBody();
        }
      }
    }

    // Roof (visual overlay)
    const roof = this.add.graphics();
    roof.fillStyle(roofColor, 0.9);
    roof.fillRect(x - 8, y - 16, bw + 16, 24);
    roof.fillStyle(this.darkenColor(roofColor, 30), 0.7);
    roof.fillRect(x - 4, y - 12, bw + 8, 16);
    roof.setDepth(4);

    // Building label
    const txt = this.add.text(x + bw / 2, y - 20, label, {
      fontSize: "9px",
      color: "#ffdd88",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 2,
    });
    txt.setOrigin(0.5, 1);
    txt.setDepth(5);
  }

  darkenColor(color: number, amount: number): number {
    let r = (color >> 16) & 0xff;
    let g = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return (r << 16) | (g << 8) | b;
  }

  getMapTile(): string {
    const r = Math.random();
    switch (this.currentMap) {
      case "village":
        return r < 0.6 ? "tile_grass" : r < 0.85 ? "tile_grass_lush" : "tile_grass_dark";
      case "fields":
        return r < 0.45 ? "tile_grass" : r < 0.7 ? "tile_grass_lush" : r < 0.85 ? "tile_dirt" : "tile_dirt_dark";
      case "forest":
        return r < 0.35 ? "tile_grass_dark" : r < 0.6 ? "tile_grass" : r < 0.85 ? "tile_dark" : "tile_grass_lush";
      case "dungeon":
        return r < 0.5 ? "tile_dark" : r < 0.8 ? "tile_stone" : "tile_stone_mossy";
      case "arena":
        return r < 0.7 ? "tile_sand" : r < 0.9 ? "tile_arena" : "tile_stone";
      case "conflict_zone":
        return r < 0.5 ? "tile_grass" : r < 0.75 ? "tile_grass_dark" : r < 0.9 ? "tile_dirt" : "tile_grass_lush";
      default: return "tile_grass";
    }
  }

  // ========================
  // SPAWN ENTITIES
  // ========================
  spawnEnemies() {
    const mapConfig = getMapConfig(this.currentMap);
    mapConfig.enemies.forEach((spawn) => {
      this.createEnemy(spawn.type, spawn.x, spawn.y, spawn.respawnTime);
    });
  }

  createEnemy(type: EnemyType, x: number, y: number, respawnTime: number) {
    const config = getEnemyConfig(type);
    const enemy = this.physics.add.sprite(x, y, `enemy_${type}`) as EnemySprite;
    enemy.enemyType = type;
    enemy.hp = config.hp;
    enemy.maxHp = config.hp;
    enemy.damage = config.damage;
    enemy.defense = config.defense;
    enemy.xpReward = config.xpReward;
    enemy.goldReward = config.goldReward;
    enemy.aggroRange = config.aggroRange;
    enemy.isDead = false;
    enemy.respawnTime = respawnTime;
    enemy.spawnX = x;
    enemy.spawnY = y;
    enemy.lastAttack = 0;
    enemy.setDepth(5);

    enemy.nameText = this.add.text(x, y - 20, config.name, {
      fontSize: "9px",
      color: "#ff6666",
      fontFamily: "serif",
      stroke: "#000000",
      strokeThickness: 2,
    });
    enemy.nameText.setOrigin(0.5, 1);
    enemy.nameText.setDepth(6);

    enemy.hpBar = this.add.graphics();
    enemy.hpBar.setDepth(7);

    this.enemies.push(enemy);
  }

  spawnNpcs() {
    const mapConfig = getMapConfig(this.currentMap);
    mapConfig.npcs.forEach((npcConfig) => {
      const npc = this.physics.add.sprite(npcConfig.x, npcConfig.y, "npc_default");
      npc.setImmovable(true);
      npc.setDepth(5);
      (npc as any).npcData = npcConfig;

      const nameText = this.add.text(npcConfig.x, npcConfig.y - 24, npcConfig.name, {
        fontSize: "10px",
        color: "#ffdd44",
        fontFamily: "serif",
        stroke: "#000000",
        strokeThickness: 2,
      });
      nameText.setOrigin(0.5, 1);
      nameText.setDepth(6);

      const questText = this.add.text(npcConfig.x, npcConfig.y - 36, "!", {
        fontSize: "14px",
        color: "#ffff00",
        fontFamily: "serif",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      });
      questText.setOrigin(0.5, 1);
      questText.setDepth(6);

      (npc as any).nameText = nameText;
      (npc as any).questMarker = questText;

      this.npcs.push(npc);
    });
  }

  spawnPortals() {
    const mapConfig = getMapConfig(this.currentMap);
    mapConfig.portals.forEach((portalConfig) => {
      const portal = this.physics.add.sprite(
        portalConfig.x + portalConfig.width / 2,
        portalConfig.y + portalConfig.height / 2,
        "portal"
      );
      portal.setDepth(3);
      (portal as any).portalData = portalConfig;

      this.tweens.add({
        targets: portal,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      const mapName = getMapConfig(portalConfig.targetMap).name;
      const label = this.add.text(portal.x, portal.y - 20, `→ ${mapName}`, {
        fontSize: "9px",
        color: "#aa88ff",
        fontFamily: "serif",
        stroke: "#000000",
        strokeThickness: 2,
      });
      label.setOrigin(0.5, 1);
      label.setDepth(4);

      this.portals.push(portal);
    });
  }

  // ========================
  // MULTIPLAYER
  // ========================
  setupMultiplayer(uid: string) {
    this.heartbeatInterval = startHeartbeat(uid);

    const store = useGameStore.getState();
    const p = store.player;
    if (p) {
      updatePlayerPresence(uid, {
        uid,
        name: p.name,
        classType: p.classType,
        advancedClass: p.advancedClass,
        level: p.level,
        hp: p.hp,
        maxHp: p.maxHp,
        position: p.position,
        currentMap: this.currentMap,
        direction: "down",
        isAttacking: false,
        lastHeartbeat: Date.now(),
        title: p.title,
      });
    }

    this.unsubPresence = listenToPlayersOnMap(this.currentMap, uid, (players) => {
      store.setRemotePlayers(players);
      this.updateRemotePlayers(players);
    });
  }

  updateRemotePlayers(players: RemotePlayer[]) {
    const currentIds = new Set(players.map((p) => p.uid));

    this.remotePlayers.forEach((sprite, uid) => {
      if (!currentIds.has(uid)) {
        sprite.nameText?.destroy();
        sprite.hpBar?.destroy();
        sprite.titleText?.destroy();
        sprite.destroy();
        this.remotePlayers.delete(uid);
      }
    });

    players.forEach((p) => {
      let sprite = this.remotePlayers.get(p.uid);

      if (!sprite) {
        sprite = this.physics.add.sprite(
          p.position.x,
          p.position.y,
          "remote_player"
        ) as RemotePlayerSprite;
        sprite.uid = p.uid;
        sprite.setDepth(8);

        sprite.nameText = this.add.text(p.position.x, p.position.y - 28, p.name, {
          fontSize: "10px",
          color: "#aaddff",
          fontFamily: "serif",
          stroke: "#000000",
          strokeThickness: 2,
        });
        sprite.nameText.setOrigin(0.5, 1);
        sprite.nameText.setDepth(9);

        sprite.hpBar = this.add.graphics();
        sprite.hpBar.setDepth(9);

        if (p.title) {
          sprite.titleText = this.add.text(p.position.x, p.position.y - 38, p.title, {
            fontSize: "8px",
            color: "#ffcc44",
            fontFamily: "serif",
            stroke: "#000000",
            strokeThickness: 2,
          });
          sprite.titleText.setOrigin(0.5, 1);
          sprite.titleText.setDepth(9);
        }

        this.remotePlayers.set(p.uid, sprite);
      }

      this.tweens.add({
        targets: sprite,
        x: p.position.x,
        y: p.position.y,
        duration: 100,
        ease: "Linear",
      });

      sprite.nameText.setPosition(p.position.x, p.position.y - 28);

      sprite.hpBar.clear();
      sprite.hpBar.fillStyle(0x333333, 1);
      sprite.hpBar.fillRect(p.position.x - 16, p.position.y - 22, 32, 3);
      const hpPercent = p.hp / p.maxHp;
      sprite.hpBar.fillStyle(hpPercent > 0.3 ? 0x44cc44 : 0xcc4444, 1);
      sprite.hpBar.fillRect(p.position.x - 16, p.position.y - 22, 32 * hpPercent, 3);
    });
  }

  // ========================
  // INTERACTION
  // ========================
  interact() {
    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData) return;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, npc.x, npc.y
      );
      if (dist < 60) {
        const npcData = (npc as any).npcData;
        store.setNpcDialogue({
          npcName: npcData.name,
          lines: npcData.dialogue,
        });

        if (npcData.questId && !playerData.quests.find((q) => q.questId === npcData.questId)) {
          store.updatePlayer({
            quests: [...playerData.quests, { questId: npcData.questId, progress: 0, completed: false }],
          });
          store.addNotification(`Nova quest: ${npcData.questId}`);
        }

        if (npcData.shopItems) {
          store.setShowShop(true);
        }

        return;
      }
    }

    for (const portal of this.portals) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, portal.x, portal.y
      );
      if (dist < 50) {
        const portalData = (portal as any).portalData;
        this.changeMap(portalData.targetMap, portalData.targetX, portalData.targetY);
        return;
      }
    }
  }

  pickupItem() {
    const store = useGameStore.getState();
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, drop.x, drop.y
      );
      if (dist < 40) {
        store.addItem(drop.item);
        store.addNotification(`Obteve: ${drop.item.name}`);
        drop.despawnTimer?.destroy();
        drop.destroy();
        this.itemDrops.splice(i, 1);
        return;
      }
    }
  }

  changeMap(targetMap: MapId, targetX: number, targetY: number) {
    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData) return;

    if (this.unsubPresence) this.unsubPresence();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    removePlayerPresence(playerData.uid);

    store.updatePlayer({
      currentMap: targetMap,
      position: { x: targetX, y: targetY },
    });
    store.setCurrentMap(targetMap);

    this.currentMap = targetMap;
    this.scene.restart();
  }

  // ========================
  // COMBAT
  // ========================
  handleAttack() {
    const now = Date.now();
    if (now - this.lastAttackTime < ATTACK_COOLDOWN) return;
    this.lastAttackTime = now;

    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData || playerData.hp <= 0) return;

    this.showAttackEffect();

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );
      if (dist < ATTACK_RANGE) {
        const baseDmg = 10 + playerData.attributes.strength * 1.5;
        const defense = enemy.defense;
        const dmg = Math.max(1, Math.floor(baseDmg - defense * 0.5));
        this.damageEnemy(enemy, dmg);
      }
    }

    const mapConfig = getMapConfig(this.currentMap);
    if (mapConfig.pvpEnabled) {
      this.remotePlayers.forEach((remoteSprite) => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, remoteSprite.x, remoteSprite.y
        );
        if (dist < ATTACK_RANGE) {
          store.addEvent({
            type: "PLAYER_DAMAGE",
            targetId: remoteSprite.uid,
            damage: 10,
            sourceId: playerData.uid,
          });
        }
      });
    }
  }

  handleSkill(index: number) {
    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData || playerData.hp <= 0) return;

    const skills = getClassSkills(playerData.classType, playerData.advancedClass);
    const skill = skills[index];
    if (!skill) return;

    const now = Date.now();
    const cooldownEnd = store.cooldowns[skill.id] || 0;
    if (now < cooldownEnd) return;

    if (skill.manaCost && playerData.mana < skill.manaCost) {
      store.addNotification("Mana insuficiente!");
      return;
    }

    if (skill.manaCost) {
      store.updatePlayer({ mana: playerData.mana - skill.manaCost });
    }

    store.setCooldown(skill.id, now + skill.cooldown);

    const damage = calculateDamage(
      skill.damage,
      skill.scaling,
      playerData.attributes,
      playerData.level
    );

    if (skill.areaOfEffect) {
      this.showAoeEffect(this.player.x, this.player.y, skill.areaOfEffect);
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, enemy.x, enemy.y
        );
        if (dist < skill.range) {
          this.damageEnemy(enemy, damage);
        }
      }
    } else if (skill.range > 60) {
      this.createProjectile(damage, skill.range);
    } else if (skill.damage > 0) {
      this.showAttackEffect();
      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, enemy.x, enemy.y
        );
        if (dist < skill.range + 20) {
          this.damageEnemy(enemy, damage);
        }
      }
    } else {
      store.addNotification(`${skill.name} ativada!`);
      if (skill.damage < 0) {
        store.heal(Math.abs(skill.damage));
      }
    }
  }

  createProjectile(damage: number, range: number) {
    const dirVec = this.getDirectionVector();
    const proj = this.physics.add.sprite(this.player.x, this.player.y, "projectile");
    proj.setDepth(15);
    proj.setVelocity(dirVec.x * 300, dirVec.y * 300);

    const startX = this.player.x;
    const startY = this.player.y;

    this.time.addEvent({
      delay: 16,
      callback: () => {
        const dist = Phaser.Math.Distance.Between(startX, startY, proj.x, proj.y);
        if (dist > range) {
          proj.destroy();
          return;
        }
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          const eDist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
          if (eDist < 20) {
            this.damageEnemy(enemy, damage);
            proj.destroy();
            return;
          }
        }
      },
      repeat: Math.floor(range / 5),
    });

    this.time.delayedCall(2000, () => {
      if (proj.active) proj.destroy();
    });
  }

  showAttackEffect() {
    const dirVec = this.getDirectionVector();
    const effect = this.add.graphics();
    effect.fillStyle(0xffffff, 0.6);
    effect.fillCircle(
      this.player.x + dirVec.x * 30,
      this.player.y + dirVec.y * 30,
      15
    );
    effect.setDepth(20);
    this.tweens.add({
      targets: effect,
      alpha: 0,
      duration: 200,
      onComplete: () => effect.destroy(),
    });
  }

  showAoeEffect(x: number, y: number, radius: number) {
    const effect = this.add.graphics();
    effect.fillStyle(0xff6600, 0.3);
    effect.fillCircle(x, y, radius);
    effect.lineStyle(2, 0xff6600, 0.8);
    effect.strokeCircle(x, y, radius);
    effect.setDepth(20);
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 400,
      onComplete: () => effect.destroy(),
    });
  }

  damageEnemy(enemy: EnemySprite, damage: number) {
    if (enemy.isDead) return;
    enemy.hp -= damage;

    const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
      fontSize: "12px",
      color: "#ff4444",
      fontFamily: "serif",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 2,
    });
    dmgText.setOrigin(0.5);
    dmgText.setDepth(30);
    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => dmgText.destroy(),
    });

    enemy.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (!enemy.isDead) enemy.clearTint();
    });

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  killEnemy(enemy: EnemySprite) {
    enemy.isDead = true;
    enemy.setVelocity(0, 0);
    if (enemy.body) (enemy.body as Phaser.Physics.Arcade.Body).enable = false;
    const store = useGameStore.getState();
    const playerData = store.player;

    store.addXp(enemy.xpReward);
    store.addGold(enemy.goldReward);
    store.addNotification(`+${enemy.xpReward} XP, +${enemy.goldReward} Gold`);

    if (playerData) {
      playerData.quests.forEach((q) => {
        if (!q.completed && q.questId) {
          const questData = Object.values(QUESTS).find(
            (quest: any) => quest.id === q.questId
          );
          if (questData && questData.target === enemy.enemyType) {
            store.updateQuest(q.questId, q.progress + 1);
          }
        }
      });
    }

    const loot = generateLoot(Math.floor(enemy.xpReward / 10));
    loot.forEach((item) => {
      this.dropItem(item, enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30);
    });

    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 300,
      onComplete: () => {
        enemy.setVisible(false);
        enemy.nameText.setVisible(false);
        enemy.hpBar.setVisible(false);
      },
    });

    this.time.delayedCall(enemy.respawnTime, () => {
      enemy.hp = enemy.maxHp;
      enemy.isDead = false;
      enemy.setPosition(enemy.spawnX, enemy.spawnY);
      enemy.setVelocity(0, 0);
      if (enemy.body) (enemy.body as Phaser.Physics.Arcade.Body).enable = true;
      enemy.setVisible(true);
      enemy.setAlpha(1);
      enemy.setScale(1);
      enemy.nameText.setVisible(true);
      enemy.hpBar.setVisible(true);
    });
  }

  dropItem(item: Item, x: number, y: number) {
    const sprite = this.physics.add.sprite(x, y, "item_drop") as ItemDrop;
    sprite.item = item;
    sprite.setDepth(4);

    this.tweens.add({
      targets: sprite,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    sprite.despawnTimer = this.time.delayedCall(30000, () => {
      const idx = this.itemDrops.indexOf(sprite);
      if (idx > -1) this.itemDrops.splice(idx, 1);
      sprite.destroy();
    });

    this.itemDrops.push(sprite);
  }

  getDirectionVector(): { x: number; y: number } {
    switch (this.direction) {
      case "up": return { x: 0, y: -1 };
      case "down": return { x: 0, y: 1 };
      case "left": return { x: -1, y: 0 };
      case "right": return { x: 1, y: 0 };
    }
  }

  // ========================
  // MAIN UPDATE LOOP
  // ========================
  update(_time: number, delta: number) {
    if (!this.player || !this.player.active) return;

    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData) return;

    // Dead check
    if (playerData.hp <= 0) {
      this.player.setVelocity(0, 0);
      this.player.setTint(0x333333);
      this.moveTarget = null;
      if (this.player.anims.isPlaying) this.player.stop();
      if (!this.player.getData("respawnScheduled")) {
        this.player.setData("respawnScheduled", true);
        store.addNotification("Você morreu! Respawnando em 3s...");
        this.time.delayedCall(3000, () => {
          store.respawn();
          this.player.setData("respawnScheduled", false);
          this.player.clearTint();
          this.changeMap("village", 400, 300);
        });
      }
      return;
    }

    // ============================
    // MOVEMENT: Keyboard + Click
    // ============================
    let vx = 0;
    let vy = 0;
    let keyboardMoving = false;

    if (this.cursors && this.wasd) {
      if (this.cursors.left?.isDown || this.wasd.A?.isDown) { vx = -PLAYER_SPEED; this.direction = "left"; keyboardMoving = true; }
      else if (this.cursors.right?.isDown || this.wasd.D?.isDown) { vx = PLAYER_SPEED; this.direction = "right"; keyboardMoving = true; }
      if (this.cursors.up?.isDown || this.wasd.W?.isDown) { vy = -PLAYER_SPEED; this.direction = "up"; keyboardMoving = true; }
      else if (this.cursors.down?.isDown || this.wasd.S?.isDown) { vy = PLAYER_SPEED; this.direction = "down"; keyboardMoving = true; }
    }

    if (keyboardMoving) {
      this.moveTarget = null;
    }

    // Click-to-move
    if (!keyboardMoving && this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CLICK_STOP_DIST) {
        this.moveTarget = null;
        vx = 0;
        vy = 0;
      } else {
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * PLAYER_SPEED;
        vy = Math.sin(angle) * PLAYER_SPEED;

        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? "right" : "left";
        } else {
          this.direction = dy > 0 ? "down" : "up";
        }
      }
    }

    // Normalize diagonal
    if (vx !== 0 && vy !== 0 && keyboardMoving) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);
    const isMoving = vx !== 0 || vy !== 0;

    // ============================
    // ANIMATED SPRITE DIRECTION
    // ============================
    const textureBase = `player_${playerData.classType}`;

    if (isMoving) {
      // Determine anim key and flipX
      let animDir: string;
      let flipX = false;
      if (this.direction === "right") {
        animDir = "left";
        flipX = true;
      } else {
        animDir = this.direction;
        flipX = false;
      }
      const walkAnimKey = `${textureBase}_walk_${animDir}`;

      this.player.setFlipX(flipX);
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== walkAnimKey) {
        this.player.play(walkAnimKey);
      }
    } else {
      // Idle - show standing frame for current direction
      if (this.player.anims.isPlaying) {
        this.player.stop();
      }
      let idleDir: string;
      let flipX = false;
      if (this.direction === "right") {
        idleDir = "left";
        flipX = true;
      } else {
        idleDir = this.direction;
        flipX = false;
      }
      this.player.setFlipX(flipX);
      this.player.setTexture(`${textureBase}_${idleDir}_0`);
    }

    // ============================
    // ATTACK (keyboard)
    // ============================
    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.handleAttack();
    }

    if (this.skillKeys) {
      this.skillKeys.forEach((key, index) => {
        if (key && Phaser.Input.Keyboard.JustDown(key)) {
          this.handleSkill(index);
        }
      });
    }

    // ============================
    // UPDATE VISUALS
    // ============================
    this.playerShadow.setPosition(this.player.x, this.player.y + 20);
    this.nameText.setPosition(this.player.x, this.player.y - 30);

    // HP Bar
    this.hpBarBg.clear();
    this.hpBarFg.clear();
    const barW = 36;
    const barH = 4;
    const barX = this.player.x - barW / 2;
    const barY = this.player.y - 24;
    this.hpBarBg.fillStyle(0x111111, 0.8);
    this.hpBarBg.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
    const hpPercent = Math.max(0, playerData.hp / playerData.maxHp);
    const hpColor = hpPercent > 0.6 ? 0x44cc44 : hpPercent > 0.3 ? 0xddaa22 : 0xcc4444;
    this.hpBarFg.fillStyle(hpColor, 1);
    this.hpBarFg.fillRoundedRect(barX, barY, barW * hpPercent, barH, 1);

    // ============================
    // ENEMIES AI + BARS
    // ============================
    this.enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      enemy.hpBar.clear();
      const eBarX = enemy.x - 16;
      const eBarY = enemy.y - 20;
      enemy.hpBar.fillStyle(0x111111, 0.7);
      enemy.hpBar.fillRoundedRect(eBarX - 1, eBarY - 1, 34, 5, 2);
      const eHpPercent = enemy.hp / enemy.maxHp;
      enemy.hpBar.fillStyle(eHpPercent > 0.3 ? 0xcc4444 : 0xff0000, 1);
      enemy.hpBar.fillRoundedRect(eBarX, eBarY, 32 * eHpPercent, 3, 1);
      enemy.nameText.setPosition(enemy.x, enemy.y - 22);

      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );

      if (dist < enemy.aggroRange) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const speed = getEnemyConfig(enemy.enemyType).speed;
        enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        const now = Date.now();
        if (dist < 40 && now - enemy.lastAttack > 1000) {
          enemy.lastAttack = now;
          const defense = calculateDefense(playerData.attributes, playerData.level);
          const dmg = Math.max(1, Math.floor(enemy.damage - defense * 0.3));
          store.takeDamage(dmg);

          const dmgText = this.add.text(this.player.x + (Math.random() - 0.5) * 20, this.player.y - 30, `-${dmg}`, {
            fontSize: "12px",
            color: "#ff6666",
            fontFamily: "Georgia, serif",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3,
          });
          dmgText.setOrigin(0.5);
          dmgText.setDepth(30);
          this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy(),
          });

          this.player.setTint(0xff4444);
          this.time.delayedCall(100, () => {
            if (playerData.hp > 0) this.player.clearTint();
          });
        }
      } else {
        if (Math.random() < 0.005) {
          enemy.setVelocity(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
          );
        }
        if (Math.random() < 0.01) {
          enemy.setVelocity(0, 0);
        }
      }
    });

    // ============================
    // PORTAL CHECK
    // ============================
    this.portals.forEach((portal) => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, portal.x, portal.y
      );
      if (dist < 30) {
        const portalData = (portal as any).portalData;
        this.changeMap(portalData.targetMap, portalData.targetX, portalData.targetY);
      }
    });

    // ============================
    // FIREBASE SYNC
    // ============================
    if (isMoving) {
      this.throttledUpdatePosition(
        playerData.uid,
        this.player.x,
        this.player.y,
        this.direction,
        this.currentMap
      );

      store.updatePlayer({
        position: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      });
    }

    // ============================
    // MINIMAP PLAYER DOT
    // ============================
    if (this.minimapPlayerDot && this.minimapPlayerDot.active) {
      this.minimapPlayerDot.setPosition(
        this.player.x * this.minimapScaleX,
        this.player.y * this.minimapScaleY
      );
    }

    // ============================
    // DAY/NIGHT CYCLE
    // ============================
    this.dayNightTime += delta * 0.00005;
    const nightAlpha = Math.max(0, Math.sin(this.dayNightTime) * 0.4);
    this.dayNightOverlay.setAlpha(nightAlpha);

    if (nightAlpha < 0.05) store.setTimeOfDay("day");
    else if (nightAlpha < 0.15) store.setTimeOfDay(Math.sin(this.dayNightTime) > 0 ? "dusk" : "dawn");
    else store.setTimeOfDay("night");

    // ============================
    // REGEN
    // ============================
    if (playerData.mana < playerData.maxMana) {
      if (Math.random() < 0.02) store.restoreMana(1);
    }
    if (playerData.hp < playerData.maxHp && playerData.hp > 0) {
      if (Math.random() < 0.005) store.heal(1);
    }
  }

  shutdown() {
    // Clean up multiplayer
    if (this.unsubPresence) {
      this.unsubPresence();
      this.unsubPresence = undefined;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    const store = useGameStore.getState();
    if (store.player) {
      removePlayerPresence(store.player.uid);
    }

    // Clean up remote players
    this.remotePlayers.forEach((sprite) => {
      sprite.nameText?.destroy();
      sprite.hpBar?.destroy();
      sprite.titleText?.destroy();
      sprite.destroy();
    });
    this.remotePlayers.clear();

    // Clean up item drops
    this.itemDrops.forEach((drop) => {
      drop.despawnTimer?.destroy();
      drop.destroy();
    });
    this.itemDrops = [];

    // Clean up keyboard
    if (this.input.keyboard) {
      this.input.keyboard.removeAllKeys(true);
    }

    // Clean up minimap
    if (this.minimapContainer) {
      this.minimapContainer.destroy(true);
      this.minimapContainer = null;
    }
    this.minimapPlayerDot = null;
    if (this.textures.exists('minimap_tex')) this.textures.remove('minimap_tex');

    // Clean up tilemap
    if (this.tileMap) { this.tileMap.destroy(); this.tileMap = null; }
    this.baseLayer = null;
    this.decoLayer = null;

    // Remove event listeners from canvas
    this.input.removeAllListeners();
  }

  destroy() {
    this.shutdown();
  }
}
