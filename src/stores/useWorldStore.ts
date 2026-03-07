import { create } from 'zustand';
import type { World, MapTile, Player } from '../types';

interface WorldState {
  worlds:          World[];
  currentWorld:    World | null;
  tiles:           MapTile[];
  nearbyPlayers:   Player[];
  setWorlds:       (worlds: World[]) => void;
  setCurrentWorld: (world: World | null) => void;
  setTiles:        (tiles: MapTile[]) => void;
  updateTile:      (x: number, y: number, partial: Partial<MapTile>) => void;
  setNearbyPlayers:(players: Player[]) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  worlds:          [],
  currentWorld:    null,
  tiles:           [],
  nearbyPlayers:   [],
  setWorlds:       (worlds)         => set({ worlds }),
  setCurrentWorld: (currentWorld)   => set({ currentWorld }),
  setTiles:        (tiles)          => set({ tiles }),
  updateTile:      (x, y, partial)  =>
    set((s) => ({
      tiles: s.tiles.map((t) =>
        t.x === x && t.y === y ? { ...t, ...partial } : t,
      ),
    })),
  setNearbyPlayers:(nearbyPlayers)  => set({ nearbyPlayers }),
}));
