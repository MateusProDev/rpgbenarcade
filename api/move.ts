// ============================================
// Vercel Serverless — Movement Validation (anti-cheat)
// ============================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const MAX_SPEED = 250; // max pixels per second allowed (with margin)
const MAX_TELEPORT = 500; // max allowed instant jump

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { uid, from, to, timestamp } = req.body;

    if (!uid || !from || !to || !timestamp) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Teleport check
    if (dist > MAX_TELEPORT) {
      return res.status(200).json({
        valid: false,
        correctedPos: from,
      });
    }

    // Speed check (using server timestamp difference)
    const db = getFirestore();
    const playerDoc = await db.doc(`users/${uid}`).get();
    const playerData = playerDoc.data();
    const lastMoveAt = playerData?.lastMoveAt ?? 0;
    const now = Date.now();
    const elapsed = (now - lastMoveAt) / 1000; // seconds

    if (elapsed > 0 && dist / elapsed > MAX_SPEED) {
      // Speed hack detected — correct position
      const ratio = (MAX_SPEED * elapsed) / dist;
      const correctedPos = {
        x: from.x + dx * ratio,
        y: from.y + dy * ratio,
      };
      return res.status(200).json({ valid: false, correctedPos });
    }

    // Update last move
    await db.doc(`users/${uid}`).update({
      lastMoveAt: now,
      'position.x': to.x,
      'position.y': to.y,
    });

    return res.status(200).json({ valid: true });
  } catch (err) {
    console.error('Move API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
