/**
 * BuildingPanel — UI panel for building info, upgrades, and construction.
 */

import type { City } from '../../types/city';
import type { BuildingInstance } from '../../types/buildings';
import { BUILDING_DEFINITIONS } from '../../game/config/buildings.config';
import { BuildingSystem } from '../../game/systems/BuildingSystem';
import { TimerDisplay } from '../../ui/TimerDisplay';

interface BuildingPanelProps {
  city: City;
  selectedBuildingId: string | null;
  onUpgrade: (buildingId: string) => void;
}

export function BuildingPanel({ city, selectedBuildingId, onUpgrade }: BuildingPanelProps) {
  if (!selectedBuildingId) {
    return (
      <div className="p-4 bg-castle-dark/90 rounded-lg border border-castle-wall/30">
        <p className="font-medieval text-parchment-200">Selecione um edifício</p>
      </div>
    );
  }

  const building = city.buildings.find((b) => b.id === selectedBuildingId);
  if (!building) return null;

  const def = BUILDING_DEFINITIONS[building.type];
  const upgradeCheck = BuildingSystem.canUpgrade(city, building.id);

  return (
    <div className="p-4 bg-castle-dark/90 rounded-lg border border-castle-wall/30 space-y-3">
      <h3 className="font-medieval text-castle-gold text-lg">
        {def?.name ?? building.type} — Nível {building.level}
      </h3>
      <p className="text-parchment-200 text-sm">{def?.description}</p>

      {building.upgradeStartedAt != null && building.upgradeFinishAt != null && (
        <TimerDisplay
          timer={{
            startedAt: building.upgradeStartedAt,
            finishAt: building.upgradeFinishAt,
            durationSeconds: (building.upgradeFinishAt - building.upgradeStartedAt) / 1000,
          }}
          label="Melhorando..."
        />
      )}

      {building.upgradeStartedAt == null && (
        <button
          className="px-4 py-2 bg-castle-gold text-castle-dark font-medieval rounded
                     hover:bg-parchment-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!upgradeCheck.ok}
          onClick={() => onUpgrade(building.id)}
          title={upgradeCheck.reason}
        >
          {upgradeCheck.ok ? `Melhorar para Nível ${building.level + 1}` : upgradeCheck.reason}
        </button>
      )}

      <BuildingCostDisplay building={building} />
    </div>
  );
}

function BuildingCostDisplay({ building }: { building: BuildingInstance }) {
  const def = BUILDING_DEFINITIONS[building.type];
  const nextLevel = def?.levels.find((l) => l.level === building.level + 1);
  if (!nextLevel) return null;

  return (
    <div className="text-xs text-parchment-300 space-y-1">
      <p>Custo do próximo nível:</p>
      <div className="flex gap-3">
        {nextLevel.cost.wood > 0 && <span>🪵 {nextLevel.cost.wood}</span>}
        {nextLevel.cost.stone > 0 && <span>🪨 {nextLevel.cost.stone}</span>}
        {nextLevel.cost.iron > 0 && <span>⚙️ {nextLevel.cost.iron}</span>}
        {nextLevel.cost.food > 0 && <span>🌾 {nextLevel.cost.food}</span>}
        {nextLevel.cost.gold > 0 && <span>🪙 {nextLevel.cost.gold}</span>}
      </div>
    </div>
  );
}
