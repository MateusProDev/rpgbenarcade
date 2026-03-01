// ========================
// Boot Scene - Asset Loading
// ========================
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, "Carregando...", {
      fontFamily: "serif",
      fontSize: "20px",
      color: "#c4a35a",
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xc4a35a, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate all game textures procedurally
    this.generateTextures();
  }

  generateTextures() {
    // Player textures
    this.generateCharTexture("player_mage", 0x6644cc);
    this.generateCharTexture("player_archer", 0x44aa44);
    this.generateCharTexture("player_swordsman", 0xcc6644);
    this.generateCharTexture("player_lancer", 0x4466cc);
    this.generateCharTexture("remote_player", 0xaaaaaa);

    // Enemy textures
    this.generateEnemyTexture("enemy_slime", 0x44cc44, 20);
    this.generateEnemyTexture("enemy_wolf", 0x888888, 22);
    this.generateEnemyTexture("enemy_skeleton", 0xdddddd, 24);
    this.generateEnemyTexture("enemy_goblin", 0x66aa22, 20);
    this.generateEnemyTexture("enemy_bandit", 0x885522, 24);
    this.generateEnemyTexture("enemy_orc", 0x446622, 28);
    this.generateEnemyTexture("enemy_dark_knight", 0x220022, 28);
    this.generateEnemyTexture("enemy_dragon", 0xcc2222, 40);

    // NPC textures
    this.generateNpcTexture("npc_default", 0xccaa44);

    // Projectile
    const proj = this.make.graphics({ x: 0, y: 0 });
    proj.fillStyle(0xffaa00, 1);
    proj.fillCircle(4, 4, 4);
    proj.generateTexture("projectile", 8, 8);
    proj.destroy();

    // Tiles
    this.generateTileTexture("tile_grass", 0x3a7d44, 0x2d6b35);
    this.generateTileTexture("tile_dirt", 0x8b6914, 0x7a5c12);
    this.generateTileTexture("tile_stone", 0x666666, 0x555555);
    this.generateTileTexture("tile_water", 0x2244aa, 0x1a3388);
    this.generateTileTexture("tile_sand", 0xccbb88, 0xbbaa77);
    this.generateTileTexture("tile_dark", 0x332233, 0x221122);
    this.generateTileTexture("tile_arena", 0x884422, 0x773311);
    this.generateTileTexture("tile_wall", 0x444444, 0x333333);
    this.generateTileTexture("tile_wood", 0x8b5a2b, 0x7a4a1b);

    // Portal
    const portal = this.make.graphics({ x: 0, y: 0 });
    portal.fillStyle(0x8844ff, 0.7);
    portal.fillCircle(16, 16, 16);
    portal.fillStyle(0xaa66ff, 0.5);
    portal.fillCircle(16, 16, 10);
    portal.generateTexture("portal", 32, 32);
    portal.destroy();

    // Item drop
    const itemDrop = this.make.graphics({ x: 0, y: 0 });
    itemDrop.fillStyle(0xffdd44, 0.9);
    itemDrop.fillRect(2, 2, 12, 12);
    itemDrop.lineStyle(1, 0xffffff, 0.8);
    itemDrop.strokeRect(2, 2, 12, 12);
    itemDrop.generateTexture("item_drop", 16, 16);
    itemDrop.destroy();

    // Health bar backgrounds
    const hpBg = this.make.graphics({ x: 0, y: 0 });
    hpBg.fillStyle(0x333333, 1);
    hpBg.fillRect(0, 0, 32, 4);
    hpBg.generateTexture("hp_bar_bg", 32, 4);
    hpBg.destroy();

    const hpFg = this.make.graphics({ x: 0, y: 0 });
    hpFg.fillStyle(0x44cc44, 1);
    hpFg.fillRect(0, 0, 32, 4);
    hpFg.generateTexture("hp_bar_fg", 32, 4);
    hpFg.destroy();
  }

  generateCharTexture(key: string, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, 8, 24, 20, 3);
    // Head
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(16, 8, 7);
    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(13, 7, 1.5);
    g.fillCircle(19, 7, 1.5);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  generateEnemyTexture(key: string, color: number, size: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    if (key.includes("slime")) {
      g.fillEllipse(size / 2, size / 2 + 4, size, size - 6);
    } else if (key.includes("dragon")) {
      g.fillTriangle(size / 2, 0, 0, size, size, size);
      g.fillStyle(0xff4400, 0.8);
      g.fillCircle(size / 2 - 4, size / 3, 2);
      g.fillCircle(size / 2 + 4, size / 3, 2);
    } else {
      g.fillRoundedRect(2, 2, size - 4, size - 4, 4);
      // Eyes
      g.fillStyle(0xff0000, 1);
      g.fillCircle(size / 2 - 4, size / 3, 2);
      g.fillCircle(size / 2 + 4, size / 3, 2);
    }
    g.generateTexture(key, size, size);
    g.destroy();
  }

  generateNpcTexture(key: string, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color, 1);
    g.fillRoundedRect(4, 8, 24, 20, 3);
    g.fillStyle(0xffcc99, 1);
    g.fillCircle(16, 8, 7);
    g.fillStyle(0x000000, 1);
    g.fillCircle(13, 7, 1.5);
    g.fillCircle(19, 7, 1.5);
    // Hat/marker
    g.fillStyle(0xffdd00, 1);
    g.fillTriangle(16, -4, 10, 3, 22, 3);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  generateTileTexture(key: string, color1: number, color2: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(color1, 1);
    g.fillRect(0, 0, 32, 32);
    // Add some variation
    g.fillStyle(color2, 0.5);
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(Math.random() * 28);
      const ry = Math.floor(Math.random() * 28);
      g.fillRect(rx, ry, 4, 4);
    }
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  create() {
    this.scene.start("WorldScene");
  }
}
