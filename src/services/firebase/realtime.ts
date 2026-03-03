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
  const r = ref(rtdb, `zones/${payload.zone}/players/${uid}`);
  set(r, { ...payload, ts: Date.now() });
}

/** Listen to all players in a zone */
export function listenZonePlayers(
  zone: string,
  callback: (players: Record<string, SyncPayload>) => void,
): () => void {
  const r = ref(rtdb, `zones/${zone}/players`);
  const handler = onValue(r, (snap) => {
    callback(snap.val() ?? {});
  });
  return () => off(r, 'value', handler);
}

/** Set presence (auto-remove on disconnect) */
export function setPresence(uid: string, zone: string): void {
  const r = ref(rtdb, `zones/${zone}/players/${uid}`);
  onDisconnect(r).remove();
  set(ref(rtdb, `zones/${zone}/players/${uid}/online`), true);
}

/** Remove presence manually */
export function removePresence(uid: string, zone: string): void {
  set(ref(rtdb, `zones/${zone}/players/${uid}`), null);
}

/** Send combat intent to Realtime DB for quick propagation */
export function sendCombatEvent(zone: string, event: {
  type: string; attackerId: string; targetId: string;
  skillId: string; timestamp: number;
}): void {
  const r = ref(rtdb, `zones/${zone}/combatEvents/${event.attackerId}_${event.timestamp}`);
  set(r, event);
}

/** Listen to combat events in zone */
export function listenCombatEvents(
  zone: string,
  callback: (events: Record<string, unknown>) => void,
): () => void {
  const r = ref(rtdb, `zones/${zone}/combatEvents`);
  const handler = onValue(r, (snap) => {
    callback(snap.val() ?? {});
  });
  return () => off(r, 'value', handler);
}
