/**
 * Castle — main village/city management page.
 *
 * This is the core gameplay screen with:
 * - 3D village scene
 * - Resource bar
 * - Building panel
 * - Troop training
 */

import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useGameTick } from '../hooks/useGameTick';
import { useCity } from '../hooks/useCity';
import { GameEngine } from '../game/engine/GameEngine';
import { CityService } from '../services/cityService';
import { VillageScene } from '../components/village/VillageScene';
import { BuildingPanel } from '../components/village/BuildingPanel';
import { ResourceBar } from '../ui/ResourceBar';

export function Castle() {
  useCity();
  useGameTick();

  const city = useGameStore((s) => s.currentCity);
  const updateCity = useGameStore((s) => s.updateCity);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  const handleUpgrade = useCallback(
    async (buildingId: string) => {
      if (!city) return;
      const updated = GameEngine.upgradeBuilding(city, buildingId);
      if (updated) {
        updateCity(() => updated);
        await CityService.save(updated);
      }
    },
    [city, updateCity],
  );

  if (!city) {
    return (
      <div className="min-h-screen bg-castle-dark flex items-center justify-center">
        <p className="font-medieval text-castle-gold text-xl animate-pulse">
          Carregando sua cidade...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-castle-dark flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 p-3 flex items-center justify-between">
        <h1 className="font-medieval text-castle-gold text-xl">{city.name}</h1>
        <ResourceBar resources={city.resources} />
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* 3D Scene */}
        <div className="flex-1 relative min-h-0">
          <div className="absolute inset-0">
            <VillageScene city={city} onBuildingClick={setSelectedBuilding} />
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-80 shrink-0 p-4 overflow-y-auto">
          <BuildingPanel
            city={city}
            selectedBuildingId={selectedBuilding}
            onUpgrade={handleUpgrade}
          />
        </aside>
      </div>
    </div>
  );
}
