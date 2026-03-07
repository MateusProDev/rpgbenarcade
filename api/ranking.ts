import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { worldId } = req.query as { worldId?: string };

  try {
    const q = worldId
      ? db.collection('castles').where('worldId', '==', worldId).orderBy('level', 'desc').limit(50)
      : db.collection('castles').orderBy('level', 'desc').limit(100);

    const snap = await q.get();
    const ranking = snap.docs.map((doc, i) => {
      const d = doc.data();
      return {
        rank:     i + 1,
        playerId: d.playerId,
        level:    d.level,
        worldId:  d.worldId,
      };
    });

    return res.json({ ranking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
