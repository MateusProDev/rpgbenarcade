import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface BattleRequest {
  attackerUid: string;
  defenderUid: string;
  worldId:     string;
  troops: Record<string, number>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { attackerUid, defenderUid, worldId, troops } = req.body as BattleRequest;

  try {
    const [atkCastle, defCastle] = await Promise.all([
      db.collection('castles').doc(`${attackerUid}_${worldId}`).get(),
      db.collection('castles').doc(`${defenderUid}_${worldId}`).get(),
    ]);

    if (!atkCastle.exists || !defCastle.exists) {
      return res.status(404).json({ error: 'Castle not found' });
    }

    const defData = defCastle.data()!;
    const defBonus = 1 + defData.level * 0.05;

    let atkPower = 0;
    let defPower = 0;

    const TROOP_STATS: Record<string, { attack: number; hp: number }> = {
      infantry: { attack: 40,  hp: 200 },
      archer:   { attack: 60,  hp: 120 },
      cavalry:  { attack: 90,  hp: 300 },
    };

    for (const [type, count] of Object.entries(troops)) {
      atkPower += (TROOP_STATS[type]?.attack ?? 0) * (count as number);
    }

    // Defensor usa tropas do castelo (simplificado: escala pelo nível)
    defPower = defData.level * 500 * defBonus;

    const attackerWon = atkPower > defPower;
    const loot = attackerWon
      ? {
          food:  Math.floor(defData.resources.food  * 0.2),
          wood:  Math.floor(defData.resources.wood  * 0.2),
          stone: Math.floor(defData.resources.stone * 0.2),
          iron:  Math.floor(defData.resources.iron  * 0.2),
        }
      : { food: 0, wood: 0, stone: 0, iron: 0 };

    // Salva resultado
    const matchRef = db.collection('matches').doc();
    await matchRef.set({
      id:         matchRef.id,
      worldId,
      attackerUid,
      defenderUid,
      troops,
      attackerWon,
      loot,
      timestamp:  FieldValue.serverTimestamp(),
    });

    // Aplica saque
    if (attackerWon) {
      const atkRef = db.collection('castles').doc(`${attackerUid}_${worldId}`);
      const defRef = db.collection('castles').doc(`${defenderUid}_${worldId}`);
      const batch  = db.batch();
      batch.update(atkRef, {
        'resources.food':  FieldValue.increment(loot.food),
        'resources.wood':  FieldValue.increment(loot.wood),
        'resources.stone': FieldValue.increment(loot.stone),
        'resources.iron':  FieldValue.increment(loot.iron),
      });
      batch.update(defRef, {
        'resources.food':  FieldValue.increment(-loot.food),
        'resources.wood':  FieldValue.increment(-loot.wood),
        'resources.stone': FieldValue.increment(-loot.stone),
        'resources.iron':  FieldValue.increment(-loot.iron),
      });
      await batch.commit();
    }

    return res.json({ attackerWon, loot, matchId: matchRef.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
