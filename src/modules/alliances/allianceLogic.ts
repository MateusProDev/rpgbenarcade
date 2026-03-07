import {
  doc, getDoc, getDocs, setDoc, updateDoc,
  collection, query, where, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Alliance } from '../../types';

/** Carrega aliança pelo ID */
export async function getAlliance(allianceId: string): Promise<Alliance | null> {
  const snap = await getDoc(doc(db, 'alliances', allianceId));
  return snap.exists() ? (snap.data() as Alliance) : null;
}

/** Lista alianças de um mundo */
export async function listAlliances(worldId: string): Promise<Alliance[]> {
  const snap = await getDocs(
    query(collection(db, 'alliances'), where('worldId', '==', worldId)),
  );
  return snap.docs.map((d) => d.data() as Alliance);
}

/** Cria uma aliança (também usada em castleLogic, reexportada aqui para clareza) */
export async function createAlliance(
  worldId: string,
  leaderId: string,
  name: string,
  tag: string,
): Promise<string> {
  const existing = await getDocs(
    query(collection(db, 'alliances'), where('worldId', '==', worldId), where('tag', '==', tag.toUpperCase())),
  );
  if (!existing.empty) throw new Error('Tag já em uso neste mundo');

  const allianceRef = doc(collection(db, 'alliances'));
  const allianceId  = allianceRef.id;

  const newAlliance: Alliance = {
    id:             allianceId,
    worldId,
    name,
    tag:            tag.toUpperCase(),
    leaderId,
    members:        [leaderId],
    bases:          [],
    controlsCastle: false,
    createdAt:      Date.now(),
  };

  await setDoc(allianceRef, newAlliance);
  await updateDoc(doc(db, 'players', leaderId), { allianceId });
  return allianceId;
}

/** Jogador entra em aliança existente */
export async function joinAlliance(
  allianceId: string,
  playerId:   string,
): Promise<void> {
  await updateDoc(doc(db, 'alliances', allianceId), {
    members: arrayUnion(playerId),
  });
  await updateDoc(doc(db, 'players', playerId), { allianceId });
}

/** Jogador sai da aliança */
export async function leaveAlliance(
  allianceId: string,
  playerId:   string,
): Promise<void> {
  await updateDoc(doc(db, 'alliances', allianceId), {
    members: arrayRemove(playerId),
  });
  await updateDoc(doc(db, 'players', playerId), { allianceId: null });
}

/** Aliança conquista uma base */
export async function captureBase(
  allianceId: string,
  baseId: string,
  previousAllianceId?: string,
): Promise<void> {
  if (previousAllianceId && previousAllianceId !== allianceId) {
    await updateDoc(doc(db, 'alliances', previousAllianceId), {
      bases: arrayRemove(baseId),
    });
  }
  await updateDoc(doc(db, 'alliances', allianceId), {
    bases: arrayUnion(baseId),
  });
}

/** Aliança conquista o castelo central */
export async function captureCentralCastle(
  worldId:    string,
  allianceId: string,
): Promise<void> {
  // Remove controle de outras alianças
  const allSnap = await getDocs(
    query(collection(db, 'alliances'), where('worldId', '==', worldId)),
  );
  const batch: Promise<void>[] = allSnap.docs.map((d) =>
    updateDoc(d.ref, { controlsCastle: false }),
  );
  await Promise.all(batch);

  // Atribui controle para a aliança vencedora
  await updateDoc(doc(db, 'alliances', allianceId), { controlsCastle: true });
}
