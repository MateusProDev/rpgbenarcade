import React from 'react';
import type { BuildingType } from '../../types';
import { BuildingCard } from './BuildingCard';
import { ResourceBar } from '../ui/ResourceBar';
import { useGameStore } from '../../stores/useGameStore';
import { useResources } from '../../hooks/useResources';
import assets from '../../services/cloudinary';

const BUILDING_ORDER: BuildingType[] = [
  'farm', 'sawmill', 'quarry', 'ironMine',
  'warehouse', 'barracks', 'academy',
];

export const CastleView: React.FC = () => {
  const castle    = useGameStore((s) => s.castle);
  const resources = useResources();

  if (!castle) return (
    <div className="flex items-center justify-center h-64 text-parchment-400">
      Carregando castelo...
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Header do castelo */}
      <div className="flex items-center gap-4 bg-castle-stone border border-castle-gold rounded-xl p-4">
        <img
          src={assets.castleLevel(castle.level)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = assets.placeholder(`Nv${castle.level}`);
          }}
          alt={`Castelo nível ${castle.level}`}
          className="w-20 h-20 rounded-lg object-cover bg-castle-dark"
        />
        <div className="flex-1">
          <h1 className="font-medieval text-2xl text-castle-gold">Seu Castelo</h1>
          <p className="text-parchment-300 text-sm">Nível {castle.level} • [{castle.mapX}, {castle.mapY}]</p>
          {resources && (
            <div className="mt-2">
              <ResourceBar resources={resources} compact />
            </div>
          )}
        </div>
      </div>

      {/* Grade de edifícios */}
      <div>
        <h2 className="font-medieval text-parchment-200 text-lg mb-3">Edifícios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILDING_ORDER.map((bType) => (
            <BuildingCard key={bType} buildingType={bType} />
          ))}
        </div>
      </div>
    </div>
  );
};
