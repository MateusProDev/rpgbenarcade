// Firestore persistence — player data, alliances, territories
import { db } from './config';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import type { PlayerData, AllianceData, TerritoryData } from '@/store/types';

// ---- Players ----
export async function loadPlayer(uid: string): Promise<PlayerData | null> {
  const snap = await getDoc(doc(db, 'players', uid));
  return snap.exists() ? (snap.data() as PlayerData) : null;
}

export async function savePlayer(uid: string, data: Partial<PlayerData>): Promise<void> {
  await setDoc(doc(db, 'players', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updatePlayer(uid: string, data: Partial<PlayerData>): Promise<void> {
  await updateDoc(doc(db, 'players', uid), { ...data, updatedAt: serverTimestamp() } as DocumentData);
}

// ---- Alliances ----
export async function loadAlliance(id: string): Promise<AllianceData | null> {
  const snap = await getDoc(doc(db, 'alliances', id));
  return snap.exists() ? (snap.data() as AllianceData) : null;
}

export async function saveAlliance(id: string, data: Partial<AllianceData>): Promise<void> {
  await setDoc(doc(db, 'alliances', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ---- Territories ----
export async function loadTerritories(): Promise<TerritoryData[]> {
  const snap = await getDocs(collection(db, 'territories'));
  return snap.docs.map((d) => d.data() as TerritoryData);
}

export async function loadTerritory(id: string): Promise<TerritoryData | null> {
  const snap = await getDoc(doc(db, 'territories', id));
  return snap.exists() ? (snap.data() as TerritoryData) : null;
}

// ---- Combat Logs ----
export async function logCombat(data: {
  attackerId: string; targetId: string; damage: number;
  skill: string; zone: string;
}): Promise<void> {
  const id = `${Date.now()}_${data.attackerId}`;
  await setDoc(doc(db, 'combatLogs', id), { ...data, timestamp: serverTimestamp() });
}

// ---- Queries ----
export async function getPlayersInAlliance(allianceId: string): Promise<PlayerData[]> {
  const q = query(collection(db, 'players'), where('allianceId', '==', allianceId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PlayerData);
}
