// ============================================
// App Root — Orchestrates auth state + game/login
// ============================================
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { GameView } from '@/ui/GameView';
import { LoginScreen } from '@/ui/LoginScreen';

export function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const loading = useAuthStore((s) => s.loading);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[var(--color-bg-dark)]">
        <div className="text-[var(--color-border-gold)] text-lg animate-pulse font-[var(--font-display)]">
          Carregando...
        </div>
      </div>
    );
  }

  return user ? <GameView /> : <LoginScreen />;
}
