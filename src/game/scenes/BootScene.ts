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
    // TILES (32x32) — painted style via Canvas 2D API
    // ========================
    this.generatePaintedTile("tile_grass", "grass");
    this.generatePaintedTile("tile_grass_dark", "grass_dark");
    this.generatePaintedTile("tile_grass_lush", "grass_lush");
    this.generatePaintedTile("tile_dirt", "dirt");
    this.generatePaintedTile("tile_dirt_dark", "dirt_dark");
    this.generatePaintedTile("tile_stone", "stone");
    this.generatePaintedTile("tile_stone_mossy", "stone_mossy");
    this.generatePaintedTile("tile_water", "water");
    this.generatePaintedTile("tile_water_deep", "water_deep");
    this.generatePaintedTile("tile_sand", "sand");
    this.generatePaintedTile("tile_dark", "dark");
    this.generatePaintedTile("tile_lava", "lava");
    this.generatePaintedTile("tile_swamp", "swamp");
    this.generatePaintedTile("tile_cobble", "cobble");
    this.generatePaintedTile("tile_snow", "snow");
    this.generatePaintedTile("tile_arena", "arena");
    this.generatePaintedTile("tile_wall", "wall");
    this.generatePaintedTile("tile_wood", "wood");
    this.generatePaintedTile("tile_path", "path");
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
  // FRONT VIEW (DOWN) - Ultra-detailed with walk animation
  // ========================
  drawHeroFront(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const ll = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const rl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const la = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const ra = frame === 2 ? 1 : frame === 1 ? -1 : 0;

    // Ground shadow (elliptical, soft)
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(24, 45, 22, 5);
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(24, 45, 26, 7);

    // Cape (rendered behind body)
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 0.85);
      g.fillRoundedRect(13, 18 + bob, 22, 25, 4);
      g.fillStyle(this.darken(cfg.cape, 25), 0.5);
      g.fillRect(15, 26 + bob, 18, 14);
      // Cape fold lines
      g.fillStyle(this.darken(cfg.cape, 40), 0.3);
      g.fillRect(19, 22 + bob, 1, 18);
      g.fillRect(28, 22 + bob, 1, 18);
      // Cape bottom tatter
      g.fillStyle(cfg.cape, 0.6);
      g.fillRect(14, 41 + bob, 3, 2);
      g.fillRect(31, 41 + bob, 3, 2);
    }

    // Legs with muscle definition
    g.fillStyle(cfg.pants, 1);
    g.fillRect(17, 34 + ll, 6, 8);
    g.fillRect(25, 34 + rl, 6, 8);
    // Knee highlight
    g.fillStyle(this.lighten(cfg.pants, 15), 0.4);
    g.fillRect(18, 35 + ll, 3, 2);
    g.fillRect(26, 35 + rl, 3, 2);
    // Inner leg shadow
    g.fillStyle(this.darken(cfg.pants, 20), 0.4);
    g.fillRect(22, 36 + ll, 1, 5);
    g.fillRect(25, 36 + rl, 1, 5);
    // Boots with detail
    g.fillStyle(cfg.boots, 1);
    g.fillRect(16, 40 + ll, 7, 4);
    g.fillRect(25, 40 + rl, 7, 4);
    // Boot toe cap
    g.fillStyle(this.lighten(cfg.boots, 15), 0.5);
    g.fillRect(16, 40 + ll, 3, 1);
    g.fillRect(25, 40 + rl, 3, 1);
    // Boot sole
    g.fillStyle(this.darken(cfg.boots, 30), 1);
    g.fillRect(16, 43 + ll, 7, 1);
    g.fillRect(25, 43 + rl, 7, 1);
    // Boot strap
    g.fillStyle(this.darken(cfg.boots, 15), 0.7);
    g.fillRect(16, 41 + ll, 7, 1);
    g.fillRect(25, 41 + rl, 7, 1);
    // Boot buckle
    g.fillStyle(0xdaa520, 0.8);
    g.fillRect(18, 41 + ll, 2, 1);
    g.fillRect(28, 41 + rl, 2, 1);

    // Body / Armor — layered with rich detail
    g.fillStyle(cfg.armor, 1);
    g.fillRoundedRect(15, 18 + bob, 18, 17, 2);
    // Chest plate gradient
    g.fillStyle(cfg.armorLight, 0.6);
    g.fillRect(16, 19 + bob, 16, 4);
    // Central chest line
    g.fillStyle(cfg.armorDark, 0.3);
    g.fillRect(23, 19 + bob, 2, 12);
    // Side armor panels
    g.fillStyle(cfg.armorDark, 0.4);
    g.fillRect(16, 25 + bob, 4, 6);
    g.fillRect(28, 25 + bob, 4, 6);
    // Chest emblem (ornate diamond)
    g.fillStyle(0xdaa520, 0.8);
    g.fillRect(23, 22 + bob, 2, 2);
    g.fillRect(22, 23 + bob, 4, 2);
    g.fillRect(23, 25 + bob, 2, 2);
    // Abdominal armor segments
    g.fillStyle(cfg.armorDark, 0.5);
    g.fillRect(17, 30 + bob, 14, 1);
    g.fillRect(17, 28 + bob, 14, 1);
    // Armor edge highlight (specular)
    g.fillStyle(this.lighten(cfg.armorLight, 30), 0.35);
    g.fillRect(16, 18 + bob, 16, 1);
    // Belt with ornate buckle
    g.fillStyle(0x6b4226, 1);
    g.fillRect(15, 33 + bob, 18, 2);
    g.fillStyle(0xdaa520, 1);
    g.fillRect(22, 33 + bob, 4, 2);
    // Belt pouch (left)
    g.fillStyle(0x5a3a1a, 0.9);
    g.fillRect(15, 31 + bob, 4, 3);
    g.fillStyle(0xdaa520, 0.6);
    g.fillRect(16, 31 + bob, 2, 1);
    // Shoulder pads
    g.fillStyle(cfg.armorLight, 1);
    g.fillEllipse(16, 20 + bob, 8, 7);
    g.fillEllipse(32, 20 + bob, 8, 7);
    // Shoulder pad edge
    g.fillStyle(this.darken(cfg.armorLight, 25), 0.6);
    g.fillEllipse(16, 22 + bob, 7, 3);
    g.fillEllipse(32, 22 + bob, 7, 3);
    // Shoulder rivets
    g.fillStyle(0xdaa520, 0.7);
    g.fillCircle(16, 19 + bob, 1);
    g.fillCircle(32, 19 + bob, 1);

    // Arms with detail
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 21 + bob + la, 4, 10);
    g.fillRect(32, 21 + bob + ra, 4, 10);
    // Arm muscle highlight
    g.fillStyle(this.lighten(cfg.skin, 15), 0.4);
    g.fillRect(12, 22 + bob + la, 2, 4);
    g.fillRect(34, 22 + bob + ra, 2, 4);
    // Bracers/gauntlets
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(11, 27 + bob + la, 5, 5);
    g.fillRect(32, 27 + bob + ra, 5, 5);
    // Bracer detail
    g.fillStyle(this.lighten(cfg.armorDark, 25), 0.5);
    g.fillRect(12, 28 + bob + la, 3, 1);
    g.fillRect(33, 28 + bob + ra, 3, 1);
    g.fillRect(12, 30 + bob + la, 3, 1);
    g.fillRect(33, 30 + bob + ra, 3, 1);
    // Hands
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 31 + bob + la, 3, 2);
    g.fillRect(33, 31 + bob + ra, 3, 2);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(21, 14 + bob, 6, 5);
    // Neck shadow
    g.fillStyle(this.darken(cfg.skin, 20), 0.3);
    g.fillRect(21, 17 + bob, 6, 2);

    // Head — detailed face
    g.fillStyle(cfg.skin, 1);
    g.fillRoundedRect(17, 4 + bob, 14, 14, 5);
    // Cheek blush
    g.fillStyle(0xff9999, 0.1);
    g.fillCircle(19, 12 + bob, 2);
    g.fillCircle(29, 12 + bob, 2);
    // Jaw shadow
    g.fillStyle(this.darken(cfg.skin, 15), 0.3);
    g.fillRect(18, 14 + bob, 12, 2);
    // Hair — detailed with strands
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(16, 2 + bob, 16, 8, 4);
    g.fillRect(16, 4 + bob, 2, 9);
    g.fillRect(30, 4 + bob, 2, 9);
    // Hair highlight
    g.fillStyle(this.lighten(cfg.hair, 25), 0.4);
    g.fillRect(20, 3 + bob, 4, 2);
    // Hair strand detail
    g.fillStyle(this.darken(cfg.hair, 15), 0.4);
    g.fillRect(22, 4 + bob, 1, 5);
    g.fillRect(26, 4 + bob, 1, 5);
    // Eyes — expressive with iris detail
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(19, 8 + bob, 4, 4, 1);
    g.fillRoundedRect(25, 8 + bob, 4, 4, 1);
    // Iris color
    g.fillStyle(0x4488cc, 1);
    g.fillRect(20, 9 + bob, 3, 3);
    g.fillRect(26, 9 + bob, 3, 3);
    // Pupil
    g.fillStyle(0x111111, 1);
    g.fillRect(21, 10 + bob, 2, 2);
    g.fillRect(27, 10 + bob, 2, 2);
    // Eye shine
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(22, 9 + bob, 1, 1);
    g.fillRect(28, 9 + bob, 1, 1);
    // Eyelids
    g.fillStyle(this.darken(cfg.skin, 25), 0.5);
    g.fillRect(19, 8 + bob, 4, 1);
    g.fillRect(25, 8 + bob, 4, 1);
    // Eyebrows
    g.fillStyle(this.darken(cfg.hair, 20), 1);
    g.fillRect(19, 7 + bob, 4, 1);
    g.fillRect(25, 7 + bob, 4, 1);
    // Nose with bridge highlight
    g.fillStyle(this.darken(cfg.skin, 18), 1);
    g.fillRect(23, 11 + bob, 2, 3);
    g.fillStyle(this.lighten(cfg.skin, 10), 0.5);
    g.fillRect(23, 11 + bob, 1, 2);
    // Mouth with lip detail
    g.fillStyle(this.darken(cfg.skin, 35), 1);
    g.fillRect(22, 15 + bob, 4, 1);
    g.fillStyle(this.darken(cfg.skin, 10), 0.5);
    g.fillRect(22, 14 + bob, 4, 1);
    // Ears
    g.fillStyle(this.darken(cfg.skin, 12), 1);
    g.fillRect(16, 9 + bob, 2, 4);
    g.fillRect(30, 9 + bob, 2, 4);
    // Inner ear
    g.fillStyle(this.darken(cfg.skin, 25), 0.5);
    g.fillRect(16, 10 + bob, 1, 2);
    g.fillRect(31, 10 + bob, 1, 2);

    // --- CLASS GEAR (enhanced) ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(15, 1 + bob, 18, 11, 4);
      // Helmet visor
      g.fillStyle(this.darken(cfg.helmetColor, 30), 1);
      g.fillRect(18, 9 + bob, 12, 2);
      // Helmet top highlight
      g.fillStyle(this.lighten(cfg.helmetColor, 40), 0.5);
      g.fillRect(18, 2 + bob, 12, 2);
      // Helmet rivets
      g.fillStyle(this.lighten(cfg.helmetColor, 25), 0.8);
      g.fillCircle(18, 5 + bob, 0.5);
      g.fillCircle(30, 5 + bob, 0.5);
      g.fillCircle(24, 2 + bob, 0.5);
      // Plume
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, -2 + bob, 4, 4);
      g.fillStyle(0xee4444, 0.7);
      g.fillRect(23, -3 + bob, 2, 2);
      g.fillStyle(0xaa1111, 0.6);
      g.fillRect(22, 1 + bob, 4, 1);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(24, -5 + bob, 12, 10 + bob, 36, 10 + bob);
      // Hat brim
      g.fillStyle(this.darken(cfg.hatColor, 15), 0.8);
      g.fillRect(12, 8 + bob, 24, 3);
      // Hat band
      g.fillStyle(this.lighten(cfg.hatColor, 40), 0.6);
      g.fillRect(17, 6 + bob, 14, 2);
      // Star ornament
      g.fillStyle(0xffdd44, 1);
      g.fillRect(22, 1 + bob, 3, 3);
      g.fillStyle(0xffee88, 0.6);
      g.fillRect(23, 0 + bob, 1, 5);
      g.fillRect(21, 2 + bob, 5, 1);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(14, 0 + bob, 20, 15, 6);
      g.fillStyle(this.darken(cfg.hoodColor, 25), 0.5);
      g.fillRect(17, 8 + bob, 14, 4);
      // Hood seam
      g.fillStyle(this.darken(cfg.hoodColor, 40), 0.3);
      g.fillRect(23, 1 + bob, 2, 12);
    }
    if (cfg.hasSword) {
      // Ornate sword
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 22 + bob + la, 2, 7);
      // Crossguard with gold ends
      g.fillStyle(0xdaa520, 1);
      g.fillRect(5, 21 + bob + la, 8, 2);
      g.fillStyle(0xffd700, 0.6);
      g.fillRect(5, 21 + bob + la, 2, 2);
      g.fillRect(11, 21 + bob + la, 2, 2);
      // Pommel
      g.fillStyle(0xdaa520, 1);
      g.fillCircle(9, 30 + bob + la, 1.5);
      // Blade with fuller
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(7, 8 + bob + la, 4, 14);
      // Blade edge highlight
      g.fillStyle(this.lighten(cfg.weapon, 50), 0.7);
      g.fillRect(10, 9 + bob + la, 1, 12);
      // Blade center fuller
      g.fillStyle(this.darken(cfg.weapon, 20), 0.4);
      g.fillRect(8, 10 + bob + la, 1, 10);
      // Tip
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(9, 5 + bob + la, 7, 8 + bob + la, 11, 8 + bob + la);
    }
    if (cfg.hasShield) {
      // Ornate kite shield
      g.fillStyle(cfg.armorDark, 1);
      g.fillRoundedRect(34, 19 + bob + ra, 12, 14, 3);
      // Shield face
      g.fillStyle(cfg.armorLight, 0.8);
      g.fillRect(36, 21 + bob + ra, 8, 10);
      // Shield boss
      g.fillStyle(0xdaa520, 1);
      g.fillCircle(40, 26 + bob + ra, 2);
      g.fillStyle(0xffd700, 0.6);
      g.fillCircle(40, 26 + bob + ra, 1);
      // Shield border
      g.fillStyle(0xdaa520, 0.6);
      g.fillRect(35, 19 + bob + ra, 1, 14);
      g.fillRect(45, 19 + bob + ra, 1, 14);
      g.fillRect(35, 19 + bob + ra, 11, 1);
      // Shield cross emblem
      g.fillStyle(cfg.armor, 0.6);
      g.fillRect(39, 22 + bob + ra, 2, 8);
      g.fillRect(37, 25 + bob + ra, 6, 2);
    }
    if (cfg.hasStaff) {
      // Gnarled staff
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(7, 6 + bob + la, 3, 36);
      // Staff wood grain
      g.fillStyle(this.darken(cfg.weaponHandle, 20), 0.4);
      g.fillRect(8, 10 + bob + la, 1, 30);
      // Staff wrapping
      g.fillStyle(0xdaa520, 0.6);
      g.fillRect(7, 18 + bob + la, 3, 1);
      g.fillRect(7, 22 + bob + la, 3, 1);
      // Crystal orb
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.4);
      g.fillCircle(8, 5 + bob + la, 6);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.9);
      g.fillCircle(8, 5 + bob + la, 4);
      // Orb inner glow
      g.fillStyle(this.lighten(cfg.orbColor || 0x44ddff, 50), 0.6);
      g.fillCircle(7, 3 + bob + la, 2);
      // Orb sparkle
      g.fillStyle(0xffffff, 0.8);
      g.fillRect(6, 3 + bob + la, 1, 1);
      // Magic particles
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.3);
      g.fillCircle(4, 2 + bob + la, 1);
      g.fillCircle(12, 4 + bob + la, 1);
      g.fillCircle(6, 8 + bob + la, 0.5);
    }
    if (cfg.hasOrb) {
      g.fillStyle(cfg.orbColor, 0.3);
      g.fillCircle(38, 16 + bob + ra, 7);
      g.fillStyle(cfg.orbColor, 0.7);
      g.fillCircle(38, 16 + bob + ra, 5);
      g.fillStyle(this.lighten(cfg.orbColor, 50), 0.5);
      g.fillCircle(36, 14 + bob + ra, 2);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(36, 13 + bob + ra, 1, 1);
    }
    if (cfg.hasBow) {
      // Detailed longbow
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(6, 12 + bob + la, 3, 22);
      // Bow curve (top and bottom)
      g.fillStyle(this.lighten(cfg.weapon, 20), 0.8);
      g.fillRect(4, 12 + bob + la, 3, 2);
      g.fillRect(4, 32 + bob + la, 3, 2);
      // Bow tips
      g.fillStyle(0xdaa520, 0.8);
      g.fillRect(5, 11 + bob + la, 1, 2);
      g.fillRect(5, 33 + bob + la, 1, 2);
      // Bowstring
      g.fillStyle(0xcccccc, 0.9);
      g.fillRect(9, 13 + bob + la, 1, 20);
      // Grip wrapping
      g.fillStyle(0x664422, 0.8);
      g.fillRect(6, 21 + bob + la, 3, 4);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x7a4a1b, 1);
      g.fillRect(33, 13 + bob, 6, 18);
      // Quiver lip
      g.fillStyle(0x5a3a15, 1);
      g.fillRect(33, 13 + bob, 6, 2);
      // Arrows
      g.fillStyle(0xcccccc, 1);
      g.fillRect(34, 10 + bob, 1, 5);
      g.fillRect(36, 11 + bob, 1, 4);
      g.fillRect(38, 10 + bob, 1, 5);
      // Arrow feathers
      g.fillStyle(0xcc4444, 0.7);
      g.fillRect(34, 10 + bob, 1, 2);
      g.fillRect(38, 10 + bob, 1, 2);
    }
    if (cfg.hasLance) {
      // Ornate lance
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(7, -2 + bob + la, 3, 44);
      // Shaft wrapping
      g.fillStyle(0xdaa520, 0.5);
      g.fillRect(7, 20 + bob + la, 3, 1);
      g.fillRect(7, 24 + bob + la, 3, 1);
      // Lance head
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(8, -8 + bob + la, 4, 0 + bob + la, 13, 0 + bob + la);
      // Lance head highlight
      g.fillStyle(this.lighten(cfg.weapon, 50), 0.6);
      g.fillRect(8, -6 + bob + la, 1, 5);
      // Pennant
      g.fillStyle(0xcc2222, 0.8);
      g.fillTriangle(10, 0 + bob + la, 10, 6 + bob + la, 16, 3 + bob + la);
    }
  }

  // ========================
  // BACK VIEW (UP) - Ultra-detailed walk animation
  // ========================
  drawHeroBack(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const ll = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const rl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const la = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const ra = frame === 2 ? 1 : frame === 1 ? -1 : 0;

    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(24, 45, 22, 5);

    // Legs
    g.fillStyle(this.darken(cfg.pants, 8), 1);
    g.fillRect(17, 34 + ll, 6, 8);
    g.fillRect(25, 34 + rl, 6, 8);
    // Leg seam
    g.fillStyle(this.darken(cfg.pants, 25), 0.3);
    g.fillRect(20, 35 + ll, 1, 6);
    g.fillRect(28, 35 + rl, 1, 6);
    // Boots
    g.fillStyle(this.darken(cfg.boots, 8), 1);
    g.fillRect(16, 40 + ll, 7, 4);
    g.fillRect(25, 40 + rl, 7, 4);
    g.fillStyle(this.darken(cfg.boots, 30), 1);
    g.fillRect(16, 43 + ll, 7, 1);
    g.fillRect(25, 43 + rl, 7, 1);
    // Boot strap
    g.fillStyle(this.darken(cfg.boots, 15), 0.6);
    g.fillRect(16, 41 + ll, 7, 1);
    g.fillRect(25, 41 + rl, 7, 1);

    // Body (back view, slightly darker)
    g.fillStyle(this.darken(cfg.armor, 8), 1);
    g.fillRoundedRect(15, 18 + bob, 18, 17, 2);
    // Back armor panels
    g.fillStyle(cfg.armorDark, 0.4);
    g.fillRect(16, 19 + bob, 16, 14);
    // Spine detail
    g.fillStyle(cfg.armorLight, 0.2);
    g.fillRect(23, 20 + bob, 2, 12);
    // Horizontal back plates
    g.fillStyle(cfg.armorDark, 0.3);
    g.fillRect(17, 22 + bob, 14, 1);
    g.fillRect(17, 26 + bob, 14, 1);
    g.fillRect(17, 30 + bob, 14, 1);
    // Belt
    g.fillStyle(0x6b4226, 1);
    g.fillRect(15, 33 + bob, 18, 2);
    // Shoulder pads (back view)
    g.fillStyle(cfg.armorLight, 0.9);
    g.fillEllipse(16, 20 + bob, 8, 7);
    g.fillEllipse(32, 20 + bob, 8, 7);
    g.fillStyle(this.darken(cfg.armorLight, 20), 0.5);
    g.fillEllipse(16, 22 + bob, 7, 3);
    g.fillEllipse(32, 22 + bob, 7, 3);

    // Cape (prominent from behind)
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 1);
      g.fillRoundedRect(14, 19 + bob, 20, 24, 4);
      // Cape fold lines
      g.fillStyle(this.darken(cfg.cape, 20), 0.35);
      g.fillRect(19, 22 + bob, 1, 20);
      g.fillRect(28, 22 + bob, 1, 20);
      // Cape highlight center
      g.fillStyle(this.lighten(cfg.cape, 15), 0.25);
      g.fillRect(23, 20 + bob, 2, 22);
      // Cape emblem
      g.fillStyle(this.lighten(cfg.cape, 30), 0.4);
      g.fillCircle(24, 30 + bob, 3);
      // Cape wave effect on walk
      if (frame === 1) {
        g.fillStyle(this.darken(cfg.cape, 15), 0.3);
        g.fillRect(14, 38 + bob, 5, 4);
      } else if (frame === 2) {
        g.fillStyle(this.darken(cfg.cape, 15), 0.3);
        g.fillRect(29, 38 + bob, 5, 4);
      }
      // Cape bottom tatter
      g.fillStyle(cfg.cape, 0.5);
      g.fillRect(15, 42 + bob, 3, 1);
      g.fillRect(30, 42 + bob, 3, 1);
    }

    // Arms
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 21 + bob + la, 4, 10);
    g.fillRect(32, 21 + bob + ra, 4, 10);
    // Bracers
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(11, 27 + bob + la, 5, 5);
    g.fillRect(32, 27 + bob + ra, 5, 5);
    g.fillStyle(this.lighten(cfg.armorDark, 20), 0.4);
    g.fillRect(12, 29 + bob + la, 3, 1);
    g.fillRect(33, 29 + bob + ra, 3, 1);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(21, 14 + bob, 6, 5);
    // Head (back)
    g.fillRoundedRect(17, 4 + bob, 14, 14, 5);
    // Hair covers back of head completely
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(16, 2 + bob, 16, 16, 5);
    // Hair shading/texture
    g.fillStyle(this.darken(cfg.hair, 12), 0.4);
    g.fillRect(18, 8 + bob, 12, 8);
    // Hair strand lines
    g.fillStyle(this.darken(cfg.hair, 25), 0.25);
    g.fillRect(20, 4 + bob, 1, 12);
    g.fillRect(24, 4 + bob, 1, 12);
    g.fillRect(28, 4 + bob, 1, 12);
    // Hair highlight
    g.fillStyle(this.lighten(cfg.hair, 20), 0.3);
    g.fillRect(21, 3 + bob, 6, 2);

    // --- GEAR FROM BACK ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(15, 1 + bob, 18, 13, 4);
      g.fillStyle(this.darken(cfg.helmetColor, 20), 0.4);
      g.fillRect(17, 6 + bob, 14, 7);
      // Helmet rivets back
      g.fillStyle(this.lighten(cfg.helmetColor, 20), 0.6);
      g.fillCircle(18, 5 + bob, 0.5);
      g.fillCircle(30, 5 + bob, 0.5);
      // Plume
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, -2 + bob, 4, 4);
      g.fillStyle(0xaa1111, 0.5);
      g.fillRect(22, 1 + bob, 4, 2);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(24, -5 + bob, 12, 10 + bob, 36, 10 + bob);
      g.fillStyle(this.darken(cfg.hatColor, 15), 0.7);
      g.fillRect(12, 8 + bob, 24, 3);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(14, 0 + bob, 20, 16, 6);
      g.fillStyle(this.darken(cfg.hoodColor, 20), 0.4);
      g.fillRect(17, 6 + bob, 14, 9);
      g.fillStyle(this.darken(cfg.hoodColor, 35), 0.2);
      g.fillRect(23, 2 + bob, 2, 13);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x7a4a1b, 1);
      g.fillRect(27, 11 + bob, 7, 20);
      g.fillStyle(0x5a3a15, 1);
      g.fillRect(27, 11 + bob, 7, 2);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(28, 8 + bob, 1, 5);
      g.fillRect(30, 9 + bob, 1, 4);
      g.fillRect(32, 8 + bob, 1, 5);
      g.fillStyle(0xcc4444, 0.6);
      g.fillRect(28, 8 + bob, 1, 2);
      g.fillRect(32, 8 + bob, 1, 2);
    }
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 0.85);
      g.fillRoundedRect(17, 20 + bob, 14, 15, 3);
      g.fillStyle(cfg.armorLight, 0.4);
      g.fillRect(19, 22 + bob, 10, 11);
      g.fillStyle(0xdaa520, 0.5);
      g.fillCircle(24, 27 + bob, 2);
    }
    if (cfg.hasSword) {
      g.fillStyle(0x5a3a1a, 1);
      g.fillRect(10, 16 + bob, 3, 22);
      g.fillStyle(cfg.weapon, 0.5);
      g.fillRect(11, 10 + bob, 1, 8);
    }
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(33, 4 + bob, 3, 36);
      g.fillStyle(this.darken(cfg.weaponHandle, 15), 0.3);
      g.fillRect(34, 8 + bob, 1, 30);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.6);
      g.fillCircle(34, 4 + bob, 4);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(33, 2 + bob, 1, 1);
    }
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 0.7);
      g.fillRect(12, 14 + bob, 2, 20);
    }
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(33, -2 + bob, 3, 40);
      g.fillStyle(cfg.weapon, 0.7);
      g.fillTriangle(34, -7 + bob, 31, 0 + bob, 38, 0 + bob);
    }
  }

  // ========================
  // SIDE VIEW (LEFT) - Ultra-detailed walk animation
  // ========================
  drawHeroSide(g: Phaser.GameObjects.Graphics, cfg: any, frame: number) {
    const bob = frame === 0 ? 0 : -1;
    const fl = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    const bl = frame === 2 ? 2 : frame === 1 ? -2 : 0;
    const flx = frame === 1 ? -2 : frame === 2 ? 1 : 0;
    const blx = frame === 2 ? -2 : frame === 1 ? 1 : 0;

    // Shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(24, 45, 18, 5);

    // Cape behind (further back for side view)
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 0.65);
      g.fillRoundedRect(26, 17 + bob, 12, 24, 4);
      g.fillStyle(this.darken(cfg.cape, 25), 0.35);
      g.fillRect(28, 24 + bob, 1, 16);
      g.fillRect(32, 24 + bob, 1, 16);
      // Cape tip
      g.fillStyle(cfg.cape, 0.4);
      g.fillRect(30, 40 + bob, 4, 2);
    }

    // Back leg
    g.fillStyle(this.darken(cfg.pants, 15), 1);
    g.fillRect(22 + blx, 34 + bl, 5, 8);
    g.fillStyle(this.darken(cfg.boots, 15), 1);
    g.fillRect(21 + blx, 40 + bl, 6, 4);
    g.fillStyle(this.darken(cfg.boots, 30), 1);
    g.fillRect(21 + blx, 43 + bl, 6, 1);

    // Back arm
    g.fillStyle(this.darken(cfg.skin, 15), 1);
    g.fillRect(28, 21 + bob, 3, 9);
    g.fillStyle(this.darken(cfg.armorDark, 10), 1);
    g.fillRect(28, 27 + bob, 3, 5);

    // Body (narrower for side profile)
    g.fillStyle(cfg.armor, 1);
    g.fillRoundedRect(17, 18 + bob, 14, 16, 2);
    // Side armor plate
    g.fillStyle(cfg.armorLight, 0.45);
    g.fillRect(18, 19 + bob, 5, 6);
    // Armor bottom edge
    g.fillStyle(cfg.armorDark, 0.35);
    g.fillRect(18, 30 + bob, 12, 2);
    // Belt
    g.fillStyle(0x6b4226, 1);
    g.fillRect(17, 32 + bob, 14, 2);
    g.fillStyle(0xdaa520, 0.8);
    g.fillRect(18, 32 + bob, 2, 2);
    // Shoulder pad
    g.fillStyle(cfg.armorLight, 0.9);
    g.fillEllipse(19, 20 + bob, 10, 7);
    g.fillStyle(this.darken(cfg.armorLight, 20), 0.4);
    g.fillEllipse(19, 22 + bob, 8, 3);
    // Side armor detail
    g.fillStyle(cfg.armorDark, 0.25);
    g.fillRect(19, 24 + bob, 10, 1);
    g.fillRect(19, 27 + bob, 10, 1);

    // Front leg
    g.fillStyle(cfg.pants, 1);
    g.fillRect(20 + flx, 34 + fl, 5, 8);
    // Knee highlight
    g.fillStyle(this.lighten(cfg.pants, 12), 0.4);
    g.fillRect(21 + flx, 35 + fl, 2, 2);
    // Boots
    g.fillStyle(cfg.boots, 1);
    g.fillRect(19 + flx, 40 + fl, 6, 4);
    g.fillStyle(this.darken(cfg.boots, 25), 1);
    g.fillRect(19 + flx, 43 + fl, 6, 1);
    // Boot strap
    g.fillStyle(this.darken(cfg.boots, 12), 0.6);
    g.fillRect(19 + flx, 41 + fl, 6, 1);

    // Front arm
    g.fillStyle(cfg.skin, 1);
    g.fillRect(15, 21 + bob, 4, 10);
    g.fillStyle(this.lighten(cfg.skin, 12), 0.35);
    g.fillRect(15, 22 + bob, 2, 4);
    // Bracer
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(14, 27 + bob, 5, 5);
    g.fillStyle(this.lighten(cfg.armorDark, 20), 0.4);
    g.fillRect(15, 29 + bob, 3, 1);
    // Hand
    g.fillStyle(cfg.skin, 1);
    g.fillRect(15, 31 + bob, 3, 2);

    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(20, 14 + bob, 5, 5);
    // Neck shadow
    g.fillStyle(this.darken(cfg.skin, 18), 0.3);
    g.fillRect(20, 17 + bob, 5, 2);

    // Head (side profile — detailed)
    g.fillStyle(cfg.skin, 1);
    g.fillRoundedRect(15, 4 + bob, 15, 14, 5);
    // Chin/jaw definition
    g.fillStyle(this.darken(cfg.skin, 12), 0.3);
    g.fillRect(15, 14 + bob, 10, 2);
    // Nose extends left (more defined)
    g.fillStyle(cfg.skin, 1);
    g.fillRect(13, 9 + bob, 3, 4);
    g.fillStyle(this.darken(cfg.skin, 18), 0.7);
    g.fillRect(13, 12 + bob, 2, 1);
    // Nostril hint
    g.fillStyle(this.darken(cfg.skin, 30), 0.5);
    g.fillRect(13, 12 + bob, 1, 1);

    // Hair — side profile
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(17, 2 + bob, 14, 8, 4);
    g.fillRect(29, 4 + bob, 2, 9);
    g.fillRect(15, 5 + bob, 3, 4);
    // Hair highlight
    g.fillStyle(this.lighten(cfg.hair, 20), 0.35);
    g.fillRect(20, 3 + bob, 4, 2);
    // Hair strand
    g.fillStyle(this.darken(cfg.hair, 15), 0.3);
    g.fillRect(24, 4 + bob, 1, 5);

    // Eye (side — single larger eye)
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(17, 8 + bob, 4, 4, 1);
    // Iris
    g.fillStyle(0x4488cc, 1);
    g.fillRect(17, 9 + bob, 3, 3);
    // Pupil
    g.fillStyle(0x111111, 1);
    g.fillRect(17, 10 + bob, 2, 2);
    // Eye shine
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(19, 9 + bob, 1, 1);
    // Eyelid
    g.fillStyle(this.darken(cfg.skin, 22), 0.5);
    g.fillRect(17, 8 + bob, 4, 1);
    // Eyebrow
    g.fillStyle(this.darken(cfg.hair, 15), 1);
    g.fillRect(17, 7 + bob, 4, 1);
    // Cheek
    g.fillStyle(0xff9999, 0.08);
    g.fillCircle(17, 13 + bob, 2);
    // Mouth
    g.fillStyle(this.darken(cfg.skin, 35), 1);
    g.fillRect(15, 14 + bob, 3, 1);
    // Ear
    g.fillStyle(this.darken(cfg.skin, 10), 1);
    g.fillRect(28, 9 + bob, 3, 4);
    g.fillStyle(this.darken(cfg.skin, 25), 0.4);
    g.fillRect(29, 10 + bob, 1, 2);

    // --- GEAR SIDE (enhanced) ---
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(14, 1 + bob, 18, 11, 4);
      g.fillStyle(this.lighten(cfg.helmetColor, 30), 0.45);
      g.fillRect(16, 2 + bob, 14, 2);
      g.fillStyle(this.darken(cfg.helmetColor, 35), 1);
      g.fillRect(15, 9 + bob, 8, 2);
      // Plume side
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, -2 + bob, 4, 4);
    }
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(22, -5 + bob, 12, 10 + bob, 34, 10 + bob);
      g.fillStyle(this.darken(cfg.hatColor, 12), 0.7);
      g.fillRect(10, 8 + bob, 24, 3);
      g.fillStyle(0xffdd44, 0.9);
      g.fillRect(22, 1 + bob, 2, 2);
    }
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(14, 0 + bob, 18, 15, 6);
      g.fillStyle(this.darken(cfg.hoodColor, 25), 0.4);
      g.fillRect(16, 8 + bob, 14, 6);
    }
    if (cfg.hasSword) {
      // Side sword with fuller
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(11, 8 + bob, 3, 16);
      g.fillStyle(this.lighten(cfg.weapon, 45), 0.5);
      g.fillRect(13, 9 + bob, 1, 14);
      g.fillStyle(this.darken(cfg.weapon, 15), 0.3);
      g.fillRect(12, 10 + bob, 1, 12);
      // Crossguard
      g.fillStyle(0xdaa520, 1);
      g.fillRect(9, 22 + bob, 7, 2);
      // Handle
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(11, 23 + bob, 3, 6);
      // Tip
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(12, 5 + bob, 11, 8 + bob, 14, 8 + bob);
    }
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 0.9);
      g.fillRoundedRect(27, 19 + bob, 7, 14, 2);
      g.fillStyle(cfg.armorLight, 0.45);
      g.fillRect(28, 21 + bob, 5, 10);
      g.fillStyle(0xdaa520, 0.6);
      g.fillCircle(30, 26 + bob, 1);
    }
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(11, 3 + bob, 3, 38);
      g.fillStyle(this.darken(cfg.weaponHandle, 15), 0.3);
      g.fillRect(12, 8 + bob, 1, 30);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.4);
      g.fillCircle(12, 3 + bob, 5);
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.85);
      g.fillCircle(12, 3 + bob, 3);
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(10, 1 + bob, 1, 1);
    }
    if (cfg.hasOrb) {
      g.fillStyle(cfg.orbColor, 0.4);
      g.fillCircle(12, 14 + bob, 5);
      g.fillStyle(cfg.orbColor, 0.7);
      g.fillCircle(12, 14 + bob, 3);
    }
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(9, 12 + bob, 3, 20);
      g.fillStyle(this.lighten(cfg.weapon, 20), 0.7);
      g.fillRect(7, 12 + bob, 3, 2);
      g.fillRect(7, 30 + bob, 3, 2);
      g.fillStyle(0xdaa520, 0.7);
      g.fillRect(8, 11 + bob, 1, 2);
      g.fillRect(8, 31 + bob, 1, 2);
      g.fillStyle(0xcccccc, 0.8);
      g.fillRect(12, 13 + bob, 1, 18);
      // Grip
      g.fillStyle(0x664422, 0.7);
      g.fillRect(9, 20 + bob, 3, 4);
    }
    if (cfg.hasQuiver) {
      g.fillStyle(0x7a4a1b, 1);
      g.fillRect(30, 13 + bob, 5, 16);
      g.fillStyle(0x5a3a15, 1);
      g.fillRect(30, 13 + bob, 5, 2);
      g.fillStyle(0xcccccc, 1);
      g.fillRect(31, 11 + bob, 1, 4);
      g.fillRect(33, 12 + bob, 1, 3);
      g.fillStyle(0xcc4444, 0.6);
      g.fillRect(31, 11 + bob, 1, 2);
    }
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(9, -4 + bob, 3, 46);
      g.fillStyle(0xdaa520, 0.4);
      g.fillRect(9, 20 + bob, 3, 1);
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(10, -10 + bob, 7, -2 + bob, 14, -2 + bob);
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.5);
      g.fillRect(10, -8 + bob, 1, 5);
      g.fillStyle(0xcc2222, 0.7);
      g.fillTriangle(12, -2 + bob, 12, 4 + bob, 18, 1 + bob);
    }
  }

  // ========================
  // ENEMY GENERATORS
  // ========================
  generateSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 32;
    // Double shadow for depth
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(16, 29, 26, 6);
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(16, 28, 22, 5);
    // Base puddle (gel pool spreading)
    g.fillStyle(0x0d8828, 0.5);
    g.fillEllipse(16, 27, 26, 7);
    // Main body layers
    g.fillStyle(0x0f9930, 1);
    g.fillEllipse(16, 21, 28, 19);
    g.fillStyle(0x15bb3c, 0.95);
    g.fillEllipse(16, 20, 25, 17);
    g.fillStyle(0x1ccc48, 0.85);
    g.fillEllipse(16, 19, 22, 15);
    // Inner gel core (translucent center glow)
    g.fillStyle(0x33ee55, 0.4);
    g.fillEllipse(14, 17, 16, 12);
    g.fillStyle(0x55ff77, 0.25);
    g.fillEllipse(13, 15, 12, 8);
    // Dark underside with gradient
    g.fillStyle(0x005518, 0.5);
    g.fillEllipse(16, 26, 22, 7);
    g.fillStyle(0x003f12, 0.3);
    g.fillEllipse(16, 28, 18, 4);
    // Surface vein lines
    g.fillStyle(0x0a7722, 0.3);
    g.fillRect(10, 18, 1, 6);
    g.fillRect(22, 16, 1, 7);
    g.fillRect(7, 22, 1, 4);
    g.fillRect(25, 21, 1, 4);
    // Specular highlight cluster
    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(11, 13, 9, 5);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(9, 11, 2.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(8, 10, 1.5);
    // Small secondary highlight
    g.fillStyle(0xffffff, 0.15);
    g.fillEllipse(22, 14, 5, 3);
    // Internal bubbles (trapped air)
    g.fillStyle(0x88ffaa, 0.25);
    g.fillCircle(19, 20, 2);
    g.fillCircle(10, 22, 1.5);
    g.fillCircle(23, 18, 1);
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(19, 19, 0.7);
    g.fillCircle(10, 21, 0.5);
    // Eyes (expressive with depth)
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(12, 17, 7, 6);
    g.fillEllipse(21, 17, 7, 6);
    // Iris
    g.fillStyle(0x226633, 0.8);
    g.fillEllipse(13, 18, 4, 4);
    g.fillEllipse(22, 18, 4, 4);
    // Pupil
    g.fillStyle(0x000000, 1);
    g.fillCircle(13, 18, 1.5);
    g.fillCircle(22, 18, 1.5);
    // Eye shine (dual)
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(11, 16, 1);
    g.fillCircle(20, 16, 1);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(14, 19, 0.5);
    g.fillCircle(23, 19, 0.5);
    // Eyelid hint
    g.fillStyle(0x15bb3c, 0.6);
    g.fillEllipse(12, 15, 6, 2);
    g.fillEllipse(21, 15, 6, 2);
    // Mouth (happy/mischievous)
    g.fillStyle(0x005518, 0.9);
    g.fillEllipse(16, 23, 7, 3);
    g.fillStyle(0x003310, 0.6);
    g.fillEllipse(16, 23, 5, 2);
    // Tongue hint
    g.fillStyle(0xcc5555, 0.5);
    g.fillEllipse(17, 24, 3, 1);
    // Gel drips (more detailed)
    g.fillStyle(0x1ccc48, 0.7);
    g.fillEllipse(5, 25, 4, 7);
    g.fillEllipse(27, 24, 3, 6);
    g.fillEllipse(3, 23, 2, 4);
    // Drip tips
    g.fillStyle(0x15bb3c, 0.5);
    g.fillCircle(5, 29, 1.5);
    g.fillCircle(27, 28, 1);
    // Surface tension film
    g.fillStyle(0x88ffbb, 0.12);
    g.fillEllipse(16, 18, 20, 14);
    // Sparkle particles
    g.fillStyle(0xccffcc, 0.7);
    g.fillCircle(8, 12, 1);
    g.fillCircle(22, 11, 1);
    g.fillCircle(18, 14, 0.7);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(6, 14, 0.5);
    g.fillCircle(26, 13, 0.5);
    g.fillCircle(16, 11, 0.5);
    g.generateTexture("enemy_slime", S, S);
    g.destroy();
  }

  generateWolfTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    // Double shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(18, 35, 30, 5);
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(18, 34, 28, 4);
    // Tail — bushy with fur strands
    g.fillStyle(0x555555, 0.85);
    g.fillEllipse(33, 17, 11, 6);
    g.fillStyle(0x666666, 0.7);
    g.fillEllipse(35, 16, 7, 4);
    g.fillStyle(0xddddcc, 0.35);
    g.fillEllipse(35, 17, 4, 2);
    // Tail fur strands
    g.fillStyle(0x444444, 0.3);
    g.fillRect(32, 14, 1, 5);
    g.fillRect(35, 15, 1, 3);
    // Back legs (muscular, darker)
    g.fillStyle(0x555555, 1);
    g.fillRect(22, 26, 4, 8);
    g.fillRect(28, 26, 4, 8);
    // Back leg muscle highlight
    g.fillStyle(0x777777, 0.35);
    g.fillRect(23, 27, 2, 4);
    g.fillRect(29, 27, 2, 4);
    // Back paws with toes
    g.fillStyle(0x444444, 1);
    g.fillEllipse(24, 34, 6, 2.5);
    g.fillEllipse(30, 34, 6, 2.5);
    g.fillStyle(0x333333, 1);
    g.fillCircle(22, 34, 1);
    g.fillCircle(26, 34, 1);
    g.fillCircle(28, 34, 1);
    g.fillCircle(32, 34, 1);
    // Front legs
    g.fillStyle(0x666666, 1);
    g.fillRect(8, 26, 4, 8);
    g.fillRect(14, 26, 4, 8);
    // Front leg muscle
    g.fillStyle(0x888888, 0.3);
    g.fillRect(9, 27, 2, 4);
    g.fillRect(15, 27, 2, 4);
    // Front paws with toes
    g.fillStyle(0x444444, 1);
    g.fillEllipse(10, 34, 6, 2.5);
    g.fillEllipse(16, 34, 6, 2.5);
    g.fillStyle(0x333333, 1);
    g.fillCircle(8, 34, 1);
    g.fillCircle(12, 34, 1);
    g.fillCircle(14, 34, 1);
    g.fillCircle(18, 34, 1);
    // Claws
    g.fillStyle(0x222222, 1);
    g.fillRect(7, 34, 1, 1);
    g.fillRect(12, 34, 1, 1);
    g.fillRect(13, 34, 1, 1);
    g.fillRect(18, 34, 1, 1);
    // Body (layered fur)
    g.fillStyle(0x5a5a5a, 1);
    g.fillEllipse(18, 22, 32, 17);
    g.fillStyle(0x6a6a6a, 0.8);
    g.fillEllipse(18, 20, 28, 14);
    // Back ridge fur
    g.fillStyle(0x777777, 0.6);
    g.fillEllipse(20, 16, 20, 5);
    // Fur strand lines on body
    g.fillStyle(0x4d4d4d, 0.3);
    g.fillRect(10, 17, 1, 5);
    g.fillRect(14, 16, 1, 6);
    g.fillRect(20, 17, 1, 4);
    g.fillRect(26, 18, 1, 5);
    g.fillRect(22, 15, 1, 4);
    // Belly (lighter underfur)
    g.fillStyle(0x999999, 0.5);
    g.fillEllipse(18, 26, 20, 7);
    g.fillStyle(0xaaaaaa, 0.25);
    g.fillEllipse(18, 27, 14, 4);
    // Head
    g.fillStyle(0x777777, 1);
    g.fillEllipse(7, 16, 17, 15);
    // Forehead ridge
    g.fillStyle(0x888888, 0.5);
    g.fillEllipse(7, 12, 10, 5);
    // Cheek fur
    g.fillStyle(0x888888, 0.4);
    g.fillEllipse(4, 19, 6, 5);
    g.fillEllipse(12, 19, 6, 5);
    // Snout layers
    g.fillStyle(0x888888, 1);
    g.fillEllipse(2, 19, 9, 7);
    g.fillStyle(0x999999, 0.6);
    g.fillEllipse(2, 18, 7, 5);
    // Nose (detailed)
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(0, 18, 4, 3);
    g.fillStyle(0x444444, 0.5);
    g.fillCircle(0, 17, 1);
    // Nostrils
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(-1, 18, 0.5);
    g.fillCircle(1, 18, 0.5);
    // Open snarling mouth
    g.fillStyle(0x882222, 0.7);
    g.fillEllipse(3, 22, 7, 3);
    g.fillStyle(0xaa3333, 0.5);
    g.fillEllipse(3, 22, 5, 2);
    // Fangs (upper + lower)
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(0, 20, 1, 3);
    g.fillRect(4, 20, 1, 3);
    g.fillStyle(0xeeeeee, 0.7);
    g.fillRect(1, 22, 1, 2);
    g.fillRect(3, 22, 1, 2);
    // Ears (layered)
    g.fillStyle(0x777777, 1);
    g.fillTriangle(5, 5, 1, 12, 9, 12);
    g.fillTriangle(14, 5, 10, 12, 17, 12);
    // Ear inner
    g.fillStyle(0xcc8888, 0.45);
    g.fillTriangle(5, 7, 3, 11, 8, 11);
    g.fillTriangle(14, 7, 12, 11, 16, 11);
    // Ear edge highlight
    g.fillStyle(0x999999, 0.3);
    g.fillRect(3, 8, 1, 3);
    g.fillRect(12, 8, 1, 3);
    // Eyes (fierce glowing amber)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(6, 15, 5, 4);
    g.fillEllipse(12, 15, 5, 4);
    g.fillStyle(0xffcc00, 1);
    g.fillEllipse(6, 15, 4, 3);
    g.fillEllipse(12, 15, 4, 3);
    // Slit pupil
    g.fillStyle(0x000000, 1);
    g.fillEllipse(6, 15, 1.5, 2.5);
    g.fillEllipse(12, 15, 1.5, 2.5);
    // Eye shine
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(5, 14, 0.7);
    g.fillCircle(11, 14, 0.7);
    // Brow ridge
    g.fillStyle(0x666666, 0.7);
    g.fillRect(4, 13, 4, 1);
    g.fillRect(10, 13, 4, 1);
    // Scar across face
    g.fillStyle(0xaa8888, 0.4);
    g.fillRect(8, 12, 1, 6);
    g.generateTexture("enemy_wolf", S, S);
    g.destroy();
  }

  generateSkeletonTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    const bone = 0xddddcc;
    const boneDark = 0xbbbbaa;
    const boneShadow = 0x999988;
    const boneHighlight = 0xeeeedd;
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(18, 35, 18, 4);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(18, 35, 14, 3);
    // Ghostly aura
    g.fillStyle(0x4444ff, 0.04);
    g.fillCircle(18, 20, 18);
    // Legs (femur + tibia detail)
    g.fillStyle(boneDark, 1);
    g.fillRect(14, 29, 4, 7);
    g.fillRect(21, 29, 4, 7);
    // Bone joint bulges
    g.fillStyle(boneHighlight, 0.6);
    g.fillCircle(16, 29, 2.5);
    g.fillCircle(23, 29, 2.5);
    g.fillCircle(16, 34, 2);
    g.fillCircle(23, 34, 2);
    // Tibia ridge
    g.fillStyle(boneShadow, 0.3);
    g.fillRect(15, 30, 1, 5);
    g.fillRect(22, 30, 1, 5);
    // Feet bones
    g.fillStyle(boneShadow, 1);
    g.fillRect(13, 34, 6, 2);
    g.fillRect(20, 34, 6, 2);
    // Toe bones
    g.fillStyle(boneDark, 0.7);
    g.fillRect(12, 35, 2, 1);
    g.fillRect(17, 35, 2, 1);
    g.fillRect(19, 35, 2, 1);
    g.fillRect(24, 35, 2, 1);
    // Pelvis
    g.fillStyle(boneDark, 1);
    g.fillEllipse(20, 28, 14, 5);
    g.fillStyle(boneHighlight, 0.4);
    g.fillEllipse(20, 27, 10, 3);
    // Spine
    g.fillStyle(bone, 1);
    g.fillRect(19, 16, 2, 13);
    // Vertebrae detail
    g.fillStyle(boneShadow, 0.5);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(20, 17 + i * 2.5, 1.5);
    }
    // Ribcage
    for (let i = 0; i < 5; i++) {
      g.fillStyle(bone, 0.9);
      g.fillRect(13, 17 + i * 2.5, 14, 1);
      g.fillStyle(boneShadow, 0.4);
      g.fillRect(14, 18 + i * 2.5, 12, 0.5);
      // Rib curve ends
      g.fillStyle(bone, 0.7);
      g.fillCircle(13, 17 + i * 2.5, 0.7);
      g.fillCircle(27, 17 + i * 2.5, 0.7);
    }
    // Collarbone
    g.fillStyle(bone, 1);
    g.fillRect(11, 15, 18, 2);
    g.fillStyle(boneHighlight, 0.5);
    g.fillRect(12, 15, 16, 1);
    // Shoulder joints (ball & socket visible)
    g.fillStyle(bone, 1);
    g.fillCircle(11, 16, 3);
    g.fillCircle(29, 16, 3);
    g.fillStyle(boneShadow, 0.4);
    g.fillCircle(11, 16, 1.5);
    g.fillCircle(29, 16, 1.5);
    // Arms
    g.fillStyle(boneDark, 1);
    g.fillRect(9, 17, 3, 11);
    g.fillRect(28, 17, 3, 11);
    // Elbow joints
    g.fillStyle(bone, 0.8);
    g.fillCircle(10, 22, 2);
    g.fillCircle(29, 22, 2);
    // Radius/ulna split hint
    g.fillStyle(boneShadow, 0.3);
    g.fillRect(10, 23, 1, 5);
    g.fillRect(29, 23, 1, 5);
    // Hands (bony fingers)
    g.fillStyle(boneShadow, 0.9);
    g.fillCircle(10, 28, 2);
    g.fillCircle(29, 28, 2);
    g.fillStyle(boneDark, 0.7);
    g.fillRect(8, 28, 1, 3);
    g.fillRect(10, 29, 1, 2);
    g.fillRect(12, 28, 1, 3);
    g.fillRect(27, 28, 1, 3);
    g.fillRect(29, 29, 1, 2);
    g.fillRect(31, 28, 1, 3);
    // Skull (detailed)
    g.fillStyle(bone, 1);
    g.fillRoundedRect(11, 1, 18, 16, 6);
    // Skull top ridge
    g.fillStyle(boneHighlight, 0.5);
    g.fillEllipse(20, 4, 14, 5);
    // Temple shadows
    g.fillStyle(boneShadow, 0.3);
    g.fillRect(12, 8, 2, 5);
    g.fillRect(26, 8, 2, 5);
    // Cheekbones
    g.fillStyle(boneHighlight, 0.3);
    g.fillEllipse(14, 11, 4, 3);
    g.fillEllipse(26, 11, 4, 3);
    // Eye sockets (deep, detailed)
    g.fillStyle(0x0a0a0a, 1);
    g.fillEllipse(16, 8, 6, 5);
    g.fillEllipse(24, 8, 6, 5);
    // Socket inner shadow
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(16, 9, 4, 3);
    g.fillEllipse(24, 9, 4, 3);
    // Glowing eyes
    g.fillStyle(0xff2222, 0.6);
    g.fillCircle(16, 8, 2);
    g.fillCircle(24, 8, 2);
    g.fillStyle(0xff4444, 1);
    g.fillCircle(16, 8, 1);
    g.fillCircle(24, 8, 1);
    g.fillStyle(0xffaaaa, 0.5);
    g.fillCircle(16, 8, 0.5);
    g.fillCircle(24, 8, 0.5);
    // Nose hole (triangular)
    g.fillStyle(0x111111, 1);
    g.fillTriangle(20, 10, 18, 13, 22, 13);
    g.fillStyle(0x1a1a1a, 0.5);
    g.fillRect(19, 12, 2, 1);
    // Teeth (individual, some missing)
    g.fillStyle(bone, 1);
    g.fillRect(14, 14, 12, 2);
    // Individual teeth
    g.fillStyle(0x333333, 0.7);
    for (let i = 0; i < 6; i++) {
      g.fillRect(15 + i * 2, 14, 1, 2);
    }
    // Missing tooth gap
    g.fillStyle(0x111111, 0.8);
    g.fillRect(21, 14, 2, 2);
    // Jaw shadow  
    g.fillStyle(boneShadow, 0.4);
    g.fillRect(15, 16, 10, 1);
    // Skull crack (more detailed)
    g.fillStyle(boneShadow, 0.6);
    g.fillRect(23, 2, 1, 4);
    g.fillRect(24, 4, 1, 3);
    g.fillRect(23, 6, 1, 2);
    // Rusty sword (ancient, damaged)
    g.fillStyle(0x777766, 1);
    g.fillRect(6, 8, 3, 20);
    g.fillStyle(0x888877, 0.5);
    g.fillRect(7, 9, 1, 18);
    // Sword edge damage
    g.fillStyle(0x666655, 0.6);
    g.fillRect(5, 12, 1, 2);
    g.fillRect(9, 16, 1, 2);
    g.fillRect(5, 20, 1, 1);
    // Rune glowing on blade
    g.fillStyle(0xff4444, 0.3);
    g.fillRect(7, 14, 1, 3);
    // Crossguard
    g.fillStyle(0x555544, 1);
    g.fillRect(3, 7, 9, 2);
    // Handle
    g.fillStyle(0x664422, 1);
    g.fillRect(6, 26, 3, 4);
    // Pommel
    g.fillStyle(0x555544, 0.8);
    g.fillCircle(7, 30, 2);
    // Armor fragment on shoulder
    g.fillStyle(0x445566, 0.5);
    g.fillEllipse(11, 15, 6, 4);
    g.fillStyle(0x556677, 0.3);
    g.fillEllipse(11, 14, 4, 2);
    g.generateTexture("enemy_skeleton", S, S);
    g.destroy();
  }

  generateGoblinTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 30;
    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(15, 28, 18, 4);
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(15, 29, 14, 3);
    // Legs (scrawny green)
    g.fillStyle(0x448811, 1);
    g.fillRect(9, 22, 4, 7);
    g.fillRect(17, 22, 4, 7);
    // Knee bulge
    g.fillStyle(0x55aa22, 0.5);
    g.fillCircle(11, 23, 1.5);
    g.fillCircle(19, 23, 1.5);
    // Shin highlight
    g.fillStyle(0x66bb33, 0.25);
    g.fillRect(10, 24, 2, 3);
    g.fillRect(18, 24, 2, 3);
    // Boots (worn leather)
    g.fillStyle(0x553322, 1);
    g.fillRect(8, 27, 6, 3);
    g.fillRect(16, 27, 6, 3);
    g.fillStyle(0x442211, 0.6);
    g.fillRect(8, 29, 6, 1);
    g.fillRect(16, 29, 6, 1);
    // Boot stitching
    g.fillStyle(0x332211, 0.4);
    g.fillRect(10, 27, 1, 2);
    g.fillRect(18, 27, 1, 2);
    // Body (leather tunic, layered)
    g.fillStyle(0x664433, 0.95);
    g.fillRoundedRect(7, 11, 16, 13, 2);
    // Tunic stitching lines
    g.fillStyle(0x553322, 0.5);
    g.fillRect(10, 13, 10, 1);
    g.fillRect(10, 17, 10, 1);
    g.fillRect(10, 20, 10, 1);
    // Leather patches
    g.fillStyle(0x775544, 0.5);
    g.fillRect(8, 14, 5, 4);
    g.fillStyle(0x554433, 0.4);
    g.fillRect(17, 16, 4, 3);
    // Belt with buckle
    g.fillStyle(0x443322, 1);
    g.fillRect(7, 22, 16, 2);
    g.fillStyle(0xddaa22, 1);
    g.fillRect(13, 22, 3, 2);
    // Belt pouch
    g.fillStyle(0x553322, 0.7);
    g.fillRect(8, 22, 3, 3);
    // Head (large for body)
    g.fillStyle(0x66aa33, 1);
    g.fillRoundedRect(6, 0, 19, 15, 6);
    // Face lighter center
    g.fillStyle(0x77bb44, 0.4);
    g.fillEllipse(16, 8, 12, 10);
    // Brow ridge
    g.fillStyle(0x559922, 0.8);
    g.fillRect(9, 3, 13, 3);
    // War paint (tribal marks)
    g.fillStyle(0xcc3333, 0.4);
    g.fillRect(8, 6, 2, 3);
    g.fillRect(22, 6, 2, 3);
    g.fillStyle(0xcc3333, 0.25);
    g.fillRect(12, 11, 1, 2);
    g.fillRect(19, 11, 1, 2);
    // Big pointy ears (detailed)
    g.fillStyle(0x66aa33, 1);
    g.fillTriangle(1, 4, 7, 2, 7, 9);
    g.fillTriangle(29, 4, 24, 2, 24, 9);
    // Ear inner
    g.fillStyle(0xcc8866, 0.45);
    g.fillTriangle(3, 5, 7, 3, 7, 8);
    g.fillTriangle(27, 5, 24, 3, 24, 8);
    // Ear ridge
    g.fillStyle(0x558822, 0.4);
    g.fillRect(5, 5, 1, 3);
    g.fillRect(25, 5, 1, 3);
    // Eyes (large, menacing yellow-green)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(13, 7, 7, 6);
    g.fillEllipse(21, 7, 7, 6);
    g.fillStyle(0xffee00, 1);
    g.fillEllipse(13, 7, 6, 5);
    g.fillEllipse(21, 7, 6, 5);
    // Iris (slit)
    g.fillStyle(0x886600, 0.7);
    g.fillEllipse(13, 7, 3, 4);
    g.fillEllipse(21, 7, 3, 4);
    // Pupil (vertical slit)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(13, 7, 1.5, 3.5);
    g.fillEllipse(21, 7, 1.5, 3.5);
    // Eye shine
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(12, 6, 0.7);
    g.fillCircle(20, 6, 0.7);
    // Angry brows (slanted)
    g.fillStyle(0x448811, 1);
    g.fillRect(10, 4, 5, 2);
    g.fillRect(19, 4, 5, 2);
    // Wart on nose
    g.fillStyle(0x55aa22, 1);
    g.fillEllipse(17, 10, 5, 4);
    g.fillStyle(0x66bb33, 0.6);
    g.fillCircle(16, 9, 1);
    // Nostrils
    g.fillStyle(0x337711, 0.7);
    g.fillCircle(16, 11, 0.7);
    g.fillCircle(18, 11, 0.7);
    // Wart
    g.fillStyle(0x448811, 0.8);
    g.fillCircle(19, 9, 1);
    // Mouth (jagged teeth)
    g.fillStyle(0x333300, 1);
    g.fillRect(11, 12, 9, 2);
    g.fillStyle(0xeeeecc, 1);
    g.fillRect(12, 12, 2, 2);
    g.fillRect(18, 12, 2, 2);
    // Lower fangs
    g.fillStyle(0xddddbb, 0.9);
    g.fillRect(14, 13, 1, 2);
    g.fillRect(17, 13, 1, 2);
    // Chin shadow
    g.fillStyle(0x558822, 0.4);
    g.fillRect(12, 14, 7, 1);
    // Arms (scrawny with wristbands)
    g.fillStyle(0x55aa22, 1);
    g.fillRect(4, 13, 3, 9);
    g.fillRect(23, 13, 3, 9);
    // Arm muscle
    g.fillStyle(0x66bb33, 0.3);
    g.fillRect(4, 14, 2, 3);
    g.fillRect(23, 14, 2, 3);
    // Wristbands
    g.fillStyle(0x664422, 0.8);
    g.fillRect(4, 19, 3, 2);
    g.fillRect(23, 19, 3, 2);
    // Hands
    g.fillStyle(0x55aa22, 0.9);
    g.fillCircle(5, 22, 1.5);
    g.fillCircle(24, 22, 1.5);
    // Dagger (serrated)
    g.fillStyle(0x999999, 1);
    g.fillRect(3, 11, 2, 10);
    g.fillStyle(0xbbbbbb, 0.5);
    g.fillRect(4, 12, 1, 8);
    // Serration
    g.fillStyle(0x777777, 0.6);
    g.fillRect(2, 14, 1, 1);
    g.fillRect(2, 16, 1, 1);
    g.fillRect(2, 18, 1, 1);
    // Dagger handle
    g.fillStyle(0x664422, 1);
    g.fillRect(3, 20, 2, 3);
    g.generateTexture("enemy_goblin", S, S);
    g.destroy();
  }

  generateBanditTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(18, 35, 18, 4);
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(18, 35, 14, 3);
    // Legs (dark leather)
    g.fillStyle(0x443322, 1);
    g.fillRect(13, 28, 4, 7);
    g.fillRect(20, 28, 4, 7);
    // Leg stitching
    g.fillStyle(0x332211, 0.4);
    g.fillRect(14, 29, 1, 5);
    g.fillRect(21, 29, 1, 5);
    // Knee pads
    g.fillStyle(0x555544, 0.5);
    g.fillEllipse(15, 28, 3, 2);
    g.fillEllipse(22, 28, 3, 2);
    // Boots (buckled)
    g.fillStyle(0x332211, 1);
    g.fillRect(12, 33, 6, 3);
    g.fillRect(19, 33, 6, 3);
    g.fillStyle(0x221100, 1);
    g.fillRect(12, 35, 6, 1);
    g.fillRect(19, 35, 6, 1);
    // Boot straps
    g.fillStyle(0x444433, 0.6);
    g.fillRect(12, 33, 6, 1);
    g.fillRect(19, 33, 6, 1);
    // Boot buckle
    g.fillStyle(0xccaa44, 0.7);
    g.fillRect(14, 33, 1, 1);
    g.fillRect(21, 33, 1, 1);
    // Body (studded leather armor)
    g.fillStyle(0x554433, 1);
    g.fillRoundedRect(10, 14, 16, 16, 2);
    // Leather grain texture
    g.fillStyle(0x665544, 0.5);
    g.fillRect(12, 16, 12, 2);
    g.fillRect(12, 20, 12, 2);
    g.fillRect(12, 24, 12, 2);
    // Metal studs on armor
    g.fillStyle(0x888877, 0.7);
    g.fillCircle(12, 17, 0.8);
    g.fillCircle(24, 17, 0.8);
    g.fillCircle(12, 21, 0.8);
    g.fillCircle(24, 21, 0.8);
    g.fillCircle(12, 25, 0.8);
    g.fillCircle(24, 25, 0.8);
    // Belt with ornate buckle
    g.fillStyle(0x333322, 1);
    g.fillRect(10, 26, 16, 3);
    g.fillStyle(0xccaa44, 1);
    g.fillRect(15, 26, 5, 3);
    g.fillStyle(0xeecc55, 0.5);
    g.fillRect(16, 27, 3, 1);
    // Belt pouches
    g.fillStyle(0x443322, 0.8);
    g.fillRect(11, 27, 3, 2);
    g.fillRect(22, 27, 3, 2);
    // Cross-body strap (with buckle)
    g.fillStyle(0x443322, 0.85);
    g.fillRect(12, 14, 3, 14);
    g.fillStyle(0xccaa44, 0.5);
    g.fillCircle(13, 18, 0.8);
    // Hood (detailed, layered)
    g.fillStyle(0x443322, 0.92);
    g.fillRoundedRect(9, -1, 18, 12, 5);
    g.fillStyle(0x553322, 0.6);
    g.fillEllipse(18, 2, 14, 6);
    // Hood shadow beneath
    g.fillStyle(0x332211, 0.5);
    g.fillRect(10, 8, 16, 3);
    // Head (face visible beneath hood)
    g.fillStyle(0xddbb99, 1);
    g.fillRoundedRect(12, 3, 12, 12, 4);
    // Jaw shadow
    g.fillStyle(0xcc9977, 0.35);
    g.fillRect(13, 12, 10, 2);
    // Stubble
    g.fillStyle(0xaa8866, 0.2);
    g.fillRect(13, 11, 10, 3);
    // Mask (detailed cloth)
    g.fillStyle(0x2a2a2a, 0.92);
    g.fillRect(12, 9, 12, 5);
    g.fillStyle(0x1a1a1a, 0.5);
    g.fillRect(14, 10, 8, 1);
    g.fillStyle(0x333333, 0.4);
    g.fillRect(14, 12, 8, 1);
    // Mask wrinkle
    g.fillStyle(0x222222, 0.3);
    g.fillRect(12, 11, 12, 1);
    // Scar above mask (across eye area)
    g.fillStyle(0xdd9988, 0.45);
    g.fillRect(22, 5, 1, 5);
    // Eyes (cold, intense)
    g.fillStyle(0x111111, 1);
    g.fillEllipse(16, 7, 4, 3.5);
    g.fillEllipse(22, 7, 4, 3.5);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(16, 7, 3, 2.5);
    g.fillEllipse(22, 7, 3, 2.5);
    // Iris (steel gray)
    g.fillStyle(0x556677, 1);
    g.fillCircle(16, 7, 1.2);
    g.fillCircle(22, 7, 1.2);
    g.fillStyle(0x111111, 1);
    g.fillCircle(16, 7, 0.6);
    g.fillCircle(22, 7, 0.6);
    // Eye shine
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(15, 6, 0.5);
    g.fillCircle(21, 6, 0.5);
    // Menacing eyebrows
    g.fillStyle(0x554433, 1);
    g.fillRect(14, 5, 5, 1);
    g.fillRect(20, 5, 5, 1);
    // Arms
    g.fillStyle(0x554433, 1);
    g.fillRect(7, 16, 4, 11);
    g.fillRect(25, 16, 4, 11);
    // Arm wrapping
    g.fillStyle(0x443322, 0.5);
    g.fillRect(7, 18, 4, 1);
    g.fillRect(7, 21, 4, 1);
    g.fillRect(25, 18, 4, 1);
    g.fillRect(25, 21, 4, 1);
    // Vambraces
    g.fillStyle(0x555544, 0.7);
    g.fillRect(7, 23, 4, 4);
    g.fillRect(25, 23, 4, 4);
    // Hands
    g.fillStyle(0xddbb99, 0.85);
    g.fillCircle(9, 27, 2);
    g.fillCircle(27, 27, 2);
    // Sword — right hand (detailed)
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(28, 13, 2, 16);
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(29, 14, 1, 14);
    // Blade edge
    g.fillStyle(0xdddddd, 0.35);
    g.fillRect(27, 14, 1, 14);
    // Sword tip
    g.fillStyle(0xaaaaaa, 1);
    g.fillTriangle(29, 11, 28, 13, 30, 13);
    // Crossguard
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(26, 12, 6, 2);
    g.fillStyle(0xccaa44, 0.6);
    g.fillCircle(26, 13, 0.8);
    g.fillCircle(32, 13, 0.8);
    // Handle
    g.fillStyle(0x664422, 1);
    g.fillRect(28, 28, 2, 4);
    // Pommel
    g.fillStyle(0x8b5a2b, 0.8);
    g.fillCircle(29, 32, 1.5);
    // Dagger — left hand (detailed)
    g.fillStyle(0x888888, 1);
    g.fillRect(7, 16, 1, 10);
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(7, 17, 1, 8);
    // Dagger crossguard
    g.fillStyle(0x555544, 0.8);
    g.fillRect(6, 15, 3, 1);
    g.generateTexture("enemy_bandit", S, S);
    g.destroy();
  }

  generateOrcTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 40;
    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(20, 39, 26, 5);
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(20, 38, 22, 4);
    // Legs (massive, muscular)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(11, 30, 7, 9);
    g.fillRect(22, 30, 7, 9);
    // Leg muscle definition
    g.fillStyle(0x4a7f23, 0.4);
    g.fillRect(13, 31, 3, 5);
    g.fillRect(24, 31, 3, 5);
    g.fillStyle(0x2a5015, 0.35);
    g.fillRect(12, 33, 2, 4);
    g.fillRect(23, 33, 2, 4);
    // Knee guard
    g.fillStyle(0x555544, 0.6);
    g.fillEllipse(14, 30, 5, 3);
    g.fillEllipse(25, 30, 5, 3);
    // Heavy boots (iron-shod)
    g.fillStyle(0x332211, 1);
    g.fillRect(10, 36, 9, 4);
    g.fillRect(21, 36, 9, 4);
    g.fillStyle(0x221100, 1);
    g.fillRect(10, 39, 9, 1);
    g.fillRect(21, 39, 9, 1);
    // Iron toe cap
    g.fillStyle(0x555555, 0.6);
    g.fillRect(10, 37, 3, 2);
    g.fillRect(21, 37, 3, 2);
    // Boot straps
    g.fillStyle(0x444433, 0.5);
    g.fillRect(10, 36, 9, 1);
    g.fillRect(21, 36, 9, 1);
    // Body (massive barrel chest)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRoundedRect(7, 13, 26, 19, 4);
    // Leather chest armor
    g.fillStyle(0x664422, 0.85);
    g.fillRect(9, 15, 22, 15);
    // Armor plating (riveted)
    g.fillStyle(0x555555, 0.55);
    g.fillRect(10, 16, 9, 7);
    g.fillRect(21, 16, 9, 7);
    g.fillStyle(0x666666, 0.35);
    g.fillRect(11, 17, 7, 5);
    g.fillRect(22, 17, 7, 5);
    // Rivets on plates
    g.fillStyle(0x888877, 0.7);
    g.fillCircle(11, 17, 0.7);
    g.fillCircle(18, 17, 0.7);
    g.fillCircle(22, 17, 0.7);
    g.fillCircle(29, 17, 0.7);
    g.fillCircle(11, 22, 0.7);
    g.fillCircle(18, 22, 0.7);
    g.fillCircle(22, 22, 0.7);
    g.fillCircle(29, 22, 0.7);
    // War paint on chest armor (tribal X)
    g.fillStyle(0xcc2222, 0.35);
    g.fillRect(14, 18, 1, 6);
    g.fillRect(25, 18, 1, 6);
    g.fillRect(12, 20, 5, 1);
    g.fillRect(23, 20, 5, 1);
    // Belt (thick with skull buckle)
    g.fillStyle(0x553311, 0.9);
    g.fillRect(9, 28, 22, 3);
    g.fillStyle(0xddddcc, 1);
    g.fillCircle(20, 29, 2);
    g.fillStyle(0x111111, 0.7);
    g.fillCircle(19, 29, 0.5);
    g.fillCircle(21, 29, 0.5);
    // Belt pouches
    g.fillStyle(0x553322, 0.7);
    g.fillRect(10, 28, 4, 3);
    g.fillRect(26, 28, 4, 3);
    // Head (broad brutish jaw)
    g.fillStyle(0x4a7f23, 1);
    g.fillRoundedRect(10, 1, 20, 15, 5);
    // Forehead ridge
    g.fillStyle(0x3d6b1e, 0.7);
    g.fillRect(11, 2, 18, 3);
    // Jaw (underbite, massive)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(12, 12, 16, 5);
    g.fillStyle(0x2a5015, 0.5);
    g.fillRect(13, 14, 14, 2);
    // Tusks (large, prominent)
    g.fillStyle(0xeeeecc, 1);
    g.fillRect(13, 12, 2, 4);
    g.fillRect(25, 12, 2, 4);
    g.fillStyle(0xddddbb, 0.7);
    g.fillRect(13, 11, 2, 2);
    g.fillRect(25, 11, 2, 2);
    // Tusk shading
    g.fillStyle(0xccccaa, 0.4);
    g.fillRect(14, 13, 1, 2);
    g.fillRect(26, 13, 1, 2);
    // Eyes (fierce orange-red, intense)
    g.fillStyle(0x111111, 1);
    g.fillEllipse(16, 7, 6, 5);
    g.fillEllipse(26, 7, 6, 5);
    g.fillStyle(0xff4400, 1);
    g.fillEllipse(16, 7, 5, 4);
    g.fillEllipse(26, 7, 5, 4);
    // Pupil (menacing slit)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(16, 7, 1.5, 3);
    g.fillEllipse(26, 7, 1.5, 3);
    // Eye glow
    g.fillStyle(0xff8844, 0.4);
    g.fillCircle(16, 7, 3);
    g.fillCircle(26, 7, 3);
    // Eye shine
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(15, 6, 0.7);
    g.fillCircle(25, 6, 0.7);
    // Heavy brow ridge
    g.fillStyle(0x2a5015, 1);
    g.fillRect(13, 4, 6, 2);
    g.fillRect(23, 4, 6, 2);
    // Nose (flat, brutish)
    g.fillStyle(0x3d6b1e, 0.85);
    g.fillEllipse(20, 10, 5, 4);
    g.fillStyle(0x2a5015, 0.5);
    g.fillCircle(19, 10, 0.7);
    g.fillCircle(22, 10, 0.7);
    // Scars (battle damage)
    g.fillStyle(0x558833, 0.55);
    g.fillRect(13, 5, 1, 5);
    g.fillRect(28, 3, 1, 6);
    // Scar across nose
    g.fillStyle(0x669944, 0.4);
    g.fillRect(18, 9, 5, 1);
    // War paint (tribal marks on face)
    g.fillStyle(0xcc1111, 0.3);
    g.fillRect(11, 6, 2, 4);
    g.fillRect(28, 6, 2, 4);
    // Arms (massive, muscular)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(3, 15, 6, 15);
    g.fillRect(31, 15, 6, 15);
    // Arm muscle striations
    g.fillStyle(0x4a7f23, 0.35);
    g.fillRect(4, 17, 3, 6);
    g.fillRect(32, 17, 3, 6);
    g.fillStyle(0x2a5015, 0.3);
    g.fillRect(3, 20, 2, 4);
    g.fillRect(35, 20, 2, 4);
    // Arm bands (tribal)
    g.fillStyle(0x664422, 0.7);
    g.fillRect(3, 18, 6, 2);
    g.fillRect(31, 18, 6, 2);
    // Wrist wrapping
    g.fillStyle(0x554433, 0.6);
    g.fillRect(3, 26, 6, 2);
    g.fillRect(31, 26, 6, 2);
    // Fists
    g.fillStyle(0x4a7f23, 0.9);
    g.fillCircle(5, 30, 3);
    g.fillCircle(35, 30, 3);
    // Battle axe (massive, detailed)
    g.fillStyle(0x664422, 1);
    g.fillRect(0, 5, 3, 30);
    // Shaft grain
    g.fillStyle(0x553311, 0.3);
    g.fillRect(1, 8, 1, 25);
    // Shaft wrapping
    g.fillStyle(0x443322, 0.5);
    g.fillRect(0, 20, 3, 2);
    g.fillRect(0, 24, 3, 2);
    // Axe head (large, double-sided appearance)
    g.fillStyle(0x777777, 1);
    g.fillRoundedRect(-1, 5, 9, 12, 2);
    g.fillStyle(0x999999, 0.5);
    g.fillRect(0, 6, 7, 10);
    // Axe edge
    g.fillStyle(0xbbbbbb, 0.6);
    g.fillRect(-1, 6, 2, 10);
    // Blood stain on axe
    g.fillStyle(0x880000, 0.25);
    g.fillRect(2, 8, 3, 4);
    // Shoulder pads (spiked)
    g.fillStyle(0x555555, 0.75);
    g.fillEllipse(7, 15, 9, 6);
    g.fillEllipse(33, 15, 9, 6);
    g.fillStyle(0x666666, 0.5);
    g.fillEllipse(7, 14, 7, 4);
    g.fillEllipse(33, 14, 7, 4);
    // Spikes
    g.fillStyle(0x555555, 1);
    g.fillTriangle(5, 10, 4, 15, 7, 15);
    g.fillTriangle(35, 10, 33, 15, 36, 15);
    // Tribal necklace
    g.fillStyle(0xddddcc, 0.5);
    g.fillRect(14, 13, 12, 1);
    g.fillStyle(0xcc2222, 0.6);
    g.fillCircle(20, 14, 1);
    g.generateTexture("enemy_orc", S, S);
    g.destroy();
  }

  generateDarkKnightTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 42;
    // Double shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(21, 41, 22, 5);
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(21, 40, 18, 4);
    // Dark aura (pulsing energy)
    g.fillStyle(0x880088, 0.06);
    g.fillCircle(21, 22, 24);
    g.fillStyle(0x6600aa, 0.04);
    g.fillCircle(21, 22, 20);
    // Dark energy particles
    g.fillStyle(0xaa44ff, 0.25);
    g.fillCircle(5, 18, 1);
    g.fillCircle(37, 24, 1);
    g.fillCircle(12, 38, 0.7);
    g.fillCircle(30, 10, 0.7);
    g.fillStyle(0xcc66ff, 0.15);
    g.fillCircle(8, 30, 1.5);
    g.fillCircle(34, 14, 1.5);
    // Dark cape behind (flowing, tattered)
    g.fillStyle(0x0d0011, 0.65);
    g.fillRoundedRect(11, 16, 20, 22, 4);
    g.fillStyle(0x1a0022, 0.35);
    g.fillRect(15, 30, 1, 8);
    g.fillRect(26, 30, 1, 8);
    g.fillRect(20, 32, 1, 6);
    // Cape tatter
    g.fillStyle(0x0d0011, 0.4);
    g.fillRect(12, 36, 3, 3);
    g.fillRect(27, 35, 3, 4);
    // Legs (dark plate greaves)
    g.fillStyle(0x1d1d2e, 1);
    g.fillRect(14, 32, 5, 9);
    g.fillRect(23, 32, 5, 9);
    // Greave plate detail
    g.fillStyle(0x2d2d3e, 0.55);
    g.fillRect(15, 33, 3, 7);
    g.fillRect(24, 33, 3, 7);
    // Knee plate
    g.fillStyle(0x333344, 0.8);
    g.fillEllipse(16, 32, 5, 3);
    g.fillEllipse(25, 32, 5, 3);
    // Rune on greave
    g.fillStyle(0x880088, 0.3);
    g.fillRect(15, 35, 1, 3);
    g.fillRect(24, 35, 1, 3);
    // Armored boots (sabatons)
    g.fillStyle(0x111122, 1);
    g.fillRect(13, 38, 7, 3);
    g.fillRect(22, 38, 7, 3);
    g.fillStyle(0x0a0a15, 1);
    g.fillRect(13, 40, 7, 1);
    g.fillRect(22, 40, 7, 1);
    // Boot edge highlight
    g.fillStyle(0x333344, 0.5);
    g.fillRect(14, 38, 5, 1);
    g.fillRect(23, 38, 5, 1);
    // Body — full ornate plate armor
    g.fillStyle(0x1d1d2e, 1);
    g.fillRoundedRect(9, 14, 24, 20, 3);
    // Chest plate sections
    g.fillStyle(0x2d2d3e, 0.55);
    g.fillRect(11, 16, 20, 2);
    g.fillRect(11, 20, 20, 2);
    g.fillRect(11, 24, 20, 2);
    g.fillRect(11, 28, 20, 2);
    // Vertical rib
    g.fillStyle(0x2d2d3e, 0.3);
    g.fillRect(20, 16, 2, 16);
    // Dark emblem (evil sigil — layered)
    g.fillStyle(0x880088, 0.85);
    g.fillCircle(21, 22, 4.5);
    g.fillStyle(0xaa00aa, 0.6);
    g.fillCircle(21, 22, 3);
    g.fillStyle(0xcc44cc, 0.3);
    g.fillCircle(21, 22, 1.5);
    // Sigil rune lines
    g.fillStyle(0xaa00aa, 0.5);
    g.fillRect(17, 22, 8, 1);
    g.fillRect(21, 18, 1, 8);
    // Shoulder pauldrons (massive, spiked, ornate)
    g.fillStyle(0x2d2d3e, 1);
    g.fillEllipse(10, 16, 12, 9);
    g.fillEllipse(32, 16, 12, 9);
    g.fillStyle(0x3d3d4e, 0.6);
    g.fillEllipse(10, 15, 10, 6);
    g.fillEllipse(32, 15, 10, 6);
    // Pauldron edge highlight
    g.fillStyle(0x4d4d5e, 0.35);
    g.fillEllipse(10, 14, 8, 3);
    g.fillEllipse(32, 14, 8, 3);
    // Spikes on pauldrons
    g.fillStyle(0x3d3d4e, 1);
    g.fillTriangle(7, 9, 6, 16, 10, 16);
    g.fillTriangle(35, 9, 32, 16, 36, 16);
    // Spike tips (bright)
    g.fillStyle(0x555566, 0.7);
    g.fillCircle(7, 10, 1);
    g.fillCircle(35, 10, 1);
    // Pauldron runes
    g.fillStyle(0x880088, 0.4);
    g.fillRect(8, 15, 1, 3);
    g.fillRect(33, 15, 1, 3);
    // Helmet (full enclosed, menacing)
    g.fillStyle(0x1d1d2e, 1);
    g.fillRoundedRect(12, 1, 18, 16, 5);
    // Helmet ridge
    g.fillStyle(0x333344, 0.7);
    g.fillRect(14, 2, 14, 4);
    g.fillStyle(0x3d3d4e, 0.4);
    g.fillRect(15, 3, 12, 2);
    // Visor slit (detailed)
    g.fillStyle(0x050508, 1);
    g.fillRect(15, 9, 12, 2);
    g.fillStyle(0x0a0a11, 0.6);
    g.fillRect(15, 11, 12, 1);
    // Evil glowing eyes through visor
    g.fillStyle(0xff0044, 0.7);
    g.fillCircle(19, 10, 2);
    g.fillCircle(25, 10, 2);
    g.fillStyle(0xff4488, 1);
    g.fillCircle(19, 10, 1);
    g.fillCircle(25, 10, 1);
    // Eye trail glow
    g.fillStyle(0xff0044, 0.2);
    g.fillRect(15, 9, 3, 1);
    g.fillRect(26, 9, 3, 1);
    // Helmet crest (dark purple spike)
    g.fillStyle(0x880088, 1);
    g.fillRect(19, -2, 4, 6);
    g.fillStyle(0xaa22aa, 0.5);
    g.fillRect(20, -1, 2, 4);
    // Helmet chin guard
    g.fillStyle(0x222233, 0.8);
    g.fillRect(15, 14, 12, 2);
    // Arms (heavy plate)
    g.fillStyle(0x1d1d2e, 1);
    g.fillRect(5, 18, 5, 14);
    g.fillRect(32, 18, 5, 14);
    // Arm plate sections
    g.fillStyle(0x2d2d3e, 0.4);
    g.fillRect(6, 20, 3, 10);
    g.fillRect(33, 20, 3, 10);
    // Elbow guard
    g.fillStyle(0x333344, 0.6);
    g.fillEllipse(7, 24, 4, 3);
    g.fillEllipse(34, 24, 4, 3);
    // Gauntlets (clawed)
    g.fillStyle(0x2d2d3e, 0.9);
    g.fillRect(4, 30, 7, 4);
    g.fillRect(31, 30, 7, 4);
    g.fillStyle(0x333344, 0.5);
    g.fillRect(5, 31, 5, 2);
    g.fillRect(32, 31, 5, 2);
    // Claw tips
    g.fillStyle(0x444455, 0.8);
    g.fillRect(4, 33, 1, 2);
    g.fillRect(6, 33, 1, 2);
    g.fillRect(8, 33, 1, 2);
    g.fillRect(33, 33, 1, 2);
    g.fillRect(35, 33, 1, 2);
    g.fillRect(37, 33, 1, 2);
    // Dark Greatsword (runed, massive)
    g.fillStyle(0x333344, 1);
    g.fillRect(2, 4, 3, 30);
    // Blade fuller
    g.fillStyle(0x444455, 0.5);
    g.fillRect(3, 5, 1, 28);
    // Blade edge highlights
    g.fillStyle(0x555566, 0.35);
    g.fillRect(1, 6, 1, 26);
    g.fillRect(5, 6, 1, 26);
    // Runes on blade (glowing purple)
    g.fillStyle(0xaa44ff, 0.5);
    g.fillRect(3, 10, 1, 2);
    g.fillRect(3, 15, 1, 2);
    g.fillRect(3, 20, 1, 2);
    g.fillRect(3, 25, 1, 2);
    // Crossguard (ornate, dark)
    g.fillStyle(0x660066, 0.8);
    g.fillRect(-1, 4, 10, 2);
    g.fillStyle(0x880088, 0.5);
    g.fillCircle(-1, 5, 1.5);
    g.fillCircle(9, 5, 1.5);
    // Sword tip
    g.fillStyle(0x333344, 1);
    g.fillTriangle(3, 0, 1, 5, 6, 5);
    // Handle
    g.fillStyle(0x220022, 1);
    g.fillRect(2, 32, 3, 4);
    // Pommel (dark gem)
    g.fillStyle(0x440044, 1);
    g.fillCircle(3, 37, 2);
    g.fillStyle(0xaa44ff, 0.5);
    g.fillCircle(3, 37, 1);
    // Chain clasp at cape
    g.fillStyle(0x555566, 0.6);
    g.fillCircle(13, 16, 1.5);
    g.fillCircle(29, 16, 1.5);
    g.fillStyle(0x666677, 0.4);
    g.fillRect(13, 16, 16, 1);
    g.generateTexture("enemy_dark_knight", S, S);
    g.destroy();
  }

  generateDragonTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 56;
    // Double shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(28, 53, 44, 7);
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(28, 52, 38, 5);
    // Heat haze beneath
    g.fillStyle(0xff4400, 0.04);
    g.fillEllipse(28, 50, 30, 8);
    // Tail (thick, segmented)
    g.fillStyle(0xaa1111, 0.85);
    g.fillEllipse(48, 34, 15, 7);
    g.fillEllipse(53, 36, 9, 5);
    // Tail scales
    g.fillStyle(0x991111, 0.4);
    g.fillCircle(46, 34, 2);
    g.fillCircle(50, 35, 1.5);
    // Tail underside
    g.fillStyle(0xdd8844, 0.4);
    g.fillEllipse(48, 36, 10, 3);
    // Tail spikes (spiked ridge)
    g.fillStyle(0x881111, 1);
    g.fillTriangle(46, 29, 44, 34, 48, 34);
    g.fillTriangle(51, 31, 49, 36, 53, 36);
    g.fillTriangle(55, 33, 53, 37, 56, 37);
    // Spike tips
    g.fillStyle(0x661111, 0.6);
    g.fillCircle(46, 30, 1);
    g.fillCircle(51, 32, 0.7);
    // Body (layered, muscular)
    g.fillStyle(0xbb2222, 1);
    g.fillEllipse(26, 32, 40, 24);
    g.fillStyle(0xcc2222, 0.8);
    g.fillEllipse(26, 30, 36, 20);
    // Body scale texture
    g.fillStyle(0xaa1111, 0.3);
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 3; j++) {
        g.fillCircle(12 + i * 5, 26 + j * 5, 2.5);
      }
    }
    // Individual larger scales
    g.fillStyle(0x991111, 0.25);
    for (let i = 0; i < 5; i++) {
      g.fillEllipse(14 + i * 6, 30, 3, 4);
    }
    // Belly plates (segmented, golden)
    g.fillStyle(0xdd8844, 0.75);
    g.fillEllipse(26, 37, 28, 13);
    // Belly segments
    g.fillStyle(0xcc7733, 0.45);
    for (let i = 0; i < 5; i++) {
      g.fillEllipse(18 + i * 4, 37, 3.5, 11);
    }
    // Belly highlight
    g.fillStyle(0xeeaa55, 0.25);
    g.fillEllipse(26, 35, 16, 6);
    // Dorsal spikes (larger, more defined)
    g.fillStyle(0x991111, 0.92);
    for (let i = 0; i < 6; i++) {
      const sz = i === 2 || i === 3 ? 8 : 6;
      g.fillTriangle(12 + i * 5, 18 - (sz - 6), 10 + i * 5, 26, 14 + i * 5, 26);
    }
    // Spike highlights
    g.fillStyle(0xcc4444, 0.3);
    for (let i = 0; i < 6; i++) {
      g.fillRect(12 + i * 5, 21, 1, 4);
    }
    // Wings (larger, membrane visible)
    g.fillStyle(0x991111, 0.75);
    g.fillTriangle(8, 12, -6, 32, 22, 32);
    g.fillTriangle(40, 12, 56, 32, 28, 32);
    // Wing membrane (translucent)
    g.fillStyle(0xcc4444, 0.3);
    g.fillTriangle(8, 14, -4, 30, 20, 30);
    g.fillTriangle(40, 14, 52, 30, 30, 30);
    // Wing veins/bones
    g.fillStyle(0x881111, 0.55);
    g.fillRect(4, 16, 1, 14);
    g.fillRect(10, 16, 1, 14);
    g.fillRect(16, 18, 1, 12);
    g.fillRect(34, 16, 1, 14);
    g.fillRect(40, 16, 1, 14);
    g.fillRect(46, 18, 1, 12);
    // Wing vein tips
    g.fillStyle(0xcc3333, 0.4);
    g.fillCircle(4, 15, 1);
    g.fillCircle(10, 15, 1);
    g.fillCircle(40, 15, 1);
    g.fillCircle(46, 15, 1);
    // Wing claws at joints
    g.fillStyle(0x333333, 0.8);
    g.fillTriangle(8, 10, 6, 14, 10, 14);
    g.fillTriangle(40, 10, 38, 14, 42, 14);
    // Legs (thick, muscular, clawed)
    g.fillStyle(0xaa2222, 1);
    g.fillRect(13, 40, 7, 11);
    g.fillRect(30, 40, 7, 11);
    // Leg muscle definition
    g.fillStyle(0xbb3333, 0.4);
    g.fillRect(15, 41, 3, 6);
    g.fillRect(32, 41, 3, 6);
    g.fillStyle(0x882222, 0.35);
    g.fillRect(14, 43, 2, 5);
    g.fillRect(31, 43, 2, 5);
    // Leg scales
    g.fillStyle(0x991111, 0.3);
    g.fillCircle(16, 43, 1.5);
    g.fillCircle(16, 46, 1.5);
    g.fillCircle(33, 43, 1.5);
    g.fillCircle(33, 46, 1.5);
    // Claws (sharp, multiple, detailed)
    g.fillStyle(0x222222, 1);
    g.fillTriangle(13, 50, 11, 55, 15, 51);
    g.fillTriangle(16, 50, 14, 55, 18, 51);
    g.fillTriangle(19, 50, 17, 55, 21, 51);
    g.fillTriangle(30, 50, 28, 55, 32, 51);
    g.fillTriangle(33, 50, 31, 55, 35, 51);
    g.fillTriangle(36, 50, 34, 55, 38, 51);
    // Claw tips
    g.fillStyle(0x444444, 0.6);
    g.fillCircle(12, 54, 0.5);
    g.fillCircle(15, 54, 0.5);
    g.fillCircle(18, 54, 0.5);
    g.fillCircle(29, 54, 0.5);
    g.fillCircle(32, 54, 0.5);
    g.fillCircle(35, 54, 0.5);
    // Head (fearsome, with snout)
    g.fillStyle(0xcc2222, 1);
    g.fillRoundedRect(5, 5, 22, 20, 5);
    // Head scale texture
    g.fillStyle(0xbb1111, 0.3);
    g.fillCircle(10, 10, 2);
    g.fillCircle(20, 10, 2);
    g.fillCircle(15, 8, 2);
    // Horns (ridged, prominent)
    g.fillStyle(0x444444, 1);
    g.fillTriangle(7, -2, 5, 10, 12, 10);
    g.fillTriangle(25, -2, 18, 10, 27, 10);
    // Horn ridges
    g.fillStyle(0x666666, 0.45);
    g.fillRect(8, 1, 1, 7);
    g.fillRect(24, 1, 1, 7);
    g.fillStyle(0x555555, 0.3);
    g.fillRect(9, 3, 1, 5);
    g.fillRect(23, 3, 1, 5);
    // Horn tips
    g.fillStyle(0x777777, 0.5);
    g.fillCircle(7, -1, 1);
    g.fillCircle(25, -1, 1);
    // Brow ridges (armored head plates)
    g.fillStyle(0xaa1111, 0.8);
    g.fillRect(6, 8, 8, 3);
    g.fillRect(18, 8, 8, 3);
    // Snout (detailed, armored)
    g.fillStyle(0xbb2222, 1);
    g.fillRoundedRect(3, 14, 16, 12, 3);
    // Snout plates
    g.fillStyle(0xaa1111, 0.4);
    g.fillRect(5, 15, 12, 2);
    g.fillRect(5, 19, 12, 2);
    // Nostrils (flaming)
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(6, 17, 2.5);
    g.fillCircle(14, 17, 2.5);
    g.fillStyle(0xffaa00, 0.6);
    g.fillCircle(6, 17, 1.5);
    g.fillCircle(14, 17, 1.5);
    // Fire breath particles
    g.fillStyle(0xff4400, 0.5);
    g.fillCircle(4, 20, 2);
    g.fillCircle(2, 22, 1.5);
    g.fillStyle(0xffaa00, 0.35);
    g.fillCircle(3, 24, 2);
    g.fillCircle(1, 21, 1);
    g.fillStyle(0xffcc00, 0.2);
    g.fillCircle(5, 25, 1.5);
    g.fillCircle(0, 23, 1);
    // Teeth (sharp, visible rows)
    g.fillStyle(0xffffff, 0.85);
    g.fillTriangle(5, 23, 4, 27, 6, 27);
    g.fillTriangle(8, 23, 7, 27, 9, 27);
    g.fillTriangle(11, 23, 10, 27, 12, 27);
    g.fillTriangle(14, 23, 13, 27, 15, 27);
    // Lower teeth
    g.fillStyle(0xeeeeee, 0.6);
    g.fillTriangle(6, 27, 5, 24, 7, 24);
    g.fillTriangle(10, 27, 9, 24, 11, 24);
    g.fillTriangle(13, 27, 12, 24, 14, 24);
    // Eyes (bright, fearsome, cat-pupil)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(10, 12, 6, 5);
    g.fillEllipse(22, 12, 6, 5);
    g.fillStyle(0xffcc00, 1);
    g.fillEllipse(10, 12, 5, 4);
    g.fillEllipse(22, 12, 5, 4);
    // Slit pupils
    g.fillStyle(0x000000, 1);
    g.fillEllipse(10, 12, 1.5, 3.5);
    g.fillEllipse(22, 12, 1.5, 3.5);
    // Eye inner glow
    g.fillStyle(0xffee44, 0.4);
    g.fillCircle(10, 12, 3);
    g.fillCircle(22, 12, 3);
    // Eye shine
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(9, 11, 0.7);
    g.fillCircle(21, 11, 0.7);
    // Back arm/foreleg visible
    g.fillStyle(0xbb2222, 0.7);
    g.fillRect(7, 26, 5, 8);
    g.fillRect(22, 26, 5, 8);
    g.generateTexture("enemy_dragon", S, S);
    g.destroy();
  }

  // ========================
  // NPC GENERATOR — Ultra-detailed robed figure
  // ========================
  generateNpcTexture(key: string, baseColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 48;
    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(24, 45, 20, 5);
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(24, 46, 16, 4);

    // Robe (full-length, layered)
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(13, 16, 22, 28, 5);
    // Robe inner fold
    g.fillStyle(this.darken(baseColor, 20), 0.5);
    g.fillRect(22, 20, 2, 22);
    // Robe outer fold right
    g.fillStyle(this.darken(baseColor, 15), 0.35);
    g.fillRect(30, 22, 2, 18);
    // Robe shading (lower)
    g.fillStyle(this.darken(baseColor, 30), 0.4);
    g.fillRect(15, 32, 18, 10);
    // Robe hem
    g.fillStyle(this.darken(baseColor, 10), 0.6);
    g.fillRect(13, 42, 22, 2);
    // Robe embroidered edge
    g.fillStyle(0xddaa22, 0.5);
    g.fillRect(13, 43, 22, 1);
    // Robe collar
    g.fillStyle(this.darken(baseColor, 12), 0.7);
    g.fillRect(17, 16, 14, 3);
    g.fillStyle(0xddaa22, 0.4);
    g.fillRect(17, 16, 14, 1);

    // Sash/belt
    g.fillStyle(0x8b2252, 1);
    g.fillRect(15, 28, 18, 3);
    g.fillStyle(0x9b3262, 0.5);
    g.fillRect(16, 29, 16, 1);
    // Sash knot
    g.fillStyle(0x8b2252, 0.8);
    g.fillCircle(24, 30, 2);
    g.fillStyle(0x7b1242, 0.4);
    g.fillCircle(24, 30, 1);
    // Sash tassels
    g.fillStyle(0x8b2252, 0.6);
    g.fillRect(22, 31, 2, 5);
    g.fillRect(25, 31, 2, 4);

    // Sleeves/arms
    g.fillStyle(baseColor, 1);
    g.fillRect(10, 18, 5, 14);
    g.fillRect(33, 18, 5, 14);
    // Sleeve fold lines
    g.fillStyle(this.darken(baseColor, 18), 0.35);
    g.fillRect(11, 22, 3, 1);
    g.fillRect(11, 26, 3, 1);
    g.fillRect(34, 22, 3, 1);
    g.fillRect(34, 26, 3, 1);
    // Sleeves cuffs
    g.fillStyle(this.darken(baseColor, 8), 0.6);
    g.fillRect(10, 30, 5, 2);
    g.fillRect(33, 30, 5, 2);
    g.fillStyle(0xddaa22, 0.35);
    g.fillRect(10, 30, 5, 1);
    g.fillRect(33, 30, 5, 1);

    // Hands
    g.fillStyle(0xffe0bd, 1);
    g.fillRect(11, 31, 3, 3);
    g.fillRect(34, 31, 3, 3);
    // Finger detail
    g.fillStyle(0xffd5aa, 0.5);
    g.fillRect(11, 33, 1, 1);
    g.fillRect(13, 33, 1, 1);
    g.fillRect(34, 33, 1, 1);
    g.fillRect(36, 33, 1, 1);

    // Feet/sandals
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(15, 42, 7, 4);
    g.fillRect(26, 42, 7, 4);
    // Sandal straps
    g.fillStyle(0x6b4a1b, 0.6);
    g.fillRect(16, 43, 5, 1);
    g.fillRect(27, 43, 5, 1);

    // Neck
    g.fillStyle(0xffe0bd, 1);
    g.fillRect(20, 13, 8, 5);
    // Neck shadow
    g.fillStyle(0xeec9a8, 0.4);
    g.fillRect(20, 16, 8, 2);

    // Head (detailed face)
    g.fillStyle(0xffe0bd, 1);
    g.fillRoundedRect(16, 2, 16, 14, 5);
    // Cheeks
    g.fillStyle(0xff9999, 0.08);
    g.fillCircle(19, 10, 2);
    g.fillCircle(29, 10, 2);
    // Jaw shadow
    g.fillStyle(0xeec9a8, 0.3);
    g.fillRect(17, 13, 14, 2);

    // Hair (silver/gray — wise)
    g.fillStyle(0xaaaaaa, 1);
    g.fillRoundedRect(16, 1, 16, 6, 3);
    g.fillRect(16, 4, 3, 8);
    g.fillRect(29, 4, 3, 8);
    // Hair highlights
    g.fillStyle(0xcccccc, 0.4);
    g.fillRect(18, 2, 4, 2);
    g.fillRect(26, 2, 4, 2);
    // Hair strand lines
    g.fillStyle(0x888888, 0.3);
    g.fillRect(20, 3, 1, 3);
    g.fillRect(27, 3, 1, 3);

    // Eyes (kind, wise — blue)
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(19, 7, 4, 3, 1);
    g.fillRoundedRect(25, 7, 4, 3, 1);
    // Iris
    g.fillStyle(0x4466aa, 1);
    g.fillCircle(21, 8, 1.2);
    g.fillCircle(27, 8, 1.2);
    // Pupil
    g.fillStyle(0x111111, 1);
    g.fillCircle(21, 8, 0.6);
    g.fillCircle(27, 8, 0.6);
    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(20, 7, 0.5);
    g.fillCircle(26, 7, 0.5);
    // Eyelids
    g.fillStyle(0xeec9a8, 0.5);
    g.fillRect(19, 7, 4, 1);
    g.fillRect(25, 7, 4, 1);
    // Eyebrows (kind)
    g.fillStyle(0x999999, 0.8);
    g.fillRect(19, 6, 4, 1);
    g.fillRect(25, 6, 4, 1);

    // Nose
    g.fillStyle(0xeec9a8, 0.7);
    g.fillRect(23, 9, 2, 3);
    g.fillStyle(0xddb99a, 0.5);
    g.fillRect(23, 11, 2, 1);

    // Mouth (gentle smile)
    g.fillStyle(this.darken(0xffe0bd, 40), 0.8);
    g.fillRect(21, 12, 6, 1);
    // Smile curve
    g.fillStyle(this.darken(0xffe0bd, 30), 0.4);
    g.fillRect(20, 12, 1, 1);
    g.fillRect(27, 12, 1, 1);

    // Halo glow (layered, ethereal)
    g.fillStyle(0xffff88, 0.12);
    g.fillCircle(24, 0, 9);
    g.fillStyle(0xffff44, 0.18);
    g.fillCircle(24, 0, 6);
    g.fillStyle(0xffff00, 0.35);
    g.fillEllipse(24, 0, 10, 4);
    // Halo ring
    g.fillStyle(0xffff00, 0.7);
    g.fillRect(19, -2, 10, 2);
    g.fillStyle(0xffffaa, 0.9);
    g.fillRect(20, -1, 8, 1);

    // Staff in back hand
    g.fillStyle(0x7a5a3b, 1);
    g.fillRect(36, 6, 2, 36);
    g.fillStyle(0x6a4a2b, 0.3);
    g.fillRect(37, 10, 1, 28);
    // Staff crystal
    g.fillStyle(0x44ddff, 0.5);
    g.fillCircle(37, 5, 3);
    g.fillStyle(0x88eeff, 0.7);
    g.fillCircle(37, 5, 2);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(36, 4, 0.7);

    // Book/scroll held in left hand
    g.fillStyle(0x664422, 0.8);
    g.fillRect(8, 28, 5, 7);
    g.fillStyle(0xeeddbb, 0.6);
    g.fillRect(9, 29, 3, 5);
    // Page lines
    g.fillStyle(0x664422, 0.2);
    g.fillRect(9, 30, 3, 0.5);
    g.fillRect(9, 31, 3, 0.5);
    g.fillRect(9, 32, 3, 0.5);

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
    this.genDecoTreeLarge();
    this.genDecoTreeWillow();
    this.genDecoTreeDead();
    this.genDecoPine();
    this.genDecoPineLarge();
    this.genDecoBush();
    this.genDecoBushBerry();
    this.genDecoFlower(0xff4444, "deco_flower_red");
    this.genDecoFlower(0xffdd44, "deco_flower_yellow");
    this.genDecoFlower(0x6688ff, "deco_flower_blue");
    this.genDecoFlower(0xdd44dd, "deco_flower_purple");
    this.genDecoRock();
    this.genDecoBoulder();
    this.genDecoMountain();
    this.genDecoCliff();
    this.genDecoFountain();
    this.genDecoWell();
    this.genDecoFence();
    this.genDecoFenceStone();
    this.genDecoTorch();
    this.genDecoLantern();
    this.genDecoMushroom();
    this.genDecoMushroomGlow();
    this.genDecoBones();
    this.genDecoBarrel();
    this.genDecoCrate();
    this.genDecoBanner("deco_banner_red", 0xcc2222);
    this.genDecoBanner("deco_banner_blue", 0x2244cc);
    this.genDecoBanner("deco_banner_green", 0x22aa44);
    this.genDecoStump();
    this.genDecoLog();
    this.genDecoHaystack();
    this.genDecoPillar();
    this.genDecoPillarRuined();
    this.genDecoCampfire();
    this.genDecoTent();
    this.genDecoTombstone();
    this.genDecoSignpost();
    this.genDecoStatue();
    this.genDecoBridge();
    this.genDecoWaterfall();
    this.genDecoCart();
    this.genDecoCrystal();
    this.genDecoWeb();
    this.genDecoRuinedWall();
    this.genDecoVine();
    this.genDecoWheat();
    this.genDecoWindmill();
    this.genDecoHouseSmall();
    this.genDecoChest();
    this.genDecoShrineGlow();
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

  genDecoPillarRuined() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x666666, 1);
    g.fillRect(2, 20, 12, 4);
    g.fillStyle(0x777777, 1);
    g.fillRect(4, 8, 8, 16);
    g.fillStyle(0x888888, 0.4);
    g.fillRect(5, 9, 3, 14);
    g.fillStyle(0x555555, 0.5);
    g.fillRect(8, 6, 3, 3);
    g.fillRect(3, 8, 2, 2);
    g.fillStyle(0x446644, 0.4);
    g.fillCircle(6, 18, 3);
    g.generateTexture("deco_pillar_ruined", 16, 26);
    g.destroy();
  }

  genDecoTreeLarge() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Trunk
    g.fillStyle(0x5a3a1a, 1);
    g.fillRect(18, 40, 12, 28);
    g.fillStyle(0x4a2a0a, 0.6);
    g.fillRect(22, 42, 3, 24);
    // Roots
    g.fillStyle(0x5a3a1a, 0.8);
    g.fillEllipse(16, 66, 8, 4);
    g.fillEllipse(32, 66, 8, 4);
    // Large canopy - layered
    g.fillStyle(0x1a6622, 1);
    g.fillCircle(24, 24, 22);
    g.fillStyle(0x228833, 0.8);
    g.fillCircle(16, 18, 14);
    g.fillCircle(32, 20, 14);
    g.fillCircle(24, 14, 13);
    g.fillStyle(0x33aa44, 0.6);
    g.fillCircle(12, 14, 8);
    g.fillCircle(28, 10, 9);
    g.fillCircle(36, 18, 7);
    g.fillStyle(0x44cc55, 0.35);
    g.fillCircle(14, 10, 5);
    g.fillCircle(30, 8, 4);
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(24, 68, 32, 6);
    g.generateTexture("deco_tree_large", 48, 72);
    g.destroy();
  }

  genDecoTreeWillow() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Trunk
    g.fillStyle(0x664433, 1);
    g.fillRect(14, 28, 8, 20);
    g.fillStyle(0x553322, 0.6);
    g.fillRect(17, 30, 2, 16);
    // Canopy
    g.fillStyle(0x447733, 1);
    g.fillCircle(18, 18, 16);
    g.fillStyle(0x559944, 0.7);
    g.fillCircle(14, 14, 10);
    g.fillCircle(22, 16, 10);
    // Hanging branches (willow)
    g.fillStyle(0x55aa44, 0.5);
    for (let i = 0; i < 6; i++) {
      const bx = 6 + i * 5;
      g.fillRect(bx, 22, 1, 18 + Math.floor(Math.random() * 8));
    }
    g.fillStyle(0x66bb55, 0.3);
    for (let i = 0; i < 4; i++) {
      const bx = 8 + i * 6;
      g.fillRect(bx, 26, 1, 14 + Math.floor(Math.random() * 6));
    }
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(18, 48, 26, 4);
    g.generateTexture("deco_tree_willow", 36, 52);
    g.destroy();
  }

  genDecoTreeDead() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Trunk
    g.fillStyle(0x554433, 1);
    g.fillRect(10, 14, 6, 24);
    g.fillStyle(0x443322, 0.6);
    g.fillRect(12, 16, 2, 20);
    // Dead branches
    g.fillStyle(0x554433, 1);
    g.fillRect(6, 10, 14, 2);
    g.fillRect(4, 8, 2, 6);
    g.fillRect(18, 6, 2, 8);
    g.fillRect(8, 4, 2, 8);
    g.fillRect(16, 2, 2, 10);
    g.fillRect(2, 12, 4, 2);
    g.fillRect(20, 10, 4, 2);
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(13, 38, 16, 3);
    g.generateTexture("deco_tree_dead", 26, 40);
    g.destroy();
  }

  genDecoPineLarge() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillRect(14, 50, 6, 18);
    g.fillStyle(0x0f4422, 1);
    g.fillTriangle(17, 8, 0, 50, 34, 50);
    g.fillStyle(0x1a5533, 0.9);
    g.fillTriangle(17, 2, 4, 34, 30, 34);
    g.fillStyle(0x227744, 0.8);
    g.fillTriangle(17, 0, 8, 22, 26, 22);
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(14, 0, 6, 3);
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(17, 67, 22, 4);
    g.generateTexture("deco_pine_large", 34, 70);
    g.destroy();
  }

  genDecoBushBerry() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x337733, 1);
    g.fillEllipse(10, 10, 18, 14);
    g.fillStyle(0x449944, 0.7);
    g.fillEllipse(8, 8, 10, 8);
    g.fillStyle(0x226622, 0.5);
    g.fillEllipse(13, 12, 8, 6);
    // Berries
    g.fillStyle(0xcc2244, 1);
    g.fillCircle(6, 7, 1.5);
    g.fillCircle(14, 6, 1.5);
    g.fillCircle(10, 10, 1.5);
    g.fillCircle(4, 11, 1);
    g.generateTexture("deco_bush_berry", 20, 16);
    g.destroy();
  }

  genDecoMountain() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 128, H = 112;
    // Base shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(W / 2, H - 2, W - 6, 10);

    // === MAIN PEAK (center-tall) ===
    // Base snow field
    g.fillStyle(0x9999aa, 1);
    g.fillTriangle(W / 2, 0, 4, H - 6, W - 4, H - 6);
    // Right side (bright)
    g.fillStyle(0x888899, 0.9);
    g.fillTriangle(W / 2, 0, W / 2, H - 6, W - 4, H - 6);
    // Left shadow face
    g.fillStyle(0x4a4a55, 0.85);
    g.fillTriangle(W / 2, 0, 4, H - 6, W / 2, H - 6);

    // === ROCKY TEXTURE LAYERS ===
    // Horizontal strata lines (light)
    g.fillStyle(0xaaaaaa, 0.25);
    g.fillRect(W / 2 - 20, 55, 40, 2);
    g.fillRect(W / 2 - 28, 68, 56, 2);
    g.fillRect(W / 2 - 35, 80, 70, 2);
    g.fillRect(W / 2 - 42, 90, 84, 2);
    // Dark crevices
    g.fillStyle(0x222222, 0.35);
    g.fillRect(W / 2 - 14, 42, 3, 8);
    g.fillRect(W / 2 + 6, 52, 2, 10);
    g.fillRect(W / 2 - 22, 62, 3, 7);
    g.fillRect(W / 2 + 16, 70, 2, 9);
    g.fillRect(W / 2 - 30, 75, 4, 6);
    g.fillRect(W / 2 + 24, 80, 3, 6);
    // Rock ledge highlights
    g.fillStyle(0xcccccc, 0.3);
    g.fillRect(W / 2 + 8, 60, 18, 3);
    g.fillRect(W / 2 - 26, 72, 14, 3);
    g.fillRect(W / 2 + 14, 85, 22, 3);
    g.fillRect(W / 2 - 34, 88, 16, 3);

    // === LEFT SHOULDER PEAK ===
    g.fillStyle(0x7a7a88, 1);
    g.fillTriangle(18, 24, 4, H - 6, W / 2 - 4, H - 6);
    g.fillStyle(0x333340, 0.7);
    g.fillTriangle(18, 24, 4, H - 6, 18, H - 6);
    g.fillStyle(0x999999, 0.3);
    g.fillRect(8, 70, 18, 2);
    g.fillRect(6, 82, 24, 2);

    // === RIGHT SHOULDER PEAK ===
    g.fillStyle(0x7a7a88, 1);
    g.fillTriangle(W - 18, 28, W / 2 + 4, H - 6, W - 4, H - 6);
    g.fillStyle(0x555560, 0.6);
    g.fillTriangle(W - 18, 28, W / 2 + 4, H - 6, W - 18, H - 6);
    g.fillStyle(0xbbbbbb, 0.25);
    g.fillRect(W - 36, 74, 20, 2);
    g.fillRect(W - 42, 86, 28, 2);

    // === SNOW CAPS ===
    // Main peak: layered snow
    g.fillStyle(0xddeeff, 1);
    g.fillTriangle(W / 2, 0, W / 2 - 18, 30, W / 2 + 18, 30);
    g.fillStyle(0xeef6ff, 0.85);
    g.fillTriangle(W / 2, 0, W / 2 - 12, 22, W / 2 + 12, 22);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(W / 2, 0, W / 2 - 7, 14, W / 2 + 7, 14);
    // Snow drip highlights along right side
    g.fillStyle(0xddeeff, 0.7);
    g.fillTriangle(W / 2 + 4, 22, W / 2 + 18, 30, W / 2 + 10, 36);
    g.fillTriangle(W / 2 + 6, 38, W / 2 + 20, 45, W / 2 + 14, 52);

    // Left shoulder snow
    g.fillStyle(0xddeeff, 0.9);
    g.fillTriangle(18, 24, 12, 38, 26, 36);
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(18, 24, 14, 32, 22, 31);

    // Right shoulder snow
    g.fillStyle(0xddeeff, 0.9);
    g.fillTriangle(W - 18, 28, W - 12, 42, W - 26, 40);
    g.fillStyle(0xffffff, 0.7);
    g.fillTriangle(W - 18, 28, W - 14, 36, W - 22, 35);

    // === BASE ROCKS & SCREE ===
    g.fillStyle(0x555544, 0.8);
    g.fillRect(8, H - 12, 20, 6);
    g.fillRect(W - 34, H - 10, 18, 5);
    g.fillRect(W / 2 - 8, H - 10, 16, 5);
    g.fillStyle(0x444433, 0.5);
    g.fillRect(12, H - 8, 8, 4);
    g.fillRect(W - 26, H - 7, 10, 4);
    g.fillRect(W / 2 - 4, H - 7, 8, 4);

    g.generateTexture("deco_mountain", W, H);
    g.destroy();
  }

  genDecoCliff() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 48, H = 32;
    // Cliff face
    g.fillStyle(0x665544, 1);
    g.fillRect(0, 4, W, H - 4);
    // Top edge
    g.fillStyle(0x776655, 1);
    g.fillRect(0, 0, W, 6);
    // Grass on top
    g.fillStyle(0x3a7d44, 0.8);
    g.fillRect(0, 0, W, 4);
    g.fillStyle(0x2d6b35, 0.5);
    for (let i = 0; i < 8; i++) {
      g.fillRect(i * 6 + 2, 3, 1, 2);
    }
    // Rock layers
    g.fillStyle(0x554433, 0.5);
    g.fillRect(0, 12, W, 1);
    g.fillRect(0, 20, W, 1);
    g.fillStyle(0x887766, 0.3);
    g.fillRect(4, 8, 12, 3);
    g.fillRect(24, 16, 14, 3);
    g.fillRect(8, 24, 16, 3);
    g.generateTexture("deco_cliff", W, H);
    g.destroy();
  }

  genDecoFenceStone() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x666666, 1);
    g.fillRect(0, 6, 32, 10);
    g.fillStyle(0x777777, 0.6);
    g.fillRect(0, 4, 32, 4);
    g.fillStyle(0x555555, 0.4);
    g.fillRect(0, 12, 32, 3);
    // Moss patches
    g.fillStyle(0x446644, 0.4);
    g.fillCircle(8, 10, 3);
    g.fillCircle(24, 8, 2);
    g.generateTexture("deco_fence_stone", 32, 18);
    g.destroy();
  }

  genDecoLantern() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Post
    g.fillStyle(0x555555, 1);
    g.fillRect(5, 8, 2, 16);
    // Arm
    g.fillRect(5, 8, 5, 2);
    // Lantern body
    g.fillStyle(0x333333, 1);
    g.fillRect(8, 6, 4, 8);
    // Glass / glow
    g.fillStyle(0xffaa44, 0.4);
    g.fillCircle(10, 10, 5);
    g.fillStyle(0xffcc66, 0.8);
    g.fillRect(9, 7, 2, 6);
    g.fillStyle(0xffffaa, 0.6);
    g.fillCircle(10, 10, 2);
    g.generateTexture("deco_lantern", 14, 26);
    g.destroy();
  }

  genDecoMushroomGlow() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xddddbb, 1);
    g.fillRect(5, 8, 4, 6);
    // Glow
    g.fillStyle(0x44ddff, 0.15);
    g.fillCircle(7, 6, 8);
    // Cap
    g.fillStyle(0x2288cc, 1);
    g.fillEllipse(7, 6, 12, 8);
    g.fillStyle(0x44aaee, 0.6);
    g.fillEllipse(6, 5, 8, 5);
    // Spots
    g.fillStyle(0xaaeeff, 0.8);
    g.fillCircle(4, 5, 1);
    g.fillCircle(9, 4, 1);
    g.fillCircle(7, 7, 0.8);
    g.generateTexture("deco_mushroom_glow", 14, 16);
    g.destroy();
  }

  genDecoLog() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x664422, 1);
    g.fillRoundedRect(0, 4, 28, 8, 3);
    g.fillStyle(0x553311, 0.5);
    g.fillRect(2, 6, 24, 2);
    // Cut end
    g.fillStyle(0x997744, 1);
    g.fillCircle(27, 8, 4);
    g.fillStyle(0x886633, 0.6);
    g.fillCircle(27, 8, 2);
    g.fillStyle(0x775522, 0.4);
    g.fillCircle(27, 8, 1);
    g.generateTexture("deco_log", 32, 14);
    g.destroy();
  }

  genDecoCampfire() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 24;
    // Glow
    g.fillStyle(0xff6600, 0.12);
    g.fillCircle(S / 2, S / 2, 12);
    g.fillStyle(0xff8800, 0.08);
    g.fillCircle(S / 2, S / 2, 16);
    // Logs
    g.fillStyle(0x553322, 1);
    g.fillRect(4, 14, 5, 3);
    g.fillRect(15, 14, 5, 3);
    g.fillRect(8, 16, 8, 2);
    g.fillStyle(0x442211, 0.6);
    g.fillRect(6, 15, 3, 1);
    g.fillRect(16, 15, 3, 1);
    // Rocks ring
    g.fillStyle(0x666666, 0.7);
    for (let a = 0; a < 6; a++) {
      const rx = S / 2 + Math.cos(a * Math.PI / 3) * 8;
      const ry = S / 2 + 2 + Math.sin(a * Math.PI / 3) * 5;
      g.fillCircle(rx, ry, 2);
    }
    // Fire
    g.fillStyle(0xff4400, 0.9);
    g.fillTriangle(12, 6, 8, 16, 16, 16);
    g.fillStyle(0xff8800, 0.8);
    g.fillTriangle(12, 8, 9, 14, 15, 14);
    g.fillStyle(0xffcc00, 0.7);
    g.fillTriangle(12, 9, 10, 13, 14, 13);
    g.fillStyle(0xffffaa, 0.5);
    g.fillCircle(12, 12, 2);
    g.generateTexture("deco_campfire", S, S);
    g.destroy();
  }

  genDecoTent() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 36, H = 28;
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(W / 2, H - 1, W - 4, 4);
    // Tent body
    g.fillStyle(0x886644, 1);
    g.fillTriangle(W / 2, 2, 2, H - 4, W - 2, H - 4);
    // Light face
    g.fillStyle(0x997755, 0.6);
    g.fillTriangle(W / 2, 2, W / 2, H - 4, W - 2, H - 4);
    // Opening
    g.fillStyle(0x332211, 0.8);
    g.fillTriangle(W / 2, 8, W / 2 - 6, H - 4, W / 2 + 6, H - 4);
    // Pole tip
    g.fillStyle(0x664422, 1);
    g.fillRect(W / 2 - 1, 0, 2, 4);
    // Rope lines
    g.fillStyle(0x554433, 0.3);
    g.fillRect(W / 2 - 8, H / 2, 1, H / 2 - 2);
    g.fillRect(W / 2 + 8, H / 2, 1, H / 2 - 2);
    g.generateTexture("deco_tent", W, H);
    g.destroy();
  }

  genDecoTombstone() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(8, 19, 14, 3);
    // Stone
    g.fillStyle(0x777777, 1);
    g.fillRoundedRect(2, 2, 12, 16, { tl: 4, tr: 4, bl: 0, br: 0 });
    // Shading
    g.fillStyle(0x666666, 0.5);
    g.fillRect(3, 8, 10, 8);
    // Cross engraving
    g.fillStyle(0x888888, 0.8);
    g.fillRect(7, 4, 2, 8);
    g.fillRect(5, 6, 6, 2);
    // Moss
    g.fillStyle(0x446644, 0.4);
    g.fillCircle(4, 16, 2);
    g.generateTexture("deco_tombstone", 16, 22);
    g.destroy();
  }

  genDecoSignpost() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Post
    g.fillStyle(0x664422, 1);
    g.fillRect(7, 6, 3, 20);
    // Sign board
    g.fillStyle(0x8b6914, 1);
    g.fillRect(0, 4, 16, 8);
    g.fillStyle(0x9b7924, 0.6);
    g.fillRect(1, 5, 14, 6);
    // Arrow shape at right
    g.fillStyle(0x8b6914, 1);
    g.fillTriangle(16, 8, 14, 4, 14, 12);
    // Text lines
    g.fillStyle(0x332211, 0.6);
    g.fillRect(2, 6, 10, 1);
    g.fillRect(3, 9, 8, 1);
    g.generateTexture("deco_signpost", 18, 28);
    g.destroy();
  }

  genDecoStatue() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 20, H = 40;
    // Base
    g.fillStyle(0x666666, 1);
    g.fillRect(2, H - 6, W - 4, 6);
    g.fillStyle(0x777777, 0.6);
    g.fillRect(3, H - 8, W - 6, 4);
    // Body
    g.fillStyle(0x888888, 1);
    g.fillRect(7, 14, 6, 18);
    // Head
    g.fillCircle(10, 10, 5);
    // Arms - sword raised
    g.fillStyle(0x888888, 1);
    g.fillRect(4, 16, 3, 8);
    g.fillRect(13, 16, 3, 8);
    // Sword
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(14, 4, 2, 14);
    g.fillStyle(0xbbbbbb, 0.5);
    g.fillRect(15, 5, 1, 12);
    g.fillStyle(0x888888, 1);
    g.fillRect(12, 12, 6, 2);
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(W / 2, H - 1, 16, 3);
    g.generateTexture("deco_statue", W, H);
    g.destroy();
  }

  genDecoBridge() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 128, H = 56;

    // === STONE ARCH SUPPORTS (LEFT) ===
    g.fillStyle(0x888880, 1);
    g.fillRect(0, 22, 20, H - 22);
    g.fillStyle(0x777770, 0.7);
    g.fillRect(0, 24, 18, H - 26);
    // Arch cutout (left)
    g.fillStyle(0x4488cc, 0.7);
    g.fillEllipse(10, 38, 12, 16);

    // === STONE ARCH SUPPORTS (RIGHT) ===
    g.fillStyle(0x888880, 1);
    g.fillRect(W - 20, 22, 20, H - 22);
    g.fillStyle(0x777770, 0.7);
    g.fillRect(W - 18, 24, 18, H - 26);
    // Arch cutout (right)
    g.fillStyle(0x4488cc, 0.7);
    g.fillEllipse(W - 10, 38, 12, 16);

    // === CENTRAL PIER ===
    g.fillStyle(0x888880, 1);
    g.fillRect(W / 2 - 9, 26, 18, H - 26);
    g.fillStyle(0x777770, 0.6);
    g.fillRect(W / 2 - 7, 28, 14, H - 30);

    // === BRIDGE DECK (main walkable surface) ===
    g.fillStyle(0x9b7540, 1);
    g.fillRect(0, 18, W, 20);
    // Plank lines (horizontal boards)
    g.fillStyle(0x7a5520, 0.55);
    for (let i = 0; i < 20; i++) {
      g.fillRect(i * 6 + 1, 18, 1, 20);
    }
    // Center board worn darker
    g.fillStyle(0x6a4810, 0.3);
    g.fillRect(0, 25, W, 6);
    // Light grain highlight
    g.fillStyle(0xccaa66, 0.25);
    g.fillRect(0, 19, W, 3);

    // === LEFT STONE PARAPET ===
    g.fillStyle(0x999988, 1);
    g.fillRect(0, 10, W, 9);
    g.fillStyle(0x777766, 0.5);
    g.fillRect(0, 13, W, 4);
    // Parapet stone block divisions
    g.fillStyle(0x666655, 0.6);
    for (let i = 0; i < 9; i++) {
      g.fillRect(i * 14 + 1, 10, 1, 9);
    }
    // === RIGHT STONE PARAPET ===
    g.fillStyle(0x999988, 1);
    g.fillRect(0, 37, W, 9);
    g.fillStyle(0x777766, 0.5);
    g.fillRect(0, 37, W, 4);
    g.fillStyle(0x666655, 0.6);
    for (let i = 0; i < 9; i++) {
      g.fillRect(i * 14 + 1, 37, 1, 9);
    }

    // === CORNER POSTS (stone pillars) ===
    // Left corners
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(0, 8, 10, 38);
    g.fillStyle(0x888888, 0.6);
    g.fillRect(2, 8, 6, 38);
    g.fillStyle(0xcccccc, 0.4);
    g.fillRect(1, 8, 2, 38);
    // Right corners
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(W - 10, 8, 10, 38);
    g.fillStyle(0x888888, 0.6);
    g.fillRect(W - 8, 8, 6, 38);
    // Center posts
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(W / 2 - 5, 8, 10, 38);
    g.fillStyle(0x888888, 0.5);
    g.fillRect(W / 2 - 3, 8, 6, 38);

    // === TOP CAPS on pillar posts ===
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(0, 6, 10, 4);
    g.fillRect(W - 10, 6, 10, 4);
    g.fillRect(W / 2 - 5, 6, 10, 4);

    // === MOSS & WEATHERING ===
    g.fillStyle(0x446644, 0.35);
    g.fillRect(4, 30, 6, 8);
    g.fillRect(W - 14, 28, 8, 7);
    g.fillRect(W / 2 - 4, 34, 8, 6);
    g.fillStyle(0x335533, 0.2);
    g.fillEllipse(8, 48, 14, 6);
    g.fillEllipse(W - 8, 48, 14, 6);

    g.generateTexture("deco_bridge", W, H);
    g.destroy();
  }

  genDecoWaterfall() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 32, H = 48;
    // Cliff top
    g.fillStyle(0x665544, 1);
    g.fillRect(0, 0, W, 8);
    g.fillStyle(0x3a7d44, 0.7);
    g.fillRect(0, 0, W, 4);
    // Water stream
    g.fillStyle(0x4488cc, 0.7);
    g.fillRect(8, 6, 16, H - 12);
    g.fillStyle(0x66aaee, 0.5);
    g.fillRect(10, 8, 12, H - 16);
    g.fillStyle(0x88ccff, 0.4);
    g.fillRect(12, 10, 8, H - 20);
    // White foam/spray
    g.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 6; i++) {
      g.fillRect(10 + Math.floor(Math.random() * 12), 8 + i * 6, 2, 3);
    }
    // Splash at bottom
    g.fillStyle(0x88bbff, 0.4);
    g.fillEllipse(W / 2, H - 6, 24, 8);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(W / 2 - 4, H - 8, 2);
    g.fillCircle(W / 2 + 4, H - 8, 2);
    g.generateTexture("deco_waterfall", W, H);
    g.destroy();
  }

  genDecoCart() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 32, H = 20;
    // Cart body
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(6, 4, 20, 10);
    g.fillStyle(0x7a4a1b, 0.5);
    g.fillRect(8, 6, 16, 6);
    // Wheels
    g.fillStyle(0x553322, 1);
    g.fillCircle(10, 16, 4);
    g.fillCircle(22, 16, 4);
    g.fillStyle(0x664433, 0.6);
    g.fillCircle(10, 16, 2);
    g.fillCircle(22, 16, 2);
    // Handle
    g.fillStyle(0x664422, 1);
    g.fillRect(0, 8, 7, 2);
    // Contents
    g.fillStyle(0xccaa44, 0.7);
    g.fillEllipse(16, 4, 14, 4);
    g.generateTexture("deco_cart", W, H);
    g.destroy();
  }

  genDecoCrystal() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Glow
    g.fillStyle(0x8844ff, 0.1);
    g.fillCircle(8, 10, 8);
    // Crystal shards
    g.fillStyle(0x8855cc, 1);
    g.fillTriangle(8, 0, 4, 16, 12, 16);
    g.fillStyle(0xaa77ee, 0.7);
    g.fillTriangle(8, 2, 7, 14, 12, 14);
    // Second shard
    g.fillStyle(0x7744bb, 0.8);
    g.fillTriangle(12, 4, 10, 14, 15, 14);
    // Sparkle
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(9, 5, 1);
    g.fillCircle(11, 8, 0.5);
    g.generateTexture("deco_crystal", 16, 18);
    g.destroy();
  }

  genDecoWeb() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 24;
    g.lineStyle(1, 0xcccccc, 0.3);
    // Radial lines
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(S / 2, S / 2, S / 2 + Math.cos(a) * 10, S / 2 + Math.sin(a) * 10);
    }
    // Concentric arcs
    g.lineStyle(1, 0xcccccc, 0.2);
    g.strokeCircle(S / 2, S / 2, 4);
    g.strokeCircle(S / 2, S / 2, 8);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(S / 2, S / 2, 1);
    g.generateTexture("deco_web", S, S);
    g.destroy();
  }

  genDecoRuinedWall() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 32, H = 24;
    // Main wall
    g.fillStyle(0x666655, 1);
    g.fillRect(0, 6, W, H - 6);
    // Damaged top
    g.fillStyle(0x666655, 1);
    g.fillRect(0, 4, 10, 4);
    g.fillRect(14, 2, 8, 6);
    g.fillRect(26, 6, 6, 4);
    // Brick lines
    g.lineStyle(1, 0x555544, 0.4);
    g.strokeRect(0, 10, 16, 6);
    g.strokeRect(16, 10, 16, 6);
    g.strokeRect(8, 16, 16, 6);
    // Vegetation
    g.fillStyle(0x447744, 0.5);
    g.fillCircle(6, 6, 3);
    g.fillCircle(28, 4, 2);
    g.fillStyle(0x55aa44, 0.3);
    g.fillRect(4, 2, 1, 6);
    g.fillRect(26, 0, 1, 6);
    g.generateTexture("deco_ruined_wall", W, H);
    g.destroy();
  }

  genDecoVine() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x337733, 0.8);
    g.fillRect(3, 0, 2, 20);
    g.fillRect(7, 2, 2, 18);
    g.fillStyle(0x449944, 0.6);
    g.fillRect(2, 4, 4, 2);
    g.fillRect(6, 8, 4, 2);
    g.fillRect(1, 12, 4, 2);
    g.fillRect(7, 16, 3, 2);
    // Leaves
    g.fillStyle(0x55bb55, 0.7);
    g.fillCircle(1, 5, 2);
    g.fillCircle(10, 9, 2);
    g.fillCircle(0, 13, 2);
    g.fillCircle(9, 17, 1.5);
    g.generateTexture("deco_vine", 12, 22);
    g.destroy();
  }

  genDecoWheat() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x88773a, 1);
    g.fillRect(3, 4, 1, 10);
    g.fillRect(6, 3, 1, 11);
    g.fillRect(9, 4, 1, 10);
    g.fillStyle(0xccaa44, 1);
    g.fillEllipse(3, 3, 3, 4);
    g.fillEllipse(6, 2, 3, 4);
    g.fillEllipse(9, 3, 3, 4);
    g.fillStyle(0xddbb55, 0.5);
    g.fillCircle(3, 2, 1);
    g.fillCircle(6, 1, 1);
    g.fillCircle(9, 2, 1);
    g.generateTexture("deco_wheat", 12, 16);
    g.destroy();
  }

  genDecoWindmill() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 32, H = 48;
    // Tower
    g.fillStyle(0x998877, 1);
    g.fillRect(10, 16, 12, 30);
    g.fillStyle(0x887766, 0.5);
    g.fillRect(12, 18, 8, 26);
    // Roof
    g.fillStyle(0x664422, 1);
    g.fillTriangle(W / 2, 10, 8, 20, W - 8, 20);
    g.fillStyle(0x553311, 0.5);
    g.fillTriangle(W / 2, 10, 8, 20, W / 2, 20);
    // Door
    g.fillStyle(0x553322, 1);
    g.fillRect(13, 38, 6, 8);
    // Window
    g.fillStyle(0x88aacc, 0.6);
    g.fillRect(14, 26, 4, 4);
    g.fillStyle(0x664422, 1);
    g.fillRect(15.5, 26, 1, 4);
    g.fillRect(14, 27.5, 4, 1);
    // Blades
    g.fillStyle(0x886644, 0.8);
    g.fillRect(W / 2 - 1, 0, 2, 14);
    g.fillRect(W / 2 - 1, 20, 2, 14);
    g.fillRect(2, 16, 12, 2);
    g.fillRect(18, 16, 12, 2);
    // Center
    g.fillStyle(0x555555, 1);
    g.fillCircle(W / 2, 17, 2);
    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(W / 2, H - 1, 20, 3);
    g.generateTexture("deco_windmill", W, H);
    g.destroy();
  }

  genDecoHouseSmall() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 96, H = 88;

    // === GROUND SHADOW ===
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(W / 2, H - 1, W - 10, 8);

    // === FOUNDATION (stone base) ===
    g.fillStyle(0x888877, 1);
    g.fillRect(4, H - 16, W - 8, 16);
    g.fillStyle(0x777766, 0.6);
    // Foundation stone blocks
    for (let i = 0; i < 6; i++) {
      g.fillRect(4 + i * 15, H - 15, 1, 14);
    }
    g.fillRect(4, H - 8, W - 8, 1);

    // === WALLS (main body) ===
    g.fillStyle(0xd4a96a, 1);
    g.fillRect(4, 36, W - 8, H - 52);
    // Wall plaster texture (subtle vertical lines)
    g.fillStyle(0xc49a5a, 0.3);
    for (let i = 0; i < 8; i++) {
      g.fillRect(4 + i * 11, 36, 1, H - 52);
    }
    // Horizontal mortar lines
    g.fillStyle(0xbb8844, 0.25);
    g.fillRect(4, 50, W - 8, 1);
    g.fillRect(4, 62, W - 8, 1);
    g.fillRect(4, 74, W - 8, 1);

    // === HALF-TIMBER FRAMING (dark wood beams) ===
    g.fillStyle(0x553311, 0.85);
    // Corner posts
    g.fillRect(4, 36, 4, H - 52);
    g.fillRect(W - 8, 36, 4, H - 52);
    // Horizontal cross-beam at mid wall
    g.fillRect(4, 56, W - 8, 4);
    // Diagonal brace (left)
    for (let d = 0; d < 28; d++) {
      g.fillRect(4 + d, 36 + d, 1, 3);
    }
    // Diagonal brace (right)
    for (let d = 0; d < 28; d++) {
      g.fillRect(W - 8 - d, 36 + d, 1, 3);
    }

    // === ROOF (broad gabled) ===
    // Roof main face
    g.fillStyle(0x882222, 1);
    g.fillTriangle(W / 2, 2, 0, 38, W, 38);
    // Roof right (lit face)
    g.fillStyle(0x993333, 0.5);
    g.fillTriangle(W / 2, 2, W / 2, 38, W, 38);
    // Roof shingles (horizontal rows)
    g.fillStyle(0x661111, 0.45);
    for (let row = 0; row < 8; row++) {
      const y = 10 + row * 3.5;
      const halfW = (row / 8) * W / 2 + 4;
      g.fillRect(W / 2 - halfW, y, halfW * 2, 1.5);
    }
    // Roof ridge (top cap)
    g.fillStyle(0x553333, 1);
    g.fillRect(W / 2 - 4, 1, 8, 6);
    g.fillStyle(0x775555, 0.8);
    g.fillRect(W / 2 - 3, 0, 6, 3);
    // Eave boards (bottom edge of roof)
    g.fillStyle(0x553311, 1);
    g.fillRect(0, 36, W, 5);
    g.fillStyle(0x442200, 0.4);
    g.fillRect(0, 38, W, 2);

    // === CHIMNEY (left side) ===
    g.fillStyle(0x666655, 1);
    g.fillRect(W - 26, 0, 14, 28);
    g.fillStyle(0x555544, 0.7);
    g.fillRect(W - 24, 2, 10, 22);
    // Chimney cap
    g.fillStyle(0x444433, 1);
    g.fillRect(W - 28, 12, 18, 4);
    // Smoke puff
    g.fillStyle(0xaaaaaa, 0.2);
    g.fillCircle(W - 19, 6, 5);
    g.fillStyle(0xbbbbbb, 0.15);
    g.fillCircle(W - 16, 2, 3);
    // Chimney brick lines
    g.fillStyle(0x7a7a66, 0.4);
    g.fillRect(W - 26, 6, 14, 1);
    g.fillRect(W - 26, 10, 14, 1);

    // === DOOR (arched) ===
    g.fillStyle(0x5a2d0c, 1);
    g.fillRect(W / 2 - 9, H - 30, 18, 30);
    // Door top arch
    g.fillStyle(0x5a2d0c, 1);
    g.fillEllipse(W / 2, H - 30, 18, 10);
    // Door panels
    g.fillStyle(0x4a1e00, 0.6);
    g.fillRect(W / 2 - 8, H - 28, 7, 10);
    g.fillRect(W / 2 + 1, H - 28, 7, 10);
    g.fillRect(W / 2 - 8, H - 16, 7, 10);
    g.fillRect(W / 2 + 1, H - 16, 7, 10);
    // Door knob / iron ring
    g.fillStyle(0xddaa33, 1);
    g.fillCircle(W / 2 + 6, H - 18, 2);
    g.fillStyle(0xffcc44, 0.7);
    g.fillCircle(W / 2 + 6, H - 18, 1);
    // Door frame
    g.fillStyle(0x331500, 0.8);
    g.fillRect(W / 2 - 10, H - 30, 2, 30);
    g.fillRect(W / 2 + 8, H - 30, 2, 30);
    g.fillRect(W / 2 - 10, H - 32, 20, 2);

    // === LEFT WINDOW ===
    g.fillStyle(0x88aadd, 0.85);
    g.fillRect(10, H - 50, 18, 16);
    // Window panes (cross dividers)
    g.fillStyle(0x553311, 0.9);
    g.fillRect(18, H - 50, 2, 16);
    g.fillRect(10, H - 43, 18, 2);
    // Frame
    g.fillStyle(0x553311, 1);
    g.fillRect(8, H - 52, 22, 2);
    g.fillRect(8, H - 34, 22, 2);
    g.fillRect(8, H - 52, 2, 20);
    g.fillRect(28, H - 52, 2, 20);
    // Window light reflection
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(11, H - 49, 5, 6);

    // === RIGHT WINDOW ===
    g.fillStyle(0x88aadd, 0.85);
    g.fillRect(W - 28, H - 50, 18, 16);
    g.fillStyle(0x553311, 0.9);
    g.fillRect(W - 20, H - 50, 2, 16);
    g.fillRect(W - 28, H - 43, 18, 2);
    g.fillStyle(0x553311, 1);
    g.fillRect(W - 30, H - 52, 22, 2);
    g.fillRect(W - 30, H - 34, 22, 2);
    g.fillRect(W - 30, H - 52, 2, 20);
    g.fillRect(W - 10, H - 52, 2, 20);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(W - 27, H - 49, 5, 6);

    // === WINDOW FLOWER BOXES ===
    g.fillStyle(0x7a4a1b, 1);
    g.fillRect(8, H - 34, 22, 5);
    g.fillRect(W - 30, H - 34, 22, 5);
    // Flowers
    g.fillStyle(0xff4444, 0.9);
    g.fillCircle(13, H - 32, 2);
    g.fillCircle(19, H - 33, 2);
    g.fillCircle(25, H - 32, 2);
    g.fillStyle(0xff8800, 0.9);
    g.fillCircle(W - 25, H - 32, 2);
    g.fillCircle(W - 19, H - 33, 2);
    g.fillStyle(0xffee00, 0.9);
    g.fillCircle(W - 13, H - 32, 2);

    // === STEPS at door ===
    g.fillStyle(0x999988, 1);
    g.fillRect(W / 2 - 12, H - 4, 24, 4);
    g.fillStyle(0x888877, 0.7);
    g.fillRect(W / 2 - 10, H - 6, 20, 3);

    g.generateTexture("deco_house_small", W, H);
    g.destroy();
  }

  genDecoChest() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Glow
    g.fillStyle(0xddaa22, 0.1);
    g.fillCircle(8, 8, 8);
    // Body
    g.fillStyle(0x8b5a2b, 1);
    g.fillRoundedRect(1, 4, 14, 10, 2);
    // Lid
    g.fillStyle(0x9b6a3b, 1);
    g.fillRoundedRect(0, 2, 16, 6, { tl: 3, tr: 3, bl: 0, br: 0 });
    // Metal bands
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 7, 16, 1);
    g.fillRect(7, 2, 2, 12);
    // Lock
    g.fillStyle(0xddaa22, 1);
    g.fillCircle(8, 7, 2);
    g.fillStyle(0xcc9922, 0.6);
    g.fillCircle(8, 7, 1);
    g.generateTexture("deco_chest", 16, 16);
    g.destroy();
  }

  genDecoShrineGlow() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const W = 24, H = 32;
    // Glow
    g.fillStyle(0x44aaff, 0.08);
    g.fillCircle(W / 2, H / 2, 14);
    g.fillStyle(0x44aaff, 0.05);
    g.fillCircle(W / 2, H / 2, 18);
    // Base
    g.fillStyle(0x777788, 1);
    g.fillRect(4, H - 6, W - 8, 6);
    g.fillStyle(0x888899, 0.7);
    g.fillRect(5, H - 8, W - 10, 4);
    // Pillar
    g.fillStyle(0x8888aa, 1);
    g.fillRect(9, 8, 6, 18);
    g.fillStyle(0x9999bb, 0.5);
    g.fillRect(10, 9, 3, 16);
    // Orb on top
    g.fillStyle(0x44aaff, 0.6);
    g.fillCircle(W / 2, 6, 5);
    g.fillStyle(0x66ccff, 0.5);
    g.fillCircle(W / 2, 5, 3);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(W / 2 - 1, 4, 1.5);
    g.generateTexture("deco_shrine", W, H);
    g.destroy();
  }

  // ========================
  // TILE GENERATOR (32x32)
  // ========================
  // ========================
  // TILE GENERATOR (32x32) — painted
  // ========================
  generateDetailedTile(_key: string, _c1: number, _c2: number, _type: string) {
    // legacy no-op — replaced by generatePaintedTile
  }

  // ========================
  // PAINTED TILE GENERATOR
  // Uses Canvas 2D API for gradients, compositing, shadows.
  // Result: indie premium RPG look — soft shading, depth, natural light.
  // ========================
  generatePaintedTile(key: string, type: string) {
    const S = 32;
    const tex = this.textures.createCanvas(key, S, S);
    if (!tex) return;
    const ctx = tex.context;
    ctx.imageSmoothingEnabled = false;

    // --- Helpers ---
    const n = (x: number, y: number, s = 1) =>
      Math.abs(Math.sin(x * 127.1 * s + y * 311.7) * 43758.5453) % 1;
    const vignette = (alpha: number) => {
      const vg = ctx.createRadialGradient(S/2, S/2, S * 0.05, S/2, S/2, S * 0.82);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(0,0,0,${alpha})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S);
    };
    const topLight = (alpha: number) => {
      const lg = ctx.createRadialGradient(5, 4, 0, 5, 4, S * 1.3);
      lg.addColorStop(0, `rgba(255,255,230,${alpha})`);
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, S, S);
    };

    switch (type) {
      // ======================================================
      case 'grass': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#4f9558'); g.addColorStop(0.5, '#3d8046'); g.addColorStop(1, '#2e6535');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // soft colour patches
        for (let i = 0; i < 22; i++) {
          const px = n(i, 0) * 30 + 1, py = n(0, i) * 30 + 1, r = n(i, i) * 4 + 1.5;
          ctx.fillStyle = n(i, i*2) > 0.5 ? 'rgba(80,165,90,0.28)' : 'rgba(28,75,35,0.32)';
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
        }
        // grass blades — dark then light
        const drawBlade = (bx: number, by: number, col: string) => {
          ctx.strokeStyle = col; ctx.lineWidth = 0.7;
          const cx2 = bx + (n(bx,by+1)-.5)*3, top = by - 5 - n(bx,by)*3;
          ctx.beginPath(); ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(cx2, by - 3, bx + (n(bx+1,by)-.5)*2, top);
          ctx.stroke();
        };
        for (let i = 0; i < 12; i++) drawBlade(n(i,4)*30+1, n(4,i)*30+1, 'rgba(40,95,48,0.75)');
        for (let i = 0; i < 10; i++) drawBlade(n(i+15,5)*30+1, n(5,i+8)*30+1, 'rgba(100,195,112,0.5)');
        vignette(0.18); topLight(0.12);
        break;
      }
      // ======================================================
      case 'grass_lush': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#5db86a'); g.addColorStop(0.5, '#4ba057'); g.addColorStop(1, '#378544');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 24; i++) {
          const px = n(i, 1) * 30 + 1, py = n(1, i) * 30 + 1, r = n(i+1, i) * 5 + 1.5;
          ctx.fillStyle = n(i, i+3) > 0.5 ? 'rgba(100,200,115,0.32)' : 'rgba(35,100,45,0.3)';
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
        }
        for (let i = 0; i < 13; i++) {
          const bx = n(i,6)*30+1, by = n(6,i)*30+1;
          ctx.strokeStyle = n(i,7) > 0.5 ? 'rgba(120,220,135,0.55)' : 'rgba(50,120,60,0.7)';
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx+(n(i+2,by)-.5)*4, by-4, bx+(n(i+3,by)-.5)*3, by-7);
          ctx.stroke();
        }
        // scattered tiny flowers
        for (let i = 0; i < 5; i++) {
          const fx = n(i,9)*28+2, fy = n(9,i)*28+2;
          ctx.fillStyle = n(i,11) > 0.6 ? 'rgba(255,220,60,0.7)' : 'rgba(255,105,155,0.65)';
          ctx.beginPath(); ctx.arc(fx, fy, 1.2, 0, Math.PI*2); ctx.fill();
        }
        vignette(0.16); topLight(0.14);
        break;
      }
      // ======================================================
      case 'grass_dark': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#2e6e38'); g.addColorStop(0.5, '#245a2d'); g.addColorStop(1, '#1a4520');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = n(i,2) > 0.5 ? 'rgba(50,110,55,0.3)' : 'rgba(12,40,16,0.45)';
          ctx.beginPath(); ctx.arc(n(i,0)*30+1, n(0,i)*30+1, n(i,i)*3.5+1.5, 0, Math.PI*2); ctx.fill();
        }
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = 'rgba(30,75,38,0.85)'; ctx.lineWidth = 0.8;
          const bx = n(i,8)*30+1, by = n(8,i)*30+1;
          ctx.beginPath(); ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx+(n(i+4,by)-.5)*3, by-3, bx, by-6); ctx.stroke();
        }
        // damp dark rim
        const dr = ctx.createLinearGradient(0, S, S, 0);
        dr.addColorStop(0, 'rgba(0,10,5,0.3)'); dr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dr; ctx.fillRect(0, 0, S, S);
        vignette(0.28); topLight(0.08);
        break;
      }
      // ======================================================
      case 'dirt': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#9e7a2a'); g.addColorStop(0.5, '#8a6820'); g.addColorStop(1, '#745516');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // soil texture — mottled patches
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = n(i,3) > 0.55 ? 'rgba(140,100,35,0.35)' : 'rgba(80,50,10,0.3)';
          ctx.beginPath(); ctx.ellipse(n(i,0)*29+1.5, n(0,i)*29+1.5, n(i,i)*4+1, n(i+1,i)*2+0.8, n(i,i+2)*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        // pebbles
        for (let i = 0; i < 5; i++) {
          const px = n(i+5,0)*26+3, py = n(0,i+5)*26+3;
          ctx.fillStyle = 'rgba(120,95,40,0.8)';
          ctx.beginPath(); ctx.ellipse(px, py, 2, 1.3, n(i,10)*Math.PI, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'rgba(180,145,75,0.5)';
          ctx.beginPath(); ctx.arc(px-0.7, py-0.5, 0.8, 0, Math.PI*2); ctx.fill();
        }
        // crack lines
        ctx.strokeStyle = 'rgba(90,60,15,0.55)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(6, 14); ctx.bezierCurveTo(10, 12, 15, 16, 20, 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18, 22); ctx.bezierCurveTo(22, 20, 25, 24, 28, 22); ctx.stroke();
        vignette(0.2); topLight(0.1);
        break;
      }
      // ======================================================
      case 'dirt_dark': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#7a5618'); g.addColorStop(0.5, '#654510'); g.addColorStop(1, '#50360a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = n(i,4) > 0.5 ? 'rgba(110,75,20,0.4)' : 'rgba(55,32,5,0.45)';
          ctx.beginPath(); ctx.ellipse(n(i,1)*29+1.5, n(1,i)*29+1.5, n(i,i+1)*4+1, n(i,i)*2+0.8, n(i,i+3)*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(60,38,8,0.65)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(3, 10); ctx.bezierCurveTo(9, 8, 14, 13, 19, 11); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(15, 22); ctx.bezierCurveTo(20, 20, 25, 24, 29, 21); ctx.stroke();
        vignette(0.3); topLight(0.06);
        break;
      }
      // ======================================================
      case 'stone': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#787878'); g.addColorStop(0.5, '#636363'); g.addColorStop(1, '#4f4f4f');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // stone blocks — staggered brick pattern with bevel
        const blocks = [[0,0,16,11],[16,0,16,11],[8,11,16,10],[0,21,16,11],[16,21,16,11]];
        blocks.forEach(([bx,by,bw,bh]) => {
          // mortar gap
          ctx.fillStyle = 'rgba(40,40,40,0.6)';
          ctx.fillRect(bx, by, bw, bh);
          // block face
          const bf = ctx.createLinearGradient(bx, by, bx+bw, by+bh);
          bf.addColorStop(0, 'rgba(135,130,125,0.7)'); bf.addColorStop(1, 'rgba(85,82,78,0.7)');
          ctx.fillStyle = bf;
          ctx.fillRect(bx+1, by+1, bw-2, bh-2);
          // top highlight
          ctx.fillStyle = 'rgba(190,185,180,0.35)';
          ctx.fillRect(bx+1, by+1, bw-2, 2);
          // bottom shadow
          ctx.fillStyle = 'rgba(30,28,25,0.4)';
          ctx.fillRect(bx+1, by+bh-3, bw-2, 2);
        });
        // chisel texture noise
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = `rgba(${n(i,5)>0.5?200:50},${n(i,5)>0.5?195:48},${n(i,5)>0.5?188:44},0.08)`;
          ctx.fillRect(n(i,0)*30+1, n(0,i)*30+1, 2, 1);
        }
        vignette(0.22); topLight(0.13);
        break;
      }
      // ======================================================
      case 'stone_mossy': {
        // base stone
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#6a7268'); g.addColorStop(1, '#505b4e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        const blocks2 = [[0,0,16,11],[16,0,16,11],[8,11,16,10],[0,21,16,11],[16,21,16,11]];
        blocks2.forEach(([bx,by,bw,bh]) => {
          ctx.fillStyle = 'rgba(35,42,32,0.6)'; ctx.fillRect(bx, by, bw, bh);
          const bf = ctx.createLinearGradient(bx, by, bx+bw, by+bh);
          bf.addColorStop(0, 'rgba(120,135,110,0.7)'); bf.addColorStop(1, 'rgba(70,85,62,0.7)');
          ctx.fillStyle = bf; ctx.fillRect(bx+1, by+1, bw-2, bh-2);
          ctx.fillStyle = 'rgba(155,180,135,0.3)'; ctx.fillRect(bx+1, by+1, bw-2, 2);
          ctx.fillStyle = 'rgba(20,30,18,0.45)'; ctx.fillRect(bx+1, by+bh-3, bw-2, 2);
        });
        // moss patches
        for (let i = 0; i < 14; i++) {
          ctx.fillStyle = `rgba(${45+n(i,6)*30|0},${110+n(6,i)*40|0},${38+n(i+1,i)*20|0},${(n(i,i+4)*0.4+0.2).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(n(i,2)*30+1, n(2,i)*30+1, n(i,i)*4+1.5, 0, Math.PI*2); ctx.fill();
        }
        vignette(0.24); topLight(0.1);
        break;
      }
      // ======================================================
      case 'water': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#2f5bc9'); g.addColorStop(0.5, '#2248a8'); g.addColorStop(1, '#183688');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // caustic light ripples
        for (let i = 0; i < 4; i++) {
          const wy = 5 + i * 7, wx = 6 + n(i,0) * 18;
          const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 6+n(i,1)*4);
          wg.addColorStop(0, 'rgba(120,180,255,0.35)');
          wg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = wg; ctx.fillRect(0, 0, S, S);
        }
        // surface sheen lines
        ctx.strokeStyle = 'rgba(140,195,255,0.4)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 4; i++) {
          const wy = 4 + i * 7;
          ctx.beginPath();
          ctx.moveTo(3, wy); ctx.quadraticCurveTo(S/2 + (n(i,3)-.5)*8, wy-2, S-3, wy+1);
          ctx.stroke();
        }
        // specular glint top-left
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.ellipse(7, 6, 3, 1.2, -0.3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(22, 12, 2, 0.9, -0.2, 0, Math.PI*2); ctx.fill();
        vignette(0.18); topLight(0.06);
        break;
      }
      // ======================================================
      case 'water_deep': {
        const g = ctx.createLinearGradient(0, 0, 0, S);
        g.addColorStop(0, '#1b358f'); g.addColorStop(0.6, '#112068'); g.addColorStop(1, '#090f3f');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // faint caustic ripples
        for (let i = 0; i < 3; i++) {
          const wg = ctx.createRadialGradient(8+n(i,0)*16, 6+n(0,i)*20, 0, 8+n(i,0)*16, 6+n(0,i)*20, 5);
          wg.addColorStop(0, 'rgba(60,100,200,0.25)');
          wg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = wg; ctx.fillRect(0, 0, S, S);
        }
        ctx.strokeStyle = 'rgba(60,100,200,0.25)'; ctx.lineWidth = 0.6;
        for (let i = 0; i < 3; i++) {
          const wy = 6 + i * 9;
          ctx.beginPath(); ctx.moveTo(4, wy);
          ctx.quadraticCurveTo(S/2+(n(i+5,2)-.5)*6, wy-1, S-4, wy+1); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(180,220,255,0.3)';
        ctx.beginPath(); ctx.ellipse(8, 7, 2.5, 0.9, -0.3, 0, Math.PI*2); ctx.fill();
        vignette(0.35); topLight(0.04);
        break;
      }
      // ======================================================
      case 'cobble': {
        ctx.fillStyle = '#9a8f7e'; ctx.fillRect(0, 0, S, S);
        // mortar fill
        ctx.fillStyle = 'rgba(60,52,44,0.7)'; ctx.fillRect(0, 0, S, S);
        // individual cobblestones
        const stones = [
          [1,1,10,10],[12,1,9,10],[22,1,9,10],
          [1,12,9,9],  [11,12,10,9],[22,12,9,9],
          [1,22,9,9],  [11,22,10,9],[22,22,9,9],
        ];
        stones.forEach(([sx, sy, sw, sh], idx) => {
          const sg = ctx.createLinearGradient(sx, sy, sx+sw, sy+sh);
          sg.addColorStop(0, `rgba(${165+n(idx,1)*30|0},${152+n(1,idx)*28|0},${132+n(idx,idx)*22|0},1)`);
          sg.addColorStop(1, `rgba(${108+n(idx,2)*20|0},${98+n(2,idx)*18|0},${82+n(idx+1,idx)*16|0},1)`);
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.roundRect(sx+1, sy+1, sw-2, sh-2, 2); ctx.fill();
          // highlight top-left
          ctx.fillStyle = 'rgba(215,205,190,0.4)';
          ctx.beginPath(); ctx.roundRect(sx+1, sy+1, sw-2, 2.5, 1); ctx.fill();
          ctx.fillStyle = 'rgba(215,205,190,0.25)';
          ctx.beginPath(); ctx.roundRect(sx+1, sy+1, 2.5, sh-2, 1); ctx.fill();
          // shadow bottom-right
          ctx.fillStyle = 'rgba(50,42,34,0.45)';
          ctx.beginPath(); ctx.roundRect(sx+1, sy+sh-3, sw-2, 2.5, [0,0,2,2]); ctx.fill();
        });
        vignette(0.2); topLight(0.12);
        break;
      }
      // ======================================================
      case 'path': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#b09a78'); g.addColorStop(0.5, '#9a8566'); g.addColorStop(1, '#826f52');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 22; i++) {
          ctx.fillStyle = n(i,5) > 0.5 ? 'rgba(155,130,90,0.3)' : 'rgba(90,68,38,0.35)';
          ctx.beginPath(); ctx.ellipse(n(i,1)*29+1.5, n(1,i)*29+1.5, n(i,i+1)*4+0.8, n(i,i)*2+0.5, n(i+1,i)*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        // tyre/hoof groove lines
        ctx.strokeStyle = 'rgba(100,78,45,0.5)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(2, 10); ctx.bezierCurveTo(8,8, 14,12, 20,10); ctx.bezierCurveTo(24,9, 28,11, 31,10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2, 22); ctx.bezierCurveTo(9,20, 15,24, 21,22); ctx.bezierCurveTo(25,21, 29,23, 31,22); ctx.stroke();
        // small embedded pebbles
        for (let i = 0; i < 6; i++) {
          const px = n(i+7,1)*26+3, py = n(1,i+7)*26+3;
          ctx.fillStyle = 'rgba(140,120,85,0.85)';
          ctx.beginPath(); ctx.ellipse(px, py, 1.5, 1, n(i,12)*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        vignette(0.22); topLight(0.1);
        break;
      }
      // ======================================================
      case 'sand': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#e0cc98'); g.addColorStop(0.5, '#ccb880'); g.addColorStop(1, '#b8a46a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // wind ripple lines
        ctx.strokeStyle = 'rgba(170,148,90,0.45)'; ctx.lineWidth = 0.6;
        for (let i = 0; i < 6; i++) {
          const ry = 4 + i * 5;
          ctx.beginPath(); ctx.moveTo(0, ry + (n(i,0)-.5)*2);
          ctx.quadraticCurveTo(S/2, ry+(n(i,1)-.5)*3, S, ry+(n(i,2)-.5)*2); ctx.stroke();
        }
        // micro-grain stipple
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = n(i,6) > 0.5 ? 'rgba(220,200,155,0.3)' : 'rgba(130,108,65,0.25)';
          ctx.fillRect(n(i,3)*30+1, n(3,i)*30+1, 1, 1);
        }
        // specular dune crest
        const sc = ctx.createLinearGradient(0, S*0.35, 0, S*0.55);
        sc.addColorStop(0, 'rgba(255,248,220,0.3)'); sc.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sc; ctx.fillRect(0, 0, S, S);
        vignette(0.14); topLight(0.15);
        break;
      }
      // ======================================================
      case 'wall': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#6e6d68'); g.addColorStop(0.5, '#5a5956'); g.addColorStop(1, '#454442');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // brick rows
        const rows: [number, number, number[]][] = [
          [0,  8, [0,16,32]],
          [8,  7, [8,24]],
          [15, 8, [0,16,32]],
          [23, 9, [8,24]],
        ];
        rows.forEach(([ry, rh, starts]) => {
          for (let s = 0; s < starts.length - 1; s++) {
            const bx = starts[s], bw = starts[s+1] - starts[s];
            // mortar
            ctx.fillStyle = 'rgba(28,26,22,0.75)'; ctx.fillRect(bx, ry, bw, rh);
            // brick face gradient
            const bf = ctx.createLinearGradient(bx, ry, bx, ry+rh);
            bf.addColorStop(0, 'rgba(135,130,120,0.8)'); bf.addColorStop(1, 'rgba(88,84,76,0.8)');
            ctx.fillStyle = bf; ctx.fillRect(bx+1, ry+1, bw-2, rh-2);
            // top chamfer light
            ctx.fillStyle = 'rgba(195,188,175,0.4)'; ctx.fillRect(bx+1, ry+1, bw-2, 1.5);
            // bottom shadow
            ctx.fillStyle = 'rgba(18,16,12,0.5)'; ctx.fillRect(bx+1, ry+rh-2.5, bw-2, 2);
            // surface imperfections
            for (let ci = 0; ci < 3; ci++) {
              ctx.fillStyle = `rgba(${n(bx+ci,ry)>0.5?170:70},${n(ry,bx+ci)>0.5?165:66},${n(bx,ry+ci)>0.5?155:60},0.12)`;
              ctx.fillRect(bx+2+n(bx+ci,ry)*( bw-4), ry+2+n(ry+ci,bx)*(rh-4), 2, 1);
            }
          }
        });
        vignette(0.25); topLight(0.1);
        break;
      }
      // ======================================================
      case 'wood': {
        const g = ctx.createLinearGradient(0, 0, S, 0);
        g.addColorStop(0, '#9e6830'); g.addColorStop(0.4, '#8a5a26'); g.addColorStop(1, '#6e4518');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // plank definition lines
        [[10,0,10,S],[20,0,20,S]].forEach(([x1,y1,x2,y2]) => {
          ctx.strokeStyle = 'rgba(60,35,10,0.55)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });
        // grain lines per plank
        for (let p = 0; p < 3; p++) {
          const ox = p * 10 + 1;
          ctx.strokeStyle = 'rgba(80,50,18,0.35)'; ctx.lineWidth = 0.5;
          for (let gi = 0; gi < 7; gi++) {
            const gy = 2 + gi * 4 + n(p,gi) * 2;
            ctx.beginPath(); ctx.moveTo(ox + n(gi,p)*2, gy);
            ctx.quadraticCurveTo(ox+4+(n(gi+1,p)-.5)*2, gy+1, ox+8+n(p+1,gi)*1.5, gy); ctx.stroke();
          }
          // knot
          const kx = ox + 4 + n(p,15)*3, ky = 6 + n(15,p) * 18;
          ctx.strokeStyle = 'rgba(70,42,12,0.6)'; ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.ellipse(kx, ky, 2.5, 1.8, n(p,16)*Math.PI, 0, Math.PI*2); ctx.stroke();
        }
        // highlight left edge
        const wh = ctx.createLinearGradient(0, 0, 4, 0);
        wh.addColorStop(0, 'rgba(210,165,90,0.35)'); wh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wh; ctx.fillRect(0, 0, S, S);
        vignette(0.2); topLight(0.12);
        break;
      }
      // ======================================================
      case 'dark': {
        const g = ctx.createRadialGradient(S/2, S/2, 2, S/2, S/2, S*0.9);
        g.addColorStop(0, '#2a1f2e'); g.addColorStop(1, '#140d18');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // stone floor subtle cracks
        ctx.strokeStyle = 'rgba(80,55,90,0.35)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(3,16); ctx.bezierCurveTo(8,14,13,18,18,16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18,8); ctx.bezierCurveTo(22,6,26,10,30,9); ctx.stroke();
        // magic dust sparkle
        for (let i = 0; i < 10; i++) {
          const alpha = n(i,7)*0.45+0.1;
          ctx.fillStyle = `rgba(${155+n(i,8)*60|0},${90+n(8,i)*50|0},${200+n(i+1,i)*55|0},${alpha.toFixed(2)})`;
          ctx.beginPath(); ctx.arc(n(i,0)*30+1, n(0,i)*30+1, 0.7, 0, Math.PI*2); ctx.fill();
        }
        // subtle purple vein glow
        const dg = ctx.createRadialGradient(20, 22, 0, 20, 22, 12);
        dg.addColorStop(0, 'rgba(120,40,180,0.2)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dg; ctx.fillRect(0, 0, S, S);
        vignette(0.4);
        break;
      }
      // ======================================================
      case 'lava': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#c84800'); g.addColorStop(0.5, '#a83400'); g.addColorStop(1, '#7a2000');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // glowing lava pools
        [[10,12,8],[22,8,6],[16,22,5]].forEach(([lx,ly,lr]) => {
          const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr+2);
          lg.addColorStop(0, 'rgba(255,220,80,0.9)');
          lg.addColorStop(0.4, 'rgba(255,120,20,0.7)');
          lg.addColorStop(1, 'rgba(100,20,0,0)');
          ctx.fillStyle = lg; ctx.fillRect(0, 0, S, S);
        });
        // dark rock cracks
        ctx.strokeStyle = 'rgba(40,10,0,0.8)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0,8); ctx.bezierCurveTo(5,6,8,11,13,9); ctx.bezierCurveTo(17,8,20,13,25,11); ctx.lineTo(S,10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5,20); ctx.bezierCurveTo(10,18,14,23,19,21); ctx.bezierCurveTo(22,20,26,24,S,22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12,0); ctx.bezierCurveTo(10,5,14,8,12,14); ctx.stroke();
        // ember glow overlay
        const eg = ctx.createLinearGradient(0,0,S,S);
        eg.addColorStop(0,'rgba(255,160,40,0.12)'); eg.addColorStop(1,'rgba(120,30,0,0.08)');
        ctx.fillStyle = eg; ctx.fillRect(0,0,S,S);
        vignette(0.15);
        break;
      }
      // ======================================================
      case 'swamp': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#3e5e25'); g.addColorStop(0.5, '#2e4d18'); g.addColorStop(1, '#1e3a0e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // murky water patches
        for (let i = 0; i < 6; i++) {
          const wg = ctx.createRadialGradient(n(i,0)*28+2, n(0,i)*28+2, 0, n(i,0)*28+2, n(0,i)*28+2, n(i,i)*7+3);
          wg.addColorStop(0, 'rgba(20,40,10,0.7)'); wg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = wg; ctx.fillRect(0, 0, S, S);
        }
        // dead plant stems
        ctx.strokeStyle = 'rgba(30,50,15,0.9)'; ctx.lineWidth = 0.9;
        [[8,28,7,14],[16,30,18,12],[24,29,22,16],[12,30,11,20]].forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(x1+(n(x1,y1)-.5)*4, (y1+y2)/2, x2,y2); ctx.stroke();
        });
        // sickly green surface sheen
        const sg2 = ctx.createLinearGradient(0, S*0.5, 0, S);
        sg2.addColorStop(0,'rgba(80,140,30,0.15)'); sg2.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = sg2; ctx.fillRect(0, 0, S, S);
        for (let i = 0; i < 9; i++) {
          ctx.fillStyle = `rgba(70,${120+n(i,9)*40|0},25,0.3)`;
          ctx.beginPath(); ctx.arc(n(i,1)*30+1, n(1,i)*30+1, n(i,i+2)*3+1, 0, Math.PI*2); ctx.fill();
        }
        vignette(0.3); topLight(0.05);
        break;
      }
      // ======================================================
      case 'arena': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#a05228'); g.addColorStop(0.5, '#8a4018'); g.addColorStop(1, '#6e2e0a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // sand-soil base texture
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = n(i,7) > 0.5 ? 'rgba(155,80,35,0.3)' : 'rgba(70,28,8,0.35)';
          ctx.beginPath(); ctx.ellipse(n(i,0)*29+1.5, n(0,i)*29+1.5, n(i,i)*3+0.8, n(i+1,i)*2+0.5, n(i,i+2)*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        // sword scoring lines
        ctx.strokeStyle = 'rgba(70,25,5,0.6)'; ctx.lineWidth = 0.7;
        [[4,6,18,8],[14,18,28,16],[8,24,22,26],[20,4,30,6]].forEach(([x1,y1,x2,y2]) => {
          ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        });
        // blood stain subtle — dark organic splotch
        const bs = ctx.createRadialGradient(18,20,0,18,20,7);
        bs.addColorStop(0,'rgba(80,10,10,0.35)'); bs.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = bs; ctx.fillRect(0,0,S,S);
        vignette(0.22); topLight(0.1);
        break;
      }
      // ======================================================
      case 'snow': {
        const g = ctx.createLinearGradient(0, 0, S, S);
        g.addColorStop(0, '#eef0f8'); g.addColorStop(0.5, '#dde0ee'); g.addColorStop(1, '#c8cce0');
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        // soft snow surface undulation
        const sw = ctx.createLinearGradient(0, S*0.3, 0, S*0.6);
        sw.addColorStop(0,'rgba(255,255,255,0.35)'); sw.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = sw; ctx.fillRect(0, 0, S, S);
        // shallow depressions
        for (let i = 0; i < 5; i++) {
          const dg2 = ctx.createRadialGradient(n(i,0)*26+3, n(0,i)*26+3, 0, n(i,0)*26+3, n(0,i)*26+3, n(i,i)*4+3);
          dg2.addColorStop(0,'rgba(170,178,205,0.35)'); dg2.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle = dg2; ctx.fillRect(0, 0, S, S);
        }
        // sparkle
        for (let i = 0; i < 12; i++) {
          ctx.fillStyle = `rgba(255,255,255,${(n(i,6)*0.6+0.3).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(n(i,2)*30+1, n(2,i)*30+1, 0.8, 0, Math.PI*2); ctx.fill();
        }
        vignette(0.12); topLight(0.2);
        break;
      }
    }
    tex.refresh();
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
    this.createTilesetAtlas();
    this.scene.start("WorldScene");
  }

  // Combine every tile texture into one horizontal canvas strip.
  // Phaser Tilemap uses this single texture for batch-GPU rendering.
  createTilesetAtlas() {
    const KEYS = [
      "tile_grass", "tile_grass_lush", "tile_grass_dark",
      "tile_dirt", "tile_dirt_dark", "tile_cobble", "tile_path",
      "tile_water", "tile_water_deep", "tile_stone", "tile_stone_mossy",
      "tile_dark", "tile_wall", "tile_lava", "tile_sand", "tile_arena",
      "tile_swamp", "tile_wood",
    ];
    const TS = 32;
    const atlas = this.textures.createCanvas("__tileset__", KEYS.length * TS, TS);
    if (!atlas) return;
    const ctx = atlas.context;
    KEYS.forEach((key, i) => {
      const tex = this.textures.get(key);
      const frame = tex.get();
      const src = frame.source.image as CanvasImageSource;
      ctx.drawImage(src, frame.cutX, frame.cutY, TS, TS, i * TS, 0, TS, TS);
    });
    atlas.refresh();
  }
}
