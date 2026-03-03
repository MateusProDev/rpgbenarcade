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

  init(canvas: HTMLElement): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove as EventListener);
    canvas.addEventListener('mousedown', this.onMouseDown as EventListener);
    canvas.addEventListener('mouseup', this.onMouseUp as EventListener);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  get enabled(): boolean { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; if (!v) this.keys.clear(); }

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
    this.mousePos = { x: e.clientX, y: e.clientY };
  };

  private onMouseDown = (_e: MouseEvent): void => { this.mouseDown = true; };
  private onMouseUp = (_e: MouseEvent): void => { this.mouseDown = false; };

  isDown(action: KeyAction): boolean { return this.keys.has(action); }
  wasPressed(action: KeyAction): boolean { return this.justPressed.has(action); }
  isMouseDown(): boolean { return this.mouseDown; }
  getMousePos(): Vec2 { return { ...this.mousePos }; }

  /** Call at end of each frame to clear just-pressed set */
  endFrame(): void {
    this.justPressed.clear();
  }
}

export const input = new InputManager();
