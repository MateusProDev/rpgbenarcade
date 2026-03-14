/**
 * Battle Resolver — Vercel Serverless Function
 *
 * Handles battle resolution server-side to prevent client cheating.
 * POST /api/battle
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (singleton)
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    const decoded = await getAuth().verifyIdToken(token);
    const attackerUid = decoded.uid;

    const { attackerCityId, defenderCityId, troops } = req.body;

    if (!attackerCityId || !defenderCityId || !troops?.length) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Load cities
    const [attackerSnap, defenderSnap] = await Promise.all([
      db.doc(`cities/${attackerCityId}`).get(),
      db.doc(`cities/${defenderCityId}`).get(),
    ]);

    if (!attackerSnap.exists || !defenderSnap.exists) {
      return res.status(404).json({ message: 'City not found.' });
    }

    const attackerCity = attackerSnap.data()!;
    const defenderCity = defenderSnap.data()!;

    // Validate ownership
    if (attackerCity.playerId !== attackerUid) {
      return res.status(403).json({ message: 'Not your city.' });
    }

    // ── Battle resolution logic (mirrors BattleSystem) ──

    // Compute army stats
    const TROOP_STATS: Record<string, { attack: number; defense: number; carry: number }> = {
      militia:    { attack: 10, defense: 8,  carry: 30 },
      swordsman:  { attack: 20, defense: 25, carry: 20 },
      archer:     { attack: 30, defense: 10, carry: 15 },
      cavalry:    { attack: 40, defense: 20, carry: 50 },
      catapult:   { attack: 80, defense: 5,  carry: 0 },
    };

    let attackPower = 0;
    for (const t of troops) {
      const stats = TROOP_STATS[t.type];
      if (stats) attackPower += stats.attack * t.count;
    }

    let defensePower = 0;
    for (const t of defenderCity.garrison ?? []) {
      const stats = TROOP_STATS[t.type];
      if (stats) defensePower += stats.defense * t.count;
    }

    // Wall bonus
    const wall = (defenderCity.buildings ?? []).find((b: { type: string; level: number }) => b.type === 'wall');
    const wallBonus = 1 + (wall?.level ?? 0) * 0.05;
    defensePower *= wallBonus;

    const attackerWins = attackPower > defensePower;
    const ratio = attackerWins
      ? defensePower / Math.max(attackPower, 1)
      : attackPower / Math.max(defensePower, 1);

    const attackerLossRatio = attackerWins ? ratio * 0.5 : 0.85;
    const defenderLossRatio = attackerWins ? 0.85 : ratio * 0.5;

    const applyLosses = (army: { type: string; count: number }[], lossRatio: number) =>
      army.map((t) => ({ type: t.type, count: Math.floor(t.count * lossRatio) })).filter((t) => t.count > 0);

    const attackerLosses = applyLosses(troops, attackerLossRatio);
    const defenderLosses = applyLosses(defenderCity.garrison ?? [], defenderLossRatio);

    // Calculate loot
    let resourcesStolen = { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 };
    if (attackerWins) {
      const lossMap = new Map(attackerLosses.map((l: { type: string; count: number }) => [l.type, l.count]));
      let totalCarry = 0;
      for (const t of troops) {
        const lost = lossMap.get(t.type) ?? 0;
        const surviving = t.count - lost;
        const stats = TROOP_STATS[t.type];
        if (stats) totalCarry += surviving * stats.carry;
      }
      const keys = ['wood', 'stone', 'iron', 'food', 'gold'] as const;
      const perResource = Math.floor(totalCarry / keys.length);
      for (const k of keys) {
        resourcesStolen[k] = Math.min(perResource, defenderCity.resources?.current?.[k] ?? 0);
      }
    }

    const result = {
      winner: attackerWins ? 'attacker' : 'defender',
      attackerLosses,
      defenderLosses,
      resourcesStolen,
    };

    // Save battle document
    const battleRef = await db.collection('battles').add({
      attackerPlayerId: attackerUid,
      defenderPlayerId: defenderCity.playerId,
      attackerCityId,
      defenderCityId,
      status: 'resolved',
      attackerTroops: troops,
      defenderTroops: defenderCity.garrison ?? [],
      result,
      marchStartedAt: Date.now(),
      marchArrivalAt: Date.now(),
      resolvedAt: Date.now(),
    });

    // Save reports for both players
    const reportBase = {
      battleId: battleRef.id,
      result,
      timestamp: Date.now(),
      read: false,
    };
    await Promise.all([
      db.collection('reports').add({ ...reportBase, playerId: attackerUid, isAttacker: true }),
      db.collection('reports').add({ ...reportBase, playerId: defenderCity.playerId, isAttacker: false }),
    ]);

    return res.status(200).json({ battleId: battleRef.id, result });
  } catch (error: unknown) {
    console.error('Battle error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
