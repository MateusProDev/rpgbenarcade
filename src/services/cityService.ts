/**
 * CityService — Firestore operations for city (village/castle) data.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import type { City } from '../types/city';

const COLLECTION = 'cities';

export const CityService = {
  async get(cityId: string): Promise<City | null> {
    const snap = await getDoc(doc(getFirebaseDb(), COLLECTION, cityId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as City) : null;
  },

  async getByPlayer(playerId: string): Promise<City[]> {
    const q = query(
      collection(getFirebaseDb(), COLLECTION),
      where('playerId', '==', playerId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as City);
  },

  async create(city: Omit<City, 'id'>): Promise<string> {
    const ref = await addDoc(collection(getFirebaseDb(), COLLECTION), city);
    return ref.id;
  },

  async update(cityId: string, data: Partial<City>): Promise<void> {
    await updateDoc(doc(getFirebaseDb(), COLLECTION, cityId), data);
  },

  async save(city: City): Promise<void> {
    const { id, ...data } = city;
    await setDoc(doc(getFirebaseDb(), COLLECTION, id), data);
  },
};
