// API Service — calls to Vercel serverless functions
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json();
}

/** Validate attack server-side */
export function apiAttack(data: {
  attackerId: string; targetId: string; skillId: string;
  attackerPos: { x: number; y: number }; targetPos: { x: number; y: number };
  zone: string;
}) {
  return post<{
    valid: boolean; damage: number; isCrit: boolean;
    targetHp: number; killed: boolean; loot?: unknown[];
    xpGained?: number; goldGained?: number;
  }>('/combat', data);
}

/** Validate movement server-side */
export function apiMove(data: {
  uid: string; from: { x: number; y: number }; to: { x: number; y: number };
  timestamp: number;
}) {
  return post<{ valid: boolean; correctedPos?: { x: number; y: number } }>('/move', data);
}

/** Territory capture attempt */
export function apiCaptureTerritory(data: {
  allianceId: string; territoryId: string; membersOnline: string[];
}) {
  return post<{ success: boolean; newOwner?: string }>('/territory/capture', data);
}

/** PvP result */
export function apiPvpResult(data: {
  winnerId: string; loserId: string; winnerName: string; loserName: string;
}) {
  return post<{ winnerDelta: number; loserDelta: number }>('/pvp-result', data);
}

/** Loot claim */
export function apiClaimLoot(data: { uid: string; lootId: string; zone: string }) {
  return post<{ valid: boolean; item?: unknown }>('/loot/claim', data);
}
