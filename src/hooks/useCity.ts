/**
 * useCity — loads and manages the current player's city.
 * Creates an initial city if the player doesn't have one yet.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { CityService } from '../services/cityService';
import { GameEngine } from '../game/engine/GameEngine';
import type { City } from '../types/city';

function createInitialCity(playerId: string, worldId: string): Omit<City, 'id'> {
  const now = Date.now();
  return {
    playerId,
    worldId,
    name: 'Nova Cidade',
    castleLevel: 1,
    position: {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
    },
    buildings: [
      {
        id: crypto.randomUUID(),
        type: 'castle',
        level: 1,
        slotIndex: 0,
        upgradeStartedAt: null,
        upgradeFinishAt: null,
      },
    ],
    resources: {
      current: { wood: 500, stone: 500, iron: 100, food: 500, gold: 200 },
      capacity: { wood: 5000, stone: 5000, iron: 2000, food: 5000, gold: 2000 },
      production: { wood: 0, stone: 0, iron: 0, food: 0, gold: 0 },
      lastCalculatedAt: now,
    },
    garrison: [],
    trainingQueue: [],
    createdAt: now,
  };
}

export function useCity(): void {
  const user = useAuthStore((s) => s.user);
  const setCurrentCity = useGameStore((s) => s.setCurrentCity);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) {
      setCurrentCity(null);
      return;
    }

    let cancelled = false;

    async function loadCity() {
      const cities = await CityService.getByPlayer(user!.uid);
      if (cancelled) return;

      if (cities.length > 0) {
        // Tick on load to catch up offline progress
        const updated = GameEngine.fullTick(cities[0]);
        setCurrentCity(updated);
        await CityService.save(updated);
      } else {
        // New player — create their first city
        const worldId = searchParams.get('world') ?? 'default';
        const seed = createInitialCity(user!.uid, worldId);
        const newId = await CityService.create(seed);
        if (cancelled) return;
        const newCity: City = { id: newId, ...seed };
        setCurrentCity(newCity);
      }
    }

    void loadCity();
    return () => { cancelled = true; };
  }, [user, setCurrentCity, searchParams]);
}
