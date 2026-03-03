// ============================================
// Vercel Serverless — Combat Validation (anti-cheat)
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
const db = getFirestore();

const MAX_ATTACK_RANGE = 220;    // max allowed range in pixels
const MAX_SPEED = 250;           // max px/s
const MIN_INTERVAL_MS = 300;     // min time between attacks

interface AttackPayload {
  attackerId: string;
  targetId: string;
  skillId: string;
  attackerPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  zone: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body as AttackPayload;
    const { attackerId, targetId, attackerPos, targetPos, zone } = body;

    if (!attackerId || !targetId || !attackerPos || !targetPos || !zone) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Distance check (anti-cheat)
    const dx = attackerPos.x - targetPos.x;
    const dy = attackerPos.y - targetPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_ATTACK_RANGE) {
      return res.status(200).json({ valid: false, error: 'Out of range' });
    }

    // Rate limit check
    const attackerDoc = await db.doc(`users/${attackerId}`).get();
    const attackerData = attackerDoc.data();
    if (!attackerData) return res.status(200).json({ valid: false, error: 'Attacker not found' });

    const lastAttack = attackerData.lastAttackAt ?? 0;
    const now = Date.now();
    if (now - lastAttack < MIN_INTERVAL_MS) {
      return res.status(200).json({ valid: false, error: 'Too fast' });
    }

    // Calculate actual damage server-side
    const atk = attackerData.stats?.attack ?? 10;
    const targetDoc = await db.doc(`users/${targetId}`).get();
    const targetData = targetDoc.data();

    let targetHp = 100;
    let defense = 5;
    if (targetData?.stats) {
      targetHp = targetData.stats.hp ?? 100;
      defense = targetData.stats.defense ?? 5;
    }

    const baseDmg = Math.max(1, atk - defense * 0.5);
    const isCrit = Math.random() < (attackerData.stats?.critRate ?? 0.05);
    const critMult = isCrit ? (attackerData.stats?.critDamage ?? 1.5) : 1;
    const damage = Math.floor(baseDmg * critMult * (0.9 + Math.random() * 0.2));

    targetHp = Math.max(0, targetHp - damage);
    const killed = targetHp <= 0;

    // Update attacker timestamp
    await db.doc(`users/${attackerId}`).update({ lastAttackAt: now });

    // Update target HP (if it's a player)
    if (targetData) {
      await db.doc(`users/${targetId}`).update({ 'stats.hp': targetHp });
    }

    // XP/Gold on kill
    let xpGained = 0;
    let goldGained = 0;
    if (killed) {
      xpGained = Math.floor((targetData?.level ?? 1) * 15 + Math.random() * 10);
      goldGained = Math.floor((targetData?.level ?? 1) * 5 + Math.random() * 8);

      await db.doc(`users/${attackerId}`).update({
        xp: (attackerData.xp ?? 0) + xpGained,
        gold: (attackerData.gold ?? 0) + goldGained,
      });

      // Log combat
      await db.collection('combatLogs').add({
        attackerId, targetId, damage, zone,
        skill: body.skillId, killed: true,
        timestamp: now,
      });
    }

    return res.status(200).json({
      valid: true,
      damage,
      isCrit,
      targetHp,
      killed,
      xpGained,
      goldGained,
    });
  } catch (err) {
    console.error('Combat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
