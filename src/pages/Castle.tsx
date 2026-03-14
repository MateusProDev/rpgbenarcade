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
    <div className="h-screen w-screen bg-castle-dark overflow-hidden relative">
      {/* 3D Scene — fullscreen background */}
      <div className="absolute inset-0">
        <VillageScene city={city} onBuildingClick={setSelectedBuilding} />
      </div>

      {/* HUD overlay — top bar */}
      <header className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
        <h1 className="font-medieval text-castle-gold text-xl drop-shadow-lg">{city.name}</h1>
        <ResourceBar resources={city.resources} />
      </header>

      {/* Floating side panel */}
      {selectedBuilding && (
        <aside className="absolute right-0 top-16 bottom-0 w-80 z-10 p-4 overflow-y-auto bg-castle-dark/85 backdrop-blur-md border-l border-castle-gold/20 pointer-events-auto">
          <BuildingPanel
            city={city}
            selectedBuildingId={selectedBuilding}
            onUpgrade={handleUpgrade}
          />
        </aside>
      )}
    </div>
  );
}
