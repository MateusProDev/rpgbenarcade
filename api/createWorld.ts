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

const db          = getFirestore();
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS_PER_WORLD ?? '200', 10);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const worldRef = db.collection('worlds').doc();
    const worldId  = worldRef.id;
    await worldRef.set({
      id:          worldId,
      name:        `Mundo ${worldId.slice(0, 6)}`,
      playerCount: 0,
      maxPlayers:  MAX_PLAYERS,
      createdAt:   FieldValue.serverTimestamp(),
      active:      true,
    });
    return res.json({ worldId, message: 'Novo mundo criado com sucesso.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
