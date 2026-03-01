// ========================
// Boot Scene - Asset Loading & High-Detail Procedural Sprites
// ========================
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
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

  // === HELPER: Draw pixel at position ===
  px(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, 1, 1);
  }

  // === HELPER: Draw a block of pixels ===
  block(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    g.fillStyle(color, alpha);
    g.fillRect(x, y, w, h);
  }

  // === HELPER: Lighten/darken color ===
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

  generateTextures() {
    // ========================
    // PLAYER CHARACTERS (48x48 detailed pixel art)
    // ========================
    this.generateHeroTexture("player_swordsman", {
      hair: 0x8b4513, skin: 0xffcc99, armor: 0xaa3333, armorLight: 0xcc5544,
      armorDark: 0x882222, pants: 0x553322, boots: 0x443322, cape: 0x771111,
      weapon: 0xcccccc, weaponHandle: 0x8b5a2b,
      // Details
      hasHelmet: true, helmetColor: 0x888888, hasSword: true, hasShield: true,
    });

    this.generateHeroTexture("player_mage", {
      hair: 0xeeeeee, skin: 0xffe0bd, armor: 0x4422aa, armorLight: 0x6644cc,
      armorDark: 0x331188, pants: 0x332266, boots: 0x221144, cape: 0x5533bb,
      weapon: 0x88aaff, weaponHandle: 0x6644cc,
      hasHat: true, hatColor: 0x4422aa, hasStaff: true, hasOrb: true, orbColor: 0x44ddff,
    });

    this.generateHeroTexture("player_archer", {
      hair: 0x44aa44, skin: 0xffe0bd, armor: 0x336633, armorLight: 0x448844,
      armorDark: 0x224422, pants: 0x554422, boots: 0x443311, cape: 0x225522,
      weapon: 0x8b5a2b, weaponHandle: 0x663311,
      hasHood: true, hoodColor: 0x336633, hasBow: true, hasQuiver: true,
    });

    this.generateHeroTexture("player_lancer", {
      hair: 0x3366cc, skin: 0xffcc99, armor: 0x3355aa, armorLight: 0x4477cc,
      armorDark: 0x224488, pants: 0x334466, boots: 0x223344, cape: 0x2244aa,
      weapon: 0xcccccc, weaponHandle: 0x8b5a2b,
      hasHelmet: true, helmetColor: 0x5577bb, hasLance: true, hasShield: true,
    });

    // Remote player (silver/ghost)
    this.generateHeroTexture("remote_player", {
      hair: 0x999999, skin: 0xddccbb, armor: 0x777788, armorLight: 0x8888aa,
      armorDark: 0x555566, pants: 0x666666, boots: 0x555555, cape: 0x666677,
      weapon: 0xaaaaaa, weaponHandle: 0x666666,
    });

    // ========================
    // ENEMIES (detailed)
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
    // TILES (32x32 detailed)
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
  }

  // ========================
  // HERO CHARACTER GENERATOR (48x48)
  // ========================
  generateHeroTexture(key: string, cfg: any) {
    const S = 48;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Cape/Cloak (behind body)
    if (cfg.cape) {
      g.fillStyle(cfg.cape, 0.9);
      g.fillRoundedRect(14, 18, 20, 24, 3);
      g.fillStyle(this.darken(cfg.cape, 30), 0.6);
      g.fillRect(16, 28, 16, 12);
    }

    // === LEGS / BOOTS ===
    g.fillStyle(cfg.pants, 1);
    g.fillRect(17, 34, 6, 8);  // left leg
    g.fillRect(25, 34, 6, 8);  // right leg
    g.fillStyle(cfg.boots, 1);
    g.fillRect(16, 40, 7, 4);  // left boot
    g.fillRect(25, 40, 7, 4);  // right boot
    g.fillStyle(this.darken(cfg.boots, 20), 1);
    g.fillRect(16, 43, 7, 1);  // boot sole
    g.fillRect(25, 43, 7, 1);

    // === BODY / ARMOR ===
    // Torso base
    g.fillStyle(cfg.armor, 1);
    g.fillRoundedRect(15, 18, 18, 17, 2);
    // Armor highlights
    g.fillStyle(cfg.armorLight, 0.7);
    g.fillRect(16, 19, 4, 6);  // left shoulder highlight
    g.fillRect(28, 19, 4, 6);  // right shoulder highlight
    // Armor shadow
    g.fillStyle(cfg.armorDark, 0.6);
    g.fillRect(17, 30, 14, 3);  // belt area
    // Belt
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(16, 32, 16, 2);
    // Belt buckle
    g.fillStyle(0xdaa520, 1);
    g.fillRect(22, 32, 4, 2);
    // Shoulder pads
    g.fillStyle(cfg.armorLight, 1);
    g.fillEllipse(16, 20, 8, 6);
    g.fillEllipse(32, 20, 8, 6);
    g.fillStyle(cfg.armorDark, 0.5);
    g.fillRect(13, 21, 3, 1);
    g.fillRect(32, 21, 3, 1);

    // === ARMS ===
    g.fillStyle(cfg.skin, 1);
    g.fillRect(12, 21, 4, 10);  // left arm
    g.fillRect(32, 21, 4, 10);  // right arm
    // Gauntlets
    g.fillStyle(cfg.armorDark, 1);
    g.fillRect(12, 28, 4, 4);
    g.fillRect(32, 28, 4, 4);

    // === HEAD ===
    // Neck
    g.fillStyle(cfg.skin, 1);
    g.fillRect(21, 15, 6, 4);
    // Head shape
    g.fillStyle(cfg.skin, 1);
    g.fillRoundedRect(17, 4, 14, 14, 4);
    // Hair
    g.fillStyle(cfg.hair, 1);
    g.fillRoundedRect(17, 3, 14, 7, 3);
    g.fillRect(17, 4, 2, 8);  // side hair left
    g.fillRect(29, 4, 2, 8);  // side hair right
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(20, 9, 3, 3);   // left eye white
    g.fillRect(25, 9, 3, 3);   // right eye white
    g.fillStyle(0x222222, 1);
    g.fillRect(21, 10, 2, 2);  // left pupil
    g.fillRect(26, 10, 2, 2);  // right pupil
    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(22, 10, 1, 1);
    g.fillRect(27, 10, 1, 1);
    // Mouth
    g.fillStyle(this.darken(cfg.skin, 40), 1);
    g.fillRect(22, 14, 4, 1);
    // Nose
    g.fillStyle(this.darken(cfg.skin, 20), 1);
    g.fillRect(23, 12, 2, 2);

    // === CLASS-SPECIFIC GEAR ===
    // Helmet
    if (cfg.hasHelmet) {
      g.fillStyle(cfg.helmetColor, 1);
      g.fillRoundedRect(16, 2, 16, 10, 3);
      g.fillStyle(this.lighten(cfg.helmetColor, 30), 0.6);
      g.fillRect(18, 3, 12, 2); // helmet shine
      // Visor
      g.fillStyle(this.darken(cfg.helmetColor, 40), 1);
      g.fillRect(19, 9, 10, 2);
      // Plume
      g.fillStyle(0xcc2222, 1);
      g.fillRect(22, 0, 4, 3);
    }

    // Wizard hat
    if (cfg.hasHat) {
      g.fillStyle(cfg.hatColor, 1);
      g.fillTriangle(24, -4, 14, 10, 34, 10);
      g.fillStyle(this.lighten(cfg.hatColor, 40), 0.5);
      g.fillRect(14, 8, 20, 3); // hat brim
      // Star on hat
      g.fillStyle(0xffdd44, 1);
      g.fillRect(22, 2, 3, 3);
    }

    // Hood
    if (cfg.hasHood) {
      g.fillStyle(cfg.hoodColor, 0.9);
      g.fillRoundedRect(15, 1, 18, 14, 5);
      g.fillStyle(this.darken(cfg.hoodColor, 30), 0.6);
      g.fillRect(17, 8, 14, 3);
    }

    // Sword
    if (cfg.hasSword) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 22, 2, 7); // handle
      g.fillStyle(0xdaa520, 1);
      g.fillRect(6, 21, 6, 2); // crossguard
      g.fillStyle(cfg.weapon, 1);
      g.fillRect(8, 10, 2, 12); // blade
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.6);
      g.fillRect(9, 11, 1, 10); // blade shine
    }

    // Shield
    if (cfg.hasShield) {
      g.fillStyle(cfg.armorDark, 1);
      g.fillRoundedRect(35, 20, 10, 12, 3);
      g.fillStyle(cfg.armorLight, 0.7);
      g.fillRect(37, 22, 6, 8);
      // Emblem on shield
      g.fillStyle(0xdaa520, 1);
      g.fillRect(39, 24, 2, 4);
      g.fillRect(38, 25, 4, 2);
    }

    // Staff
    if (cfg.hasStaff) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 5, 2, 36); // staff pole
      // Ornament top
      g.fillStyle(cfg.orbColor || 0x44ddff, 0.9);
      g.fillCircle(9, 5, 4);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(7, 3, 2, 2); // shine
    }

    // Orb (floating)
    if (cfg.hasOrb) {
      g.fillStyle(cfg.orbColor, 0.6);
      g.fillCircle(38, 16, 5);
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(36, 14, 2, 2);
    }

    // Bow
    if (cfg.hasBow) {
      g.fillStyle(cfg.weapon, 1);
      // Bow arc
      g.fillRect(7, 14, 2, 20);
      g.fillRect(5, 14, 3, 2);
      g.fillRect(5, 32, 3, 2);
      // String
      g.fillStyle(0xcccccc, 0.8);
      g.fillRect(9, 15, 1, 18);
    }

    // Quiver
    if (cfg.hasQuiver) {
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(34, 14, 5, 16);
      // Arrow tips
      g.fillStyle(0xcccccc, 1);
      g.fillRect(35, 12, 1, 3);
      g.fillRect(37, 13, 1, 2);
    }

    // Lance
    if (cfg.hasLance) {
      g.fillStyle(cfg.weaponHandle, 1);
      g.fillRect(8, 0, 2, 40); // pole
      // Spearhead
      g.fillStyle(cfg.weapon, 1);
      g.fillTriangle(9, -4, 5, 3, 13, 3);
      g.fillStyle(this.lighten(cfg.weapon, 40), 0.6);
      g.fillRect(8, -2, 1, 4);
    }

    g.generateTexture(key, S, S);
    g.destroy();
  }

  // ========================
  // ENEMY GENERATORS (detailed)
  // ========================
  generateSlimeTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 32;
    // Main body - gel-like shape
    g.fillStyle(0x22cc44, 1);
    g.fillEllipse(16, 20, 26, 18);
    // Inner highlight
    g.fillStyle(0x44ff66, 0.6);
    g.fillEllipse(14, 17, 14, 10);
    // Shine
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(12, 14, 3);
    g.fillCircle(10, 16, 1);
    // Cute eyes
    g.fillStyle(0x000000, 1);
    g.fillCircle(12, 18, 2);
    g.fillCircle(20, 18, 2);
    // Eye highlights
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(11, 17, 1, 1);
    g.fillRect(19, 17, 1, 1);
    // Mouth
    g.fillStyle(0x006622, 1);
    g.fillRect(14, 22, 4, 1);
    // Shadow beneath
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 28, 20, 4);
    g.generateTexture("enemy_slime", S, S);
    g.destroy();
  }

  generateWolfTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    // Body
    g.fillStyle(0x777777, 1);
    g.fillEllipse(18, 22, 28, 16);
    // Darker back
    g.fillStyle(0x555555, 0.7);
    g.fillEllipse(18, 18, 20, 8);
    // Head
    g.fillStyle(0x888888, 1);
    g.fillEllipse(8, 16, 14, 12);
    // Snout
    g.fillStyle(0x999999, 1);
    g.fillEllipse(3, 18, 8, 6);
    // Nose
    g.fillStyle(0x222222, 1);
    g.fillCircle(1, 17, 2);
    // Ears
    g.fillStyle(0x666666, 1);
    g.fillTriangle(6, 6, 3, 12, 9, 12);
    g.fillTriangle(14, 6, 11, 12, 17, 12);
    // Inner ear
    g.fillStyle(0xcc8888, 0.6);
    g.fillTriangle(6, 8, 4, 11, 8, 11);
    g.fillTriangle(14, 8, 12, 11, 16, 11);
    // Eyes (fierce)
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(6, 15, 2);
    g.fillCircle(12, 15, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(6, 15, 1);
    g.fillCircle(12, 15, 1);
    // Tail
    g.fillStyle(0x666666, 1);
    g.fillEllipse(32, 16, 8, 4);
    // Legs
    g.fillStyle(0x666666, 1);
    g.fillRect(8, 28, 3, 6);
    g.fillRect(16, 28, 3, 6);
    g.fillRect(22, 28, 3, 6);
    g.fillRect(28, 28, 3, 6);
    // Shadow
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
    // Skull
    g.fillStyle(bone, 1);
    g.fillRoundedRect(11, 2, 14, 14, 4);
    // Eye sockets
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 8, 3);
    g.fillCircle(24, 8, 3);
    // Red eyes
    g.fillStyle(0xff2222, 1);
    g.fillCircle(16, 8, 1);
    g.fillCircle(24, 8, 1);
    // Nose hole
    g.fillStyle(0x222222, 1);
    g.fillTriangle(20, 10, 18, 13, 22, 13);
    // Jaw
    g.fillStyle(boneDark, 1);
    g.fillRect(14, 14, 12, 3);
    // Teeth
    g.fillStyle(bone, 1);
    for (let i = 0; i < 5; i++) {
      g.fillRect(15 + i * 2, 15, 1, 2);
    }
    // Ribcage
    g.fillStyle(bone, 1);
    g.fillRect(19, 17, 2, 12); // spine
    for (let i = 0; i < 4; i++) {
      g.fillRect(14, 18 + i * 3, 12, 1); // ribs
    }
    // Arms (bony)
    g.fillStyle(boneDark, 1);
    g.fillRect(10, 18, 3, 10);
    g.fillRect(27, 18, 3, 10);
    // Legs
    g.fillRect(15, 29, 3, 7);
    g.fillRect(22, 29, 3, 7);
    // Sword
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
    // Body
    g.fillStyle(0x558822, 1);
    g.fillRoundedRect(8, 12, 14, 12, 2);
    // Head (large for goblin)
    g.fillStyle(0x66aa33, 1);
    g.fillRoundedRect(6, 1, 18, 14, 5);
    // Ears (big pointed)
    g.fillStyle(0x66aa33, 1);
    g.fillTriangle(2, 5, 7, 3, 7, 9);
    g.fillTriangle(28, 5, 23, 3, 23, 9);
    // Inner ears
    g.fillStyle(0xcc8866, 0.5);
    g.fillTriangle(4, 5, 7, 4, 7, 8);
    g.fillTriangle(26, 5, 23, 4, 23, 8);
    // Eyes (big, yellow, menacing)
    g.fillStyle(0xffee00, 1);
    g.fillCircle(12, 7, 3);
    g.fillCircle(20, 7, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(12, 7, 1.5);
    g.fillCircle(20, 7, 1.5);
    // Nose
    g.fillStyle(0x448811, 1);
    g.fillCircle(16, 10, 2);
    // Mouth (toothy grin)
    g.fillStyle(0x333300, 1);
    g.fillRect(11, 12, 10, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(12, 12, 2, 1);
    g.fillRect(18, 12, 2, 1);
    // Legs
    g.fillStyle(0x448811, 1);
    g.fillRect(10, 24, 4, 5);
    g.fillRect(17, 24, 4, 5);
    // Little dagger
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(4, 14, 1, 8);
    g.generateTexture("enemy_goblin", S, S);
    g.destroy();
  }

  generateBanditTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 36;
    // Cape
    g.fillStyle(0x443322, 0.8);
    g.fillRoundedRect(10, 14, 16, 18, 2);
    // Body
    g.fillStyle(0x554433, 1);
    g.fillRoundedRect(11, 14, 14, 14, 2);
    // Head
    g.fillStyle(0xddbb99, 1);
    g.fillRoundedRect(12, 2, 12, 13, 4);
    // Bandana/mask
    g.fillStyle(0x333333, 0.9);
    g.fillRect(12, 8, 12, 5);
    // Eyes (only eyes visible through mask)
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 7, 2);
    g.fillCircle(22, 7, 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 7, 1);
    g.fillCircle(22, 7, 1);
    // Hood
    g.fillStyle(0x443322, 1);
    g.fillRoundedRect(10, 0, 16, 8, 4);
    // Legs
    g.fillStyle(0x443322, 1);
    g.fillRect(13, 28, 4, 6);
    g.fillRect(20, 28, 4, 6);
    // Boots
    g.fillStyle(0x332211, 1);
    g.fillRect(12, 32, 5, 3);
    g.fillRect(19, 32, 5, 3);
    // Dual daggers
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(7, 16, 1, 10);
    g.fillRect(28, 16, 1, 10);
    g.generateTexture("enemy_bandit", S, S);
    g.destroy();
  }

  generateOrcTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 40;
    // Legs
    g.fillStyle(0x445522, 1);
    g.fillRect(12, 30, 6, 8);
    g.fillRect(22, 30, 6, 8);
    // Boots
    g.fillStyle(0x332211, 1);
    g.fillRect(11, 36, 7, 3);
    g.fillRect(21, 36, 7, 3);
    // Body (bulky)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRoundedRect(8, 14, 24, 18, 4);
    // Leather armor
    g.fillStyle(0x664422, 0.8);
    g.fillRect(10, 16, 20, 14);
    g.fillStyle(0x553311, 0.6);
    g.fillRect(12, 28, 16, 2); // belt
    // Head
    g.fillStyle(0x4a7f23, 1);
    g.fillRoundedRect(11, 2, 18, 14, 5);
    // Jaw (strong)
    g.fillStyle(0x3d6b1e, 1);
    g.fillRect(13, 12, 14, 4);
    // Tusks
    g.fillStyle(0xeeeecc, 1);
    g.fillRect(14, 13, 2, 3);
    g.fillRect(24, 13, 2, 3);
    // Eyes (angry)
    g.fillStyle(0xff4400, 1);
    g.fillCircle(16, 8, 2);
    g.fillCircle(24, 8, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(16, 8, 1);
    g.fillCircle(24, 8, 1);
    // Eyebrows (angry)
    g.fillStyle(0x2a5015, 1);
    g.fillRect(14, 5, 5, 2);
    g.fillRect(21, 5, 5, 2);
    // Big axe
    g.fillStyle(0x666666, 1);
    g.fillRect(4, 6, 3, 28); // handle
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 6, 8, 10); // axe head
    g.fillStyle(0xaaaaaa, 0.5);
    g.fillRect(1, 7, 6, 8);
    g.generateTexture("enemy_orc", S, S);
    g.destroy();
  }

  generateDarkKnightTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 42;
    // Dark cape
    g.fillStyle(0x110011, 0.9);
    g.fillRoundedRect(10, 16, 22, 24, 4);
    // Legs
    g.fillStyle(0x222222, 1);
    g.fillRect(14, 32, 5, 8);
    g.fillRect(23, 32, 5, 8);
    // Body (heavy armor)
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(12, 16, 18, 18, 3);
    // Armor detail
    g.fillStyle(0x333344, 0.8);
    g.fillRect(14, 18, 14, 2);
    g.fillRect(14, 22, 14, 2);
    g.fillRect(14, 26, 14, 2);
    // Dark emblem
    g.fillStyle(0x880088, 1);
    g.fillRect(19, 20, 4, 4);
    // Shoulder pads (big)
    g.fillStyle(0x333344, 1);
    g.fillEllipse(12, 18, 10, 8);
    g.fillEllipse(30, 18, 10, 8);
    // Spikes on shoulders
    g.fillStyle(0x444455, 1);
    g.fillTriangle(9, 12, 8, 18, 11, 18);
    g.fillTriangle(33, 12, 31, 18, 35, 18);
    // Helmet
    g.fillStyle(0x222233, 1);
    g.fillRoundedRect(13, 2, 16, 16, 5);
    g.fillStyle(0x333344, 0.6);
    g.fillRect(15, 3, 12, 4);
    // Visor slit
    g.fillStyle(0x000000, 1);
    g.fillRect(16, 9, 10, 2);
    // Glowing eyes
    g.fillStyle(0xff0044, 1);
    g.fillCircle(19, 10, 1.5);
    g.fillCircle(25, 10, 1.5);
    // Dark sword
    g.fillStyle(0x555555, 1);
    g.fillRect(6, 8, 2, 26);
    g.fillStyle(0x880088, 0.6);
    g.fillRect(7, 9, 1, 24); // magical glow
    g.fillStyle(0x444444, 1);
    g.fillRect(3, 7, 8, 2); // crossguard
    g.generateTexture("enemy_dark_knight", S, S);
    g.destroy();
  }

  generateDragonTexture() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 56;
    // Tail
    g.fillStyle(0xaa1111, 0.8);
    g.fillEllipse(48, 34, 14, 6);
    g.fillEllipse(52, 36, 8, 4);
    // Body (large)
    g.fillStyle(0xcc2222, 1);
    g.fillEllipse(24, 30, 36, 20);
    // Belly
    g.fillStyle(0xdd8844, 0.8);
    g.fillEllipse(24, 34, 24, 10);
    // Scales pattern
    g.fillStyle(0xaa1111, 0.4);
    for (let i = 0; i < 5; i++) {
      g.fillCircle(14 + i * 6, 26, 3);
    }
    // Wings
    g.fillStyle(0x991111, 0.8);
    g.fillTriangle(10, 14, -2, 28, 20, 28);
    g.fillTriangle(38, 14, 52, 28, 28, 28);
    g.fillStyle(0xcc4444, 0.4);
    g.fillTriangle(10, 16, 0, 26, 18, 26);
    g.fillTriangle(38, 16, 48, 26, 30, 26);
    // Legs
    g.fillStyle(0xaa2222, 1);
    g.fillRect(12, 38, 6, 10);
    g.fillRect(28, 38, 6, 10);
    // Claws
    g.fillStyle(0x222222, 1);
    g.fillTriangle(12, 48, 11, 52, 15, 48);
    g.fillTriangle(16, 48, 14, 52, 18, 48);
    g.fillTriangle(28, 48, 27, 52, 31, 48);
    g.fillTriangle(32, 48, 30, 52, 34, 48);
    // Head
    g.fillStyle(0xcc2222, 1);
    g.fillRoundedRect(6, 8, 18, 16, 4);
    // Horns
    g.fillStyle(0x555555, 1);
    g.fillTriangle(8, 2, 6, 10, 12, 10);
    g.fillTriangle(22, 2, 18, 10, 24, 10);
    // Snout
    g.fillStyle(0xbb2222, 1);
    g.fillRoundedRect(4, 14, 12, 8, 3);
    // Nostrils (smoking)
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(6, 16, 1.5);
    g.fillCircle(12, 16, 1.5);
    // Eyes (fierce, yellow)
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(10, 12, 3);
    g.fillCircle(20, 12, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(10, 12, 1.5);
    g.fillCircle(20, 12, 1.5);
    // Fire breath particles
    g.fillStyle(0xff4400, 0.5);
    g.fillCircle(2, 20, 2);
    g.fillStyle(0xffaa00, 0.4);
    g.fillCircle(0, 22, 1.5);
    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(24, 50, 36, 6);
    g.generateTexture("enemy_dragon", S, S);
    g.destroy();
  }

  generateNpcTexture(key: string, baseColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 48;
    // Robe
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(14, 16, 20, 26, 4);
    g.fillStyle(this.darken(baseColor, 30), 0.6);
    g.fillRect(16, 30, 16, 10);
    // Sash
    g.fillStyle(0x8b2252, 1);
    g.fillRect(16, 28, 16, 2);
    // Head
    g.fillStyle(0xffe0bd, 1);
    g.fillRoundedRect(17, 4, 14, 14, 4);
    // Hair/beard
    g.fillStyle(0xaaaaaa, 1);
    g.fillRoundedRect(17, 3, 14, 5, 3);
    g.fillRect(17, 14, 4, 6); // beard left
    g.fillRect(27, 14, 4, 6); // beard right
    g.fillRect(20, 16, 8, 4); // beard center
    // Eyes (friendly)
    g.fillStyle(0x4466aa, 1);
    g.fillCircle(21, 9, 2);
    g.fillCircle(27, 9, 2);
    g.fillStyle(0x000000, 1);
    g.fillCircle(21, 9, 1);
    g.fillCircle(27, 9, 1);
    // Smile
    g.fillStyle(this.darken(0xffe0bd, 50), 1);
    g.fillRect(22, 12, 4, 1);
    // Question/quest marker aura
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(24, 0, 6);
    g.fillStyle(0xffff00, 1);
    g.fillRect(23, -3, 2, 4);
    g.fillRect(23, 2, 2, 2);
    // Feet
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
    // Glow
    g.fillStyle(0xff8800, 0.3);
    g.fillCircle(8, 8, 8);
    // Core
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(8, 8, 4);
    // Hot center
    g.fillStyle(0xffffaa, 1);
    g.fillCircle(8, 8, 2);
    g.generateTexture("projectile", 16, 16);
    g.destroy();
  }

  generatePortal() {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 40;
    // Outer glow
    g.fillStyle(0x6622cc, 0.2);
    g.fillCircle(S / 2, S / 2, S / 2);
    // Ring
    g.lineStyle(3, 0x8844ff, 0.8);
    g.strokeCircle(S / 2, S / 2, 14);
    // Inner ring
    g.lineStyle(2, 0xaa66ff, 0.6);
    g.strokeCircle(S / 2, S / 2, 9);
    // Core
    g.fillStyle(0xcc88ff, 0.5);
    g.fillCircle(S / 2, S / 2, 6);
    // Sparkles
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(S / 2 - 5, S / 2 - 5, 1);
    g.fillCircle(S / 2 + 4, S / 2 - 3, 1);
    g.fillCircle(S / 2 + 2, S / 2 + 5, 1);
    g.generateTexture("portal", S, S);
    g.destroy();
  }

  generateItemDrop() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Glow
    g.fillStyle(0xffdd44, 0.3);
    g.fillCircle(10, 10, 10);
    // Bag
    g.fillStyle(0xcc9944, 1);
    g.fillRoundedRect(4, 6, 12, 10, 3);
    // Tie
    g.fillStyle(0x886622, 1);
    g.fillRect(7, 5, 6, 2);
    // Sparkle
    g.fillStyle(0xffff88, 0.8);
    g.fillRect(14, 2, 2, 2);
    g.fillRect(3, 3, 1, 1);
    g.generateTexture("item_drop", 20, 20);
    g.destroy();
  }

  generateClickTarget() {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Outer circle
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(16, 16, 14);
    // Cross
    g.lineStyle(1, 0xffffff, 0.8);
    g.lineBetween(16, 4, 16, 28);
    g.lineBetween(4, 16, 28, 16);
    // Center dot
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 2);
    g.generateTexture("click_target", 32, 32);
    g.destroy();
  }

  // ========================
  // DETAILED TILE GENERATOR (32x32)
  // ========================
  generateDetailedTile(key: string, color1: number, color2: number, type: string) {
    const g = this.make.graphics({ x: 0, y: 0 });
    const S = 32;

    // Base fill
    g.fillStyle(color1, 1);
    g.fillRect(0, 0, S, S);

    // Type-specific details
    switch (type) {
      case "grass":
        // Grass blades
        g.fillStyle(color2, 0.6);
        for (let i = 0; i < 12; i++) {
          const gx = Math.floor(Math.random() * 28) + 2;
          const gy = Math.floor(Math.random() * 28) + 2;
          g.fillRect(gx, gy, 1, 3);
        }
        // Lighter patches
        g.fillStyle(this.lighten(color1, 15), 0.4);
        for (let i = 0; i < 4; i++) {
          const px = Math.floor(Math.random() * 24) + 4;
          const py = Math.floor(Math.random() * 24) + 4;
          g.fillCircle(px, py, 3);
        }
        break;
      case "dirt":
        // Pebbles
        g.fillStyle(color2, 0.7);
        for (let i = 0; i < 5; i++) {
          const dx = Math.floor(Math.random() * 26) + 3;
          const dy = Math.floor(Math.random() * 26) + 3;
          g.fillCircle(dx, dy, 1 + Math.random());
        }
        // Cracks
        g.fillStyle(this.darken(color1, 20), 0.5);
        g.fillRect(8, 12, 6, 1);
        g.fillRect(18, 20, 8, 1);
        break;
      case "stone":
        // Stone blocks pattern
        g.lineStyle(1, this.darken(color1, 25), 0.5);
        g.strokeRect(0, 0, 16, 16);
        g.strokeRect(16, 0, 16, 16);
        g.strokeRect(8, 16, 16, 16);
        // Moss spots
        g.fillStyle(0x446644, 0.3);
        g.fillCircle(6, 24, 2);
        g.fillCircle(26, 8, 2);
        break;
      case "water":
        // Waves
        g.fillStyle(this.lighten(color1, 20), 0.4);
        for (let i = 0; i < 3; i++) {
          const wy = 6 + i * 10;
          g.fillEllipse(16, wy, 24, 3);
        }
        // Sparkle
        g.fillStyle(0xffffff, 0.3);
        g.fillRect(10, 8, 2, 1);
        g.fillRect(22, 18, 2, 1);
        break;
      case "dark":
        // Dark atmosphere
        g.fillStyle(color2, 0.5);
        for (let i = 0; i < 8; i++) {
          const dx = Math.floor(Math.random() * 28) + 2;
          const dy = Math.floor(Math.random() * 28) + 2;
          g.fillRect(dx, dy, 2, 2);
        }
        // Eerie glow spots
        g.fillStyle(0x440044, 0.3);
        g.fillCircle(8, 24, 3);
        break;
      case "arena":
        // Lines
        g.fillStyle(this.lighten(color1, 20), 0.4);
        g.fillRect(0, 15, 32, 2);
        g.fillRect(15, 0, 2, 32);
        // Corner marks
        g.fillStyle(0xffcc00, 0.3);
        g.fillRect(0, 0, 4, 4);
        g.fillRect(28, 0, 4, 4);
        g.fillRect(0, 28, 4, 4);
        g.fillRect(28, 28, 4, 4);
        break;
      case "wall":
        // Brick pattern
        g.lineStyle(1, this.darken(color1, 20), 0.6);
        g.strokeRect(0, 0, 16, 8);
        g.strokeRect(16, 0, 16, 8);
        g.strokeRect(8, 8, 16, 8);
        g.strokeRect(0, 16, 16, 8);
        g.strokeRect(16, 16, 16, 8);
        g.strokeRect(8, 24, 16, 8);
        break;
      case "wood":
        // Wood grain
        g.fillStyle(this.darken(color1, 15), 0.5);
        for (let i = 0; i < 6; i++) {
          g.fillRect(0, i * 5 + 2, 32, 1);
        }
        // Knot
        g.fillStyle(this.darken(color1, 25), 0.6);
        g.fillCircle(12, 16, 3);
        g.fillCircle(24, 8, 2);
        break;
      case "sand":
        // Sand grains
        g.fillStyle(color2, 0.4);
        for (let i = 0; i < 10; i++) {
          g.fillRect(Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 30) + 1, 1, 1);
        }
        // Small dune
        g.fillStyle(this.lighten(color1, 10), 0.3);
        g.fillEllipse(16, 20, 20, 6);
        break;
    }

    g.generateTexture(key, S, S);
    g.destroy();
  }

  create() {
    this.scene.start("WorldScene");
  }
}
