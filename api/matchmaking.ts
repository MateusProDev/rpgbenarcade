import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const MAP_SIZE    = 50;
const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS_PER_WORLD ?? '200', 10);

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel escapa \n como \\n nas env vars — desfaz aqui
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Variáveis Firebase Admin não configuradas: ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY são obrigatórias.',
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function findSpawn(occupied: { x: number; y: number }[]): { x: number; y: number } {
  const set    = new Set(occupied.map((p) => `${p.x},${p.y}`));
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

  const { uid } = req.body as { uid?: string };
  if (!uid) return res.status(400).json({ error: 'uid é obrigatório' });

  let db: ReturnType<typeof getFirestore>;
  try {
    db = getFirestore(getAdminApp());
  } catch (err) {
    console.error('[matchmaking] Firebase Admin init error:', err);
    return res.status(503).json({
      error: 'Serviço indisponível — credenciais do servidor não configuradas.',
      detail: (err as Error).message,
    });
  }

  try {
    // Jogador já tem mundo? Retorna direto.
    const playerSnap = await db.collection('players').doc(uid).get();
    const playerData = playerSnap.data();
    if (playerData?.worldId) {
      return res.json({ worldId: playerData.worldId, castleId: playerData.castleId });
    }

    // Encontra mundo com vagas (sem inequality para evitar índice composto)
    const worldsSnap = await db
      .collection('worlds')
      .where('active', '==', true)
      .orderBy('playerCount', 'desc')
      .limit(5)
      .get();

    const availableWorld = worldsSnap.docs.find(
      (d) => (d.data().playerCount as number) < MAX_PLAYERS,
    );

    let worldId: string;

    if (!availableWorld) {
      const worldRef = db.collection('worlds').doc();
      worldId = worldRef.id;
      await worldRef.set({
        id:          worldId,
        name:        `Mundo ${worldId.slice(0, 6).toUpperCase()}`,
        playerCount: 0,
        maxPlayers:  MAX_PLAYERS,
        createdAt:   FieldValue.serverTimestamp(),
        active:      true,
      });
    } else {
      worldId = availableWorld.id;
    }

    // Calcula posição de spawn livre
    const castlesSnap = await db.collection('castles').where('worldId', '==', worldId).get();
    const occupied    = castlesSnap.docs.map((d) => ({ x: d.data().mapX as number, y: d.data().mapY as number }));
    const { x: mapX, y: mapY } = findSpawn(occupied);

    // Cria castelo + atualiza jogador + incrementa mundo em batch atômico
    const castleId = `${uid}_${worldId}`;
    const now      = Date.now();
    const batch    = db.batch();

    batch.set(db.collection('castles').doc(castleId), {
      id: castleId, playerId: uid, worldId, level: 1, mapX, mapY,
      resources:        { food: 1000, wood: 1000, stone: 500, iron: 200 },
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

    batch.update(db.collection('players').doc(uid), { worldId, castleId, mapX, mapY });
    batch.update(db.collection('worlds').doc(worldId), {
      playerCount: FieldValue.increment(1),
    });

    await batch.commit();

    return res.status(200).json({ worldId, castleId });
  } catch (err) {
    console.error('[matchmaking] Error:', err);
    return res.status(500).json({ error: 'Erro interno', detail: (err as Error).message });
  }
}

