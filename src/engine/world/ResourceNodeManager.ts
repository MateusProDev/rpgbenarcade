// ============================================
// Resource Node Manager — renders & manages harvestable nodes
// Trees, rocks, herbs with interaction + respawn system
// ============================================
import { Container, Graphics, Text } from 'pixi.js';
import { RESOURCE_DEFS, ZONE_RESOURCES } from '@/data/resources';
import type { ResourceNodeDef, ResourceNodeInstance } from '@/data/resources';
import { useGameStore } from '@/store/gameStore';
import { ITEM_TEMPLATES } from '@/data/items';
import type { Vec2 } from '@/store/types';
import { distance } from '../Physics';

const INTERACT_RANGE = 60;
const HARVEST_COOLDOWN = 0.5; // seconds between hits

interface ActiveNode {
  def: ResourceNodeDef;
  instance: ResourceNodeInstance;
  container: Container;
  hpRemaining: number;
  respawnTimer: number;  // 0 = alive, >0 = respawning
  interactIcon: Container;
}

export class ResourceNodeManager {
  private parent: Container;
  private nodes: ActiveNode[] = [];
  private harvestTimer = 0;

  constructor(parent: Container) {
    this.parent = parent;
  }

  /** Spawn all resource nodes for the current zone */
  spawnForZone(zoneId: string): void {
    this.clear();
    const instances = ZONE_RESOURCES[zoneId] ?? [];

    for (const inst of instances) {
      const def = RESOURCE_DEFS[inst.defId];
      if (!def) continue;

      const container = new Container();
      container.position.set(inst.position.x, inst.position.y);
      container.zIndex = inst.position.y;

      // Draw the resource visual
      const gfx = new Graphics();
      this.drawResource(gfx, def);
      container.addChild(gfx);

      // Name label
      const label = new Text({
        text: def.name,
        style: {
          fontSize: 9,
          fontFamily: 'Segoe UI, sans-serif',
          fill: this.getLabelColor(def.type),
          stroke: { color: 0x000000, width: 3 },
          align: 'center',
        },
      });
      label.anchor.set(0.5, 1);
      label.position.set(0, this.getTopY(def) - 4);
      container.addChild(label);

      // Interaction prompt (hidden by default)
      const interactIcon = this.createInteractPrompt(def);
      interactIcon.visible = false;
      container.addChild(interactIcon);

      this.parent.addChild(container);

      this.nodes.push({
        def,
        instance: inst,
        container,
        hpRemaining: def.hp,
        respawnTimer: 0,
        interactIcon,
      });
    }
  }

  update(dt: number, playerPos: Vec2 | null): void {
    this.harvestTimer = Math.max(0, this.harvestTimer - dt);

    for (const node of this.nodes) {
      // Respawn logic
      if (node.respawnTimer > 0) {
        node.respawnTimer -= dt;
        if (node.respawnTimer <= 0) {
          node.respawnTimer = 0;
          node.hpRemaining = node.def.hp;
          node.container.visible = true;
          node.container.alpha = 1;
        }
        continue;
      }

      // Show/hide interact prompt based on distance
      if (playerPos) {
        const dist = distance(playerPos, node.instance.position);
        const inRange = dist < INTERACT_RANGE;
        node.interactIcon.visible = inRange;

        // Gentle pulse when in range
        if (inRange) {
          node.interactIcon.alpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
        }
      } else {
        node.interactIcon.visible = false;
      }
    }
  }

  /** Returns the world position of the nearest alive node within `radius` of `worldPos`, or null. */
  getClickableNodeNear(worldPos: Vec2, radius: number): Vec2 | null {
    let closest: ActiveNode | null = null;
    let closestDist = radius;

    for (const node of this.nodes) {
      if (node.respawnTimer > 0) continue;
      const dist = distance(worldPos, node.instance.position);
      if (dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }

    return closest ? { ...closest.instance.position } : null;
  }

  /** Try to harvest the nearest node. Returns true if a hit was applied. */
  tryHarvest(playerPos: Vec2): boolean {
    if (this.harvestTimer > 0) return false;

    let closest: ActiveNode | null = null;
    let closestDist = INTERACT_RANGE;

    for (const node of this.nodes) {
      if (node.respawnTimer > 0) continue;
      const dist = distance(playerPos, node.instance.position);
      if (dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }

    if (!closest) return false;

    this.harvestTimer = HARVEST_COOLDOWN;
    closest.hpRemaining--;

    // Visual feedback: shake
    const base = closest.instance.position;
    closest.container.position.set(
      base.x + (Math.random() - 0.5) * 4,
      base.y + (Math.random() - 0.5) * 2,
    );
    setTimeout(() => {
      closest!.container.position.set(base.x, base.y);
    }, 100);

    if (closest.hpRemaining <= 0) {
      // Harvested! Give loot
      this.giveNodeLoot(closest);
      // Start respawn
      closest.respawnTimer = closest.def.respawnTime;
      closest.container.alpha = 0;
      closest.container.visible = false;
    }

    return true;
  }

  private giveNodeLoot(node: ActiveNode): void {
    const state = useGameStore.getState();

    for (const drop of node.def.loot) {
      if (Math.random() > drop.chance) continue;
      const qty = drop.minQty + Math.floor(Math.random() * (drop.maxQty - drop.minQty + 1));
      const template = ITEM_TEMPLATES[drop.itemId];
      if (template) {
        state.addItem({
          id: `${drop.itemId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          templateId: drop.itemId,
          name: template.name,
          rarity: template.rarity,
          slot: template.slot,
          stats: template.stats,
          quantity: qty,
        });
      }
    }

    // XP reward
    state.addXp(node.def.xpReward);
  }

  private drawResource(g: Graphics, def: ResourceNodeDef): void {
    switch (def.type) {
      case 'tree': this.drawTree(g, def.id); break;
      case 'rock': this.drawRock(g); break;
      case 'ore': this.drawOre(g, def.id); break;
      case 'herb': this.drawHerb(g, def.id); break;
      case 'bush': this.drawBush(g); break;
    }
  }

  private drawTree(g: Graphics, id: string): void {
    const isDark = id.includes('dark');
    const isPine = id.includes('pine');
    const trunkColor = isDark ? 0x3A2A1A : 0x6B4226;
    const leafColor = isDark ? 0x1A3A1A : isPine ? 0x2A5A2A : 0x2D6B2D;
    const leafLight = isDark ? 0x2A4A2A : isPine ? 0x3A7A3A : 0x4A9A4A;

    // Shadow
    g.ellipse(0, 18, 20, 6);
    g.fill({ color: 0x000000, alpha: 0.25 });

    // Trunk
    g.roundRect(-5, -8, 10, 28, 2);
    g.fill(trunkColor);
    // Trunk bark
    g.rect(-4, -4, 2, 6);
    g.fill({ color: trunkColor - 0x111111, alpha: 0.5 });
    g.rect(1, 2, 2, 5);
    g.fill({ color: trunkColor - 0x111111, alpha: 0.5 });
    // Roots
    g.moveTo(-5, 16);
    g.bezierCurveTo(-10, 18, -12, 20, -8, 20);
    g.fill(trunkColor);
    g.moveTo(5, 16);
    g.bezierCurveTo(10, 18, 12, 20, 8, 20);
    g.fill(trunkColor);

    if (isPine) {
      // Pine: triangular layered foliage
      for (let i = 0; i < 3; i++) {
        const y = -12 - i * 14;
        const w = 22 - i * 5;
        g.moveTo(0, y - 16 + i * 2);
        g.lineTo(-w, y);
        g.lineTo(w, y);
        g.closePath();
        g.fill(leafColor + i * 0x080808);
      }
      // Snow tips
      g.circle(-8, -16, 2);
      g.fill({ color: 0xFFFFFF, alpha: 0.3 });
      g.circle(5, -28, 2);
      g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    } else {
      // Round tree: large canopy
      g.circle(0, -28, 22);
      g.fill(leafColor);
      // Depth layers
      g.circle(-6, -32, 14);
      g.fill(leafLight);
      g.circle(8, -26, 12);
      g.fill(leafLight);
      g.circle(-2, -22, 10);
      g.fill(leafColor + 0x050505);
      // Highlight spots
      g.circle(-10, -36, 5);
      g.fill({ color: 0xFFFFFF, alpha: 0.08 });
      g.circle(6, -34, 4);
      g.fill({ color: 0xFFFFFF, alpha: 0.06 });

      if (isDark) {
        // Glowing eyes in leaves
        g.circle(-6, -26, 2);
        g.fill({ color: 0xAA44FF, alpha: 0.4 });
        g.circle(4, -30, 1.5);
        g.fill({ color: 0xAA44FF, alpha: 0.3 });
      }
    }
  }

  private drawRock(g: Graphics): void {
    // Shadow
    g.ellipse(0, 12, 16, 5);
    g.fill({ color: 0x000000, alpha: 0.25 });
    // Main rock
    g.moveTo(-14, 8);
    g.lineTo(-12, -6);
    g.lineTo(-4, -12);
    g.lineTo(6, -10);
    g.lineTo(14, -4);
    g.lineTo(12, 8);
    g.closePath();
    g.fill(0x888888);
    // Lighter face
    g.moveTo(-4, -12);
    g.lineTo(6, -10);
    g.lineTo(8, 0);
    g.lineTo(-2, 2);
    g.closePath();
    g.fill(0x999999);
    // Dark shadow
    g.moveTo(-14, 8);
    g.lineTo(-12, -6);
    g.lineTo(-6, 2);
    g.lineTo(-10, 8);
    g.closePath();
    g.fill(0x666666);
    // Cracks
    g.moveTo(-2, -8);
    g.lineTo(2, -2);
    g.lineTo(-1, 4);
    g.stroke({ color: 0x555555, width: 1 });
    // Sparkle spots
    g.circle(4, -6, 1.2);
    g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    g.circle(-6, -2, 1);
    g.fill({ color: 0xFFFFFF, alpha: 0.2 });
  }

  private drawOre(g: Graphics, id: string): void {
    const isCrystal = id.includes('crystal');
    const oreColor = isCrystal ? 0x8844CC : 0xAA7744;
    const sparkle = isCrystal ? 0xCC88FF : 0xDDAA66;

    // Shadow
    g.ellipse(0, 12, 14, 5);
    g.fill({ color: 0x000000, alpha: 0.25 });
    // Rock base
    g.moveTo(-12, 8);
    g.lineTo(-10, -4);
    g.lineTo(0, -8);
    g.lineTo(10, -4);
    g.lineTo(12, 8);
    g.closePath();
    g.fill(0x666666);
    // Ore veins
    g.moveTo(-6, -2);
    g.lineTo(-2, -6);
    g.lineTo(4, -4);
    g.lineTo(6, 2);
    g.closePath();
    g.fill(oreColor);
    // Another vein
    g.moveTo(2, 0);
    g.lineTo(8, -2);
    g.lineTo(10, 4);
    g.lineTo(4, 6);
    g.closePath();
    g.fill(oreColor);
    // Sparkles
    g.circle(-3, -4, 1.5);
    g.fill({ color: sparkle, alpha: 0.6 });
    g.circle(5, -1, 1.2);
    g.fill({ color: sparkle, alpha: 0.5 });
    g.circle(8, 2, 1);
    g.fill({ color: sparkle, alpha: 0.4 });

    if (isCrystal) {
      // Crystal shards poking out
      g.moveTo(-2, -8);
      g.lineTo(0, -18);
      g.lineTo(2, -8);
      g.fill({ color: 0xAA66DD, alpha: 0.8 });
      g.moveTo(4, -6);
      g.lineTo(7, -14);
      g.lineTo(9, -5);
      g.fill({ color: 0x8844CC, alpha: 0.7 });
      // Glow
      g.circle(2, -12, 6);
      g.fill({ color: 0xBB88FF, alpha: 0.12 });
    }
  }

  private drawHerb(g: Graphics, id: string): void {
    const isBlue = id.includes('mana');
    const isDark = id.includes('shadow') || id.includes('mushroom');
    const color = isDark ? 0x664488 : isBlue ? 0x4488DD : 0x44AA44;
    const accent = isDark ? 0xAA66CC : isBlue ? 0x88CCFF : 0x88DD88;

    if (isDark) {
      // Mushroom
      g.rect(-1, -2, 2, 8);
      g.fill(0xCCBBAA);
      // Cap
      g.ellipse(0, -4, 8, 5);
      g.fill(color);
      // Spots
      g.circle(-3, -5, 1.5);
      g.fill(accent);
      g.circle(2, -3, 1.2);
      g.fill(accent);
      g.circle(-1, -7, 1);
      g.fill(accent);
      // Glow
      g.circle(0, -2, 10);
      g.fill({ color, alpha: 0.08 });
    } else {
      // Plant
      for (let i = -2; i <= 2; i++) {
        const angle = (i * 0.4) + Math.PI * -0.5;
        const len = 8 + Math.abs(i) * 2;
        g.moveTo(0, 4);
        g.lineTo(Math.cos(angle) * len, 4 + Math.sin(angle) * len);
        g.stroke({ color: 0x336633, width: 1.5 });
        // Leaf
        g.circle(
          Math.cos(angle) * len,
          4 + Math.sin(angle) * len,
          2.5,
        );
        g.fill(color);
      }
      // Center flower/bud
      g.circle(0, -6, 3);
      g.fill(accent);
      g.circle(0, -6, 1.5);
      g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    }
  }

  private drawBush(g: Graphics): void {
    // Shadow
    g.ellipse(0, 10, 14, 4);
    g.fill({ color: 0x000000, alpha: 0.2 });
    // Bush body
    g.circle(-4, 0, 10);
    g.fill(0x2D6B2D);
    g.circle(6, -2, 8);
    g.fill(0x3A8A3A);
    g.circle(0, -6, 7);
    g.fill(0x4A9A4A);
    // Berries!
    const berryPositions = [[-6, -2], [-2, -8], [4, -6], [8, -2], [0, -4], [-4, -6]];
    for (const [bx, by] of berryPositions) {
      g.circle(bx, by, 2);
      g.fill(0x4444CC);
      g.circle(bx - 0.5, by - 0.5, 0.8);
      g.fill({ color: 0xFFFFFF, alpha: 0.3 });
    }
  }

  private createInteractPrompt(def: ResourceNodeDef): Container {
    const c = new Container();
    const bg = new Graphics();
    bg.roundRect(-20, -14, 40, 16, 4);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    bg.roundRect(-20, -14, 40, 16, 4);
    bg.stroke({ color: 0xDDAA33, width: 1, alpha: 0.6 });
    c.addChild(bg);

    const text = new Text({
      text: `[E] ${def.icon}`,
      style: {
        fontSize: 9,
        fontFamily: 'Segoe UI, sans-serif',
        fill: 0xDDAA33,
      },
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(0, -6);
    c.addChild(text);

    c.position.set(0, this.getTopY(def) - 18);
    return c;
  }

  private getTopY(def: ResourceNodeDef): number {
    switch (def.type) {
      case 'tree': return -50;
      case 'rock': return -14;
      case 'ore': return -10;
      case 'herb': return -10;
      case 'bush': return -14;
      default: return -10;
    }
  }

  private getLabelColor(type: string): number {
    switch (type) {
      case 'tree': return 0x66AA66;
      case 'rock': return 0xAAAA88;
      case 'ore': return 0xCCAA44;
      case 'herb': return 0x66CC66;
      case 'bush': return 0x6688CC;
      default: return 0xCCCCCC;
    }
  }

  clear(): void {
    for (const node of this.nodes) {
      node.container.destroy({ children: true });
    }
    this.nodes = [];
  }
}
