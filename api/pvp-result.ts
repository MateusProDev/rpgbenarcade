// Vercel Serverless Function - PvP Result Handler
// Install @vercel/node and firebase-admin before deploying to Vercel

// Inline types (avoid dependency on @vercel/node for local type checking)
interface VercelRequest {
  method?: string;
  body: any;
}
interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): VercelResponse;
}

// Firebase Admin SDK - only used at deploy time
let db: any;
try {
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  db = admin.firestore();
} catch (_) {
  // firebase-admin not available (local dev)
}

// ELO-like rating calculation
function calculateRatingChange(
  winnerRating: number,
  loserRating: number
): { winnerDelta: number; loserDelta: number } {
  const K = 32;
  const expectedWin =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const winnerDelta = Math.round(K * (1 - expectedWin));
  const loserDelta = Math.round(K * expectedWin);
  return { winnerDelta, loserDelta: -loserDelta };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { winnerId, loserId, winnerName, loserName } = req.body;

    if (!winnerId || !loserId) {
      return res.status(400).json({ error: "Missing winnerId or loserId" });
    }

    if (winnerId === loserId) {
      return res.status(400).json({ error: "Winner and loser cannot be the same" });
    }

    // Get current player data
    const [winnerDoc, loserDoc] = await Promise.all([
      db.collection("players").doc(winnerId).get(),
      db.collection("players").doc(loserId).get(),
    ]);

    if (!winnerDoc.exists || !loserDoc.exists) {
      return res.status(404).json({ error: "Player not found" });
    }

    const winnerData = winnerDoc.data()!;
    const loserData = loserDoc.data()!;

    const winnerRating = winnerData.pvpRating || 1000;
    const loserRating = loserData.pvpRating || 1000;

    const { winnerDelta, loserDelta } = calculateRatingChange(
      winnerRating,
      loserRating
    );

    // XP reward for winner (scales with level difference)
    const levelDiff = Math.max(0, loserData.level - winnerData.level);
    const baseXp = 50 + levelDiff * 20;
    const goldReward = 25 + levelDiff * 10;

    // Update both players atomically using a batch
    const batch = db.batch();

    batch.update(winnerDoc.ref, {
      pvpRating: Math.max(0, winnerRating + winnerDelta),
      pvpWins: (winnerData.pvpWins || 0) + 1,
    });

    batch.update(loserDoc.ref, {
      pvpRating: Math.max(0, loserRating + loserDelta),
      pvpLosses: (loserData.pvpLosses || 0) + 1,
    });

    // Record the match
    const matchRef = db.collection("pvp_results").doc();
    batch.set(matchRef, {
      winnerId,
      loserId,
      winnerName: winnerName || "Unknown",
      loserName: loserName || "Unknown",
      winnerRatingBefore: winnerRating,
      loserRatingBefore: loserRating,
      winnerDelta,
      loserDelta,
      xpReward: baseXp,
      goldReward,
      timestamp: new Date(),
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      winnerNewRating: Math.max(0, winnerRating + winnerDelta),
      loserNewRating: Math.max(0, loserRating + loserDelta),
      winnerDelta,
      loserDelta,
      xpReward: baseXp,
      goldReward,
    });
  } catch (error: any) {
    console.error("PvP result error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
