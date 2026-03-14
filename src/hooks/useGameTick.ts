/**
 * useGameTick — periodically ticks the game engine forward
 * to update resources, resolve buildings, and resolve training.
 *
 * This is how the client catches up on offline progress
 * and keeps the UI in sync with time-based mechanics.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { GameEngine } from '../game/engine/GameEngine';

const TICK_INTERVAL_MS = 10_000; // 10 seconds

export function useGameTick(): void {
  const updateCity = useGameStore((s) => s.updateCity);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Initial tick (catch up on offline time)
    updateCity((city) => GameEngine.fullTick(city));

    // Periodic tick
    intervalRef.current = setInterval(() => {
      updateCity((city) => GameEngine.fullTick(city));
    }, TICK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateCity]);
}
