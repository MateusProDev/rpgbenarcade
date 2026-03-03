// ============================================
// Minimap Renderer — canvas-based minimap overlay
// ============================================
import { Container, Graphics, Text } from 'pixi.js';
import type { GameEngine } from './GameEngine';
import { useGameStore } from '@/store/gameStore';
import { ZONES } from '@/data/zones';

const MAP_SIZE = 150;
const MARGIN = 12;

export class MinimapRenderer {
  private container: Container;
  private bg: Graphics;
  private dots: Graphics;
  private label: Text;

  constructor(stage: Container, screenW: number, screenH: number) {
    this.container = new Container();
    this.container.position.set(screenW - MAP_SIZE - MARGIN, MARGIN);
    this.container.zIndex = 1000;

    // Background
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 6);
    this.bg.fill({ color: 0x0a0c10, alpha: 0.8 });
    this.bg.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 6);
    this.bg.stroke({ color: 0xb4965a, width: 1, alpha: 0.4 });
    this.container.addChild(this.bg);

    // Dots layer
    this.dots = new Graphics();
    this.container.addChild(this.dots);

    // Zone label
    this.label = new Text({
      text: '',
      style: {
        fontSize: 10,
        fontFamily: 'Segoe UI, sans-serif',
        fill: 0xb4965a,
      },
    });
    this.label.position.set(4, MAP_SIZE - 14);
    this.container.addChild(this.label);

    stage.addChild(this.container);
  }

  resize(screenW: number, _screenH: number): void {
    this.container.position.set(screenW - MAP_SIZE - MARGIN, MARGIN);
  }

  update(engine: GameEngine): void {
    this.dots.clear();

    const state = useGameStore.getState();
    const zone = ZONES[state.currentZone];
    if (!zone) return;

    const worldW = zone.width * zone.tileSize;
    const worldH = zone.height * zone.tileSize;
    const scaleX = (MAP_SIZE - 8) / worldW;
    const scaleY = (MAP_SIZE - 8) / worldH;
    const ox = 4, oy = 4;

    // Draw collision map (very simple)
    const step = Math.max(1, Math.floor(zone.width / 30)); // downsample
    for (let ty = 0; ty < zone.height; ty += step) {
      for (let tx = 0; tx < zone.width; tx += step) {
        const idx = ty * zone.width + tx;
        if (zone.collisionMap[idx] === 1) {
          const px = ox + tx * zone.tileSize * scaleX;
          const py = oy + ty * zone.tileSize * scaleY;
          this.dots.rect(px, py, step * zone.tileSize * scaleX, step * zone.tileSize * scaleY);
          this.dots.fill({ color: 0x444444, alpha: 0.5 });
        }
      }
    }

    // Draw portals
    for (const portal of zone.portals) {
      const px = ox + portal.position.x * zone.tileSize * scaleX;
      const py = oy + portal.position.y * zone.tileSize * scaleY;
      this.dots.circle(px, py, 3);
      this.dots.fill({ color: 0x44aaff, alpha: 0.8 });
    }

    // Draw remote players
    for (const [uid, rp] of Object.entries(state.remotePlayers)) {
      if (uid === state.player?.uid) continue;
      const px = ox + rp.x * scaleX;
      const py = oy + rp.y * scaleY;
      this.dots.circle(px, py, 2);
      this.dots.fill({ color: 0xcc4444, alpha: 0.9 });
    }

    // Draw local player
    const localPos = engine.entities.getLocalPlayerPos();
    if (localPos) {
      const px = ox + localPos.x * scaleX;
      const py = oy + localPos.y * scaleY;
      this.dots.circle(px, py, 3);
      this.dots.fill(0xddaa33);
    }

    // View bounds indicator
    const bounds = engine.camera.getVisibleBounds();
    const vx = ox + bounds.x * scaleX;
    const vy = oy + bounds.y * scaleY;
    const vw = bounds.w * scaleX;
    const vh = bounds.h * scaleY;
    this.dots.rect(vx, vy, vw, vh);
    this.dots.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });

    this.label.text = zone.name;
  }
}
