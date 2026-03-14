/**
 * useAuth — Firebase authentication listener hook.
 *
 * Subscribes to auth state changes and syncs with Zustand store.
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/config';
import { useAuthStore } from '../stores/useAuthStore';

export function useAuth(): void {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, [setUser]);
}
