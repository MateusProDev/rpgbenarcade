import {
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { Player } from '../types';

/** Inicia login com Google via redirect (sem popup — evita bloqueio de COOP) */
export async function signInWithGoogle(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Chame no carregamento do app para processar o retorno do redirect do Google.
 * Retorna o User se houver resultado, ou null.
 */
export async function handleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  if (!result) return null;

  const user      = result.user;
  const playerRef = doc(db, 'players', user.uid);
  const snap      = await getDoc(playerRef);

  if (!snap.exists()) {
    await setDoc(playerRef, {
      uid:         user.uid,
      displayName: user.displayName ?? 'Guerreiro',
      photoURL:    user.photoURL ?? '',
      worldId:     null,
      castleId:    null,
      allianceId:  null,
      vip:         false,
      vipLevel:    0,
      joinedAt:    Date.now(),
    });
  }

  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function getPlayerData(uid: string): Promise<Player | null> {
  const snap = await getDoc(doc(db, 'players', uid));
  return snap.exists() ? (snap.data() as Player) : null;
}
