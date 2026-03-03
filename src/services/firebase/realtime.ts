// Realtime Database — fast position sync (100ms throttle)
import { rtdb } from './config';
import { ref, set, onValue, off, onDisconnect } from 'firebase/database';
import type { SyncPayload } from '@/store/types';

const THROTTLE_MS = 100;
let lastSend = 0;

/** Push local player position (throttled) */
export function sendPosition(uid: string, payload: SyncPayload): void {
  const now = Date.now();
  if (now - lastSend < THROTTLE_MS) return;
  lastSend = now;
  try {
    const r = ref(rtdb, `zones/${payload.zone}/players/${uid}`);
    set(r, { ...payload, ts: Date.now() }).catch(() => {});
  } catch { /* RTDB not provisioned yet */ }
}

/** Listen to all players in a zone */
export function listenZonePlayers(
  zone: string,
  callback: (players: Record<string, SyncPayload>) => void,
): () => void {
  try {
    const r = ref(rtdb, `zones/${zone}/players`);
    const handler = onValue(r, (snap) => {
      callback(snap.val() ?? {});
    }, () => { /* RTDB error – ignore */ });
    return () => off(r, 'value', handler);
  } catch {
    return () => {};
  }
}

/** Set presence (auto-remove on disconnect) */
export function setPresence(uid: string, zone: string): void {
  try {
    const r = ref(rtdb, `zones/${zone}/players/${uid}`);
    onDisconnect(r).remove();
    set(ref(rtdb, `zones/${zone}/players/${uid}/online`), true).catch(() => {});
  } catch { /* RTDB not provisioned yet */ }
}

/** Remove presence manually */
export function removePresence(uid: string, zone: string): void {
  try {
    set(ref(rtdb, `zones/${zone}/players/${uid}`), null).catch(() => {});
  } catch { /* RTDB not provisioned yet */ }
}

/** Send combat intent to Realtime DB for quick propagation */
export function sendCombatEvent(zone: string, event: {
  type: string; attackerId: string; targetId: string;
  skillId: string; timestamp: number;
}): void {
  try {
    const r = ref(rtdb, `zones/${zone}/combatEvents/${event.attackerId}_${event.timestamp}`);
    set(r, event).catch(() => {});
  } catch { /* RTDB not provisioned yet */ }
}

/** Listen to combat events in zone */
export function listenCombatEvents(
  zone: string,
  callback: (events: Record<string, unknown>) => void,
): () => void {
  try {
    const r = ref(rtdb, `zones/${zone}/combatEvents`);
    const handler = onValue(r, (snap) => {
      callback(snap.val() ?? {});
    }, () => { /* RTDB error – ignore */ });
    return () => off(r, 'value', handler);
  } catch {
    return () => {};
  }
}
