/**
 * useCity — loads and manages the current player's city.
 */

import { useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { CityService } from '../services/cityService';
import { GameEngine } from '../game/engine/GameEngine';

export function useCity(): void {
  const user = useAuthStore((s) => s.user);
  const setCurrentCity = useGameStore((s) => s.setCurrentCity);

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
        // Persist the caught-up state
        await CityService.save(updated);
      }
    }

    void loadCity();
    return () => { cancelled = true; };
  }, [user, setCurrentCity]);
}
