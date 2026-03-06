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
  shakeTime: number;    // >0 = shaking (oscillates, auto-decays)
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
        shakeTime: 0,
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

      // Shake animation (oscila e amorte sozinho)
      if (node.shakeTime > 0) {
        node.shakeTime -= dt;
        const t = Math.max(0, node.shakeTime);
        const isTree = node.def.type === 'tree';
        const ampX = isTree ? 5.5 : 3;
        const ampY = isTree ? 2   : 2.5;
        const freq = isTree ? 38  : 30;
        node.container.position.set(
          node.instance.position.x + Math.sin(t * freq) * ampX * t * 2.5,
          node.instance.position.y + Math.sin(t * freq * 1.4) * ampY * t * 2,
        );
      } else {
        node.container.position.set(
          node.instance.position.x,
          node.instance.position.y,
        );
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

    // Shake oscilatório (decai em update)
    closest.shakeTime = 0.4;

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

    const trunkF  = isDark ? 0x3A2010 : 0x5C3418;  // face frontal
    const trunkLt = isDark ? 0x5A3A22 : 0x7A5028;  // face direita (clara)
    const trunkDk = isDark ? 0x1E0E06 : 0x38200E;  // face esquerda (escura)
    const leafDk  = isDark ? 0x1A3E14 : isPine ? 0x1C4E22 : 0x1E5A1E;  // base copa
    const leafMd  = isDark ? 0x2A5522 : isPine ? 0x2E6E32 : 0x2E7030;  // meio
    const leafLt  = isDark ? 0x3E7030 : isPine ? 0x44924A : 0x449A44;  // topo/luz
    const leafHl  = isDark ? 0x58963E : isPine ? 0x5EAA5E : 0x5EBB5E;  // specular

    // --- SOMBRA NO CHAO ---
    g.ellipse(3, 21, 24, 7);
    g.fill({ color: 0x000000, alpha: 0.3 });

    if (isPine) {
      // ========== PINHEIRO ISOMETRICO 3D ==========
      // Tronco — face frontal
      g.moveTo(-4, -10); g.lineTo(-4, 20); g.lineTo(4, 20); g.lineTo(4, -10);
      g.fill(trunkF);
      // face direita (iluminada)
      g.moveTo(4, -10); g.lineTo(7, -8); g.lineTo(7, 18); g.lineTo(4, 20);
      g.fill({ color: trunkLt, alpha: 0.8 });
      // face esquerda (sombra)
      g.moveTo(-4, -10); g.lineTo(-7, -8); g.lineTo(-7, 18); g.lineTo(-4, 20);
      g.fill({ color: trunkDk, alpha: 0.75 });
      // casca
      for (let y = -6; y < 18; y += 5) {
        g.moveTo(-3.5, y); g.bezierCurveTo(-1, y+1.5, 1, y+1.5, 3.5, y);
        g.stroke({ color: trunkDk, width: 0.8, alpha: 0.4 });
      }
      // raizes
      g.moveTo(-4, 15); g.bezierCurveTo(-9, 18, -12, 21, -7, 21); g.fill(trunkDk);
      g.moveTo(4, 15);  g.bezierCurveTo(9, 18, 12, 21, 7, 21);   g.fill(trunkDk);

      // Folhagem em 3 camadas piramidais
      const layers = [[0, 24, -14], [0, 19, -27], [0, 13, -38]] as const;
      for (const [, hw, cy] of layers) {
        // Sombra debaixo da camada
        g.ellipse(2, cy + 10, hw * 0.72, hw * 0.22);
        g.fill({ color: 0x000000, alpha: 0.14 });
        // Face inferior (escura)
        g.moveTo(0, cy); g.lineTo(-hw, cy + 13); g.lineTo(hw, cy + 13);
        g.closePath(); g.fill(leafDk);
        // Face frontal (media)
        g.moveTo(0, cy); g.lineTo(-hw * 0.62, cy + 4); g.lineTo(hw * 0.62, cy + 4);
        g.closePath(); g.fill(leafMd);
        // Ponta iluminada
        g.moveTo(0, cy - 13); g.lineTo(-hw * 0.22, cy - 3); g.lineTo(hw * 0.22, cy - 3);
        g.closePath(); g.fill(leafLt);
        // specular no pico
        g.circle(0, cy - 12, 2.5); g.fill({ color: leafHl, alpha: 0.55 });
      }
      if (isDark) {
        g.circle(-5, -32, 1.5); g.fill({ color: 0xAA44FF, alpha: 0.5 });
        g.circle(4, -24, 1.2);  g.fill({ color: 0xAA44FF, alpha: 0.35 });
      }

    } else {
      // ========== ARVORE FOLHOSA 3D (isometrica) ==========
      // Tronco — 3 faces
      g.moveTo(-4.5, -10); g.lineTo(-4.5, 20); g.lineTo(4.5, 20); g.lineTo(4.5, -10);
      g.fill(trunkF);
      g.moveTo(4.5, -10); g.lineTo(7, -8); g.lineTo(7, 18); g.lineTo(4.5, 20);
      g.fill({ color: trunkLt, alpha: 0.82 });
      g.moveTo(-4.5, -10); g.lineTo(-7, -8); g.lineTo(-7, 18); g.lineTo(-4.5, 20);
      g.fill({ color: trunkDk, alpha: 0.78 });
      // casca
      for (let y = -7; y < 18; y += 5.5) {
        g.moveTo(-4, y); g.bezierCurveTo(-1.5, y + 1.2, 1.5, y + 1.2, 4, y);
        g.stroke({ color: trunkDk, width: 0.9, alpha: 0.42 });
      }
      // raizes
      g.moveTo(-4.5, 14); g.bezierCurveTo(-10, 17, -13, 21, -8, 21); g.fill(trunkDk);
      g.moveTo(4.5, 14);  g.bezierCurveTo(10, 17, 13, 21, 8, 21);   g.fill(trunkDk);
      g.moveTo(-2, 15);   g.bezierCurveTo(-5, 19, -6, 22, -3, 21);  g.fill(trunkDk);
      g.moveTo(2, 15);    g.bezierCurveTo(5, 19, 6, 22, 3, 21);     g.fill(trunkDk);

      // Copa: camadas de profundidade (fundo → frente)
      // Camada mais funda/escura (sombra global)
      g.ellipse(0, -18, 22, 16); g.fill(leafDk);
      // Face lateral esquerda (sombra)
      g.ellipse(-10, -22, 16, 13); g.fill(this.shdk(leafDk, 8));
      // Massa media (frente-baixo)
      g.ellipse(3, -25, 20, 16); g.fill(leafMd);
      // Cluster frontal esquerdo
      g.ellipse(-7, -31, 14, 11); g.fill(leafMd);
      // Cluster frontal direito (mais luz)
      g.ellipse(9, -29, 13, 11); g.fill(leafLt);
      // Topo iluminado
      g.ellipse(-2, -37, 10, 9); g.fill(leafLt);
      // Specular / ponto de luz direto
      g.ellipse(-5, -41, 7, 6); g.fill(leafHl);
      g.circle(-7, -43, 3); g.fill({ color: 0xFFFFFF, alpha: 0.1 });
      // Oclusao ambiental na base da copa
      g.ellipse(2, -16, 13, 5); g.fill({ color: 0x000000, alpha: 0.2 });

      if (isDark) {
        g.circle(-7, -26, 2.2); g.fill({ color: 0xAA44FF, alpha: 0.45 });
        g.circle(5,  -31, 1.8); g.fill({ color: 0xAA44FF, alpha: 0.35 });
        g.circle(0,  -40, 1.5); g.fill({ color: 0xCC88FF, alpha: 0.22 });
      }
    }
  }

  // helper local de cor
  private shdk(c: number, a: number): number {
    return ((Math.max(0,((c>>16)&0xFF)-a))<<16)|((Math.max(0,((c>>8)&0xFF)-a))<<8)|(Math.max(0,(c&0xFF)-a));
  }

  private drawRock(g: Graphics): void {
    // Sombra projetada no chao
    g.ellipse(2, 14, 18, 5.5);
    g.fill({ color: 0x000000, alpha: 0.3 });

    // Base da pedra (oclusao ambiental — face inferior)
    g.moveTo(-14, 8); g.lineTo(-12, -6); g.lineTo(-3, -12);
    g.lineTo(7, -10); g.lineTo(14, -3); g.lineTo(12, 8);
    g.closePath(); g.fill(0x52504A);

    // Face frontal principal (tonalidade media)
    g.moveTo(-12, 7); g.lineTo(-10, -4); g.lineTo(-2, -10);
    g.lineTo(8, -8); g.lineTo(13, -2); g.lineTo(11, 7);
    g.closePath(); g.fill(0x7C7868);

    // Face superior (plano que recebe luz direta)
    g.moveTo(-10, -4); g.lineTo(-2, -10); g.lineTo(8, -8);
    g.lineTo(9, -2); g.lineTo(1, -1); g.lineTo(-6, -1);
    g.closePath(); g.fill(0xA09888);

    // Faceta lateral direita (semi-iluminada)
    g.moveTo(8, -8); g.lineTo(13, -2); g.lineTo(11, 7); g.lineTo(9, 0);
    g.closePath(); g.fill(0x888070);

    // Faceta lateral esquerda (sombra)
    g.moveTo(-10, -4); g.lineTo(-14, 5); g.lineTo(-12, 7); g.lineTo(-8, 3);
    g.closePath(); g.fill(0x484640);

    // Highlight especular na aresta superior
    g.moveTo(-5, -9); g.bezierCurveTo(0, -12, 5, -10, 7, -7);
    g.stroke({ color: 0xC4BCB0, width: 1.6, alpha: 0.62 });

    // Rachaduras naturais
    g.moveTo(-2, -8); g.lineTo(1, -3); g.lineTo(-1, 4);
    g.stroke({ color: 0x38362E, width: 1.2, alpha: 0.58 });
    g.moveTo(4, -6); g.lineTo(6, 0); g.lineTo(4, 5);
    g.stroke({ color: 0x424038, width: 0.9, alpha: 0.42 });
    // Microfratura adicional
    g.moveTo(-7, -2); g.lineTo(-4, 2); g.lineTo(-6, 6);
    g.stroke({ color: 0x38362E, width: 0.8, alpha: 0.32 });

    // Pontos de mineral
    g.circle(3, -5, 1.5);  g.fill({ color: 0xD0C4B0, alpha: 0.48 });
    g.circle(-5, -1, 1.2); g.fill({ color: 0xC4B8A4, alpha: 0.4 });
    g.circle(8, 1, 1);     g.fill({ color: 0xCCC0AC, alpha: 0.38 });
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
