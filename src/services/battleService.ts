/**
 * BattleService — Firestore operations for battles and reports.
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import type { Battle, BattleReport } from '../types/battle';

export const BattleService = {
  async get(battleId: string): Promise<Battle | null> {
    const snap = await getDoc(doc(getFirebaseDb(), 'battles', battleId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Battle) : null;
  },

  async getReportsByPlayer(playerId: string, maxResults = 20): Promise<BattleReport[]> {
    const q = query(
      collection(getFirebaseDb(), 'reports'),
      where('playerId', '==', playerId),
      orderBy('timestamp', 'desc'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BattleReport);
  },

  /**
   * Sends a battle request to the server-side function.
   * Battle resolution MUST happen server-side.
   */
  async requestBattle(
    attackerCityId: string,
    defenderCityId: string,
    troops: { type: string; count: number }[],
  ): Promise<{ battleId: string }> {
    const response = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attackerCityId, defenderCityId, troops }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message ?? 'Falha ao iniciar batalha.');
    }

    return response.json();
  },
};
