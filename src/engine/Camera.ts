// ============================================
// Camera — follow target, shake, smoothing
// ============================================
import { Container } from 'pixi.js';
import type { Vec2 } from '@/store/types';

export class Camera {
  /** The root container moved to simulate camera */
  readonly pivot = new Container();
  private target: Vec2 = { x: 0, y: 0 };
  private smoothing = 0.12;
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;
  private screenW = 0;
  private screenH = 0;

  constructor(screenW: number, screenH: number) {
    this.screenW = screenW;
    this.screenH = screenH;
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  setTarget(pos: Vec2): void {
    this.target = pos;
  }

  /** Snap instantly (no lerp) */
  snap(): void {
    this.pivot.x = -this.target.x + this.screenW / 2;
    this.pivot.y = -this.target.y + this.screenH / 2;
  }

  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  update(dt: number): void {
    // Smooth follow
    const goalX = -this.target.x + this.screenW / 2;
    const goalY = -this.target.y + this.screenH / 2;
    this.pivot.x += (goalX - this.pivot.x) * this.smoothing;
    this.pivot.y += (goalY - this.pivot.y) * this.smoothing;

    // Screen shake
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += dt;
      const factor = 1 - this.shakeElapsed / this.shakeDuration;
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
      this.pivot.x += offsetX;
      this.pivot.y += offsetY;
    }
  }

  /** Convert screen coords to world coords */
  screenToWorld(screenX: number, screenY: number): Vec2 {
    return {
      x: screenX - this.pivot.x,
      y: screenY - this.pivot.y,
    };
  }

  /** Convert world coords to screen coords */
  worldToScreen(worldX: number, worldY: number): Vec2 {
    return {
      x: worldX + this.pivot.x,
      y: worldY + this.pivot.y,
    };
  }

  /** Get AABB of visible area in world coords */
  getVisibleBounds(): { x: number; y: number; w: number; h: number } {
    return {
      x: -this.pivot.x,
      y: -this.pivot.y,
      w: this.screenW,
      h: this.screenH,
    };
  }
}
