import { useEffect } from 'react';
import { onAuthChange, getPlayerData } from '../services/auth';
import { useAuthStore } from '../stores/useAuthStore';

/** Hook raiz — observa estado de autenticação e carrega dados do jogador */
export function useAuth() {
  const { user, player, loading, setUser, setPlayer, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getPlayerData(firebaseUser.uid);
        setPlayer(p);
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [setUser, setPlayer, setLoading]);

  return { user, player, loading };
}
