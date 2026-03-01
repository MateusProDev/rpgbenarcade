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
    this.cameras.main.setZoom(1.8);

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

    // Base tiles
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        if (x === 0 || y === 0 || x >= width - tileSize || y >= height - tileSize) {
          const wall = this.decoColliders.create(x + tileSize / 2, y + tileSize / 2, "tile_wall");
          wall.setDepth(1);
          wall.body.setSize(tileSize, tileSize);
          wall.refreshBody();
        } else {
          const tileKey = this.getMapTile();
          this.add.image(x + tileSize / 2, y + tileSize / 2, tileKey).setDepth(0);
        }
      }
    }

    // Area-specific decoration
    switch (this.currentMap) {
      case "village": this.decorateVillage(width, height, tileSize); break;
      case "fields": this.decorateFields(width, height, tileSize); break;
      case "forest": this.decorateForest(width, height, tileSize); break;
      case "dungeon": this.decorateDungeon(width, height, tileSize); break;
      case "arena": this.decorateArena(width, height, tileSize); break;
    }
  }

  // --- VILLAGE DECORATION ---
  decorateVillage(w: number, h: number, _ts: number) {
    // Cobblestone paths (cross pattern through center)
    const cx = w / 2;
    const cy = h / 2;

    // Horizontal path
    for (let x = 80; x < w - 80; x += 32) {
      this.add.image(x, cy, "tile_path").setDepth(0);
      this.add.image(x, cy + 32, "tile_path").setDepth(0);
    }
    // Vertical path
    for (let y = 80; y < h - 80; y += 32) {
      this.add.image(cx, y, "tile_path").setDepth(0);
      this.add.image(cx + 32, y, "tile_path").setDepth(0);
    }

    // Fountain in center
    const fountain = this.add.image(cx, cy, "deco_fountain");
    fountain.setDepth(3);
    // Fountain collision
    const fBlock = this.decoColliders.create(cx, cy + 6, "deco_fountain");
    fBlock.setVisible(false);
    fBlock.body.setSize(40, 20);
    fBlock.body.setOffset(4, 28);
    fBlock.refreshBody();

    // Building 1 - Elder's House (top-left)
    this.addRichBuilding(200, 120, 8, 5, 0xaa6633, "Ancião");
    // Building 2 - Blacksmith (top-right)
    this.addRichBuilding(600, 130, 7, 5, 0x666666, "Ferreiro");
    // Building 3 - Healer cottage (bottom-left)
    this.addRichBuilding(150, 450, 6, 4, 0x88aa55, "Curandeira");
    // Building 4 - Guild hall (center-right)
    this.addRichBuilding(550, 420, 8, 6, 0x8855aa, "Guilda");
    // Building 5 - Tavern (top-center)
    this.addRichBuilding(400, 100, 7, 4, 0xcc8844, "Taverna");

    // Market stalls near blacksmith
    this.addDeco(680, 280, "deco_barrel", false);
    this.addDeco(700, 280, "deco_crate", false);
    this.addDeco(720, 280, "deco_barrel", false);

    // Well near healer
    const well = this.addDeco(280, 480, "deco_well", true);
    if (well) { well.body.setSize(28, 14); well.body.setOffset(2, 22); well.refreshBody(); }

    // Gardens with flowers and fences
    this.addDeco(100, 340, "deco_fence", false);
    this.addDeco(132, 340, "deco_fence", false);
    this.addDeco(164, 340, "deco_fence", false);
    for (let i = 0; i < 8; i++) {
      const fx = 100 + Math.random() * 100;
      const fy = 310 + Math.random() * 25;
      const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue"];
      this.addDeco(fx, fy, flowers[Math.floor(Math.random() * 3)], false);
    }

    // Trees along edges
    const treePositions = [
      [80, 80], [160, 60], [240, 70], [w - 120, 80], [w - 200, 60],
      [80, h - 120], [160, h - 100], [w - 120, h - 120], [w - 200, h - 100],
      [80, 200], [80, 400], [80, 600], [w - 80, 200], [w - 80, 400],
    ];
    treePositions.forEach(([tx, ty]) => {
      const tree = this.addDeco(tx, ty, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    });

    // Bushes
    this.addDeco(320, 200, "deco_bush", false);
    this.addDeco(500, 350, "deco_bush", false);
    this.addDeco(700, 400, "deco_bush", false);
    this.addDeco(350, 550, "deco_bush", false);

    // Rocks
    this.addDeco(450, 500, "deco_rock", false);
    this.addDeco(650, 150, "deco_rock", false);

    // Barrels & crates near buildings
    this.addDeco(260, 180, "deco_barrel", false);
    this.addDeco(280, 180, "deco_crate", false);
    this.addDeco(660, 180, "deco_barrel", false);
  }

  // --- FIELDS DECORATION ---
  decorateFields(w: number, h: number, _ts: number) {
    // Dirt paths
    for (let x = 80; x < 400; x += 32) {
      this.add.image(x, h / 3, "tile_dirt").setDepth(0);
      this.add.image(x, h / 3 + 32, "tile_dirt").setDepth(0);
    }
    for (let y = 200; y < h - 200; y += 32) {
      this.add.image(w / 3, y, "tile_dirt").setDepth(0);
    }

    // Farm plots (green crop rows)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const px = 500 + col * 40;
        const py = 200 + row * 50;
        // Dark soil
        this.add.image(px, py, "tile_dirt").setDepth(0);
        // Crop sprouts (using flowers)
        if (Math.random() > 0.3) {
          this.addDeco(px, py - 8, "deco_flower_yellow", false);
        }
      }
    }

    // Haystacks
    const haystackPos = [
      [350, 500], [400, 520], [380, 540],
      [900, 300], [940, 310],
      [1400, 600], [1440, 630],
    ];
    haystackPos.forEach(([hx, hy]) => this.addDeco(hx, hy, "deco_haystack", false));

    // Scattered trees
    const fieldTrees = [
      [200, 250], [350, 150], [800, 700], [1000, 200],
      [1200, 500], [1500, 300], [1700, 800], [1800, 200],
      [300, 900], [600, 1100], [900, 1000], [1400, 1200],
    ];
    fieldTrees.forEach(([tx, ty]) => {
      const tree = this.addDeco(tx, ty, "deco_tree", true);
      if (tree) { tree.body.setSize(8, 8); tree.body.setOffset(12, 38); tree.refreshBody(); }
    });

    // Fences bordering farm area
    for (let x = 460; x < 760; x += 32) {
      this.addDeco(x, 170, "deco_fence", false);
      this.addDeco(x, 430, "deco_fence", false);
    }

    // Rocks and boulders
    this.addDeco(700, 800, "deco_boulder", true);
    this.addDeco(1100, 400, "deco_rock", false);
    this.addDeco(1300, 700, "deco_rock", false);
    this.addDeco(200, 700, "deco_boulder", true);

    // Bushes
    for (let i = 0; i < 12; i++) {
      this.addDeco(
        150 + Math.random() * (w - 300),
        150 + Math.random() * (h - 300),
        "deco_bush", false
      );
    }

    // Small pond (water tiles)
    for (let px = 0; px < 4; px++) {
      for (let py = 0; py < 3; py++) {
        this.add.image(1100 + px * 32, 900 + py * 32, "tile_water").setDepth(0);
      }
    }

    // Flowers near path
    for (let i = 0; i < 15; i++) {
      const flowers = ["deco_flower_red", "deco_flower_yellow", "deco_flower_blue"];
      this.addDeco(
        100 + Math.random() * (w - 200),
        100 + Math.random() * (h - 200),
        flowers[Math.floor(Math.random() * 3)], false
      );
    }

    // Tree stumps
    this.addDeco(600, 350, "deco_stump", false);
    this.addDeco(1600, 500, "deco_stump", false);
  }

  // --- FOREST DECORATION ---
  decorateForest(w: number, h: number, _ts: number) {
    // Dense tree coverage
    const numTrees = 60;
    const placed: { x: number; y: number }[] = [];

    // Clear paths for player movement (thin corridors)
    const pathY = h / 2;
    const pathX = w / 2;

    for (let i = 0; i < numTrees; i++) {
      const tx = 80 + Math.random() * (w - 160);
      const ty = 80 + Math.random() * (h - 160);

      // Keep corridors clear
      const nearPathH = Math.abs(ty - pathY) < 60;
      const nearPathV = Math.abs(tx - pathX) < 60;
      if (nearPathH || nearPathV) continue;

      // Min distance between trees
      const tooClose = placed.some(
        (p) => Math.abs(p.x - tx) < 40 && Math.abs(p.y - ty) < 40
      );
      if (tooClose) continue;

      placed.push({ x: tx, y: ty });
      const treeType = Math.random() > 0.4 ? "deco_pine" : "deco_tree";
      const tree = this.addDeco(tx, ty, treeType, true);
      if (tree) {
        tree.body.setSize(8, 8);
        tree.body.setOffset(treeType === "deco_pine" ? 8 : 12, 38);
        tree.refreshBody();
      }
    }

    // Mushroom clusters
    const mushClusters = [
      [300, 500], [700, 300], [500, 900], [1200, 600],
      [1000, 1000], [400, 1200], [1500, 400],
    ];
    mushClusters.forEach(([mx, my]) => {
      for (let j = 0; j < 3; j++) {
        this.addDeco(mx + (Math.random() - 0.5) * 30, my + (Math.random() - 0.5) * 20, "deco_mushroom", false);
      }
    });

    // Bushes (lots)
    for (let i = 0; i < 20; i++) {
      this.addDeco(
        100 + Math.random() * (w - 200),
        100 + Math.random() * (h - 200),
        "deco_bush", false
      );
    }

    // Rocks
    for (let i = 0; i < 8; i++) {
      this.addDeco(
        150 + Math.random() * (w - 300),
        150 + Math.random() * (h - 300),
        Math.random() > 0.5 ? "deco_rock" : "deco_boulder",
        Math.random() > 0.5
      );
    }

    // Stumps (fallen trees)
    this.addDeco(600, 700, "deco_stump", false);
    this.addDeco(1100, 500, "deco_stump", false);
    this.addDeco(400, 400, "deco_stump", false);

    // Flowers (sparse, forest floor)
    for (let i = 0; i < 10; i++) {
      this.addDeco(
        100 + Math.random() * (w - 200),
        100 + Math.random() * (h - 200),
        "deco_flower_blue", false
      );
    }

    // Mossy dark patches using dark tiles
    for (let i = 0; i < 5; i++) {
      const dx = 200 + Math.random() * (w - 400);
      const dy = 200 + Math.random() * (h - 400);
      for (let px = 0; px < 2; px++) {
        for (let py = 0; py < 2; py++) {
          this.add.image(dx + px * 32, dy + py * 32, "tile_dark").setDepth(0).setAlpha(0.3);
        }
      }
    }
  }

  // --- DUNGEON DECORATION ---
  decorateDungeon(w: number, h: number, _ts: number) {
    // Replace floor tiles in corridors with stone  
    // Main corridor (horizontal)
    for (let x = 64; x < w - 64; x += 32) {
      this.add.image(x, h / 2, "tile_stone").setDepth(0);
      this.add.image(x, h / 2 + 32, "tile_stone").setDepth(0);
      this.add.image(x, h / 2 - 32, "tile_stone").setDepth(0);
    }
    // Vertical corridor
    for (let y = 64; y < h - 64; y += 32) {
      this.add.image(w / 3, y, "tile_stone").setDepth(0);
      this.add.image(w / 3 + 32, y, "tile_stone").setDepth(0);
      this.add.image(2 * w / 3, y, "tile_stone").setDepth(0);
      this.add.image(2 * w / 3 + 32, y, "tile_stone").setDepth(0);
    }

    // Room 1 (top-left) - Entry room
    for (let rx = 100; rx < 450; rx += 32) {
      for (let ry = 100; ry < 350; ry += 32) {
        this.add.image(rx, ry, "tile_stone").setDepth(0);
      }
    }

    // Room 2 (bottom-right) - Boss room
    for (let rx = w - 500; rx < w - 100; rx += 32) {
      for (let ry = h - 450; ry < h - 100; ry += 32) {
        this.add.image(rx, ry, "tile_stone").setDepth(0);
      }
    }

    // Pillars in rooms
    const pillarPositions = [
      [200, 200], [350, 200], [200, 300], [350, 300],
      [w - 400, h - 350], [w - 250, h - 350],
      [w - 400, h - 200], [w - 250, h - 200],
    ];
    pillarPositions.forEach(([px, py]) => {
      const pillar = this.addDeco(px, py, "deco_pillar", true);
      if (pillar) { pillar.body.setSize(12, 8); pillar.body.setOffset(2, 30); pillar.refreshBody(); }
    });

    // Torches along corridors
    for (let x = 128; x < w - 128; x += 160) {
      this.addDeco(x, h / 2 - 60, "deco_torch", false);
      this.addDeco(x, h / 2 + 70, "deco_torch", false);
    }
    // Torches in rooms
    this.addDeco(130, 130, "deco_torch", false);
    this.addDeco(420, 130, "deco_torch", false);
    this.addDeco(130, 320, "deco_torch", false);
    this.addDeco(420, 320, "deco_torch", false);

    // Bone piles
    const bonePos = [
      [250, 250], [300, 180], [w - 350, h - 300],
      [w - 200, h - 250], [w / 2, h / 2 + 60],
    ];
    bonePos.forEach(([bx, by]) => this.addDeco(bx, by, "deco_bones", false));

    // Barrels and crates in entry room
    this.addDeco(140, 140, "deco_barrel", false);
    this.addDeco(160, 140, "deco_crate", false);
    this.addDeco(140, 160, "deco_crate", false);

    // Boss room features
    this.addDeco(w - 300, h - 300, "deco_barrel", false);
    this.addDeco(w - 280, h - 300, "deco_barrel", false);

    // Scattered rocks
    for (let i = 0; i < 6; i++) {
      this.addDeco(
        100 + Math.random() * (w - 200),
        100 + Math.random() * (h - 200),
        "deco_rock", false
      );
    }

    // Inner walls (create corridors)
    // Top wall segment
    for (let x = 64; x < w / 3 - 48; x += 32) {
      this.addWallBlock(x, h / 2 - 80);
      this.addWallBlock(x, h / 2 + 80);
    }
    // Bottom wall segment  
    for (let x = w / 3 + 80; x < 2 * w / 3 - 48; x += 32) {
      this.addWallBlock(x, h / 2 - 80);
      this.addWallBlock(x, h / 2 + 80);
    }
    for (let x = 2 * w / 3 + 80; x < w - 64; x += 32) {
      this.addWallBlock(x, h / 2 - 80);
      this.addWallBlock(x, h / 2 + 80);
    }
  }

  // --- ARENA DECORATION ---
  decorateArena(w: number, h: number, _ts: number) {
    const cx = w / 2;
    const cy = h / 2;

    // Arena floor (center pit)
    const pitR = 200;
    for (let x = cx - pitR; x < cx + pitR; x += 32) {
      for (let y = cy - pitR; y < cy + pitR; y += 32) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < pitR) {
          this.add.image(x, y, "tile_arena").setDepth(0);
        }
      }
    }

    // Arena border ring (sand)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
      const bx = cx + Math.cos(angle) * (pitR + 16);
      const by = cy + Math.sin(angle) * (pitR + 16);
      this.add.image(bx, by, "tile_sand").setDepth(0);
    }

    // Banners around perimeter
    const bannerAngles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
    bannerAngles.forEach((angle, i) => {
      const bx = cx + Math.cos(angle) * (pitR + 60);
      const by = cy + Math.sin(angle) * (pitR + 60);
      this.addDeco(bx, by, i % 2 === 0 ? "deco_banner_red" : "deco_banner_blue", false);
    });

    // Torches
    const torchAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    torchAngles.forEach((angle) => {
      const tx = cx + Math.cos(angle) * (pitR + 40);
      const ty = cy + Math.sin(angle) * (pitR + 40);
      this.addDeco(tx, ty, "deco_torch", false);
    });

    // Spectator area (raised edge, stone tiles)
    for (let x = 64; x < w - 64; x += 32) {
      for (let y = 64; y < 150; y += 32) {
        this.add.image(x, y, "tile_stone").setDepth(0);
      }
      for (let y = h - 150; y < h - 64; y += 32) {
        this.add.image(x, y, "tile_stone").setDepth(0);
      }
    }

    // Barrels by entrance
    this.addDeco(w - 100, cy - 30, "deco_barrel", false);
    this.addDeco(w - 100, cy + 30, "deco_barrel", false);
    this.addDeco(w - 120, cy, "deco_crate", false);

    // Pillars at entrance
    const entrance = this.addDeco(w - 70, cy - 50, "deco_pillar", true);
    if (entrance) { entrance.body.setSize(12, 8); entrance.body.setOffset(2, 30); entrance.refreshBody(); }
    const entrance2 = this.addDeco(w - 70, cy + 50, "deco_pillar", true);
    if (entrance2) { entrance2.body.setSize(12, 8); entrance2.body.setOffset(2, 30); entrance2.refreshBody(); }
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

  addRichBuilding(x: number, y: number, tw: number, th: number, roofColor: number, label: string) {
    const tileSize = 32;
    const bw = tw * tileSize;

    // Floor
    for (let bx = 0; bx < tw; bx++) {
      for (let by = 0; by < th; by++) {
        const wx = x + bx * tileSize;
        const wy = y + by * tileSize;
        this.add.image(wx + tileSize / 2, wy + tileSize / 2, "tile_wood").setDepth(0);

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
    switch (this.currentMap) {
      case "village": return "tile_grass";
      case "fields": return Math.random() > 0.15 ? "tile_grass" : "tile_dirt";
      case "forest": return Math.random() > 0.3 ? "tile_grass" : "tile_dark";
      case "dungeon": return "tile_dark";
      case "arena": return "tile_sand";
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
    if (this.unsubPresence) this.unsubPresence();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    const store = useGameStore.getState();
    if (store.player) {
      removePlayerPresence(store.player.uid);
    }
  }

  destroy() {
    this.shutdown();
  }
}
