import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { Player } from '../types';

/** Login com Google — cria o documento do jogador se não existir */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user   = result.user;

  const playerRef = doc(db, 'players', user.uid);
  const snap      = await getDoc(playerRef);

  if (!snap.exists()) {
    // Novo jogador — o mundo é atribuído pelo matchmaking serverless
    const newPlayer = {
      uid:         user.uid,
      displayName: user.displayName ?? 'Guerreiro',
      photoURL:    user.photoURL ?? '',
      worldId:     null,
      castleId:    null,
      allianceId:  null,
      vip:         false,
      vipLevel:    0,
      joinedAt:    Date.now(),
    };
    await setDoc(playerRef, newPlayer);
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
