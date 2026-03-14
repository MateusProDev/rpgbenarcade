/**
 * Resource Tick — Vercel Serverless Function (or Cron)
 *
 * Calculates offline resource accumulation for a player's city.
 * GET /api/resource-tick?cityId=xxx
 *
 * Can also be called as a cron job to batch-update all cities.
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

    const { cityId } = req.body;
    if (!cityId) return res.status(400).json({ message: 'cityId required.' });

    const cityRef = db.doc(`cities/${cityId}`);
    const citySnap = await cityRef.get();
    if (!citySnap.exists) return res.status(404).json({ message: 'City not found.' });

    const city = citySnap.data()!;
    if (city.playerId !== decoded.uid) {
      return res.status(403).json({ message: 'Not your city.' });
    }

    const now = Date.now();
    const resources = city.resources;
    const elapsedMs = Math.max(0, now - (resources.lastCalculatedAt ?? now));
    const elapsedHours = elapsedMs / 3_600_000;

    const KEYS = ['wood', 'stone', 'iron', 'food', 'gold'] as const;
    const updated = { ...resources.current };

    for (const k of KEYS) {
      const produced = (resources.production[k] ?? 0) * elapsedHours;
      updated[k] = Math.min((updated[k] ?? 0) + produced, resources.capacity[k] ?? 5000);
    }

    await cityRef.update({
      'resources.current': updated,
      'resources.lastCalculatedAt': now,
    });

    return res.status(200).json({ resources: updated, calculatedAt: now });
  } catch (error: unknown) {
    console.error('Resource tick error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
}
