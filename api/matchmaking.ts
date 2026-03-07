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
const MAP_SIZE    = 50;

function findSpawn(occupied: {x:number;y:number}[]): {x:number;y:number} {
  const set = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const center = MAP_SIZE / 2;
  for (let i = 0; i < 500; i++) {
    const x = Math.floor(Math.random() * MAP_SIZE);
    const y = Math.floor(Math.random() * MAP_SIZE);
    if (Math.hypot(x - center, y - center) < 5) continue;
    if (!set.has(`${x},${y}`)) return { x, y };
  }
  return { x: Math.floor(Math.random() * MAP_SIZE), y: Math.floor(Math.random() * MAP_SIZE) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { uid } = req.body as { uid: string };
  if (!uid) return res.status(400).json({ error: 'uid required' });

  try {
    // Verifica se jogador já tem mundo
    const playerDoc = await db.collection('players').doc(uid).get();
    const player    = playerDoc.data();
    if (player?.worldId) return res.json({ worldId: player.worldId, castleId: player.castleId });

    // Encontra mundo com vagas
    const worldsSnap = await db
      .collection('worlds')
      .where('active', '==', true)
      .where('playerCount', '<', MAX_PLAYERS)
      .orderBy('playerCount', 'desc')
      .limit(1)
      .get();

    let worldId: string;

    if (worldsSnap.empty) {
      // Cria novo mundo
      const worldRef = db.collection('worlds').doc();
      worldId = worldRef.id;
      await worldRef.set({
        id:          worldId,
        name:        `Mundo ${worldId.slice(0, 6)}`,
        playerCount: 0,
        maxPlayers:  MAX_PLAYERS,
        createdAt:   FieldValue.serverTimestamp(),
        active:      true,
      });
    } else {
      worldId = worldsSnap.docs[0].id;
    }

    // Posições ocupadas
    const castlesSnap = await db
      .collection('castles')
      .where('worldId', '==', worldId)
      .get();
    const occupied = castlesSnap.docs.map((d) => ({ x: d.data().mapX, y: d.data().mapY }));
    const { x: mapX, y: mapY } = findSpawn(occupied);

    // Cria castelo
    const castleId = `${uid}_${worldId}`;
    const now      = Date.now();
    await db.collection('castles').doc(castleId).set({
      id: castleId, playerId: uid, worldId, level: 1, mapX, mapY,
      resources: { food: 1000, wood: 1000, stone: 500, iron: 200 },
      lastResourceTick: now,
      buildings: {
        sawmill:   { type: 'sawmill',   level: 1, upgrading: false, upgradeEnds: null },
        quarry:    { type: 'quarry',    level: 1, upgrading: false, upgradeEnds: null },
        ironMine:  { type: 'ironMine',  level: 1, upgrading: false, upgradeEnds: null },
        farm:      { type: 'farm',      level: 1, upgrading: false, upgradeEnds: null },
        barracks:  { type: 'barracks',  level: 1, upgrading: false, upgradeEnds: null },
        academy:   { type: 'academy',   level: 1, upgrading: false, upgradeEnds: null },
        warehouse: { type: 'warehouse', level: 1, upgrading: false, upgradeEnds: null },
      },
    });

    // Atualiza jogador
    await db.collection('players').doc(uid).update({ worldId, castleId, mapX, mapY });
    // Incrementa contador do mundo
    await db.collection('worlds').doc(worldId).update({
      playerCount: FieldValue.increment(1),
    });

    return res.json({ worldId, castleId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
