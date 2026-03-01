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

  // === TILE CHUNK SYSTEM ===
  // Each chunk is a 512×512 RenderTexture (1 GPU draw call).
  // Only chunks inside/near the camera viewport are kept alive.
  private mapChunks: Map<string, Phaser.GameObjects.RenderTexture> = new Map();
  private decoTilesByChunk: Map<string, Array<[string, number, number]>> = new Map();
  private readonly CHUNK_PX = 512;
  private chunkUpdateTimer = 0;

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
  // RICH MAP GENERATION
  // ========================
  generateMap() {
    const mapConfig = getMapConfig(this.currentMap);
    const { width, height, tileSize } = mapConfig;

    // Clear any existing chunks
    this.mapChunks.forEach(rt => rt.destroy());
    this.mapChunks.clear();
    this.decoTilesByChunk.clear();

    // 4 invisible border walls instead of per-tile sprites
    this.addInvisibleWall(width / 2, tileSize / 2, width, tileSize);
    this.addInvisibleWall(width / 2, height - tileSize / 2, width, tileSize);
    this.addInvisibleWall(tileSize / 2, height / 2, tileSize, height);
    this.addInvisibleWall(width - tileSize / 2, height / 2, tileSize, height);

    // Area-specific decoration (queues tiles via drawTile)
    switch (this.currentMap) {
      case "village": this.decorateVillage(width, height, tileSize); break;
      case "fields": this.decorateFields(width, height, tileSize); break;
      case "forest": this.decorateForest(width, height, tileSize); break;
      case "dungeon": this.decorateDungeon(width, height, tileSize); break;
      case "arena": this.decorateArena(width, height, tileSize); break;
    }

    // Build initial visible chunks
    this.updateMapChunks();
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
      for (let i = 0; i < 15; i++) {
        const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue", "deco_flower_purple"];
        this.addDeco(gx + Math.random() * 150, gy + 10 + Math.random() * 60, flowers[Math.floor(Math.random() * 4)], false);
      }
      // Add bushes
      this.addDeco(gx - 10, gy + 40, "deco_bush_berry", false);
      this.addDeco(gx + 160, gy + 40, "deco_bush", false);
    });

    // === TREES — Dense coverage along edges and parks ===
    // Border trees (all 4 sides)
    for (let x = 100; x < w - 100; x += 120 + Math.floor(Math.random() * 60)) {
      const ty = 80 + Math.random() * 40;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_tree_large", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let x = 100; x < w - 100; x += 120 + Math.floor(Math.random() * 60)) {
      const ty = h - 80 - Math.random() * 40;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let y = 150; y < h - 150; y += 120 + Math.floor(Math.random() * 60)) {
      const tree = this.addDeco(80, y, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    for (let y = 150; y < h - 150; y += 120 + Math.floor(Math.random() * 60)) {
      const tree = this.addDeco(w - 80, y, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Park trees (scattered interior)
    for (let i = 0; i < 30; i++) {
      const tx = 200 + Math.random() * (w - 400);
      const ty = 200 + Math.random() * (h - 400);
      // Skip if near roads
      if (Math.abs(ty - cy) < 60 || Math.abs(tx - cx) < 60) continue;
      const tree = this.addDeco(tx, ty, Math.random() > 0.3 ? "deco_tree" : "deco_tree_willow", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === BUSHES everywhere ===
    for (let i = 0; i < 40; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === SIGNPOSTS at key locations ===
    this.addDeco(cx + 200, cy - 200, "deco_signpost", false);
    this.addDeco(w - 200, cy, "deco_signpost", false);
    this.addDeco(cx, 200, "deco_signpost", false);
    this.addDeco(200, cy, "deco_signpost", false);

    // === LANTERNS along roads ===
    for (let x = 200; x < w - 200; x += 250) {
      this.addDeco(x, cy - 60, "deco_lantern", false);
      this.addDeco(x, cy + 80, "deco_lantern", false);
    }
    for (let y = 200; y < h - 200; y += 250) {
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
    for (let i = 0; i < 15; i++) {
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
    // === MAIN DIRT ROAD NETWORK ===
    // Central east-west highway
    for (let x = 80; x < w - 80; x += 32) {
      this.drawTile("tile_dirt", x, h / 3);
      this.drawTile("tile_dirt", x, h / 3 + 32);
    }
    // North-south crossroads
    for (let y = 200; y < h - 200; y += 32) {
      this.drawTile("tile_dirt", w / 4, y);
      this.drawTile("tile_dirt", 3 * w / 4, y);
    }
    // Central cross
    for (let x = w / 4; x < 3 * w / 4; x += 32) {
      this.drawTile("tile_dirt", x, h / 2);
    }
    // Southern road
    for (let x = 200; x < w - 200; x += 32) {
      this.drawTile("tile_dirt_dark", x, 2 * h / 3);
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
    for (let i = 0; i < 30; i++) {
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

    // === TREES — massive forest borders ===
    // Northern tree line
    for (let x = 100; x < w - 100; x += 80 + Math.floor(Math.random() * 60)) {
      const ty = 80 + Math.random() * 60;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_tree_large", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Southern tree line
    for (let x = 100; x < w - 100; x += 80 + Math.floor(Math.random() * 60)) {
      const ty = h - 80 - Math.random() * 60;
      const tree = this.addDeco(x, ty, Math.random() > 0.5 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }
    // Scattered trees across fields
    for (let i = 0; i < 50; i++) {
      const tx = 200 + Math.random() * (w - 400);
      const ty = 200 + Math.random() * (h - 400);
      const tree = this.addDeco(tx, ty, Math.random() > 0.6 ? "deco_tree" : "deco_pine", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === BOULDERS AND ROCKS ===
    for (let i = 0; i < 20; i++) {
      const rx = 200 + Math.random() * (w - 400);
      const ry = 200 + Math.random() * (h - 400);
      this.addDeco(rx, ry, Math.random() > 0.5 ? "deco_rock" : "deco_boulder", Math.random() > 0.5);
    }

    // === MOUNTAINS along northern edge ===
    for (let x = 200; x < w - 200; x += 140 + Math.floor(Math.random() * 80)) {
      this.addDeco(x, 60 + Math.random() * 30, "deco_mountain", true);
    }

    // === BUSHES ===
    for (let i = 0; i < 40; i++) {
      this.addDeco(150 + Math.random() * (w - 300), 150 + Math.random() * (h - 300),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === FLOWERS everywhere ===
    for (let i = 0; i < 60; i++) {
      const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue", "deco_flower_purple"];
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        flowers[Math.floor(Math.random() * 4)], false);
    }

    // === STUMPS ===
    for (let i = 0; i < 10; i++) {
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

    // === DENSE TREE COVERAGE ===
    const placed: { x: number; y: number }[] = [];
    const numTrees = 220;
    for (let i = 0; i < numTrees; i++) {
      const tx = 80 + Math.random() * (w - 160);
      const ty = 80 + Math.random() * (h - 160);
      // Keep paths clear
      const pathWobble1 = Math.sin(tx * 0.008) * 50;
      const pathWobble2 = Math.sin(ty * 0.01) * 30;
      if (Math.abs(ty - (h / 2 + pathWobble1)) < 70) continue;
      if (Math.abs(tx - (w / 3 + pathWobble2)) < 50) continue;
      const tooClose = placed.some(p => Math.abs(p.x - tx) < 42 && Math.abs(p.y - ty) < 42);
      if (tooClose) continue;
      placed.push({ x: tx, y: ty });
      const r = Math.random();
      const treeType = r < 0.3 ? "deco_pine" : r < 0.5 ? "deco_pine_large" : r < 0.75 ? "deco_tree" : r < 0.9 ? "deco_tree_large" : "deco_tree_dead";
      const tree = this.addDeco(tx, ty, treeType, true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

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
    for (let i = 0; i < 18; i++) {
      const tree = this.addDeco(10800 + Math.random() * 3600, 9600 + Math.random() * 2400, "deco_tree_dead", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    }

    // === MUSHROOM GROVES ===
    for (let i = 0; i < 25; i++) {
      const mx = 300 + Math.random() * (w - 600);
      const my = 300 + Math.random() * (h - 600);
      this.addDeco(mx, my, "deco_mushroom", false);
      this.addDeco(mx + 15, my + 10, "deco_mushroom", false);
    }
    // Glowing mushrooms (deeper forest, north)
    for (let i = 0; i < 25; i++) {
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
    for (let i = 0; i < 20; i++) {
      this.addDeco(13200 + Math.random() * 2400, 3000 + Math.random() * 3000, "deco_web", false);
    }

    // === VINES on trees ===
    for (let i = 0; i < 20; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_vine", false);
    }

    // === LOGS and STUMPS ===
    for (let i = 0; i < 15; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_log", false);
    }
    for (let i = 0; i < 12; i++) {
      this.addDeco(200 + Math.random() * (w - 400), 200 + Math.random() * (h - 400), "deco_stump", false);
    }

    // === BUSHES ===
    for (let i = 0; i < 50; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200),
        Math.random() > 0.5 ? "deco_bush" : "deco_bush_berry", false);
    }

    // === ROCKS AND BOULDERS ===
    for (let i = 0; i < 20; i++) {
      this.addDeco(150 + Math.random() * (w - 300), 150 + Math.random() * (h - 300),
        Math.random() > 0.5 ? "deco_rock" : "deco_boulder", Math.random() > 0.5);
    }

    // === FLOWERS ===
    for (let i = 0; i < 30; i++) {
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

    // === MOUNTAIN RANGE (far north edge) ===
    for (let x = 200; x < w - 200; x += 150 + Math.floor(Math.random() * 80)) {
      this.addDeco(x, 50 + Math.random() * 30, "deco_mountain", true);
    }
    // Cliffs near stream
    this.addDeco(2 * w / 3 + 100, 300, "deco_cliff", true);
    this.addDeco(2 * w / 3 - 60, 300, "deco_cliff", true);

    // === MOSSY DARK PATCHES ===
    for (let i = 0; i < 15; i++) {
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

    // === TORCHES — along all corridors ===
    for (let x = 128; x < w - 128; x += 100) {
      this.addDeco(x, h / 2 - 90, "deco_torch", false);
      this.addDeco(x, h / 2 + 90, "deco_torch", false);
    }
    vCorrX.forEach(cx => {
      for (let y = 128; y < h - 128; y += 120) {
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
    for (let i = 0; i < 15; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_bones", false);
    }

    // === SCATTERED ROCKS ===
    for (let i = 0; i < 15; i++) {
      this.addDeco(100 + Math.random() * (w - 200), 100 + Math.random() * (h - 200), "deco_rock", false);
    }

    // === WEBS in dark corners ===
    for (let i = 0; i < 10; i++) {
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

  // Queue a floor/deco tile into the appropriate render-texture chunk
  drawTile(key: string, wx: number, wy: number) {
    const cx = Math.floor(wx / this.CHUNK_PX);
    const cy = Math.floor(wy / this.CHUNK_PX);
    const ck = `${cx},${cy}`;
    if (!this.decoTilesByChunk.has(ck)) this.decoTilesByChunk.set(ck, []);
    this.decoTilesByChunk.get(ck)!.push([key, wx, wy]);
  }

  // Deterministic base-tile selector (reproducible — chunk can be re-built identically)
  getBaseTileKeyAt(wx: number, wy: number): string {
    const n = (Math.abs(Math.sin(wx * 3.7 + wy * 6.1) * 99999) | 0) % 100;
    switch (this.currentMap) {
      case "village": return n < 60 ? "tile_grass" : n < 85 ? "tile_grass_lush" : "tile_grass_dark";
      case "fields":  return n < 45 ? "tile_grass" : n < 70 ? "tile_grass_lush" : n < 85 ? "tile_dirt" : "tile_dirt_dark";
      case "forest":  return n < 35 ? "tile_grass_dark" : n < 60 ? "tile_grass" : n < 85 ? "tile_dark" : "tile_grass_lush";
      case "dungeon": return n < 50 ? "tile_dark" : n < 80 ? "tile_stone" : "tile_stone_mossy";
      case "arena":   return n < 70 ? "tile_sand" : n < 90 ? "tile_arena" : "tile_stone";
      default: return "tile_grass";
    }
  }

  // Build one CHUNK_PX×CHUNK_PX RenderTexture (base tiles + queued deco tiles baked in)
  private buildChunk(chunkX: number, chunkY: number): Phaser.GameObjects.RenderTexture | null {
    const cp = this.CHUNK_PX;
    const ts = 32;
    const wx0 = chunkX * cp;
    const wy0 = chunkY * cp;
    const mapConfig = getMapConfig(this.currentMap);
    const chW = Math.min(cp, mapConfig.width - wx0);
    const chH = Math.min(cp, mapConfig.height - wy0);
    if (chW <= 0 || chH <= 0) return null;

    const rt = this.add.renderTexture(wx0, wy0, chW, chH);
    rt.setOrigin(0, 0).setDepth(0);

    // Stamp base tiles
    for (let ty = 0; ty < chH; ty += ts) {
      for (let tx = 0; tx < chW; tx += ts) {
        const wx = wx0 + tx;
        const wy = wy0 + ty;
        const isBorder = wx < ts || wy < ts ||
                         wx >= mapConfig.width - ts || wy >= mapConfig.height - ts;
        const key = isBorder ? "tile_wall" : this.getBaseTileKeyAt(wx, wy);
        rt.stamp(key, undefined, tx + ts / 2, ty + ts / 2);
      }
    }

    // Stamp deco tiles queued for this chunk
    const decos = this.decoTilesByChunk.get(`${chunkX},${chunkY}`);
    if (decos) {
      for (const [key, wx, wy] of decos) {
        rt.stamp(key, undefined, wx - wx0, wy - wy0);
      }
    }
    return rt;
  }

  // Lazy chunk streaming — called throttled every 400 ms from update()
  updateMapChunks() {
    const cam = this.cameras.main;
    const cp = this.CHUNK_PX;
    const margin = 1;
    const cxMin = Math.floor(cam.scrollX / cp) - margin;
    const cxMax = Math.ceil((cam.scrollX + cam.width) / cp) + margin;
    const cyMin = Math.floor(cam.scrollY / cp) - margin;
    const cyMax = Math.ceil((cam.scrollY + cam.height) / cp) + margin;
    const mapConfig = getMapConfig(this.currentMap);
    const maxCx = Math.ceil(mapConfig.width / cp);
    const maxCy = Math.ceil(mapConfig.height / cp);

    for (let cy = Math.max(0, cyMin); cy < Math.min(maxCy, cyMax); cy++) {
      for (let cx = Math.max(0, cxMin); cx < Math.min(maxCx, cxMax); cx++) {
        const key = `${cx},${cy}`;
        if (!this.mapChunks.has(key)) {
          const rt = this.buildChunk(cx, cy);
          if (rt) this.mapChunks.set(key, rt);
        }
      }
    }

    // Destroy chunks far from camera
    const destroyMargin = margin + 2;
    for (const [key, rt] of this.mapChunks) {
      const [kcx, kcy] = key.split(",").map(Number);
      if (kcx < cxMin - destroyMargin || kcx > cxMax + destroyMargin ||
          kcy < cyMin - destroyMargin || kcy > cyMax + destroyMargin) {
        rt.destroy();
        this.mapChunks.delete(key);
      }
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

    // Chunk streaming throttle
    this.chunkUpdateTimer += delta;
    if (this.chunkUpdateTimer > 400) {
      this.chunkUpdateTimer = 0;
      this.updateMapChunks();
    }

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

    // Clean up map chunks
    this.mapChunks.forEach(rt => rt.destroy());
    this.mapChunks.clear();
    this.decoTilesByChunk.clear();

    // Remove event listeners from canvas
    this.input.removeAllListeners();
  }

  destroy() {
    this.shutdown();
  }
}
