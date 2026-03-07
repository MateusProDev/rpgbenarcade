/**
 * Game Loop baseado em requestAnimationFrame.
 * Executa callbacks de tick em intervalo configurável.
 */

type TickFn = (delta: number) => void;

class GameLoop {
  private callbacks: Map<string, TickFn> = new Map();
  private lastTime   = 0;
  private rafId: number | null = null;
  private tickInterval: number; // ms

  constructor(tickInterval = 1000) {
    this.tickInterval = tickInterval;
  }

  register(key: string, fn: TickFn): void {
    this.callbacks.set(key, fn);
  }

  unregister(key: string): void {
    this.callbacks.delete(key);
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const loop = (now: number) => {
      const delta = now - this.lastTime;
      if (delta >= this.tickInterval) {
        this.lastTime = now - (delta % this.tickInterval);
        this.callbacks.forEach((fn) => fn(delta));
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Instância singleton usada pelo jogo
export const gameLoop = new GameLoop(5_000); // tick a cada 5 segundos
export default GameLoop;
