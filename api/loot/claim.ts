// ============================================
// Vercel Serverless — Loot Claim Validation
// ============================================
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { uid, lootId, zone } = req.body;

    if (!uid || !lootId || !zone) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Check if loot exists and hasn't been claimed
    const lootDoc = await db.doc(`lootDrops/${lootId}`).get();
    if (!lootDoc.exists) {
      return res.status(200).json({ valid: false, error: 'Loot not found' });
    }

    const loot = lootDoc.data()!;
    if (loot.claimed) {
      return res.status(200).json({ valid: false, error: 'Already claimed' });
    }

    // Zone check
    if (loot.zone !== zone) {
      return res.status(200).json({ valid: false, error: 'Wrong zone' });
    }

    // Expiry check (30 seconds)
    if (Date.now() - (loot.droppedAt ?? 0) > 30000) {
      await db.doc(`lootDrops/${lootId}`).delete();
      return res.status(200).json({ valid: false, error: 'Loot expired' });
    }

    // Mark as claimed
    await db.doc(`lootDrops/${lootId}`).update({ claimed: true, claimedBy: uid });

    // Add item to player inventory
    const item = loot.item;
    if (item) {
      // Simple approach: add to player inventory as array element
      await db.doc(`users/${uid}`).update({
        inventory: FieldValue.arrayUnion(item),
      });
    }

    return res.status(200).json({ valid: true, item });
  } catch (err) {
    console.error('Loot claim error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
