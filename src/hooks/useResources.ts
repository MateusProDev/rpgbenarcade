import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { tickResources } from '../modules/economy/economyLogic';
import { gameLoop } from '../core/gameLoop';

/**
 * Atualiza os recursos do castelo localmente a cada tick do game loop.
 * A persistência real vai para o Firestore em batches pelo servidor.
 */
export function useResources() {
  const castle       = useGameStore((s) => s.castle);
  const updateCastle = useGameStore((s) => s.updateCastle);
  const tickKeyRef   = useRef('resources');

  useEffect(() => {
    if (!castle) return;

    gameLoop.register(tickKeyRef.current, () => {
      const current = useGameStore.getState().castle;
      if (!current) return;
      const { updated } = tickResources(current);
      updateCastle({ resources: updated.resources, lastResourceTick: updated.lastResourceTick });
    });

    gameLoop.start();
    return () => {
      gameLoop.unregister(tickKeyRef.current);
    };
  }, [castle?.id]);

  return castle?.resources;
}
