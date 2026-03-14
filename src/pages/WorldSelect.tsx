/**
 * WorldSelect — player picks or creates a world to enter.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorldMap } from '../types/map';
import { MapService } from '../services/mapService';

export function WorldSelect() {
  const navigate = useNavigate();
  const [worlds, setWorlds] = useState<WorldMap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MapService.getActiveWorlds()
      .then(setWorlds)
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(worldId: string) {
    navigate(`/castle?world=${worldId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-castle-dark flex items-center justify-center">
        <p className="font-medieval text-castle-gold text-xl animate-pulse">Carregando mundos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-castle-dark p-8">
      <h1 className="text-4xl font-medieval text-castle-gold text-center mb-8">Escolha seu Mundo</h1>

      {worlds.length === 0 ? (
        <p className="text-parchment-200 text-center">Nenhum mundo ativo disponível.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {worlds.map((world) => (
            <button
              key={world.id}
              onClick={() => handleSelect(world.id)}
              className="p-6 bg-castle-stone/80 rounded-xl border border-castle-wall/30
                         hover:border-castle-gold transition-colors text-left"
            >
              <h3 className="font-medieval text-castle-gold text-xl mb-2">{world.name}</h3>
              <p className="text-parchment-300 text-sm">
                Jogadores: {world.playerCount}/{world.maxPlayers}
              </p>
              <p className="text-parchment-400 text-xs mt-1">
                Mapa: {world.width}x{world.height}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
