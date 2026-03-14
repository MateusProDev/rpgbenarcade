/**
 * MapService — Firestore operations for world map and tiles.
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import type { WorldMap, MapTile } from '../types/map';

export const MapService = {
  async getWorld(worldId: string): Promise<WorldMap | null> {
    const snap = await getDoc(doc(getFirebaseDb(), 'worlds', worldId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as WorldMap) : null;
  },

  async getActiveWorlds(): Promise<WorldMap[]> {
    const q = query(
      collection(getFirebaseDb(), 'worlds'),
      where('active', '==', true),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorldMap);
  },

  async getTilesInArea(
    worldId: string,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
  ): Promise<MapTile[]> {
    // Firestore doesn't support range queries on multiple fields efficiently,
    // so we query by x range and filter y client-side.
    const q = query(
      collection(getFirebaseDb(), 'worlds', worldId, 'tiles'),
      where('x', '>=', minX),
      where('x', '<=', maxX),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as MapTile)
      .filter((t) => t.y >= minY && t.y <= maxY);
  },
};
