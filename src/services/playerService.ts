/**
 * PlayerService — Firestore operations for player data.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import type { Player } from '../types/player';

const COLLECTION = 'players';

export const PlayerService = {
  async get(uid: string): Promise<Player | null> {
    const snap = await getDoc(doc(getFirebaseDb(), COLLECTION, uid));
    return snap.exists() ? (snap.data() as Player) : null;
  },

  async create(player: Player): Promise<void> {
    await setDoc(doc(getFirebaseDb(), COLLECTION, player.uid), player);
  },

  async updateLastLogin(uid: string): Promise<void> {
    await updateDoc(doc(getFirebaseDb(), COLLECTION, uid), {
      lastLoginAt: serverTimestamp(),
    });
  },

  async update(uid: string, data: Partial<Player>): Promise<void> {
    await updateDoc(doc(getFirebaseDb(), COLLECTION, uid), data);
  },
};
