// ============================================
// Vercel Serverless — Territory Capture
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

const CAPTURE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MIN_MEMBERS_ONLINE = 2;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { allianceId, territoryId, membersOnline } = req.body;

    if (!allianceId || !territoryId || !membersOnline?.length) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Verify alliance exists
    const allianceDoc = await db.doc(`alliances/${allianceId}`).get();
    if (!allianceDoc.exists) {
      return res.status(200).json({ success: false, error: 'Alliance not found' });
    }

    // Verify territory exists
    const territoryDoc = await db.doc(`territories/${territoryId}`).get();
    if (!territoryDoc.exists) {
      return res.status(200).json({ success: false, error: 'Territory not found' });
    }

    const territory = territoryDoc.data()!;

    // Check cooldown
    const lastCaptured = territory.lastCaptured ?? 0;
    if (Date.now() - lastCaptured < CAPTURE_COOLDOWN_MS) {
      const remainingMs = CAPTURE_COOLDOWN_MS - (Date.now() - lastCaptured);
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(200).json({
        success: false,
        error: `Território em cooldown. Aguarde ${remainingMin} min.`,
      });
    }

    // Can't capture own territory
    if (territory.ownerId === allianceId) {
      return res.status(200).json({ success: false, error: 'Already your territory' });
    }

    // Need minimum members online
    if (membersOnline.length < MIN_MEMBERS_ONLINE) {
      return res.status(200).json({
        success: false,
        error: `Mínimo de ${MIN_MEMBERS_ONLINE} membros online necessário.`,
      });
    }

    // Verify members belong to alliance
    const alliance = allianceDoc.data()!;
    const memberUids = new Set(alliance.members?.map((m: { uid: string }) => m.uid) ?? []);
    const validMembers = membersOnline.filter((uid: string) => memberUids.has(uid));
    if (validMembers.length < MIN_MEMBERS_ONLINE) {
      return res.status(200).json({ success: false, error: 'Insufficient valid members' });
    }

    // Capture territory
    const now = Date.now();
    await db.doc(`territories/${territoryId}`).update({
      ownerId: allianceId,
      ownerName: alliance.name ?? alliance.tag,
      captureProgress: 100,
      capturingAlliance: null,
      lastCaptured: now,
    });

    // Update alliance territories list
    await db.doc(`alliances/${allianceId}`).update({
      territories: FieldValue.arrayUnion(territoryId),
    });

    // Remove from old owner if exists
    if (territory.ownerId) {
      await db.doc(`alliances/${territory.ownerId}`).update({
        territories: FieldValue.arrayRemove(territoryId),
      });
    }

    return res.status(200).json({
      success: true,
      newOwner: allianceId,
    });
  } catch (err) {
    console.error('Territory capture error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
