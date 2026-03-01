// ========================
// World Scene - Main Game Scene
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

  // Click-to-move state
  private moveTarget: { x: number; y: number } | null = null;
  private clickMarker?: Phaser.GameObjects.Sprite;
  private clickMarkerTween?: Phaser.Tweens.Tween;

  // Shadow
  private playerShadow!: Phaser.GameObjects.Ellipse;

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

    // Setup world bounds
    this.physics.world.setBounds(0, 0, mapConfig.width, mapConfig.height);

    // Generate map tiles
    this.generateMap(mapConfig.width, mapConfig.height);

    // Create player shadow
    this.playerShadow = this.add.ellipse(0, 0, 24, 8, 0x000000, 0.3);
    this.playerShadow.setDepth(9);

    // Create player
    const textureKey = `player_${playerData.classType}`;
    this.player = this.physics.add.sprite(
      playerData.position?.x || mapConfig.spawnPoint.x,
      playerData.position?.y || mapConfig.spawnPoint.y,
      textureKey
    );
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1);

    // Player name
    this.nameText = this.add.text(this.player.x, this.player.y - 30, playerData.name, {
      fontSize: "11px",
      color: "#ffffff",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.nameText.setOrigin(0.5, 1);
    this.nameText.setDepth(11);

    // HP bar
    this.hpBarBg = this.add.graphics();
    this.hpBarFg = this.add.graphics();
    this.hpBarBg.setDepth(11);
    this.hpBarFg.setDepth(12);

    // Camera
    this.cameras.main.setBounds(0, 0, mapConfig.width, mapConfig.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.8);

    // === KEYBOARD INPUT ===
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

      // Interact & pickup keys
      this.input.keyboard.on("keydown-E", () => this.interact());
      this.input.keyboard.on("keydown-P", () => this.pickupItem());
    }

    // === CLICK-TO-MOVE (mouse & touch) ===
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Only left click; ignore if over UI
      if (pointer.leftButtonDown()) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.moveTarget = { x: worldPoint.x, y: worldPoint.y };
        this.showClickMarker(worldPoint.x, worldPoint.y);
      }
    });

    // Right-click = attack towards mouse
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleAttack();
      }
    });

    // Disable context menu on canvas
    this.game.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Re-focus canvas on click so keyboard works
    this.game.canvas.setAttribute("tabindex", "1");
    this.game.canvas.addEventListener("mousedown", () => {
      this.game.canvas.focus();
    });
    // Focus on start
    this.game.canvas.focus();

    // Spawn enemies
    this.spawnEnemies();

    // Spawn NPCs
    this.spawnNpcs();

    // Spawn portals
    this.spawnPortals();

    // Day/Night overlay
    this.dayNightOverlay = this.add.rectangle(
      mapConfig.width / 2, mapConfig.height / 2,
      mapConfig.width, mapConfig.height,
      0x000033, 0
    );
    this.dayNightOverlay.setDepth(100);
    this.dayNightOverlay.setScrollFactor(1);

    // Multiplayer setup
    this.setupMultiplayer(playerData.uid);

    // Periodically clean up offline players
    this.time.addEvent({
      delay: 15000,
      callback: () => cleanupOfflinePlayers(),
      loop: true,
    });

    // Map display text + minimap coordinates
    const mapLabel = this.add.text(10, 10, mapConfig.name, {
      fontSize: "14px",
      color: "#c4a35a",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 3,
    });
    mapLabel.setScrollFactor(0);
    mapLabel.setDepth(200);

    // Controls hint
    const hint = this.add.text(10, 28, "WASD/Setas: mover | Click: ir até | Espaço: atacar | E: interagir | P: pegar", {
      fontSize: "9px",
      color: "#888899",
      fontFamily: "Georgia, serif",
      stroke: "#000000",
      strokeThickness: 2,
    });
    hint.setScrollFactor(0);
    hint.setDepth(200);

    // Fade hint after 6s
    this.time.delayedCall(6000, () => {
      this.tweens.add({ targets: hint, alpha: 0, duration: 1000, onComplete: () => hint.destroy() });
    });
  }

  showClickMarker(x: number, y: number) {
    // Remove old marker
    if (this.clickMarkerTween) this.clickMarkerTween.stop();
    if (this.clickMarker) this.clickMarker.destroy();

    this.clickMarker = this.add.sprite(x, y, "click_target");
    this.clickMarker.setDepth(101);
    this.clickMarker.setAlpha(0.8);
    this.clickMarker.setScale(0.6);

    this.clickMarkerTween = this.tweens.add({
      targets: this.clickMarker,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        if (this.clickMarker) {
          this.clickMarker.destroy();
          this.clickMarker = undefined;
        }
      },
    });
  }

  generateMap(width: number, height: number) {
    const tileSize = 32;
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    const tileKey = this.getMapTile();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize + tileSize / 2;
        const y = r * tileSize + tileSize / 2;

        // Border walls
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          this.add.image(x, y, "tile_wall").setDepth(0);
        } else {
          // Some decoration variation
          let tile = tileKey;
          if (this.currentMap === "village" && Math.random() < 0.08) {
            tile = "tile_dirt";
          } else if (this.currentMap === "forest" && Math.random() < 0.05) {
            tile = "tile_water";
          }
          this.add.image(x, y, tile).setDepth(0);
        }
      }
    }

    // Add decorative structures for village
    if (this.currentMap === "village") {
      this.addBuilding(250, 150, 4, 3, "tile_wood");
      this.addBuilding(550, 200, 4, 3, "tile_stone");
      this.addBuilding(150, 350, 3, 3, "tile_wood");
      this.addBuilding(450, 400, 5, 3, "tile_stone");
    }
  }

  addBuilding(x: number, y: number, w: number, h: number, tile: string) {
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const img = this.add.image(x + c * 32, y + r * 32, tile);
        img.setDepth(1);
      }
    }
  }

  getMapTile(): string {
    switch (this.currentMap) {
      case "village": return "tile_grass";
      case "fields": return "tile_grass";
      case "forest": return "tile_grass";
      case "dungeon": return "tile_dark";
      case "arena": return "tile_arena";
      default: return "tile_grass";
    }
  }

  spawnEnemies() {
    const mapConfig = getMapConfig(this.currentMap);
    mapConfig.enemies.forEach((spawn) => {
      this.createEnemy(spawn.type, spawn.x, spawn.y, spawn.respawnTime);
    });
  }

  createEnemy(type: EnemyType, x: number, y: number, respawnTime: number) {
    const config = getEnemyConfig(type);
    const textureKey = `enemy_${type}`;

    const enemy = this.physics.add.sprite(x, y, textureKey) as EnemySprite;
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

    // Name
    enemy.nameText = this.add.text(x, y - 20, config.name, {
      fontSize: "9px",
      color: "#ff6666",
      fontFamily: "serif",
      stroke: "#000000",
      strokeThickness: 2,
    });
    enemy.nameText.setOrigin(0.5, 1);
    enemy.nameText.setDepth(6);

    // HP bar
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

      // Quest marker
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

      // Tween for portal animation
      this.tweens.add({
        targets: portal,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      // Label
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

  setupMultiplayer(uid: string) {
    // Start heartbeat
    this.heartbeatInterval = startHeartbeat(uid);

    // Set initial presence
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

    // Listen to other players
    this.unsubPresence = listenToPlayersOnMap(this.currentMap, uid, (players) => {
      store.setRemotePlayers(players);
      this.updateRemotePlayers(players);
    });
  }

  updateRemotePlayers(players: RemotePlayer[]) {
    const currentIds = new Set(players.map((p) => p.uid));

    // Remove disconnected players
    this.remotePlayers.forEach((sprite, uid) => {
      if (!currentIds.has(uid)) {
        sprite.nameText?.destroy();
        sprite.hpBar?.destroy();
        sprite.titleText?.destroy();
        sprite.destroy();
        this.remotePlayers.delete(uid);
      }
    });

    // Update/create remote players
    players.forEach((p) => {
      let sprite = this.remotePlayers.get(p.uid);

      if (!sprite) {
        // Create new remote player
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

      // Smooth lerp to target position
      this.tweens.add({
        targets: sprite,
        x: p.position.x,
        y: p.position.y,
        duration: 100,
        ease: "Linear",
      });

      // Update name position
      sprite.nameText.setPosition(p.position.x, p.position.y - 28);

      // Update HP bar
      sprite.hpBar.clear();
      sprite.hpBar.fillStyle(0x333333, 1);
      sprite.hpBar.fillRect(p.position.x - 16, p.position.y - 22, 32, 3);
      const hpPercent = p.hp / p.maxHp;
      sprite.hpBar.fillStyle(hpPercent > 0.3 ? 0x44cc44 : 0xcc4444, 1);
      sprite.hpBar.fillRect(p.position.x - 16, p.position.y - 22, 32 * hpPercent, 3);
    });
  }

  interact() {
    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData) return;

    // Check NPC interaction
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

        // quest accept
        if (npcData.questId && !playerData.quests.find((q) => q.questId === npcData.questId)) {
          store.updatePlayer({
            quests: [...playerData.quests, { questId: npcData.questId, progress: 0, completed: false }],
          });
          store.addNotification(`Nova quest: ${npcData.questId}`);
        }

        // shop
        if (npcData.shopItems) {
          store.setShowShop(true);
        }

        return;
      }
    }

    // Check portal interaction
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

    // Cleanup
    if (this.unsubPresence) this.unsubPresence();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    // Remove presence from old map
    removePlayerPresence(playerData.uid);

    // Update state
    store.updatePlayer({
      currentMap: targetMap,
      position: { x: targetX, y: targetY },
    });
    store.setCurrentMap(targetMap);

    // Restart scene  
    this.currentMap = targetMap;
    this.scene.restart();
  }

  handleAttack() {
    const now = Date.now();
    if (now - this.lastAttackTime < ATTACK_COOLDOWN) return;
    this.lastAttackTime = now;

    const store = useGameStore.getState();
    const playerData = store.player;
    if (!playerData || playerData.hp <= 0) return;

    // Visual attack effect
    this.showAttackEffect();

    // Check enemy hits
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

    // PvP check
    const mapConfig = getMapConfig(this.currentMap);
    if (mapConfig.pvpEnabled) {
      this.remotePlayers.forEach((remoteSprite) => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, remoteSprite.x, remoteSprite.y
        );
        if (dist < ATTACK_RANGE) {
          // PvP damage event (would be validated server-side)
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

    // Check cooldown
    const now = Date.now();
    const cooldownEnd = store.cooldowns[skill.id] || 0;
    if (now < cooldownEnd) return;

    // Check mana
    if (skill.manaCost && playerData.mana < skill.manaCost) {
      store.addNotification("Mana insuficiente!");
      return;
    }

    // Consume mana
    if (skill.manaCost) {
      store.updatePlayer({ mana: playerData.mana - skill.manaCost });
    }

    // Set cooldown
    store.setCooldown(skill.id, now + skill.cooldown);

    // Execute skill
    const damage = calculateDamage(
      skill.damage,
      skill.scaling,
      playerData.attributes,
      playerData.level
    );

    // Find targets
    if (skill.areaOfEffect) {
      // AoE skill
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
      // Ranged skill - create projectile
      this.createProjectile(damage, skill.range);
    } else if (skill.damage > 0) {
      // Melee skill
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
      // Buff/utility skill
      store.addNotification(`${skill.name} ativada!`);
      if (skill.damage < 0) {
        // Healing skill
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
        // Check enemy collision
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

    // Auto destroy after duration
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

    // Damage number
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

    // Flash red
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

    // XP & Gold
    store.addXp(enemy.xpReward);
    store.addGold(enemy.goldReward);
    store.addNotification(`+${enemy.xpReward} XP, +${enemy.goldReward} Gold`);

    // Update quests
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

    // Loot
    const loot = generateLoot(Math.floor(enemy.xpReward / 10));
    loot.forEach((item) => {
      this.dropItem(item, enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30);
    });

    // Death effect
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

    // Respawn timer
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

    // Floating animation
    this.tweens.add({
      targets: sprite,
      y: y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Auto despawn after 30s
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

    // Keyboard input (only if keys exist and canvas has focus)
    if (this.cursors && this.wasd) {
      if (this.cursors.left?.isDown || this.wasd.A?.isDown) { vx = -PLAYER_SPEED; this.direction = "left"; keyboardMoving = true; }
      else if (this.cursors.right?.isDown || this.wasd.D?.isDown) { vx = PLAYER_SPEED; this.direction = "right"; keyboardMoving = true; }
      if (this.cursors.up?.isDown || this.wasd.W?.isDown) { vy = -PLAYER_SPEED; this.direction = "up"; keyboardMoving = true; }
      else if (this.cursors.down?.isDown || this.wasd.S?.isDown) { vy = PLAYER_SPEED; this.direction = "down"; keyboardMoving = true; }
    }

    // Keyboard cancels click-to-move
    if (keyboardMoving) {
      this.moveTarget = null;
    }

    // Click-to-move pathfinding
    if (!keyboardMoving && this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CLICK_STOP_DIST) {
        // Arrived at destination
        this.moveTarget = null;
        vx = 0;
        vy = 0;
      } else {
        // Move towards target
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * PLAYER_SPEED;
        vy = Math.sin(angle) * PLAYER_SPEED;

        // Determine direction for sprite facing
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

    // Subtle bobbing animation when moving
    if (isMoving) {
      this.player.setY(this.player.y + Math.sin(_time * 0.01) * 0.15);
    }

    // ============================
    // ATTACK (keyboard)
    // ============================
    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.handleAttack();
    }

    // Skills (keyboard)
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
    // Shadow
    this.playerShadow.setPosition(this.player.x, this.player.y + 20);

    // Player name
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

      // HP bar
      enemy.hpBar.clear();
      const eBarX = enemy.x - 16;
      const eBarY = enemy.y - 20;
      enemy.hpBar.fillStyle(0x111111, 0.7);
      enemy.hpBar.fillRoundedRect(eBarX - 1, eBarY - 1, 34, 5, 2);
      const eHpPercent = enemy.hp / enemy.maxHp;
      enemy.hpBar.fillStyle(eHpPercent > 0.3 ? 0xcc4444 : 0xff0000, 1);
      enemy.hpBar.fillRoundedRect(eBarX, eBarY, 32 * eHpPercent, 3, 1);
      enemy.nameText.setPosition(enemy.x, enemy.y - 22);

      // AI - chase player if in range
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, enemy.x, enemy.y
      );

      if (dist < enemy.aggroRange) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const speed = getEnemyConfig(enemy.enemyType).speed;
        enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

        // Attack player in melee
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

          // Player hurt flash
          this.player.setTint(0xff4444);
          this.time.delayedCall(100, () => {
            if (playerData.hp > 0) this.player.clearTint();
          });
        }
      } else {
        // Idle wander
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
