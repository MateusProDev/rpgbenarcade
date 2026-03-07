import { useCallback } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { startBuildingUpgrade, completeBuildingUpgrade } from '../modules/castle/castleLogic';
import { loadCastle } from '../modules/castle/castleLogic';
import type { BuildingType } from '../types';

export function useBuilding() {
  const castle     = useGameStore((s) => s.castle);
  const setCastle  = useGameStore((s) => s.setCastle);

  const refresh = useCallback(async () => {
    if (!castle) return;
    const updated = await loadCastle(castle.id);
    if (updated) setCastle(updated);
  }, [castle, setCastle]);

  const upgrade = useCallback(
    async (type: BuildingType) => {
      if (!castle) return { success: false, message: 'Castelo não carregado' };
      const result = await startBuildingUpgrade(castle, type);
      if (result.success) await refresh();
      return result;
    },
    [castle, refresh],
  );

  const checkComplete = useCallback(
    async (type: BuildingType) => {
      if (!castle) return false;
      const done = await completeBuildingUpgrade(castle, type);
      if (done) await refresh();
      return done;
    },
    [castle, refresh],
  );

  return { castle, upgrade, checkComplete, refresh };
}
