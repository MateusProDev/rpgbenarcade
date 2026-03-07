import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Player } from '../types';

interface AuthState {
  user:   User | null;
  player: Player | null;
  loading: boolean;
  setUser:   (user: User | null) => void;
  setPlayer: (player: Player | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:    null,
  player:  null,
  loading: true,
  setUser:    (user)    => set({ user }),
  setPlayer:  (player)  => set({ player }),
  setLoading: (loading) => set({ loading }),
}));
