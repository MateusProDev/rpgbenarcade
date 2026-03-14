/**
 * Validation — Vercel Serverless Function
 *
 * Validates building/troop actions server-side.
 * POST /api/validate
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.slice(7);
    const decoded = await getAuth().verifyIdToken(token);

    const { action, cityId, payload } = req.body;
    if (!action || !cityId) {
      return res.status(400).json({ message: 'action and cityId required.' });
    }

    const citySnap = await db.doc(`cities/${cityId}`).get();
    if (!citySnap.exists) return res.status(404).json({ message: 'City not found.' });

    const city = citySnap.data()!;
    if (city.playerId !== decoded.uid) {
      return res.status(403).json({ message: 'Not your city.' });
    }

    // Action validation
    switch (action) {
      case 'upgrade_building': {
        const building = city.buildings?.find((b: { id: string }) => b.id === payload?.buildingId);
        if (!building) return res.status(400).json({ valid: false, reason: 'Building not found.' });
        if (building.upgradeStartedAt) return res.status(400).json({ valid: false, reason: 'Already upgrading.' });
        return res.status(200).json({ valid: true });
      }

      case 'train_troops': {
        if (!payload?.troopType || !payload?.amount) {
          return res.status(400).json({ valid: false, reason: 'Missing troopType or amount.' });
        }
        return res.status(200).json({ valid: true });
      }

      default:
        return res.status(400).json({ valid: false, reason: 'Unknown action.' });
    }
  } catch (error: unknown) {
    console.error('Validation error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
