// ========================
// Boot Scene - Asset Loading & Animated Procedural Sprites
// Directional walk animations + Rich decoration textures
// ========================
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.cameras.main.setBackgroundColor("#0d0d12");

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x111118, 0.9);
    progressBox.fillRoundedRect(width / 2 - 170, height / 2 - 35, 340, 60, 8);
    progressBox.lineStyle(2, 0xc4a35a, 0.6);
    progressBox.strokeRoundedRect(width / 2 - 170, height / 2 - 35, 340, 60, 8);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 60, "⚔️ Forjando o Mundo... ⚔️", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#c4a35a",
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2 - 5, "0%", {
      fontFamily: "Georgia, serif",
      fontSize: "14px",
      color: "#e8dcc8",
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xc4a35a, 1);
      progressBar.fillRoundedRect(width / 2 - 158, height / 2 - 22, 316 * value, 34, 5);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.generateTextures();
  }

  // ========================
  // HELPERS
  // ========================
  px(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, 1, 1);
  }

  block(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, w, h);
  }

  lighten(color: number, amount: number): number {
    let r = (color >> 16) & 0xff;
    let gr = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.min(255, r + amount);
    gr = Math.min(255, gr + amount);
    b = Math.min(255, b + amount);
    return (r << 16) | (gr << 8) | b;
  }

  darken(color: number, amount: number): number {
    let r = (color >> 16) & 0xff;
    let gr = (color >> 8) & 0xff;
    let b = color & 0xff;
    r = Math.max(0, r - amount);
    gr = Math.max(0, gr - amount);
    b = Math.max(0, b - amount);
    return (r << 16) | (gr << 8) | b;
  }

  // ========================
  // MAIN TEXTURE GENERATOR
  // ========================
  generateTextures() {
    // ========================
    // HERO CHARACTERS - Animated (48x48 per frame)
    // Directions: down (front), up (back), left (side) — right uses flipX
    // Frames: 0=idle, 1=walk_left_leg, 2=walk_right_leg
    // ========================
    this.generateHeroFrames("player_swordsman", {
      hair: 0x8b4513, skin: 0xffcc99, armor: 0xaa3333, armorLight: 0xcc5544,
      armorDark: 0x882222, pants: 0x553322, boots: 0x443322, cape: 0x771111,
      weapon: 0xcccccc, weaponHandle: 0x8b5a2b,
      hasHelmet: true, helmetColor: 0x888888, hasSword: true, hasShield: true,
    });

    this.generateHeroFrames("player_mage", {
      hair: 0xeeeeee, skin: 0xffe0bd, armor: 0x4422aa, armorLight: 0x6644cc,
      armorDark: 0x331188, pants: 0x332266, boots: 0x221144, cape: 0x5533bb,
      weapon: 0x88aaff, weaponHandle: 0x6644cc,
      hasHat: true, hatColor: 0x4422aa, hasStaff: true, hasOrb: true, orbColor: 0x44ddff,
    });

    this.generateHeroFrames("player_archer", {
      hair: 0x44aa44, skin: 0xffe0bd, armor: 0x336633, armorLight: 0x448844,
      armorDark: 0x224422, pants: 0x554422, boots: 0x443311, cape: 0x225522,
      weapon: 0x8b5a2b, weaponHandle: 0x663311,
      hasHood: true, hoodColor: 0x336633, hasBow: true, hasQuiver: true,
    });

    this.generateHeroFrames("player_lancer", {
      hair: 0x3366cc, skin: 0xffcc99, armor: 0x3355aa, armorLight: 0x4477cc,
      armorDark: 0x224488, pants: 0x334466, boots: 0x223344, cape: 0x2244aa,
      weapon: 0xcccccc, weaponHandle: 0x8b5a2b,
      hasHelmet: true, helmetColor: 0x5577bb, hasLance: true, hasShield: true,
    });

    this.generateHeroFrames("remote_player", {
      hair: 0x999999, skin: 0xddccbb, armor: 0x777788, armorLight: 0x8888aa,
      armorDark: 0x555566, pants: 0x666666, boots: 0x555555, cape: 0x666677,
      weapon: 0xaaaaaa, weaponHandle: 0x666666,
    });

    // ========================
    // ENEMIES
    // ========================
    this.generateSlimeTexture();
    this.generateWolfTexture();
    this.generateSkeletonTexture();
    this.generateGoblinTexture();
    this.generateBanditTexture();
    this.generateOrcTexture();
    this.generateDarkKnightTexture();
    this.generateDragonTexture();

    // ========================
    // NPCs
    // ========================
    this.generateNpcTexture("npc_default", 0xccaa44);

    // ========================
    // EFFECTS & OBJECTS
    // ========================
    this.generateProjectile();
    this.generatePortal();
    this.generateItemDrop();
    this.generateClickTarget();

    // ========================
    // DECORATIONS
    // ========================
    this.generateDecorations();

    // ========================
    // TILES (32x32)
    // ========================
    this.generateDetailedTile("tile_grass", 0x3a7d44, 0x2d6b35, "grass");
    this.generateDetailedTile("tile_dirt", 0x8b6914, 0x7a5c12, "dirt");
    this.generateDetailedTile("tile_stone", 0x666666, 0x555555, "stone");
    this.generateDetailedTile("tile_water", 0x2244aa, 0x1a3388, "water");
    this.generateDetailedTile("tile_sand", 0xccbb88, 0xbbaa77, "sand");
    this.generateDetailedTile("tile_dark", 0x332233, 0x221122, "dark");
    this.generateDetailedTile("tile_arena", 0x884422, 0x773311, "arena");
    this.generateDetailedTile("tile_wall", 0x555555, 0x444444, "wall");
    this.generateDetailedTile("tile_wood", 0x8b5a2b, 0x7a4a1b, "wood");
    this.generateDetailedTile("tile_path", 0x998877, 0x887766, "path");
  }

  // ========================
  // HERO ANIMATED FRAMES GENERATOR
  // 3 dirs × 3 frames = 9 + 1 base key = 10 textures/hero
  // ========================
  generateHeroFrames(baseKey: string, cfg: any) {
    const dirs = ["down", "up", "left"] as const;
    for (const dir of dirs) {
      for (let f = 0; f < 3; f++) {
        const key = `${baseKey}_${dir}_${f}`;
        const g = this.make.graphics({ x: 0, y: 0 });
        this.drawHeroDirection(g, cfg, dir, f);
        g.generateTexture(key, 48, 48);
        g.destroy();
      }
    }
    // Base key = down idle (compatibility)
    const gb = this.make.graphics({ x: 0, y: 0 });
    this.drawHeroDirection(gb, cfg, "down", 0);
    gb.generateTexture(baseKey, 48, 48);
    gb.destroy();
  }

  drawHeroDirection(g: Phaser.GameObjects.Graphics, cfg: any, dir: string, frame: number) {
    switch (dir) {
      case "down": this.drawHeroFront(g, cfg, frame); break;
      case "up": this.drawHeroBack(g, cfg, frame); break;
      case "left": this.drawHeroSide(g, cfg, frame); break;
    }
  }

  // ========================
  // FRONT VIEW (DOWN) - Detailed with walk animation
  // ========================
  drawHeroFront(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const ll = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const rl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const la = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const ra = frame === 2 ? 1 : frame === 1 ? -1 : 0;

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 44, 20, 6);

    // Cape
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 0.9);
      g.fillRoundedRect(14, 18 + bob, 20, 24, 3);
      g.fillStyle(this.darken(cfg.cape, 30), 0.6);
      g.fillRect(16, 28 + bob, 16, 12);
    }

    // Legs
    g.fillStyle(cfg.pants, 1);
    g.fillRect(17, 34 + ll, 6, 8);
    g.fillRect(25, 34 + rl, 6, 8);
    g.fillStyle(cfg.boots, 1);
    g.fillRect(16, 40 + ll, 7, 4);
    g.fillRect(25, 40 + rl, 7, 4);
    g.fillStyle(this.darken(cfg.boots, 20), 1);
    g.fillRect(16, 43 + ll, 7, 1);
    g.fillRect(25, 43 + rl, 7, 1);
    g.fillStyle(this.lighten(cfg.boots, 20), 0.4);
    g.fillRect(17, 40 + ll, 2, 1);
    g.fillRect(26, 40 + rl, 2, 1);

    // Body / Armor
    g.fillStyle(cfg.armor, 1);
    g.fillRoundedRect(15, 18 + bob, 18, 17, 2);
    g.fillStyle(cfg.armorLight, 0.7);
    g.fillRect(16, 19 + bob, 4, 6);
    g.fillRect(28, 19 + bob, 4, 6);
    g.fillStyle(cfg.armorDark, 0.6);
    g.fillRect(17, 30 + bob, 14, 3);
    g.fillStyle(cfg.armorLight, 0.3);
    g.fillRect(22, 20 + bob, 4, 8);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(16, 32 + bob, 16, 2);
    g.fillStyle(0xdaa520, 1);
    g.fillRect(22, 32 + bob, 4, 2);
    g.fillStyle(cfg.armorLight, 1);
    g.fillEllipse(16, 20 + bob, 8, 6);
    g.fillEllipse(32, 20 + bob, 8, 6);
    g.fillStyle(cfg.armorDark, 0.5);
    g.fillRect(13, 21 + bob, 3, 1);
    g.fillRect(32, 21 + bob, 3, 1);

    // Arms
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 21 + bob + la, 4, 10);
    g.fillRect(32, 21 + bob + ra, 4, 10);
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(12, 28 + bob + la, 4, 4);
    g.fillRect(32, 28 + bob + ra, 4, 4);
    g.fillStyle(this.lighten(cfg.armorDark, 30), 0.5);
    g.fillRect(13, 28 + bob + la, 2, 1);
    g.fillRect(33, 28 + bob + ra, 2, 1);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(21, 15 + bob, 6, 4);
    // Head
    g.fillRoundedRect(17, 4 + bob, 14, 14, 4);
    // Hair
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(17, 3 + bob, 14, 7, 3);
    g.fillRect(17, 4 + bob, 2, 8);
    g.fillRect(29, 4 + bob, 2, 8);
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(20, 9 + bob, 3, 3);
    g.fillRect(25, 9 + bob, 3, 3);
    g.fillStyle(0x222222, 1);
    g.fillRect(21, 10 + bob, 2, 2);
    g.fillRect(26, 10 + bob, 2, 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(22, 10 + bob, 1, 1);
    g.fillRect(27, 10 + bob, 1, 1);
    // Mouth & Nose
    g.fillStyle(this.darken(cfg.skin, 40), 1);
    g.fillRect(22, 14 + bob, 4, 1);
    g.fillStyle(this.darken(cfg.skin, 20), 1);
    g.fillRect(23, 12 + bob, 2, 2);
    // Ear hints
    g.fillStyle(this.darken(cfg.skin, 15), 1);
    g.fillRect(16, 9 + bob, 2, 3);
    g.fillRect(30, 9 + bob, 2, 3);

    // --- CLASS GEAR ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(16, 2 + bob, 16, 10, 3);
      g.fillStyle(this.lighten(cfg.helmetColor, 30), 0.6);
      g.fillRect(18, 3 + bob, 12, 2);
      g.fillStyle(this.darken(cfg.helmetColor, 40), 1);
      g.fillRect(19, 9 + bob, 10, 2);
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, 0 + bob, 4, 3);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(24, -4 + bob, 14, 10 + bob, 34, 10 + bob);
      g.fillStyle(this.lighten(cfg.hatColor, 40), 0.5);
      g.fillRect(14, 8 + bob, 20, 3);
      g.fillStyle(0xffdd44, 1);
      g.fillRect(22, 2 + bob, 3, 3);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(15, 1 + bob, 18, 14, 5);
      g.fillStyle(this.darken(cfg.hoodColor, 30), 0.6);
      g.fillRect(17, 8 + bob, 14, 3);
    }
    if (cfg.hasSword) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 22 + bob + la, 2, 7);
      g.fillStyle(0xdaa520, 1);
      g.fillRect(6, 21 + bob + la, 6, 2);
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(8, 10 + bob + la, 2, 12);
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.6);
      g.fillRect(9, 11 + bob + la, 1, 10);
    }
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 1);
      g.fillRoundedRect(35, 20 + bob + ra, 10, 12, 3);
      g.fillStyle(cfg.armorLight, 0.7);
      g.fillRect(37, 22 + bob + ra, 6, 8);
      g.fillStyle(0xdaa520, 1);
      g.fillRect(39, 24 + bob + ra, 2, 4);
      g.fillRect(38, 25 + bob + ra, 4, 2);
    }
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 5 + bob + la, 2, 36);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.9);
      g.fillCircle(9, 5 + bob + la, 4);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(7, 3 + bob + la, 2, 2);
    }
    if (cfg.hasOrb) {
      g.fillStyle(cfg.orbColor, 0.6);
      g.fillCircle(38, 16 + bob + ra, 5);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(36, 14 + bob + ra, 2, 2);
    }
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(7, 14 + bob + la, 2, 20);
      g.fillRect(5, 14 + bob + la, 3, 2);
      g.fillRect(5, 32 + bob + la, 3, 2);
      g.fillStyle(0xcccccc, 0.8);
      g.fillRect(9, 15 + bob + la, 1, 18);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(34, 14 + bob, 5, 16);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(35, 12 + bob, 1, 3);
      g.fillRect(37, 13 + bob, 1, 2);
    }
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 0 + bob + la, 2, 40);
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(9, -4 + bob + la, 5, 3 + bob + la, 13, 3 + bob + la);
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.6);
      g.fillRect(8, -2 + bob + la, 1, 4);
    }
  }

  // ========================
  // BACK VIEW (UP) - Walk animation
  // ========================
  drawHeroBack(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const ll = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const rl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const la = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const ra = frame === 2 ? 1 : frame === 1 ? -1 : 0;

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 44, 20, 6);

    // Legs
    g.fillStyle(this.darken(cfg.pants, 10), 1);
    g.fillRect(17, 34 + ll, 6, 8);
    g.fillRect(25, 34 + rl, 6, 8);
    g.fillStyle(this.darken(cfg.boots, 10), 1);
    g.fillRect(16, 40 + ll, 7, 4);
    g.fillRect(25, 40 + rl, 7, 4);
    g.fillStyle(this.darken(cfg.boots, 30), 1);
    g.fillRect(16, 43 + ll, 7, 1);
    g.fillRect(25, 43 + rl, 7, 1);

    // Body (back)
    g.fillStyle(this.darken(cfg.armor, 10), 1);
    g.fillRoundedRect(15, 18 + bob, 18, 17, 2);
    g.fillStyle(cfg.armorDark, 0.5);
    g.fillRect(16, 19 + bob, 16, 14);
    g.fillStyle(cfg.armorLight, 0.25);
    g.fillRect(23, 20 + bob, 2, 12);
    g.fillRect(18, 25 + bob, 12, 2);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(16, 32 + bob, 16, 2);
    g.fillStyle(cfg.armorLight, 0.9);
    g.fillEllipse(16, 20 + bob, 8, 6);
    g.fillEllipse(32, 20 + bob, 8, 6);

    // Cape (prominent from behind)
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 1);
      g.fillRoundedRect(15, 19 + bob, 18, 22, 3);
      g.fillStyle(this.darken(cfg.cape, 20), 0.4);
      g.fillRect(20, 22 + bob, 1, 18);
      g.fillRect(27, 22 + bob, 1, 18);
      g.fillStyle(this.lighten(cfg.cape, 15), 0.3);
      g.fillRect(23, 20 + bob, 2, 20);
      if (frame === 1) {
        g.fillStyle(this.darken(cfg.cape, 10), 0.3);
        g.fillRect(15, 36 + bob, 4, 4);
      } else if (frame === 2) {
        g.fillStyle(this.darken(cfg.cape, 10), 0.3);
        g.fillRect(29, 36 + bob, 4, 4);
      }
    }

    // Arms
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 21 + bob + la, 4, 10);
    g.fillRect(32, 21 + bob + ra, 4, 10);
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(12, 28 + bob + la, 4, 4);
    g.fillRect(32, 28 + bob + ra, 4, 4);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(21, 15 + bob, 6, 4);
    // Head (back)
    g.fillRoundedRect(17, 4 + bob, 14, 14, 4);
    // Hair covers back
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(16, 3 + bob, 16, 14, 4);
    g.fillStyle(this.darken(cfg.hair, 15), 0.5);
    g.fillRect(18, 8 + bob, 12, 8);

    // --- GEAR FROM BACK ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(16, 2 + bob, 16, 12, 3);
      g.fillStyle(this.darken(cfg.helmetColor, 20), 0.5);
      g.fillRect(18, 5 + bob, 12, 8);
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, 0 + bob, 4, 3);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(24, -4 + bob, 14, 10 + bob, 34, 10 + bob);
      g.fillStyle(this.lighten(cfg.hatColor, 40), 0.5);
      g.fillRect(14, 8 + bob, 20, 3);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(15, 1 + bob, 18, 14, 5);
      g.fillStyle(this.darken(cfg.hoodColor, 20), 0.4);
      g.fillRect(17, 6 + bob, 14, 8);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(28, 12 + bob, 6, 18);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(29, 10 + bob, 1, 3);
      g.fillRect(31, 11 + bob, 1, 2);
      g.fillRect(33, 10 + bob, 1, 3);
    }
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 0.8);
      g.fillRoundedRect(18, 20 + bob, 12, 14, 3);
      g.fillStyle(cfg.armorLight, 0.5);
      g.fillRect(20, 22 + bob, 8, 10);
      g.fillStyle(0xdaa520, 0.7);
      g.fillRect(23, 25 + bob, 2, 4);
    }
    if (cfg.hasSword) {
      g.fillStyle(0x553322, 1);
      g.fillRect(10, 16 + bob, 3, 20);
      g.fillStyle(cfg.weapon, 0.6);
      g.fillRect(11, 10 + bob, 1, 8);
    }
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(34, 5 + bob, 2, 34);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.7);
      g.fillCircle(35, 5 + bob, 3);
    }
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 0.8);
      g.fillRect(12, 14 + bob, 2, 18);
    }
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(34, 0 + bob, 2, 38);
      g.fillStyle(cfg.weapon, 0.8);
      g.fillTriangle(35, -4 + bob, 32, 2 + bob, 38, 2 + bob);
    }
  }

  // ========================
  // SIDE VIEW (LEFT) - Walk animation
  // Right direction uses flipX in WorldScene
  // ========================
  drawHeroSide(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const fl = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const bl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const flx = frame === 1 ? -2 : frame === 2 ? 1 : 0;
    const blx = frame === 2 ? -2 : frame === 1 ? 1 : 0;

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 44, 16, 5);

    // Cape behind
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 0.7);
      g.fillRoundedRect(26, 18 + bob, 10, 22, 3);
      g.fillStyle(this.darken(cfg.cape, 20), 0.4);
      g.fillRect(28, 24 + bob, 1, 14);
    }

    // Back leg
    g.fillStyle(this.darken(cfg.pants, 15), 1);
    g.fillRect(22 + blx, 34 + bl, 5, 8);
    g.fillStyle(this.darken(cfg.boots, 15), 1);
    g.fillRect(21 + blx, 40 + bl, 6, 4);

    // Back arm
    g.fillStyle(this.darken(cfg.skin, 15), 1);
    g.fillRect(28, 21 + bob, 3, 9);
    g.fillStyle(this.darken(cfg.armorDark, 10), 1);
    g.fillRect(28, 27 + bob, 3, 4);

    // Body (narrower)
    g.fillStyle(cfg.armor, 1);
    g.fillRoundedRect(18, 18 + bob, 12, 16, 2);
    g.fillStyle(cfg.armorLight, 0.5);
    g.fillRect(19, 19 + bob, 4, 6);
    g.fillStyle(cfg.armorDark, 0.4);
    g.fillRect(19, 30 + bob, 10, 2);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(18, 32 + bob, 12, 2);
    g.fillStyle(0xdaa520, 0.8);
    g.fillRect(19, 32 + bob, 2, 2);
    g.fillStyle(cfg.armorLight, 0.9);
    g.fillEllipse(20, 20 + bob, 8, 6);

    // Front leg
    g.fillStyle(cfg.pants, 1);
    g.fillRect(20 + flx, 34 + fl, 5, 8);
    g.fillStyle(cfg.boots, 1);
    g.fillRect(19 + flx, 40 + fl, 6, 4);
    g.fillStyle(this.darken(cfg.boots, 20), 1);
    g.fillRect(19 + flx, 43 + fl, 6, 1);

    // Front arm
    g.fillStyle(cfg.skin, 1);
    g.fillRect(16, 21 + bob, 4, 10);
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(16, 28 + bob, 4, 4);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(20, 15 + bob, 5, 4);
    // Head (side profile facing left)
    g.fillRoundedRect(16, 4 + bob, 14, 13, 4);
    // Nose extends left
    g.fillRect(14, 10 + bob, 3, 3);
    g.fillStyle(this.darken(cfg.skin, 20), 1);
    g.fillRect(14, 12 + bob, 2, 1);
    // Hair
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(18, 3 + bob, 12, 7, 3);
    g.fillRect(28, 4 + bob, 2, 8);
    g.fillRect(16, 5 + bob, 3, 4);
    // Eye
    g.fillStyle(0xffffff, 1);
    g.fillRect(18, 9 + bob, 3, 3);
    g.fillStyle(0x222222, 1);
    g.fillRect(18, 10 + bob, 2, 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(19, 10 + bob, 1, 1);
    // Mouth
    g.fillStyle(this.darken(cfg.skin, 40), 1);
    g.fillRect(16, 14 + bob, 3, 1);
    // Ear
    g.fillStyle(this.darken(cfg.skin, 10), 1);
    g.fillRect(28, 9 + bob, 2, 3);

    // --- GEAR SIDE ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(15, 2 + bob, 16, 10, 3);
      g.fillStyle(this.lighten(cfg.helmetColor, 30), 0.5);
      g.fillRect(17, 3 + bob, 12, 2);
      g.fillStyle(this.darken(cfg.helmetColor, 40), 1);
      g.fillRect(16, 9 + bob, 8, 2);
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, 0 + bob, 4, 3);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(22, -4 + bob, 14, 10 + bob, 32, 10 + bob);
      g.fillStyle(this.lighten(cfg.hatColor, 40), 0.5);
      g.fillRect(12, 8 + bob, 20, 3);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(15, 1 + bob, 16, 14, 5);
    }
    if (cfg.hasSword) {
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(12, 10 + bob, 2, 14);
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.5);
      g.fillRect(13, 11 + bob, 1, 12);
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(12, 22 + bob, 2, 5);
      g.fillStyle(0xdaa520, 1);
      g.fillRect(10, 21 + bob, 6, 2);
    }
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 0.9);
      g.fillRoundedRect(28, 20 + bob, 6, 12, 2);
      g.fillStyle(cfg.armorLight, 0.5);
      g.fillRect(29, 22 + bob, 4, 8);
    }
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(12, 4 + bob, 2, 36);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.8);
      g.fillCircle(13, 4 + bob, 4);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(11, 2 + bob, 2, 2);
    }
    if (cfg.hasOrb) {
      g.fillStyle(cfg.orbColor, 0.5);
      g.fillCircle(13, 14 + bob, 4);
    }
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(10, 14 + bob, 2, 18);
      g.fillRect(8, 14 + bob, 3, 2);
      g.fillRect(8, 30 + bob, 3, 2);
      g.fillStyle(0xcccccc, 0.7);
      g.fillRect(12, 15 + bob, 1, 16);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(30, 14 + bob, 4, 14);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(31, 12 + bob, 1, 3);
      g.fillRect(33, 13 + bob, 1, 2);
    }
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(10, 0 + bob, 2, 40);
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(11, -4 + bob, 8, 2 + bob, 14, 2 + bob);
    }
  }

  // ========================
  // ENEMY GENERATORS
  // ========================
  generateSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 32;
    g.fillStyle(0x22cc44, 1);
    g.fillEllipse(16, 20, 26, 18);
    g.fillStyle(0x44ff66, 0.6);
    g.fillEllipse(14, 17, 14, 10);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(12, 14, 3);
    g.fillCircle(10, 16, 1);
    g.fillStyle(0x000000, 1);
    g.fillCircle(12, 18, 2);
    g.fillCircle(20, 18, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(11, 17, 1, 1);
    g.fillRect(19, 17, 1, 1);
    g.fillStyle(0x006622, 1);
    g.fillRect(14, 22, 4, 1);
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 28, 20, 4);
    g.generateTexture("enemy_slime", S, S);
    g.destroy();
  }

  generateWolfTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    g.fillStyle(0x777777, 1);
    g.fillEllipse(18, 22, 28, 16);
    g.fillStyle(0x555555, 0.7);
    g.fillEllipse(18, 18, 20, 8);
    g.fillStyle(0x888888, 1);
    g.fillEllipse(8, 16, 14, 12);
    g.fillStyle(0x999999, 1);
    g.fillEllipse(3, 18, 8, 6);
    g.fillStyle(0x222222, 1);
    g.fillCircle(1, 17, 2);
    g.fillStyle(0x666666, 1);
    g.fillTriangle(6, 6, 3, 12, 9, 12);
    g.fillTriangle(14, 6, 11, 12, 17, 12);
    g.fillStyle(0xcc8888, 0.6);
    g.fillTriangle(6, 8, 4, 11, 8, 11);
    g.fillTriangle(14, 8, 12, 11, 16, 11);
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(6, 15, 2);
    g.fillCircle(12, 15, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(6, 15, 1);
    g.fillCircle(12, 15, 1);
    g.fillStyle(0x666666, 1);
    g.fillEllipse(32, 16, 8, 4);
    g.fillRect(8, 28, 3, 6);
    g.fillRect(16, 28, 3, 6);
    g.fillRect(22, 28, 3, 6);
    g.fillRect(28, 28, 3, 6);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(18, 34, 24, 3);
    g.generateTexture("enemy_wolf", S, S);
    g.destroy();
  }

  generateSkeletonTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    const bone = 0xddddcc;
    const boneDark = 0xbbbbaa;
    g.fillStyle(bone, 1);
    g.fillRoundedRect(11, 2, 14, 14, 4);
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 8, 3);
    g.fillCircle(24, 8, 3);
    g.fillStyle(0xff2222, 1);
    g.fillCircle(16, 8, 1);
    g.fillCircle(24, 8, 1);
    g.fillStyle(0x222222, 1);
    g.fillTriangle(20, 10, 18, 13, 22, 13);
    g.fillStyle(boneDark, 1);
    g.fillRect(14, 14, 12, 3);
    g.fillStyle(bone, 1);
    for (let i = 0; i < 5; i++) {
      g.fillRect(15 + i * 2, 15, 1, 2);
    }
    g.fillRect(19, 17, 2, 12);
    for (let i = 0; i < 4; i++) {
      g.fillRect(14, 18 + i * 3, 12, 1);
    }
    g.fillStyle(boneDark, 1);
    g.fillRect(10, 18, 3, 10);
    g.fillRect(27, 18, 3, 10);
    g.fillRect(15, 29, 3, 7);
    g.fillRect(22, 29, 3, 7);
    g.fillStyle(0x888888, 1);
    g.fillRect(7, 12, 2, 16);
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(8, 13, 1, 14);
    g.generateTexture("enemy_skeleton", S, S);
    g.destroy();
  }

  generateGoblinTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 30;
    g.fillStyle(0x558822, 1);
    g.fillRoundedRect(8, 12, 14, 12, 2);
    g.fillStyle(0x66aa33, 1);
    g.fillRoundedRect(6, 1, 18, 14, 5);
    g.fillTriangle(2, 5, 7, 3, 7, 9);
    g.fillTriangle(28, 5, 23, 3, 23, 9);
    g.fillStyle(0xcc8866, 0.5);
    g.fillTriangle(4, 5, 7, 4, 7, 8);
    g.fillTriangle(26, 5, 23, 4, 23, 8);
    g.fillStyle(0xffee00, 1);
    g.fillCircle(12, 7, 3);
    g.fillCircle(20, 7, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(12, 7, 1.5);
    g.fillCircle(20, 7, 1.5);
    g.fillStyle(0x448811, 1);
    g.fillCircle(16, 10, 2);
    g.fillStyle(0x333300, 1);
    g.fillRect(11, 12, 10, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(12, 12, 2, 1);
    g.fillRect(18, 12, 2, 1);
    g.fillStyle(0x448811, 1);
    g.fillRect(10, 24, 4, 5);
    g.fillRect(17, 24, 4, 5);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(4, 14, 1, 8);
    g.generateTexture("enemy_goblin", S, S);
    g.destroy();
  }

  generateBanditTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    g.fillStyle(0x443322, 0.8);
    g.fillRoundedRect(10, 14, 16, 18, 2);
    g.fillStyle(0x554433, 1);
    g.fillRoundedRect(11, 14, 14, 14, 2);
    g.fillStyle(0xddbb99, 1);
    g.fillRoundedRect(12, 2, 12, 13, 4);
    g.fillStyle(0x333333, 0.9);
    g.fillRect(12, 8, 12, 5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 7, 2);
    g.fillCircle(22, 7, 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 7, 1);
    g.fillCircle(22, 7, 1);
    g.fillStyle(0x443322, 1);
    g.fillRoundedRect(10, 0, 16, 8, 4);
    g.fillRect(13, 28, 4, 6);
    g.fillRect(20, 28, 4, 6);
    g.fillStyle(0x332211, 1);
    g.fillRect(12, 32, 5, 3);
    g.fillRect(19, 32, 5, 3);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(7, 16, 1, 10);
    g.fillRect(28, 16, 1, 10);
    g.generateTexture("enemy_bandit", S, S);
    g.destroy();
  }

  generateOrcTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 40;
    g.fillStyle(0x445522, 1);
    g.fillRect(12, 30, 6, 8);
    g.fillRect(22, 30, 6, 8);
    g.fillStyle(0x332211, 1);
    g.fillRect(11, 36, 7, 3);
    g.fillRect(21, 36, 7, 3);
    g.fillStyle(0x3d6b1e, 1);
    g.fillRoundedRect(8, 14, 24, 18, 4);
    g.fillStyle(0x664422, 0.8);
    g.fillRect(10, 16, 20, 14);
    g.fillStyle(0x553311, 0.6);
    g.fillRect(12, 28, 16, 2);
    g.fillStyle(0x4a7f23, 1);
    g.fillRoundedRect(11, 2, 18, 14, 5);
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(13, 12, 14, 4);
    g.fillStyle(0xeeeecc, 1);
    g.fillRect(14, 13, 2, 3);
    g.fillRect(24, 13, 2, 3);
    g.fillStyle(0xff4400, 1);
    g.fillCircle(16, 8, 2);
    g.fillCircle(24, 8, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 8, 1);
    g.fillCircle(24, 8, 1);
    g.fillStyle(0x2a5015, 1);
    g.fillRect(14, 5, 5, 2);
    g.fillRect(21, 5, 5, 2);
    g.fillStyle(0x666666, 1);
    g.fillRect(4, 6, 3, 28);
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 6, 8, 10);
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(1, 7, 6, 8);
    g.generateTexture("enemy_orc", S, S);
    g.destroy();
  }

  generateDarkKnightTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 42;
    g.fillStyle(0x110011, 0.9);
    g.fillRoundedRect(10, 16, 22, 24, 4);
    g.fillStyle(0x222222, 1);
    g.fillRect(14, 32, 5, 8);
    g.fillRect(23, 32, 5, 8);
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(12, 16, 18, 18, 3);
    g.fillStyle(0x333344, 0.8);
    g.fillRect(14, 18, 14, 2);
    g.fillRect(14, 22, 14, 2);
    g.fillRect(14, 26, 14, 2);
    g.fillStyle(0x880088, 1);
    g.fillRect(19, 20, 4, 4);
    g.fillStyle(0x333344, 1);
    g.fillEllipse(12, 18, 10, 8);
    g.fillEllipse(30, 18, 10, 8);
    g.fillStyle(0x444455, 1);
    g.fillTriangle(9, 12, 8, 18, 11, 18);
    g.fillTriangle(33, 12, 31, 18, 35, 18);
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(13, 2, 16, 16, 5);
    g.fillStyle(0x333344, 0.6);
    g.fillRect(15, 3, 12, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(16, 9, 10, 2);
    g.fillStyle(0xff0044, 1);
    g.fillCircle(19, 10, 1.5);
    g.fillCircle(25, 10, 1.5);
    g.fillStyle(0x555555, 1);
    g.fillRect(6, 8, 2, 26);
    g.fillStyle(0x880088, 0.6);
    g.fillRect(7, 9, 1, 24);
    g.fillStyle(0x444444, 1);
    g.fillRect(3, 7, 8, 2);
    g.generateTexture("enemy_dark_knight", S, S);
    g.destroy();
  }

  generateDragonTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 56;
    g.fillStyle(0xaa1111, 0.8);
    g.fillEllipse(48, 34, 14, 6);
    g.fillEllipse(52, 36, 8, 4);
    g.fillStyle(0xcc2222, 1);
    g.fillEllipse(24, 30, 36, 20);
    g.fillStyle(0xdd8844, 0.8);
    g.fillEllipse(24, 34, 24, 10);
    g.fillStyle(0xaa1111, 0.4);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(14 + i * 6, 26, 3);
    }
    g.fillStyle(0x991111, 0.8);
    g.fillTriangle(10, 14, -2, 28, 20, 28);
    g.fillTriangle(38, 14, 52, 28, 28, 28);
    g.fillStyle(0xcc4444, 0.4);
    g.fillTriangle(10, 16, 0, 26, 18, 26);
    g.fillTriangle(38, 16, 48, 26, 30, 26);
    g.fillStyle(0xaa2222, 1);
    g.fillRect(12, 38, 6, 10);
    g.fillRect(28, 38, 6, 10);
    g.fillStyle(0x222222, 1);
    g.fillTriangle(12, 48, 11, 52, 15, 48);
    g.fillTriangle(16, 48, 14, 52, 18, 48);
    g.fillTriangle(28, 48, 27, 52, 31, 48);
    g.fillTriangle(32, 48, 30, 52, 34, 48);
    g.fillStyle(0xcc2222, 1);
    g.fillRoundedRect(6, 8, 18, 16, 4);
    g.fillStyle(0x555555, 1);
    g.fillTriangle(8, 2, 6, 10, 12, 10);
    g.fillTriangle(22, 2, 18, 10, 24, 10);
    g.fillStyle(0xbb2222, 1);
    g.fillRoundedRect(4, 14, 12, 8, 3);
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(6, 16, 1.5);
    g.fillCircle(12, 16, 1.5);
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(10, 12, 3);
    g.fillCircle(20, 12, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(10, 12, 1.5);
    g.fillCircle(20, 12, 1.5);
    g.fillStyle(0xff4400, 0.5);
    g.fillCircle(2, 20, 2);
    g.fillStyle(0xffaa00, 0.4);
    g.fillCircle(0, 22, 1.5);
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 50, 36, 6);
    g.generateTexture("enemy_dragon", S, S);
    g.destroy();
  }

  // ========================
  // NPC GENERATOR
  // ========================
  generateNpcTexture(key: string, baseColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 48;
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(14, 16, 20, 26, 4);
    g.fillStyle(this.darken(baseColor, 30), 0.6);
    g.fillRect(16, 30, 16, 10);
    g.fillStyle(0x8b2252, 1);
    g.fillRect(16, 28, 16, 2);
    g.fillStyle(0xffe0bd, 1);
    g.fillRoundedRect(17, 4, 14, 14, 4);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRoundedRect(17, 3, 14, 5, 3);
    g.fillRect(17, 14, 4, 6);
    g.fillRect(27, 14, 4, 6);
    g.fillRect(20, 16, 8, 4);
    g.fillStyle(0x4466aa, 1);
    g.fillCircle(21, 9, 2);
    g.fillCircle(27, 9, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(21, 9, 1);
    g.fillCircle(27, 9, 1);
    g.fillStyle(this.darken(0xffe0bd, 50), 1);
    g.fillRect(22, 12, 4, 1);
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(24, 0, 6);
    g.fillStyle(0xffff00, 1);
    g.fillRect(23, -3, 2, 4);
    g.fillRect(23, 2, 2, 2);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(16, 40, 7, 4);
    g.fillRect(25, 40, 7, 4);
    g.generateTexture(key, S, S);
    g.destroy();
  }

  // ========================
  // OBJECTS
  // ========================
  generateProjectile() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xff8800, 0.3);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(8, 8, 4);
    g.fillStyle(0xffffaa, 1);
    g.fillCircle(8, 8, 2);
    g.generateTexture("projectile", 16, 16);
    g.destroy();
  }

  generatePortal() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 40;
    g.fillStyle(0x6622cc, 0.2);
    g.fillCircle(S / 2, S / 2, S / 2);
    g.lineStyle(3, 0x8844ff, 0.8);
    g.strokeCircle(S / 2, S / 2, 14);
    g.lineStyle(2, 0xaa66ff, 0.6);
    g.strokeCircle(S / 2, S / 2, 9);
    g.fillStyle(0xcc88ff, 0.5);
    g.fillCircle(S / 2, S / 2, 6);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(S / 2 - 5, S / 2 - 5, 1);
    g.fillCircle(S / 2 + 4, S / 2 - 3, 1);
    g.fillCircle(S / 2 + 2, S / 2 + 5, 1);
    g.generateTexture("portal", S, S);
    g.destroy();
  }

  generateItemDrop() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffdd44, 0.3);
    g.fillCircle(10, 10, 10);
    g.fillStyle(0xcc9944, 1);
    g.fillRoundedRect(4, 6, 12, 10, 3);
    g.fillStyle(0x886622, 1);
    g.fillRect(7, 5, 6, 2);
    g.fillStyle(0xffff88, 0.8);
    g.fillRect(14, 2, 2, 2);
    g.fillRect(3, 3, 1, 1);
    g.generateTexture("item_drop", 20, 20);
    g.destroy();
  }

  generateClickTarget() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(16, 16, 14);
    g.lineStyle(1, 0xffffff, 0.8);
    g.lineBetween(16, 4, 16, 28);
    g.lineBetween(4, 16, 28, 16);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 2);
    g.generateTexture("click_target", 32, 32);
    g.destroy();
  }

  // ========================
  // DECORATION GENERATORS
  // ========================
  generateDecorations() {
    this.genDecoTree();
    this.genDecoPine();
    this.genDecoBush();
    this.genDecoFlower(0xff4444, "deco_flower_red");
    this.genDecoFlower(0xffdd44, "deco_flower_yellow");
    this.genDecoFlower(0x6688ff, "deco_flower_blue");
    this.genDecoRock();
    this.genDecoBoulder();
    this.genDecoFountain();
    this.genDecoWell();
    this.genDecoFence();
    this.genDecoTorch();
    this.genDecoMushroom();
    this.genDecoBones();
    this.genDecoBarrel();
    this.genDecoCrate();
    this.genDecoBanner("deco_banner_red", 0xcc2222);
    this.genDecoBanner("deco_banner_blue", 0x2244cc);
    this.genDecoStump();
    this.genDecoHaystack();
    this.genDecoPillar();
  }

  genDecoTree() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillRect(12, 28, 8, 18);
    g.fillStyle(0x553311, 0.6);
    g.fillRect(14, 30, 2, 14);
    g.fillStyle(0x553311, 1);
    g.fillRect(9, 44, 4, 2);
    g.fillRect(19, 44, 4, 2);
    g.fillStyle(0x228833, 1);
    g.fillCircle(16, 18, 14);
    g.fillStyle(0x33aa44, 0.7);
    g.fillCircle(12, 14, 8);
    g.fillCircle(20, 16, 9);
    g.fillStyle(0x116622, 0.5);
    g.fillCircle(18, 22, 7);
    g.fillStyle(0x44cc55, 0.4);
    g.fillCircle(10, 12, 4);
    g.fillCircle(20, 10, 3);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(16, 46, 22, 4);
    g.generateTexture("deco_tree", 32, 48);
    g.destroy();
  }

  genDecoPine() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillRect(10, 34, 4, 14);
    g.fillStyle(0x1a5533, 1);
    g.fillTriangle(12, 6, 0, 34, 24, 34);
    g.fillStyle(0x227744, 0.8);
    g.fillTriangle(12, 2, 4, 22, 20, 22);
    g.fillStyle(0x2d8844, 0.7);
    g.fillTriangle(12, 0, 6, 14, 18, 14);
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(10, 0, 4, 2);
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(12, 47, 16, 3);
    g.generateTexture("deco_pine", 24, 48);
    g.destroy();
  }

  genDecoBush() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x337733, 1);
    g.fillEllipse(10, 10, 18, 14);
    g.fillStyle(0x449944, 0.7);
    g.fillEllipse(8, 8, 10, 8);
    g.fillStyle(0x226622, 0.5);
    g.fillEllipse(13, 12, 8, 6);
    g.fillStyle(0x55bb55, 0.3);
    g.fillCircle(6, 7, 3);
    g.generateTexture("deco_bush", 20, 16);
    g.destroy();
  }

  genDecoFlower(color: number, key: string) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x338833, 1);
    g.fillRect(4, 5, 2, 7);
    g.fillStyle(0x44aa44, 1);
    g.fillEllipse(7, 8, 4, 2);
    g.fillStyle(color, 1);
    g.fillCircle(3, 3, 2);
    g.fillCircle(7, 3, 2);
    g.fillCircle(5, 1, 2);
    g.fillCircle(5, 5, 2);
    g.fillStyle(0xffff88, 1);
    g.fillCircle(5, 3, 1.5);
    g.generateTexture(key, 10, 12);
    g.destroy();
  }

  genDecoRock() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x777777, 1);
    g.fillRoundedRect(1, 3, 14, 9, 3);
    g.fillStyle(0x999999, 0.6);
    g.fillRect(3, 3, 8, 3);
    g.fillStyle(0x555555, 0.4);
    g.fillRect(4, 9, 6, 2);
    g.generateTexture("deco_rock", 16, 14);
    g.destroy();
  }

  genDecoBoulder() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x666666, 1);
    g.fillRoundedRect(1, 4, 22, 14, 5);
    g.fillStyle(0x888888, 0.6);
    g.fillEllipse(10, 6, 14, 6);
    g.fillStyle(0x444444, 0.4);
    g.fillRect(6, 14, 10, 3);
    g.fillStyle(0x333333, 0.5);
    g.fillRect(8, 8, 6, 1);
    g.fillRect(12, 6, 1, 5);
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(12, 18, 18, 3);
    g.generateTexture("deco_boulder", 24, 20);
    g.destroy();
  }

  genDecoFountain() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 48;
    g.fillStyle(0x888888, 1);
    g.fillEllipse(S / 2, S / 2 + 6, 40, 20);
    g.fillStyle(0x999999, 0.7);
    g.fillEllipse(S / 2, S / 2 + 4, 36, 16);
    g.fillStyle(0x3366cc, 0.6);
    g.fillEllipse(S / 2, S / 2 + 4, 30, 12);
    g.fillStyle(0x4488ee, 0.4);
    g.fillEllipse(S / 2, S / 2 + 2, 20, 8);
    g.fillStyle(0x777777, 1);
    g.fillRect(21, 10, 6, 20);
    g.fillStyle(0x999999, 0.6);
    g.fillRect(23, 11, 2, 18);
    g.fillStyle(0x888888, 1);
    g.fillEllipse(S / 2, 10, 14, 6);
    g.fillStyle(0x88bbff, 0.5);
    g.fillCircle(S / 2 - 3, 6, 2);
    g.fillCircle(S / 2 + 3, 6, 2);
    g.fillCircle(S / 2, 4, 2);
    g.fillStyle(0xaaddff, 0.3);
    g.fillCircle(S / 2, 2, 1);
    g.generateTexture("deco_fountain", S, S);
    g.destroy();
  }

  genDecoWell() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x777777, 1);
    g.fillEllipse(16, 28, 28, 14);
    g.fillStyle(0x666666, 1);
    g.fillRect(4, 18, 24, 10);
    g.fillStyle(0x888888, 0.5);
    g.fillEllipse(16, 18, 24, 10);
    g.fillStyle(0x223366, 0.7);
    g.fillEllipse(16, 20, 16, 6);
    g.fillStyle(0x664422, 1);
    g.fillRect(6, 6, 3, 22);
    g.fillRect(23, 6, 3, 22);
    g.fillRect(6, 6, 20, 3);
    g.fillStyle(0xaa9966, 1);
    g.fillRect(15, 6, 2, 10);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(13, 14, 6, 4);
    g.generateTexture("deco_well", 32, 36);
    g.destroy();
  }

  genDecoFence() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8b6914, 1);
    g.fillRect(2, 2, 3, 16);
    g.fillRect(14, 2, 3, 16);
    g.fillRect(27, 2, 3, 16);
    g.fillStyle(0x9b7924, 1);
    g.fillRect(2, 5, 28, 2);
    g.fillRect(2, 12, 28, 2);
    g.fillStyle(0xab8934, 0.6);
    g.fillRect(2, 1, 3, 2);
    g.fillRect(14, 1, 3, 2);
    g.fillRect(27, 1, 3, 2);
    g.generateTexture("deco_fence", 32, 20);
    g.destroy();
  }

  genDecoTorch() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillRect(4, 10, 4, 14);
    g.fillStyle(0x555555, 1);
    g.fillRect(3, 12, 6, 2);
    g.fillStyle(0xff6600, 0.3);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xff8800, 0.9);
    g.fillTriangle(6, 2, 2, 10, 10, 10);
    g.fillStyle(0xffcc00, 0.8);
    g.fillTriangle(6, 4, 4, 9, 8, 9);
    g.fillStyle(0xffffaa, 0.6);
    g.fillCircle(6, 7, 2);
    g.generateTexture("deco_torch", 12, 24);
    g.destroy();
  }

  genDecoMushroom() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xddddbb, 1);
    g.fillRect(4, 7, 4, 5);
    g.fillStyle(0xcc2222, 1);
    g.fillEllipse(6, 5, 11, 8);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(4, 4, 1.5);
    g.fillCircle(8, 3, 1);
    g.fillCircle(6, 6, 1);
    g.generateTexture("deco_mushroom", 12, 14);
    g.destroy();
  }

  genDecoBones() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xccccbb, 1);
    g.fillRect(2, 6, 10, 2);
    g.fillCircle(2, 7, 2);
    g.fillCircle(12, 7, 2);
    g.fillRect(6, 2, 2, 10);
    g.fillCircle(7, 2, 2);
    g.fillCircle(7, 12, 2);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(15, 5, 4);
    g.fillStyle(0x111111, 1);
    g.fillCircle(14, 4, 1);
    g.fillCircle(17, 4, 1);
    g.fillRect(14, 7, 3, 1);
    g.generateTexture("deco_bones", 20, 14);
    g.destroy();
  }

  genDecoBarrel() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8b5a2b, 1);
    g.fillRoundedRect(1, 2, 16, 20, 3);
    g.fillStyle(0x7a4a1b, 0.5);
    g.fillRect(3, 4, 12, 1);
    g.fillRect(3, 8, 12, 1);
    g.fillRect(3, 12, 12, 1);
    g.fillRect(3, 16, 12, 1);
    g.fillStyle(0x888888, 1);
    g.fillRect(1, 6, 16, 2);
    g.fillRect(1, 14, 16, 2);
    g.fillStyle(0x9b6a3b, 0.8);
    g.fillEllipse(9, 2, 14, 4);
    g.generateTexture("deco_barrel", 18, 24);
    g.destroy();
  }

  genDecoCrate() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8b6914, 1);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x7a5804, 0.4);
    g.fillRect(0, 3, 16, 1);
    g.fillRect(0, 7, 16, 1);
    g.fillRect(0, 11, 16, 1);
    g.fillStyle(0x664422, 1);
    g.fillRect(0, 7, 16, 2);
    g.fillRect(7, 0, 2, 16);
    g.fillStyle(0x9b7924, 0.4);
    g.fillRect(1, 1, 6, 6);
    g.generateTexture("deco_crate", 16, 16);
    g.destroy();
  }

  genDecoBanner(key: string, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x888888, 1);
    g.fillRect(7, 0, 2, 32);
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(8, 0, 1, 32);
    g.fillStyle(0xddaa22, 1);
    g.fillCircle(8, 1, 2);
    g.fillStyle(color, 1);
    g.fillRect(0, 3, 7, 18);
    g.fillStyle(this.lighten(color, 30), 0.4);
    g.fillRect(1, 4, 5, 4);
    g.fillStyle(0xddaa22, 1);
    g.fillRect(2, 9, 3, 3);
    g.fillStyle(color, 0.8);
    g.fillTriangle(0, 21, 3, 24, 7, 21);
    g.generateTexture(key, 16, 32);
    g.destroy();
  }

  genDecoStump() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillEllipse(10, 12, 18, 10);
    g.fillStyle(0x8b6914, 1);
    g.fillEllipse(10, 8, 18, 10);
    g.fillStyle(0x775522, 0.5);
    g.fillCircle(10, 8, 6);
    g.fillStyle(0x8b6914, 0.6);
    g.fillCircle(10, 8, 4);
    g.fillStyle(0x997733, 0.4);
    g.fillCircle(10, 8, 2);
    g.generateTexture("deco_stump", 20, 18);
    g.destroy();
  }

  genDecoHaystack() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xccaa44, 1);
    g.fillRoundedRect(1, 4, 18, 12, 4);
    g.fillStyle(0xddbb55, 0.7);
    g.fillEllipse(10, 4, 16, 6);
    g.fillStyle(0xbbaa33, 0.5);
    g.fillRect(3, 8, 14, 1);
    g.fillRect(3, 11, 14, 1);
    g.fillStyle(0xddcc66, 0.6);
    g.fillRect(0, 6, 2, 1);
    g.fillRect(18, 8, 2, 1);
    g.fillRect(8, 2, 1, 3);
    g.generateTexture("deco_haystack", 20, 18);
    g.destroy();
  }

  genDecoPillar() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x777777, 1);
    g.fillRect(2, 36, 12, 4);
    g.fillStyle(0x888888, 1);
    g.fillRect(4, 4, 8, 32);
    g.fillStyle(0x999999, 0.5);
    g.fillRect(5, 5, 3, 30);
    g.fillStyle(0x666666, 0.3);
    g.fillRect(9, 5, 2, 30);
    g.fillStyle(0x999999, 1);
    g.fillRect(2, 2, 12, 4);
    g.fillStyle(0xaaaaaa, 0.6);
    g.fillRect(3, 1, 10, 2);
    g.generateTexture("deco_pillar", 16, 40);
    g.destroy();
  }

  // ========================
  // TILE GENERATOR (32x32)
  // ========================
  generateDetailedTile(key: string, color1: number, color2: number, type: string) {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 32;

    g.fillStyle(color1, 1);
    g.fillRect(0, 0, S, S);

    switch (type) {
      case "grass":
        g.fillStyle(color2, 0.6);
        for (let i = 0; i < 12; i++) {
          const gx = Math.floor(Math.random() * 28) + 2;
          const gy = Math.floor(Math.random() * 28) + 2;
          g.fillRect(gx, gy, 1, 3);
        }
        g.fillStyle(this.lighten(color1, 15), 0.4);
        for (let i = 0; i < 4; i++) {
          const px = Math.floor(Math.random() * 24) + 4;
          const py = Math.floor(Math.random() * 24) + 4;
          g.fillCircle(px, py, 3);
        }
        break;
      case "dirt":
        g.fillStyle(color2, 0.7);
        for (let i = 0; i < 5; i++) {
          const dx = Math.floor(Math.random() * 26) + 3;
          const dy = Math.floor(Math.random() * 26) + 3;
          g.fillCircle(dx, dy, 1 + Math.random());
        }
        g.fillStyle(this.darken(color1, 20), 0.5);
        g.fillRect(8, 12, 6, 1);
        g.fillRect(18, 20, 8, 1);
        break;
      case "stone":
        g.lineStyle(1, this.darken(color1, 25), 0.5);
        g.strokeRect(0, 0, 16, 16);
        g.strokeRect(16, 0, 16, 16);
        g.strokeRect(8, 16, 16, 16);
        g.fillStyle(0x446644, 0.3);
        g.fillCircle(6, 24, 2);
        g.fillCircle(26, 8, 2);
        break;
      case "water":
        g.fillStyle(this.lighten(color1, 20), 0.4);
        for (let i = 0; i < 3; i++) {
          const wy = 6 + i * 10;
          g.fillEllipse(16, wy, 24, 3);
        }
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(10, 8, 2, 1);
        g.fillRect(22, 18, 2, 1);
        break;
      case "dark":
        g.fillStyle(color2, 0.5);
        for (let i = 0; i < 8; i++) {
          const dx = Math.floor(Math.random() * 28) + 2;
          const dy = Math.floor(Math.random() * 28) + 2;
          g.fillRect(dx, dy, 2, 2);
        }
        g.fillStyle(0x440044, 0.3);
        g.fillCircle(8, 24, 3);
        break;
      case "arena":
        g.fillStyle(this.lighten(color1, 20), 0.4);
        g.fillRect(0, 15, 32, 2);
        g.fillRect(15, 0, 2, 32);
        g.fillStyle(0xffcc00, 0.3);
        g.fillRect(0, 0, 4, 4);
        g.fillRect(28, 0, 4, 4);
        g.fillRect(0, 28, 4, 4);
        g.fillRect(28, 28, 4, 4);
        break;
      case "wall":
        g.lineStyle(1, this.darken(color1, 20), 0.6);
        g.strokeRect(0, 0, 16, 8);
        g.strokeRect(16, 0, 16, 8);
        g.strokeRect(8, 8, 16, 8);
        g.strokeRect(0, 16, 16, 8);
        g.strokeRect(16, 16, 16, 8);
        g.strokeRect(8, 24, 16, 8);
        break;
      case "wood":
        g.fillStyle(this.darken(color1, 15), 0.5);
        for (let i = 0; i < 6; i++) {
          g.fillRect(0, i * 5 + 2, 32, 1);
        }
        g.fillStyle(this.darken(color1, 25), 0.6);
        g.fillCircle(12, 16, 3);
        g.fillCircle(24, 8, 2);
        break;
      case "sand":
        g.fillStyle(color2, 0.4);
        for (let i = 0; i < 10; i++) {
          g.fillRect(Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 30) + 1, 1, 1);
        }
        g.fillStyle(this.lighten(color1, 10), 0.3);
        g.fillEllipse(16, 20, 20, 6);
        break;
      case "path":
        g.fillStyle(this.darken(color1, 10), 0.6);
        g.fillRoundedRect(1, 1, 14, 14, 2);
        g.fillRoundedRect(17, 1, 14, 14, 2);
        g.fillRoundedRect(9, 17, 14, 14, 2);
        g.fillStyle(this.lighten(color1, 15), 0.3);
        g.fillRect(3, 3, 4, 4);
        g.fillRect(19, 19, 4, 4);
        g.fillStyle(this.darken(color1, 25), 0.3);
        g.fillRect(0, 15, 32, 1);
        g.fillRect(15, 0, 1, 32);
        break;
    }

    g.generateTexture(key, S, S);
    g.destroy();
  }

  // ========================
  // ANIMATION DEFINITIONS
  // ========================
  createAnimations() {
    const heroes = [
      "player_swordsman", "player_mage", "player_archer",
      "player_lancer", "remote_player",
    ];
    const dirs = ["down", "up", "left"];

    for (const hero of heroes) {
      for (const dir of dirs) {
        this.anims.create({
          key: `${hero}_walk_${dir}`,
          frames: [
            { key: `${hero}_${dir}_0` },
            { key: `${hero}_${dir}_1` },
            { key: `${hero}_${dir}_0` },
            { key: `${hero}_${dir}_2` },
          ],
          frameRate: 8,
          repeat: -1,
        });
      }
    }
  }

  create() {
    this.createAnimations();
    this.scene.start("WorldScene");
  }
}
