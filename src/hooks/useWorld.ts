import { useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, getDocs, limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useWorldStore } from '../stores/useWorldStore';
import type { MapTile, Player, World } from '../types';

/** Carrega lista de mundos disponíveis (sem listener — leitura pontual) */
export function useWorlds() {
  const { worlds, setWorlds } = useWorldStore();

  const loadWorlds = useCallback(async () => {
    const snap = await getDocs(
      query(collection(db, 'worlds'), where('active', '==', true), limit(20)),
    );
    setWorlds(snap.docs.map((d) => d.data() as World));
  }, [setWorlds]);

  useEffect(() => { loadWorlds(); }, [loadWorlds]);
  return { worlds, reload: loadWorlds };
}

/** Listener realtime apenas dos tiles próximos (viewport) */
export function useWorldMap(worldId: string, viewX: number, viewY: number, radius = 10) {
  const { tiles, setTiles } = useWorldStore();

  useEffect(() => {
    if (!worldId) return;

    const q = query(
      collection(db, 'worlds', worldId, 'tiles'),
      where('x', '>=', viewX - radius),
      where('x', '<=', viewX + radius),
    );

    const unsub = onSnapshot(q, (snap) => {
      const newTiles = snap.docs.map((d) => d.data() as MapTile);
      setTiles(newTiles);
    });

    return unsub;
  }, [worldId, viewX, viewY, radius, setTiles]);

  return tiles;
}

/** Jogadores próximos no mapa — listener restrito */
export function useNearbyPlayers(worldId: string, _castleX: number, _castleY: number) {
  const { nearbyPlayers, setNearbyPlayers } = useWorldStore();

  useEffect(() => {
    if (!worldId) return;
    const q = query(
      collection(db, 'players'),
      where('worldId', '==', worldId),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      setNearbyPlayers(snap.docs.map((d) => d.data() as Player));
    });
    return unsub;
  }, [worldId, setNearbyPlayers]);

  return nearbyPlayers;
}
