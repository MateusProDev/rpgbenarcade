/**
 * Game Store — manages current game state (city, player data).
 *
 * Game logic does NOT live here. The store only holds state.
 * All mutations go through GameEngine and services.
 */

import { create } from 'zustand';
import type { City } from '../types/city';
import type { Player } from '../types/player';

interface GameState {
  player: Player | null;
  currentCity: City | null;
  setPlayer: (player: Player | null) => void;
  setCurrentCity: (city: City | null) => void;
  updateCity: (updater: (city: City) => City) => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: null,
  currentCity: null,
  setPlayer: (player) => set({ player }),
  setCurrentCity: (city) => set({ currentCity: city }),
  updateCity: (updater) =>
    set((state) => {
      if (!state.currentCity) return state;
      return { currentCity: updater(state.currentCity) };
    }),
}));
