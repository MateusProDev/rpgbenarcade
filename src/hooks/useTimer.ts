/**
 * useTimer — provides countdown state for building/training timers.
 */

import { useState, useEffect } from 'react';
import { TimeSystem } from '../game/systems/TimeSystem';
import type { TimerInfo } from '../types/time';

interface TimerState {
  remaining: number;
  formatted: string;
  progress: number;
  isComplete: boolean;
}

export function useTimer(timer: TimerInfo | null): TimerState {
  const [state, setState] = useState<TimerState>({
    remaining: 0,
    formatted: 'Pronto',
    progress: 1,
    isComplete: true,
  });

  useEffect(() => {
    if (!timer) {
      setState({ remaining: 0, formatted: 'Pronto', progress: 1, isComplete: true });
      return;
    }

    function tick() {
      const now = Date.now();
      const remaining = TimeSystem.getRemainingSeconds(timer!, now);
      setState({
        remaining,
        formatted: TimeSystem.formatRemaining(remaining),
        progress: TimeSystem.getProgress(timer!, now),
        isComplete: TimeSystem.isComplete(timer!, now),
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timer]);

  return state;
}
