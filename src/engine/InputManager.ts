// ============================================
// Input Manager — keyboard & mouse state
// ============================================
import type { Vec2 } from '@/store/types';

export type KeyAction =
  | 'up' | 'down' | 'left' | 'right'
  | 'skill1' | 'skill2' | 'skill3' | 'skill4' | 'skill5'
  | 'interact' | 'inventory' | 'chat' | 'escape' | 'tab';

const KEY_MAP: Record<string, KeyAction> = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Digit1: 'skill1', Digit2: 'skill2', Digit3: 'skill3',
  Digit4: 'skill4', Digit5: 'skill5',
  KeyE: 'interact',
  KeyI: 'inventory',
  Enter: 'chat',
  Escape: 'escape',
  Tab: 'tab',
};

class InputManager {
  private keys = new Set<KeyAction>();
  private justPressed = new Set<KeyAction>();
  private mousePos: Vec2 = { x: 0, y: 0 };
  private mouseDown = false;
  private _enabled = true;
  private _clickPos: Vec2 | null = null;  // screen-space click (pending consumption)
  private _canvas: HTMLElement | null = null;

  init(canvas: HTMLElement): void {
    this._canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove as EventListener);
    canvas.addEventListener('mousedown', this.onMouseDown as EventListener);
    canvas.addEventListener('mouseup', this.onMouseUp as EventListener);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // Mobile touch
    canvas.addEventListener('touchstart', this.onTouchStart as EventListener, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd as EventListener, { passive: false });
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; if (!v) this.keys.clear(); }

  private getCanvasOffset(): { left: number; top: number } {
    if (!this._canvas) return { left: 0, top: 0 };
    const rect = this._canvas.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this._enabled) return;
    const action = KEY_MAP[e.code];
    if (action) {
      e.preventDefault();
      if (!this.keys.has(action)) this.justPressed.add(action);
      this.keys.add(action);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = KEY_MAP[e.code];
    if (action) this.keys.delete(action);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const { left, top } = this.getCanvasOffset();
    this.mousePos = { x: e.clientX - left, y: e.clientY - top };
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (!this._enabled) return;
    this.mouseDown = true;
    // Only primary (left) button triggers click-to-move
    if (e.button === 0) {
      const { left, top } = this.getCanvasOffset();
      this._clickPos = { x: e.clientX - left, y: e.clientY - top };
    }
  };

  private onMouseUp = (_e: MouseEvent): void => { this.mouseDown = false; };

  private _touchStartPos: Vec2 | null = null;
  private _touchStartTime = 0;

  private onTouchStart = (e: TouchEvent): void => {
    if (!this._enabled) return;
    e.preventDefault();
    if (e.touches.length > 0) {
      const { left, top } = this.getCanvasOffset();
      const t = e.touches[0];
      this._touchStartPos = { x: t.clientX - left, y: t.clientY - top };
      this._touchStartTime = Date.now();
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (!this._enabled) return;
    e.preventDefault();
    // Treat quick taps (< 300ms, < 20px movement) as click-to-move
    if (this._touchStartPos && (Date.now() - this._touchStartTime) < 300) {
      const touch = e.changedTouches[0];
      if (touch) {
        const { left, top } = this.getCanvasOffset();
        const endX = touch.clientX - left;
        const endY = touch.clientY - top;
        const dx = endX - this._touchStartPos.x;
        const dy = endY - this._touchStartPos.y;
        if (Math.hypot(dx, dy) < 20) {
          this._clickPos = { x: endX, y: endY };
        }
      }
    }
    this._touchStartPos = null;
  };

  isDown(action: KeyAction): boolean { return this.keys.has(action); }
  wasPressed(action: KeyAction): boolean { return this.justPressed.has(action); }
  isMouseDown(): boolean { return this.mouseDown; }
  getMousePos(): Vec2 { return { ...this.mousePos }; }

  /**
   * Returns the canvas-relative screen position of the last click/tap
   * and clears it (consume pattern). Returns null if no click this frame.
   */
  consumeClick(): Vec2 | null {
    const p = this._clickPos;
    this._clickPos = null;
    return p;
  }

  /** Call at end of each frame to clear just-pressed set */
  endFrame(): void {
    this.justPressed.clear();
  }
}

export const input = new InputManager();
