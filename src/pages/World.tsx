/**
 * World — world map page for exploring tiles and attacking.
 */

import { useEffect, useState } from 'react';
import { MapService } from '../services/mapService';
import { useGameStore } from '../stores/useGameStore';
import { WorldMapView } from '../components/map/WorldMapView';
import type { MapTile } from '../types/map';

export function World() {
  const city = useGameStore((s) => s.currentCity);
  const [tiles, setTiles] = useState<MapTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    MapService.getTilesInArea(
      city.worldId,
      city.position.x - 25,
      city.position.x + 25,
      city.position.y - 25,
      city.position.y + 25,
    )
      .then(setTiles)
      .finally(() => setLoading(false));
  }, [city]);

  if (!city || loading) {
    return (
      <div className="min-h-screen bg-castle-dark flex items-center justify-center">
        <p className="font-medieval text-castle-gold text-xl animate-pulse">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-castle-dark flex flex-col items-center p-8">
      <h1 className="text-3xl font-medieval text-castle-gold mb-6">Mapa do Mundo</h1>
      <WorldMapView
        tiles={tiles}
        centerX={city.position.x}
        centerY={city.position.y}
        onTileClick={(tile) => {
          // TODO: show tile details / attack dialog
          console.log('Tile clicked:', tile);
        }}
      />
    </div>
  );
}
