import { create } from 'zustand';
import type { Castle, March } from '../types';

interface GameState {
  castle:  Castle | null;
  marches: March[];
  setCastle:  (castle: Castle | null) => void;
  updateCastle: (partial: Partial<Castle>) => void;
  setMarches: (marches: March[]) => void;
  addMarch:   (march: March) => void;
  removeMarch:(id: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  castle:  null,
  marches: [],
  setCastle: (castle) => set({ castle }),
  updateCastle: (partial) =>
    set((s) => ({ castle: s.castle ? { ...s.castle, ...partial } : null })),
  setMarches: (marches) => set({ marches }),
  addMarch:   (march)   => set((s) => ({ marches: [...s.marches, march] })),
  removeMarch:(id)      => set((s) => ({ marches: s.marches.filter((m) => m.id !== id) })),
}));
