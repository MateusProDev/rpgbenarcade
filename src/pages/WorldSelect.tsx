import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';
import { useWorlds } from '../hooks/useWorld';
import type { World } from '../types';

function WorldCard({ world, onSelect }: { world: World; onSelect: () => void }) {
  const pct = Math.round((world.playerCount / world.maxPlayers) * 100);
  const fill = pct < 50 ? 'bg-green-600' : pct < 85 ? 'bg-yellow-500' : 'bg-red-600';
  const full = world.playerCount >= world.maxPlayers;

  return (
    <div className="bg-castle-stone border border-castle-wall rounded-xl p-5 flex flex-col gap-3 hover:border-castle-gold transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="font-medieval text-parchment-100 text-lg">{world.name}</h3>
        {full && (
          <span className="text-xs bg-red-900/50 border border-red-700 text-red-300 rounded px-2 py-0.5">
            Lotado
          </span>
        )}
      </div>

      <div className="text-sm text-parchment-400">
        {world.playerCount} / {world.maxPlayers} jogadores
      </div>

      {/* Barra de ocupação */}
      <div className="w-full bg-castle-dark rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <Button
        size="sm"
        variant={full ? 'ghost' : 'primary'}
        disabled={full}
        onClick={onSelect}
      >
        {full ? 'Cheio' : '⚔️ Entrar neste Mundo'}
      </Button>
    </div>
  );
}

export const WorldSelect: React.FC = () => {
  const navigate = useNavigate();
  const player   = useAuthStore((s) => s.player);
  const { worlds, reload } = useWorlds();

  // Se já tem mundo, redireciona direto
  useEffect(() => {
    if (player?.worldId) navigate('/castle', { replace: true });
  }, [player, navigate]);

  const handleSelect = async (_world: World) => {
    // O matchmaking serverless cuida do resto
    await fetch('/api/matchmaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: player?.uid }),
    });
    navigate('/castle');
  };

  return (
    <div className="min-h-screen bg-castle-dark text-parchment-100">
      <nav className="sticky top-0 z-40 bg-castle-dark/95 border-b border-castle-wall px-4 py-2 flex items-center justify-between">
        <span className="font-medieval text-castle-gold text-lg">🏰 Bentropy Kingdom</span>
        <Button size="sm" variant="ghost" onClick={reload}>↺ Atualizar</Button>
      </nav>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-medieval text-3xl text-castle-gold mb-2">Escolha seu Mundo</h1>
          <p className="text-parchment-400 text-sm">
            Cada mundo suporta até 200 jogadores. Mundos cheios criam automaticamente um novo.
          </p>
        </div>

        {worlds.length === 0 ? (
          <div className="text-center text-parchment-400 py-12">
            <p className="mb-4">Nenhum mundo disponível no momento.</p>
            <Button onClick={reload}>Atualizar</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {worlds.map((w) => (
              <WorldCard key={w.id} world={w} onSelect={() => handleSelect(w)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
