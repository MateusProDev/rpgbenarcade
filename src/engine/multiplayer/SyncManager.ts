// ============================================
// Sync Manager — multiplayer position sync + presence
// ============================================
import { sendPosition, listenZonePlayers, setPresence, removePresence } from '@/services/firebase/realtime';
import { useGameStore } from '@/store/gameStore';
import type { GameEngine } from '../GameEngine';
import type { SyncPayload, RemotePlayerState } from '@/store/types';

const SYNC_INTERVAL = 0.1; // 100ms

export class SyncManager {
  private engine: GameEngine;
  private timer = 0;
  private unsubZone: (() => void) | null = null;
  private currentZone = '';

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  update(dt: number): void {
    this.timer += dt;
    if (this.timer < SYNC_INTERVAL) return;
    this.timer = 0;

    this.sendLocalPosition();
  }

  private sendLocalPosition(): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    const pos = this.engine.entities.getLocalPlayerPos();
    if (!pos) return;

    const payload: SyncPayload = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      direction: this.engine.entities.getLocalDir(),
      zone: state.currentZone,
      animation: 'idle',
      hp: player.stats.hp,
      maxHp: player.stats.maxHp,
      name: player.name,
      level: player.level,
      className: player.className,
      ts: Date.now(),
    };

    sendPosition(player.uid, payload);
  }

  changeZone(zoneId: string): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    // Unsubscribe from old zone
    if (this.unsubZone) {
      this.unsubZone();
      this.unsubZone = null;
    }
    if (this.currentZone) {
      removePresence(player.uid, this.currentZone);
    }

    // Subscribe to new zone
    this.currentZone = zoneId;
    setPresence(player.uid, zoneId);

    this.unsubZone = listenZonePlayers(zoneId, (players) => {
      const remotes: Record<string, RemotePlayerState> = {};
      for (const [uid, data] of Object.entries(players)) {
        if (uid === player.uid) continue;
        if (typeof data === 'object' && data && 'x' in data) {
          const d = data as SyncPayload;
          remotes[uid] = {
            ...d,
            uid,
            lastUpdate: d.ts || Date.now(),
          };
        }
      }
      state.setRemotePlayers(remotes);
    });
  }

  destroy(): void {
    if (this.unsubZone) {
      this.unsubZone();
      this.unsubZone = null;
    }
    const state = useGameStore.getState();
    const player = state.player;
    if (player && this.currentZone) {
      removePresence(player.uid, this.currentZone);
    }
  }
}
